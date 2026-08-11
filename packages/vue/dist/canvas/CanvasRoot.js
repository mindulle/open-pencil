import { computed, defineComponent, inject, onMounted, onScopeDispose, provide, ref, renderSlot } from "vue";
import { SkiaRenderer } from "@open-pencil/core/canvas";
import { getCanvasKit } from "@open-pencil/core/canvaskit";
import { useBreakpoints, useResizeObserver } from "@vueuse/core";
import { IS_BROWSER } from "@open-pencil/core/constants";
//#region src/editor/context/index.ts
/**
* Injection key for the current OpenPencil editor instance.
*
* Most SDK consumers should use {@link provideEditor} and {@link useEditor}
* instead of interacting with this symbol directly.
*/
const EDITOR_KEY = Symbol("open-pencil-editor");
/**
* Provides an OpenPencil editor instance to the current Vue subtree.
*
* Call this once near the top of your editor shell so descendant composables
* and headless primitives can access the editor with {@link useEditor}.
*/
function provideEditor(editor) {
	provide(EDITOR_KEY, editor);
}
/**
* Returns the current injected OpenPencil editor.
*
* Throws if called outside a subtree where {@link provideEditor} has already
* been called.
*/
function useEditor() {
	const editor = inject(EDITOR_KEY);
	if (!editor) throw new Error("[open-pencil] useEditor() called without an injected editor. Call provideEditor(editor) near the top of your Vue subtree first.");
	return editor;
}
//#endregion
//#region src/canvas/surface/gl-surface.ts
function sizeCanvas(canvas, editor) {
	const dpr = window.devicePixelRatio || 1;
	canvas.width = canvas.clientWidth * dpr;
	canvas.height = canvas.clientHeight * dpr;
	if ("setViewportSize" in editor && typeof editor.setViewportSize === "function") editor.setViewportSize(canvas.clientWidth, canvas.clientHeight);
}
function makeGLSurface(ck, canvas, editor, options, glContext) {
	let context = glContext;
	if (!context) {
		const glAttrs = options?.preserveDrawingBuffer ? { preserveDrawingBuffer: 1 } : void 0;
		const handle = ck.GetWebGLContext(canvas, glAttrs);
		if (!handle) return {
			surface: null,
			glContext: context
		};
		context = ck.MakeGrContext(handle);
	}
	if (!context) return {
		surface: null,
		glContext: context
	};
	const colorSpaces = editor.graph.documentColorSpace === "display-p3" ? [ck.ColorSpace.DISPLAY_P3, ck.ColorSpace.SRGB] : [ck.ColorSpace.SRGB];
	for (const colorSpace of colorSpaces) {
		const surface = ck.MakeOnScreenGLSurface(context, canvas.width, canvas.height, colorSpace);
		if (surface) return {
			surface,
			glContext: context
		};
	}
	return {
		surface: null,
		glContext: context
	};
}
//#endregion
//#region src/canvas/surface/kit-loader.ts
function useCanvasKitLoader({ canvasRef, lifecycle, setCanvasKit, createSurface, loadFonts, renderNow, onReady }) {
	const isDestroyed = () => lifecycle.destroyed;
	async function init() {
		const canvas = canvasRef.value;
		if (!canvas || isDestroyed()) return;
		setCanvasKit(await getCanvasKit());
		if (isDestroyed()) return;
		await new Promise((resolve) => {
			requestAnimationFrame(resolve);
		});
		createSurface(canvas);
		await loadFonts();
		if (isDestroyed()) return;
		renderNow();
		onReady?.();
	}
	onMounted(() => {
		init();
	});
	onScopeDispose(() => {
		lifecycle.destroyed = true;
	});
}
//#endregion
//#region src/canvas/surface/render-loop.ts
const renderSchedulers = /* @__PURE__ */ new WeakMap();
function getRenderScheduler(editor) {
	const existing = renderSchedulers.get(editor);
	if (existing) return existing;
	let frameId = null;
	const callbacks = /* @__PURE__ */ new Set();
	function flush() {
		frameId = null;
		const pending = [...callbacks];
		callbacks.clear();
		for (const callback of pending) callback();
	}
	const scheduler = {
		schedule(callback) {
			callbacks.add(callback);
			if (frameId !== null) return;
			frameId = requestAnimationFrame(flush);
		},
		cancel(callback) {
			callbacks.delete(callback);
			if (callbacks.size === 0 && frameId !== null) {
				cancelAnimationFrame(frameId);
				frameId = null;
			}
		}
	};
	renderSchedulers.set(editor, scheduler);
	return scheduler;
}
function shouldScheduleForSelection(layer) {
	return layer !== "scene";
}
function createCanvasRenderLoop(editor, renderNow, options = {}) {
	const scheduler = getRenderScheduler(editor);
	let dirty = true;
	let frameScheduled = false;
	let lastRenderVersion = -1;
	let lastSelectedIds = null;
	function renderFrame() {
		frameScheduled = false;
		if (editor.state.loading) {
			scheduleRender();
			return;
		}
		const versionChanged = editor.state.renderVersion !== lastRenderVersion;
		const selectionChanged = editor.state.selectedIds !== lastSelectedIds;
		if (dirty || versionChanged || selectionChanged) {
			dirty = false;
			renderNow();
		}
	}
	const scheduleRender = () => {
		dirty = true;
		if (frameScheduled) return;
		frameScheduled = true;
		scheduler.schedule(renderFrame);
	};
	const unsubscribe = [editor.onEditorEvent("render:requested", scheduleRender), editor.onEditorEvent("viewport:changed", scheduleRender)];
	unsubscribe.push(editor.onEditorEvent("repaint:requested", scheduleRender));
	if (shouldScheduleForSelection(options.layer)) unsubscribe.push(editor.onEditorEvent("selection:changed", scheduleRender));
	function markRendered() {
		lastRenderVersion = editor.state.renderVersion;
		lastSelectedIds = editor.state.selectedIds;
	}
	function pause() {
		for (const off of unsubscribe) off();
		if (frameScheduled) {
			scheduler.cancel(renderFrame);
			frameScheduled = false;
		}
	}
	return {
		pause,
		markRendered,
		markDirty: scheduleRender
	};
}
//#endregion
//#region src/canvas/surface/resize-observer.ts
function useCanvasResizeObserver({ canvasRef, getCanvasKitValue, resizeCanvas }) {
	let resizeRaf = 0;
	function cancelResize() {
		cancelAnimationFrame(resizeRaf);
	}
	useResizeObserver(canvasRef, () => {
		const canvas = canvasRef.value;
		if (!canvas || !getCanvasKitValue() || resizeRaf) return;
		resizeRaf = requestAnimationFrame(() => {
			resizeRaf = 0;
			resizeCanvas(canvas);
		});
	});
	return { cancelResize };
}
//#endregion
//#region src/canvas/surface/lifecycle.ts
function createCanvasSurfaceManager({ editor, canvasRef, options, getCanvasKit, isDestroyed, shouldShowRulers }) {
	const state = {
		renderer: null,
		glContext: null
	};
	let sceneBackingRenderTimer = null;
	function clearSceneBackingRenderTimer() {
		if (sceneBackingRenderTimer === null) return;
		clearTimeout(sceneBackingRenderTimer);
		sceneBackingRenderTimer = null;
	}
	function createSurface(canvas, { reloadFonts = false } = {}) {
		const ck = getCanvasKit();
		if (!ck) return;
		if (state.renderer) editor.removeCanvasRenderer(state.renderer);
		state.renderer?.destroy();
		state.renderer = null;
		state.glContext?.delete();
		state.glContext = null;
		sizeCanvas(canvas, editor);
		const result = makeGLSurface(ck, canvas, editor, options, state.glContext);
		state.glContext = result.glContext;
		const surface = result.surface;
		if (!surface) {
			canvas.dataset.surfaceError = "webgl";
			return;
		}
		state.renderer = new SkiaRenderer(ck, surface, canvas.getContext("webgl2") ?? null);
		editor.setCanvasKit(ck, state.renderer);
		canvas.dataset.ready = "1";
		if (reloadFonts && !isDestroyed()) state.renderer.loadFonts(renderNow).then(() => {
			if (!isDestroyed()) renderNow();
		});
	}
	function renderNow() {
		if (!state.renderer || isDestroyed()) return;
		state.renderer.renderFromEditorState(editor.state, editor.graph, editor.textEditor, canvasRef.value?.clientWidth ?? 0, canvasRef.value?.clientHeight ?? 0, shouldShowRulers(), options?.layer ?? "full");
		renderLoop.markRendered();
		clearSceneBackingRenderTimer();
		if (options?.layer === "scene" && state.renderer.sceneBackingNeedsCrispRender) {
			const delay = Math.max(0, state.renderer.sceneBackingPreviewUntil - performance.now());
			sceneBackingRenderTimer = setTimeout(() => renderLoop.markDirty(), delay);
		}
	}
	const renderLoop = createCanvasRenderLoop(editor, renderNow, { layer: options?.layer });
	function resizeCanvas(canvas) {
		const ck = getCanvasKit();
		if (!ck || !state.renderer) {
			createSurface(canvas);
			return;
		}
		sizeCanvas(canvas, editor);
		const result = makeGLSurface(ck, canvas, editor, options, state.glContext);
		state.glContext = result.glContext;
		const surface = result.surface;
		if (!surface) {
			console.warn("Falling back to full surface recreation after resize");
			createSurface(canvas, { reloadFonts: true });
			return;
		}
		state.renderer.replaceSurface(surface);
		renderNow();
	}
	function destroy() {
		clearSceneBackingRenderTimer();
		renderLoop.pause();
		if (state.renderer) editor.removeCanvasRenderer(state.renderer);
		state.renderer?.destroy();
		state.glContext?.delete();
	}
	return {
		createSurface,
		resizeCanvas,
		renderNow,
		destroy,
		markDirty: renderLoop.markDirty,
		getRenderer: () => state.renderer
	};
}
function useCanvasSurfaceLifecycle({ canvasRef, surface, setCanvasKit, getCanvasKitValue, lifecycle, onReady }) {
	useCanvasKitLoader({
		canvasRef,
		lifecycle,
		setCanvasKit,
		createSurface: surface.createSurface,
		loadFonts: () => surface.getRenderer()?.loadFonts(surface.renderNow),
		renderNow: surface.renderNow,
		onReady
	});
	const { cancelResize } = useCanvasResizeObserver({
		canvasRef,
		getCanvasKitValue,
		resizeCanvas: surface.resizeCanvas
	});
	onScopeDispose(() => {
		lifecycle.destroyed = true;
		cancelResize();
		surface.destroy();
	});
}
//#endregion
//#region src/editor/viewport-kind/use.ts
const breakpoints = useBreakpoints({ mobile: 768 });
/**
* Returns coarse viewport kind flags used by responsive editor UI.
*/
function useViewportKind() {
	const isMobile = breakpoints.smaller("mobile");
	return {
		isMobile,
		isDesktop: computed(() => !isMobile.value)
	};
}
//#endregion
//#region src/canvas/surface/overlays.ts
function createRulerVisibility(options) {
	const noRulersParam = (IS_BROWSER ? new URLSearchParams(window.location.search) : new URLSearchParams()).has("no-rulers");
	const { isMobile } = useViewportKind();
	return function shouldShowRulers() {
		if (options?.showRulers === false) return false;
		return !noRulersParam && !isMobile.value;
	};
}
function createCanvasHitTests(editor, getRenderer) {
	function hitTestSectionTitle(canvasX, canvasY) {
		return getRenderer()?.hitTestSectionTitle(editor.graph, canvasX, canvasY) ?? null;
	}
	function hitTestComponentLabel(canvasX, canvasY) {
		return getRenderer()?.hitTestComponentLabel(editor.graph, canvasX, canvasY) ?? null;
	}
	function hitTestFrameTitle(canvasX, canvasY) {
		return getRenderer()?.hitTestFrameTitle(editor.graph, canvasX, canvasY, editor.state.selectedIds) ?? null;
	}
	return {
		hitTestSectionTitle,
		hitTestComponentLabel,
		hitTestFrameTitle
	};
}
//#endregion
//#region src/canvas/surface/use.ts
/**
* Connects an OpenPencil editor to a real canvas element using CanvasKit.
*
* This composable owns renderer creation, surface recreation on resize,
* render scheduling, and renderer-backed hit testing helpers used by higher-
* level canvas interaction code.
*/
function useCanvas(canvasRef, editor, options) {
	let ck = null;
	const lifecycle = { destroyed: false };
	const isDestroyed = () => lifecycle.destroyed;
	const surface = createCanvasSurfaceManager({
		editor,
		canvasRef,
		options,
		getCanvasKit: () => ck,
		isDestroyed,
		shouldShowRulers: createRulerVisibility(options)
	});
	useCanvasSurfaceLifecycle({
		canvasRef,
		surface,
		lifecycle,
		getCanvasKitValue: () => ck,
		setCanvasKit: (value) => {
			ck = value;
		},
		onReady: options?.onReady
	});
	const { hitTestSectionTitle, hitTestComponentLabel, hitTestFrameTitle } = createCanvasHitTests(editor, surface.getRenderer);
	return {
		render: surface.markDirty,
		renderNow: surface.renderNow,
		hitTestSectionTitle,
		hitTestComponentLabel,
		hitTestFrameTitle
	};
}
//#endregion
//#region \0/plugin-vue/export-helper
var export_helper_default = (sfc, props) => {
	const target = sfc.__vccOpts || sfc;
	for (const [key, val] of props) target[key] = val;
	return target;
};
//#endregion
//#region src/canvas/context/index.ts
const CANVAS_KEY = Symbol("canvas");
function provideCanvas(ctx) {
	provide(CANVAS_KEY, ctx);
}
function useCanvasContext() {
	const ctx = inject(CANVAS_KEY);
	if (!ctx) throw new Error("[open-pencil] useCanvasContext() called outside <CanvasRoot>");
	return ctx;
}
//#endregion
//#region src/canvas/CanvasRoot.vue
const _sfc_main = /* @__PURE__ */ defineComponent({
	__name: "CanvasRoot",
	props: {
		layer: {
			type: String,
			required: false
		},
		showRulers: {
			type: Boolean,
			required: false
		},
		preserveDrawingBuffer: {
			type: Boolean,
			required: false
		},
		onReady: {
			type: Function,
			required: false
		}
	},
	setup(__props, { expose: __expose }) {
		__expose();
		const editor = useEditor();
		const canvasRef = ref(null);
		const ready = ref(false);
		const { renderNow, hitTestSectionTitle, hitTestComponentLabel, hitTestFrameTitle } = useCanvas(canvasRef, editor, {
			showRulers: __props.showRulers,
			preserveDrawingBuffer: __props.preserveDrawingBuffer,
			onReady: () => {
				ready.value = true;
			}
		});
		provideCanvas({
			canvasRef,
			ready,
			renderNow,
			hitTestSectionTitle,
			hitTestComponentLabel,
			hitTestFrameTitle
		});
		const __returned__ = {
			editor,
			canvasRef,
			ready,
			renderNow,
			hitTestSectionTitle,
			hitTestComponentLabel,
			hitTestFrameTitle
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default", {
		canvasRef: $setup.canvasRef,
		ready: $setup.ready,
		renderNow: $setup.renderNow
	});
}
var CanvasRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main, [["render", _sfc_render], ["__file", "/tmp/open-pencil-debug/packages/vue/src/canvas/CanvasRoot.vue"]]);
//#endregion
export { CanvasRoot_default, EDITOR_KEY, export_helper_default, provideEditor, useCanvas, useCanvasContext, useEditor, useViewportKind };

//# sourceMappingURL=CanvasRoot.js.map
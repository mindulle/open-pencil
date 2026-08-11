import { CANVAS_BG_COLOR, COMPONENT_COLOR, COMPONENT_SET_BORDER_WIDTH, IS_BROWSER, SELECTION_COLOR } from "../constants.js";
import { decodeBase64 } from "../bytes/base64.js";
import { buildParagraph, buildTextPicture, measureTextNode, nodeFontReadiness } from "./text/index.js";
import { RenderProfiler } from "../profiler/render-profiler.js";
import { LabelCache } from "./labels/cache.js";
import { hitTestComponentLabel, hitTestFrameTitle, hitTestSectionTitle } from "./labels/hit-test.js";
import { resolveFillColor, resolveFillColorInfo, resolveStrokeColor, resolveStrokeColorInfo } from "./renderer/colors.js";
import { getFontProvider, isTextPictureCurrent, loadFonts, prepareForExport, syncFontGeneration, trackFontDemand } from "./renderer/fonts.js";
import { aiClearActive, aiClearAll, aiFlashDone, aiMarkActive, aiMarkDone, flashNode, hasActiveFlashes, invalidateAllPictures, invalidateNodePicture, invalidateScenePicture } from "./renderer/state.js";
import { destroyRenderer } from "./renderer/lifecycle.js";
import { installRendererDomainMethods } from "./renderer/methods.js";
import { initializeRendererPaints } from "./renderer/paints.js";
import { render, renderFromEditorState, renderSceneToCanvas } from "./renderer/pipeline.js";
//#region src/canvas/renderer.ts
var SkiaRenderer = class {
	ck;
	surface;
	imageFilterCache = /* @__PURE__ */ new Map();
	maskFilterCache = /* @__PURE__ */ new Map();
	_tmpColor = /* @__PURE__ */ new Float32Array(4);
	_tmpRect = /* @__PURE__ */ new Float32Array(4);
	textFont = null;
	labelFont = null;
	sizeFont = null;
	sectionTitleFont = null;
	componentLabelFont = null;
	fontMgr = null;
	fontProvider = null;
	fontsLoaded = false;
	fontGeneration = 0;
	onFontResolutionSettled;
	pendingFontNodes = /* @__PURE__ */ new Map();
	textPictureGenerations = /* @__PURE__ */ new Map();
	imageCache = /* @__PURE__ */ new Map();
	vectorPathCache = /* @__PURE__ */ new Map();
	vectorStrokePathCache = /* @__PURE__ */ new Map();
	vectorStrokeOutlineCache = /* @__PURE__ */ new Map();
	fillGeometryCache = /* @__PURE__ */ new Map();
	strokeGeometryCache = /* @__PURE__ */ new Map();
	scenePicture = null;
	scenePictureVersion = -1;
	scenePictureFontGeneration = -1;
	scenePicturePositionPreviewVersion = -1;
	scenePicturePageId = null;
	sceneBacking = null;
	sceneBackingPreviewUntil = 0;
	sceneBackingNeedsCrispRender = false;
	sceneBackingAllocationFailed = false;
	sceneBackingBuild = null;
	sceneBackingAverageRecordMs = 40;
	sceneBackingAverageViewportIntervalMs = 80;
	sceneBackingLastViewportEventAt = 0;
	lastSceneViewport = null;
	nodePictureCache = /* @__PURE__ */ new Map();
	nodePictureCacheGenerations = /* @__PURE__ */ new Map();
	subtreePictureCache = /* @__PURE__ */ new Map();
	subtreePictureCachePageId = null;
	subtreePictureCacheSceneVersion = -1;
	subtreePictureCachePositionPreviewVersion = -1;
	subtreePictureCacheFontGeneration = -1;
	labelCache = new LabelCache();
	profiler;
	panX = 0;
	panY = 0;
	zoom = 1;
	dpr = 1;
	viewportWidth = 0;
	viewportHeight = 0;
	showRulers = true;
	pageColor = CANVAS_BG_COLOR;
	rulerTheme = null;
	pageId = null;
	worldViewport = {
		x: 0,
		y: 0,
		w: 0,
		h: 0
	};
	_nodeCount = 0;
	_culledCount = 0;
	_flashes = [];
	_flashPaint = null;
	_aiActiveNodes = /* @__PURE__ */ new Set();
	_aiDoneFlashes = [];
	DEFAULT_FONT_SIZE = 14;
	COMPONENT_SET_BORDER_WIDTH = COMPONENT_SET_BORDER_WIDTH;
	COMPONENT_SET_DASH = 6;
	COMPONENT_SET_DASH_GAP = 4;
	color4f(r, g, b, a) {
		const c = this._tmpColor;
		c[0] = r;
		c[1] = g;
		c[2] = b;
		c[3] = a;
		return c;
	}
	ltrb(l, t, r, b) {
		const rc = this._tmpRect;
		rc[0] = l;
		rc[1] = t;
		rc[2] = r;
		rc[3] = b;
		return rc;
	}
	selColor(alpha = 1) {
		return this.ck.Color4f(SELECTION_COLOR.r, SELECTION_COLOR.g, SELECTION_COLOR.b, alpha);
	}
	compColor(alpha = 1) {
		return this.ck.Color4f(COMPONENT_COLOR.r, COMPONENT_COLOR.g, COMPONENT_COLOR.b, alpha);
	}
	isComponentType(type) {
		return type === "COMPONENT" || type === "COMPONENT_SET" || type === "INSTANCE";
	}
	isRectangularType(type) {
		return type === "FRAME" || type === "RECTANGLE" || type === "ROUNDED_RECTANGLE" || type === "COMPONENT" || type === "INSTANCE" || type === "SECTION" || type === "GROUP";
	}
	effectOverflow(node) {
		let expand = 0;
		for (const e of node.effects) {
			if (!e.visible) continue;
			const blur = e.radius;
			const spread = e.spread;
			const ox = Math.abs(e.offset.x);
			const oy = Math.abs(e.offset.y);
			expand = Math.max(expand, blur + spread + ox, blur + spread + oy);
		}
		return expand;
	}
	constructor(ck, surface, gl) {
		this.ck = ck;
		this.surface = surface;
		this.profiler = new RenderProfiler(ck, gl ?? null);
		initializeRendererPaints(this);
	}
	getFontProvider() {
		return getFontProvider(this);
	}
	isDestroyed() {
		return this.destroyed;
	}
	async loadFonts(onFallbackFontsLoaded) {
		await loadFonts(this, onFallbackFontsLoaded);
	}
	syncFontGeneration() {
		syncFontGeneration(this);
	}
	trackFontDemand(node, key) {
		trackFontDemand(this, node, key);
	}
	isTextPictureCurrent(node) {
		return isTextPictureCurrent(this, node);
	}
	async prepareForExport(graph, pageId, nodeIds) {
		return prepareForExport(this, graph, pageId, nodeIds);
	}
	replaceSurface(surface) {
		this.surface.delete();
		this.surface = surface;
		this.sceneBackingAllocationFailed = false;
		this.invalidateScenePicture();
	}
	invalidateScenePicture() {
		invalidateScenePicture(this);
	}
	invalidateAllPictures() {
		invalidateAllPictures(this);
	}
	invalidateNodePicture(nodeId) {
		invalidateNodePicture(this, nodeId);
	}
	flashNode(nodeId) {
		flashNode(this, nodeId);
	}
	aiMarkActive(nodeIds) {
		aiMarkActive(this, nodeIds);
	}
	aiMarkDone(nodeIds) {
		aiMarkDone(this, nodeIds);
	}
	aiFlashDone(nodeIds) {
		aiFlashDone(this, nodeIds);
	}
	aiClearActive() {
		aiClearActive(this);
	}
	aiClearAll() {
		aiClearAll(this);
	}
	get hasActiveFlashes() {
		return hasActiveFlashes(this);
	}
	hitTestSectionTitle(graph, canvasX, canvasY) {
		return hitTestSectionTitle(graph, canvasX, canvasY, this.zoom, this.pageId ?? graph.rootId, this.sectionTitleFont, this.labelCache);
	}
	hitTestComponentLabel(graph, canvasX, canvasY) {
		return hitTestComponentLabel(graph, canvasX, canvasY, this.zoom, this.pageId ?? graph.rootId, this.componentLabelFont, this.labelCache);
	}
	hitTestFrameTitle(graph, canvasX, canvasY, selectedIds) {
		return hitTestFrameTitle(graph, canvasX, canvasY, this.zoom, selectedIds, this.labelFont);
	}
	renderSceneToCanvas(canvas, graph, pageId) {
		renderSceneToCanvas(this, canvas, graph, pageId);
	}
	renderFromEditorState(state, graph, textEditor, viewportWidth, viewportHeight, showRulers = true, layer = "full") {
		const dpr = IS_BROWSER ? window.devicePixelRatio || 1 : 1;
		renderFromEditorState(this, state, graph, textEditor, viewportWidth, viewportHeight, showRulers, dpr, layer);
	}
	render(graph, selectedIds, overlays = {}, sceneVersion = -1, layer = "full") {
		render(this, graph, selectedIds, overlays, sceneVersion, layer);
	}
	invalidateVectorPath(nodeId) {
		for (const cache of [this.vectorPathCache, this.vectorStrokePathCache]) {
			const old = cache.get(nodeId);
			if (!old) continue;
			for (const p of old) p.delete();
			cache.delete(nodeId);
		}
		for (const [key, paths] of this.vectorStrokeOutlineCache) {
			if (!key.startsWith(`${nodeId}|`)) continue;
			for (const p of paths) p.delete();
			this.vectorStrokeOutlineCache.delete(key);
		}
		for (const cache of [this.fillGeometryCache, this.strokeGeometryCache]) {
			const oldGeom = cache.get(nodeId);
			if (oldGeom) {
				for (const p of oldGeom) p.delete();
				cache.delete(nodeId);
			}
		}
	}
	measureTextNode(node, maxWidth) {
		return measureTextNode(this, node, maxWidth);
	}
	nodeFontReadiness(node) {
		return nodeFontReadiness(this, node);
	}
	isNodeFontLoaded(node) {
		return this.nodeFontReadiness(node) === "ready";
	}
	buildTextPicture(node) {
		return buildTextPicture(this, node);
	}
	buildParagraph(node, color, opts) {
		return buildParagraph(this, node, color, opts);
	}
	resolveFillColorInfo(fill, fillIndex, node, graph) {
		return resolveFillColorInfo(fill, fillIndex, node, graph);
	}
	resolveFillColor(fill, fillIndex, node, graph) {
		return resolveFillColor(fill, fillIndex, node, graph);
	}
	resolveStrokeColorInfo(stroke, strokeIndex, node, graph) {
		return resolveStrokeColorInfo(stroke, strokeIndex, node, graph);
	}
	resolveStrokeColor(stroke, strokeIndex, node, graph) {
		return resolveStrokeColor(stroke, strokeIndex, node, graph);
	}
	screenToCanvas(sx, sy) {
		return {
			x: (sx - this.panX) / this.zoom,
			y: (sy - this.panY) / this.zoom
		};
	}
	/**
	* Browser fallback for raster formats CanvasKit cannot encode itself
	* (this build returns null from `encodeToBytes` for JPEG/WEBP). Routes the
	* RGBA pixels through an HTMLCanvasElement so `toDataURL` does the encoding.
	* Returns null outside the browser or if encoding fails.
	*/
	encodeRasterFallback(pixels, width, height, format, quality) {
		if (!IS_BROWSER) return null;
		try {
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext("2d");
			if (!ctx) return null;
			const imageData = ctx.createImageData(width, height);
			imageData.data.set(pixels);
			ctx.putImageData(imageData, 0, 0);
			const mime = format === "JPG" ? "image/jpeg" : "image/webp";
			const dataURL = canvas.toDataURL(mime, quality / 100);
			if (!dataURL.startsWith(`data:${mime}`)) return null;
			const base64 = dataURL.split(",")[1];
			if (!base64) return null;
			return decodeBase64(base64);
		} catch (err) {
			console.warn("Raster encode fallback failed:", err);
			return null;
		}
	}
	destroyed = false;
	destroy() {
		destroyRenderer(this);
	}
};
installRendererDomainMethods(SkiaRenderer.prototype);
//#endregion
export { SkiaRenderer };

//# sourceMappingURL=renderer.js.map
import { IS_BROWSER } from "../constants.js";
import { fontManager } from "../text/fonts.js";
import { prefetchFigmaSchema } from "../clipboard.js";
import { setTextMeasurer } from "../layout/text-measurement.js";
import { TextEditor } from "../text/editor.js";
import { createAlignmentActions } from "./alignment.js";
import { createClipboardBridge } from "./bridges/clipboard.js";
import { createComponentBridge } from "./bridges/components.js";
import { createStructureBridge } from "./bridges/structure.js";
import { createUndoBridge } from "./bridges/undo.js";
import { createClipboardActions } from "./clipboard.js";
import { createColorSpaceActions } from "./color-space.js";
import { createComponentSyncScheduler } from "./component-sync.js";
import { createComponentActions } from "./components.js";
import { createGraphEventSubscription } from "./graph-events.js";
import { createGraphReadActions } from "./graph-reads.js";
import { createLayoutRunner } from "./layout-runner.js";
import { createNodeActions } from "./nodes.js";
import { createPageActions } from "./pages.js";
import { createSelectionActions } from "./selection.js";
import { createShapeActions } from "./shapes.js";
import { createDefaultEditorState } from "./state.js";
import { createStructureActions } from "./structure.js";
import { createTextActions } from "./text.js";
import { createUndoActions } from "./undo.js";
import { createVariableActions } from "./variables.js";
import { createVectorizeActions } from "./vectorize.js";
import { createViewportActions } from "./viewport.js";
import { SceneGraph } from "@open-pencil/scene-graph";
import { createNanoEvents } from "nanoevents";
import { UndoManager } from "@open-pencil/scene-graph/undo";
//#region src/editor/create.ts
function createEditor(options) {
	let _graph = options?.graph ?? new SceneGraph();
	const skipInitialGraphSetup = options?.skipInitialGraphSetup ?? false;
	const undo = new UndoManager();
	const _loadFont = options?.loadFont ?? fontManager.loadFont.bind(fontManager);
	const _getViewportSize = options?.getViewportSize ?? (() => {
		if (IS_BROWSER) return {
			width: window.innerWidth,
			height: window.innerHeight
		};
		return {
			width: 800,
			height: 600
		};
	});
	let _ck = null;
	let _renderer = null;
	const _renderers = /* @__PURE__ */ new Set();
	let _textEditor = null;
	const events = createNanoEvents();
	prefetchFigmaSchema();
	const state = options?.state ?? createDefaultEditorState(_graph.getPages()[0].id);
	function emitEditorEvent(event, ...args) {
		events.emit(event, ...args);
	}
	function onEditorEvent(event, handler) {
		return events.on(event, handler);
	}
	function requestRender() {
		state.renderVersion++;
		state.sceneVersion++;
		emitEditorEvent("render:requested", {
			renderVersion: state.renderVersion,
			sceneVersion: state.sceneVersion
		});
	}
	function requestRepaint() {
		state.renderVersion++;
		emitEditorEvent("repaint:requested", {
			renderVersion: state.renderVersion,
			sceneVersion: state.sceneVersion
		});
	}
	function setSelectedIds(ids) {
		const previous = [...state.selectedIds];
		state.selectedIds = ids;
		const selected = [...ids];
		if (previous.length !== selected.length || previous.some((id, index) => id !== selected[index])) emitEditorEvent("selection:changed", selected, previous);
	}
	function setActiveTool(tool) {
		const previous = state.activeTool;
		state.activeTool = tool;
		if (previous !== tool) emitEditorEvent("tool:changed", tool, previous);
	}
	const graphReads = createGraphReadActions(() => _graph);
	const { runLayoutForNode } = createLayoutRunner(() => _graph);
	const { scheduleComponentSync } = createComponentSyncScheduler(() => _graph, requestRender);
	const { subscribeToGraph } = createGraphEventSubscription({
		getGraph: () => _graph,
		getRenderers: () => _renderers,
		scheduleComponentSync,
		requestRender,
		emitEditorEvent
	});
	if (!skipInitialGraphSetup) subscribeToGraph();
	const ctx = {
		get graph() {
			return _graph;
		},
		set graph(g) {
			_graph = g;
		},
		undo,
		state,
		loadFont: _loadFont,
		resolveFigmaClipboardImages: options?.resolveFigmaClipboardImages ?? null,
		getViewportSize: _getViewportSize,
		getCk: () => _ck,
		getRenderer: () => _renderer,
		getTextEditor: () => _textEditor,
		requestRender,
		requestRepaint,
		emitEditorEvent,
		setSelectedIds,
		setActiveTool,
		runLayoutForNode,
		subscribeToGraph
	};
	const viewport = createViewportActions(ctx);
	const selection = createSelectionActions(ctx);
	const pages = createPageActions(ctx);
	const shapes = createShapeActions(ctx);
	const structure = createStructureActions(ctx);
	const components = createComponentActions(ctx);
	const clipboard = createClipboardActions(ctx);
	const colorSpace = createColorSpaceActions(ctx);
	const undoActions = createUndoActions(ctx);
	const text = createTextActions(ctx);
	const nodes = createNodeActions(ctx);
	const variables = createVariableActions(ctx);
	const vectorize = createVectorizeActions(ctx);
	const alignment = createAlignmentActions(ctx);
	const clipboardBridge = createClipboardBridge(clipboard, selection);
	const componentBridge = createComponentBridge(components, selection, structure, pages);
	const structureBridge = createStructureBridge(structure, selection);
	const undoBridge = createUndoBridge(undoActions, selection);
	function setCanvasKit(ck, renderer) {
		_ck = ck;
		_renderer = renderer;
		_renderers.add(renderer);
		_textEditor ??= new TextEditor(ck);
		setTextMeasurer(typeof renderer.measureTextNode === "function" ? (node, maxWidth) => renderer.measureTextNode(node, maxWidth) : null);
	}
	function removeCanvasRenderer(renderer) {
		_renderers.delete(renderer);
		if (_renderer === renderer) _renderer = _renderers.values().next().value ?? null;
	}
	function replaceGraph(newGraph) {
		_graph = newGraph;
		subscribeToGraph();
		const previousPageId = state.currentPageId;
		state.currentPageId = _graph.getPages()[0]?.id ?? _graph.rootId;
		setSelectedIds(/* @__PURE__ */ new Set());
		state.hoveredNodeId = null;
		pages.clearPageViewports();
		emitEditorEvent("graph:replaced", _graph);
		if (previousPageId !== state.currentPageId) emitEditorEvent("page:changed", state.currentPageId, previousPageId);
		requestRender();
	}
	return {
		get graph() {
			return _graph;
		},
		get renderer() {
			return _renderer;
		},
		get canvasRenderers() {
			return [..._renderers];
		},
		get textEditor() {
			return _textEditor;
		},
		undo,
		state,
		...graphReads,
		requestRender,
		requestRepaint,
		onEditorEvent,
		setCanvasKit,
		removeCanvasRenderer,
		replaceGraph,
		subscribeToGraph,
		...selection,
		...pages,
		...shapes,
		...structure,
		...nodes,
		...alignment,
		...vectorize,
		...variables,
		...text,
		...viewport,
		...undoBridge,
		setDocumentColorSpace: colorSpace.setDocumentColorSpace,
		...clipboardBridge,
		...componentBridge,
		...structureBridge
	};
}
//#endregion
export { createDefaultEditorState, createEditor };

//# sourceMappingURL=create.js.map
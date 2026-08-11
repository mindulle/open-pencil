import { drawPageGuides } from "../page-guides.js";
import { renderSceneBacking, updateSceneBackingPreviewState } from "./retained-backing.js";
import { computeDescendantVisualBounds } from "@open-pencil/scene-graph/geometry";
//#region src/canvas/renderer/pipeline.ts
function renderSceneToCanvas(r, canvas, graph, pageId) {
	const prevViewport = r.worldViewport;
	r.worldViewport = {
		x: -1e9,
		y: -1e9,
		w: 2e9,
		h: 2e9
	};
	const pageNode = graph.getNode(pageId);
	if (pageNode) for (const childId of pageNode.childIds) r.renderNode(canvas, graph, childId, {});
	r.worldViewport = prevViewport;
}
function renderFromEditorState(r, state, graph, textEditor, viewportWidth, viewportHeight, showRulers = true, dpr = 1, layer = "full") {
	r.dpr = dpr;
	r.panX = state.panX;
	r.panY = state.panY;
	r.zoom = state.zoom;
	r.viewportWidth = viewportWidth;
	r.viewportHeight = viewportHeight;
	r.showRulers = showRulers;
	r.pageColor = state.pageColor;
	r.rulerTheme = state.rulerTheme ?? null;
	r.pageId = state.currentPageId;
	render(r, graph, state.selectedIds, {
		hoveredNodeId: state.hoveredNodeId,
		enteredContainerId: state.enteredContainerId,
		editingTextId: state.editingTextId,
		textEditor,
		marquee: state.marquee,
		snapGuides: state.snapGuides,
		rotationPreview: state.rotationPreview,
		dropTargetId: state.dropTargetId,
		layoutInsertIndicator: state.layoutInsertIndicator,
		penState: state.penState ? {
			...state.penState,
			cursorX: state.penCursorX ?? void 0,
			cursorY: state.penCursorY ?? void 0
		} : null,
		nodeEditState: state.nodeEditState ?? null,
		remoteCursors: state.remoteCursors,
		autoLayoutHover: state.autoLayoutHover
	}, state.sceneVersion, layer);
}
function hasVolatileOverlay(overlays) {
	return overlays.dropTargetId != null || overlays.rotationPreview != null || overlays.editingTextId != null || overlays.nodeEditState != null;
}
function scenePictureMissReason(r, graph, overlays, sceneVersion, hasPositionPreview) {
	if (hasPositionPreview) return "position-preview";
	if (hasVolatileOverlay(overlays)) return "volatile-overlay";
	if (!r.scenePicture) return "missing-picture";
	if (graph.positionPreviewVersion !== r.scenePicturePositionPreviewVersion) return "position-preview-version";
	if (sceneVersion !== r.scenePictureVersion) return "scene-version";
	if (r.fontGeneration !== r.scenePictureFontGeneration) return "font-generation";
	if (r.pageId !== r.scenePicturePageId) return "page";
	return "unknown";
}
function canUseScenePicture(r, graph, sceneVersion, hasVolatileOverlays) {
	return !hasVolatileOverlays && !!r.scenePicture && graph.positionPreviewVersion === r.scenePicturePositionPreviewVersion && sceneVersion === r.scenePictureVersion && r.fontGeneration === r.scenePictureFontGeneration && r.pageId === r.scenePicturePageId;
}
const now = typeof performance !== "undefined" ? () => performance.now() : () => 0;
function measure(fn) {
	const start = now();
	return {
		value: fn(),
		duration: now() - start
	};
}
function render(r, graph, selectedIds, overlays = {}, sceneVersion = -1, layer = "full") {
	r.syncFontGeneration();
	const p = r.profiler;
	p.beginFrame();
	p.setScenePictureDrawTime(0);
	p.setScenePictureRecordTime(0);
	p.setFlushTime(0);
	graph.clearAbsPosCache();
	const canvas = r.surface.getCanvas();
	if (layer === "overlays") canvas.clear(r.ck.Color4f(0, 0, 0, 0));
	else canvas.clear(r.ck.Color4f(r.pageColor.r, r.pageColor.g, r.pageColor.b, 1));
	r.worldViewport = {
		x: -r.panX / r.zoom,
		y: -r.panY / r.zoom,
		w: r.viewportWidth / r.zoom,
		h: r.viewportHeight / r.zoom
	};
	updateSceneBackingPreviewState(r, layer);
	const hasPositionPreview = graph.positionPreviewVersion !== r.scenePicturePositionPreviewVersion && sceneVersion === r.scenePictureVersion;
	const hasVolatileOverlays = hasPositionPreview || hasVolatileOverlay(overlays);
	const canUsePicture = canUseScenePicture(r, graph, sceneVersion, hasVolatileOverlays);
	const cacheMissReason = scenePictureMissReason(r, graph, overlays, sceneVersion, hasPositionPreview);
	if (layer !== "overlays") {
		canvas.save();
		canvas.scale(r.dpr, r.dpr);
		p.beginPhase("render:scene");
		if (layer === "scene" && !hasVolatileOverlays && renderSceneBacking(r, canvas, graph, sceneVersion)) p.setScenePictureMode("hit", "backing");
		else {
			canvas.translate(r.panX, r.panY);
			canvas.scale(r.zoom, r.zoom);
			renderSceneContent(r, canvas, graph, overlays, sceneVersion, canUsePicture, cacheMissReason, hasVolatileOverlays);
		}
		p.endPhase("render:scene");
		canvas.restore();
	}
	if (layer !== "scene") {
		canvas.save();
		canvas.scale(r.dpr, r.dpr);
		r.labelCache.update(graph, r.pageId, sceneVersion, graph.positionPreviewVersion);
		p.beginPhase("render:sectionTitles");
		r.drawSectionTitles(canvas, graph);
		p.endPhase("render:sectionTitles");
		p.beginPhase("render:componentLabels");
		r.drawComponentLabels(canvas, graph);
		p.endPhase("render:componentLabels");
		canvas.restore();
		canvas.save();
		canvas.scale(r.dpr, r.dpr);
		r.drawHoverHighlight(canvas, graph, overlays.hoveredNodeId === overlays.nodeEditState?.nodeId ? null : overlays.hoveredNodeId);
		r.drawEnteredContainer(canvas, graph, overlays.enteredContainerId);
		p.beginPhase("render:selection");
		r.drawSelection(canvas, graph, selectedIds, overlays);
		p.endPhase("render:selection");
		r.drawFlashes(canvas, graph);
		drawPageGuides(r, canvas, graph);
		r.drawSnapGuides(canvas, overlays.snapGuides);
		r.drawMarquee(canvas, overlays.marquee);
		r.drawLayoutInsertIndicator(canvas, overlays.layoutInsertIndicator);
		r.drawAutoLayoutHover(canvas, graph, overlays.autoLayoutHover);
		r.drawNodeEditOverlay(canvas, graph, overlays.nodeEditState);
		r.drawPenOverlay(canvas, overlays.penState);
		r.drawRemoteCursors(canvas, graph, overlays.remoteCursors);
		p.beginPhase("render:rulers");
		if (r.showRulers) r.drawRulers(canvas, graph, selectedIds);
		p.endPhase("render:rulers");
		p.drawHUD(canvas, r.showRulers);
		canvas.restore();
	}
	p.beginPhase("render:flush");
	const { duration: flushDuration } = measure(() => r.surface.flush());
	p.setFlushTime(flushDuration);
	p.endPhase("render:flush");
	p.setNodeCounts(r._nodeCount, r._culledCount);
	p.endFrame();
}
function renderSceneContent(r, canvas, graph, overlays, sceneVersion, canUsePicture, cacheMissReason, hasVolatileOverlays) {
	const p = r.profiler;
	if (canUsePicture) {
		p.setScenePictureMode("hit");
		p.beginPhase("render:drawPicture");
		if (r.scenePicture) {
			const picture = r.scenePicture;
			const { duration } = measure(() => canvas.drawPicture(picture));
			p.setScenePictureDrawTime(duration);
		}
		p.endPhase("render:drawPicture");
	} else if (hasVolatileOverlays) {
		p.setScenePictureMode("volatile", cacheMissReason);
		r._nodeCount = 0;
		r._culledCount = 0;
		p.beginPhase("render:volatile");
		renderPageChildren(r, canvas, graph, overlays);
		p.endPhase("render:volatile");
	} else {
		p.setScenePictureMode("record", cacheMissReason);
		r._nodeCount = 0;
		r._culledCount = 0;
		p.beginPhase("render:recordPicture");
		const { duration } = measure(() => recordScenePicture(r, canvas, graph, sceneVersion));
		p.setScenePictureRecordTime(duration);
		p.endPhase("render:recordPicture");
	}
}
function renderPageChildren(r, canvas, graph, overlays) {
	const pageNode = graph.getNode(r.pageId ?? graph.rootId);
	if (!pageNode) return;
	for (const childId of pageNode.childIds) r.renderNode(canvas, graph, childId, overlays);
}
function recordScenePicture(r, canvas, graph, sceneVersion) {
	r.scenePicture?.delete();
	const prevViewport = r.worldViewport;
	r.worldViewport = {
		x: -1e6,
		y: -1e6,
		w: 2e6,
		h: 2e6
	};
	const recorder = new r.ck.PictureRecorder();
	const pageNode = graph.getNode(r.pageId ?? graph.rootId);
	const sceneContentBounds = pageNode ? computeDescendantVisualBounds(pageNode.childIds, (id) => graph.getNode(id), (id) => graph.getAbsolutePosition(id)) : null;
	const sceneBounds = sceneContentBounds ? {
		x: sceneContentBounds.minX,
		y: sceneContentBounds.minY,
		width: sceneContentBounds.maxX - sceneContentBounds.minX,
		height: sceneContentBounds.maxY - sceneContentBounds.minY
	} : {
		x: 0,
		y: 0,
		width: 1,
		height: 1
	};
	const padding = 1024;
	const bounds = r.ck.LTRBRect(sceneBounds.x - padding, sceneBounds.y - padding, sceneBounds.x + sceneBounds.width + padding, sceneBounds.y + sceneBounds.height + padding);
	const recCanvas = recorder.beginRecording(bounds);
	if (pageNode) for (const childId of pageNode.childIds) r.renderNode(recCanvas, graph, childId, {});
	r.scenePicture = recorder.finishRecordingAsPicture();
	recorder.delete();
	r.worldViewport = prevViewport;
	r.scenePictureVersion = sceneVersion;
	r.scenePictureFontGeneration = r.fontGeneration;
	r.scenePicturePositionPreviewVersion = graph.positionPreviewVersion;
	r.scenePicturePageId = r.pageId;
	canvas.drawPicture(r.scenePicture);
}
//#endregion
export { render, renderFromEditorState, renderSceneToCanvas };

//# sourceMappingURL=pipeline.js.map
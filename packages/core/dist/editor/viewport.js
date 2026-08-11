import { ZOOM_SCALE_MAX, ZOOM_SCALE_MIN } from "../constants.js";
import { computeAbsoluteBounds, computeBounds } from "@open-pencil/scene-graph/geometry";
//#region src/editor/viewport.ts
function createViewportActions(ctx) {
	function currentViewport() {
		return {
			panX: ctx.state.panX,
			panY: ctx.state.panY,
			zoom: ctx.state.zoom
		};
	}
	function emitViewportChanged(previous) {
		const next = currentViewport();
		if (next.panX !== previous.panX || next.panY !== previous.panY || next.zoom !== previous.zoom) ctx.emitEditorEvent("viewport:changed", next, previous);
	}
	function screenToCanvas(sx, sy) {
		return {
			x: (sx - ctx.state.panX) / ctx.state.zoom,
			y: (sy - ctx.state.panY) / ctx.state.zoom
		};
	}
	function setZoomAroundPoint(level, centerX, centerY) {
		const previous = currentViewport();
		const newZoom = Math.max(.02, Math.min(256, level));
		ctx.state.panX = centerX - (centerX - ctx.state.panX) * (newZoom / ctx.state.zoom);
		ctx.state.panY = centerY - (centerY - ctx.state.panY) * (newZoom / ctx.state.zoom);
		ctx.state.zoom = newZoom;
		ctx.requestRepaint();
		emitViewportChanged(previous);
	}
	function applyZoom(delta, centerX, centerY) {
		const factor = Math.min(ZOOM_SCALE_MAX, Math.max(ZOOM_SCALE_MIN, Math.exp(-delta / 50)));
		setZoomAroundPoint(ctx.state.zoom * factor, centerX, centerY);
	}
	function pan(dx, dy) {
		const previous = currentViewport();
		ctx.state.panX += dx;
		ctx.state.panY += dy;
		ctx.requestRepaint();
		emitViewportChanged(previous);
	}
	function zoomToBounds(minX, minY, maxX, maxY) {
		const previous = currentViewport();
		const padding = 80;
		const w = maxX - minX + padding * 2;
		const h = maxY - minY + padding * 2;
		const { width: viewW, height: viewH } = ctx.getViewportSize();
		const zoom = Math.min(viewW / w, viewH / h, 1);
		ctx.state.zoom = zoom;
		ctx.state.panX = (viewW - w * zoom) / 2 - minX * zoom + padding * zoom;
		ctx.state.panY = (viewH - h * zoom) / 2 - minY * zoom + padding * zoom;
		ctx.requestRepaint();
		emitViewportChanged(previous);
	}
	function zoomToFit() {
		const nodes = ctx.graph.getChildren(ctx.state.currentPageId);
		if (nodes.length === 0) return;
		const b = computeBounds(nodes);
		zoomToBounds(b.x, b.y, b.x + b.width, b.y + b.height);
	}
	function zoomToLevel(level) {
		const { width: viewW, height: viewH } = ctx.getViewportSize();
		const centerX = (-ctx.state.panX + viewW / 2) / ctx.state.zoom;
		const centerY = (-ctx.state.panY + viewH / 2) / ctx.state.zoom;
		const previous = currentViewport();
		ctx.state.zoom = Math.max(.02, Math.min(256, level));
		ctx.state.panX = viewW / 2 - centerX;
		ctx.state.panY = viewH / 2 - centerY;
		ctx.requestRepaint();
		emitViewportChanged(previous);
	}
	function zoomTo100() {
		zoomToLevel(1);
	}
	function zoomToSelection() {
		if (ctx.state.selectedIds.size === 0) return;
		const nodes = [...ctx.state.selectedIds].map((id) => ctx.graph.getNode(id)).filter((n) => n != null);
		if (nodes.length === 0) return;
		const b = computeAbsoluteBounds(nodes, (id) => ctx.graph.getAbsolutePosition(id));
		zoomToBounds(b.x, b.y, b.x + b.width, b.y + b.height);
	}
	return {
		screenToCanvas,
		setZoomAroundPoint,
		applyZoom,
		pan,
		zoomToBounds,
		zoomToFit,
		zoomTo100,
		zoomToLevel,
		zoomToSelection
	};
}
//#endregion
export { createViewportActions };

//# sourceMappingURL=viewport.js.map
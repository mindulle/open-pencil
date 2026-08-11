import { PEN_HANDLE_RADIUS } from "../constants.js";
import { regenerateFillGeometry } from "../vector/fill-geometry.js";
import { vectorNetworkToPath } from "../vector/index.js";
import { transformVectorNetwork } from "@open-pencil/scene-graph";
import { getWorldMatrix as getWorldMatrix$1 } from "@open-pencil/scene-graph/coordinate";
import Matrix from "@open-pencil/scene-graph/matrix";
//#region src/canvas/node-edit-overlay.ts
const BLUE = [
	.23,
	.51,
	.96
];
const LIGHT_BLUE = [
	.376,
	.647,
	.98
];
/** Compute set of vertices whose handles should be visible: selected vertices + vertices with selected handles + their direct neighbors */
function computeHandleVisibleVertices(selectedVertexIndices, selectedHandles, segments) {
	const seed = new Set(selectedVertexIndices);
	for (const key of selectedHandles) {
		const [siStr, tf] = key.split(":");
		const seg = segments[Number(siStr)];
		seed.add(tf === "tangentStart" ? seg.start : seg.end);
	}
	const visible = new Set(seed);
	for (const seg of segments) {
		if (seed.has(seg.start)) visible.add(seg.end);
		if (seed.has(seg.end)) visible.add(seg.start);
	}
	return visible;
}
function drawNodeEditOverlay(r, canvas, graph, editState) {
	if (!editState) return;
	const { segments, selectedVertexIndices } = editState;
	const vertices = editState.vertices;
	const regions = editState.regions;
	if (vertices.length === 0) return;
	ensureNodeEditPaints(r);
	const toScreen = (x, y) => ({
		x: x * r.zoom + r.panX,
		y: y * r.zoom + r.panY
	});
	const selectedHandles = editState.selectedHandles ?? /* @__PURE__ */ new Set();
	const hovered = editState.hoveredHandleInfo ?? null;
	const handleVisibleVertices = computeHandleVisibleVertices(selectedVertexIndices, selectedHandles, segments);
	drawLiveShape(r, canvas, graph, editState.nodeId, vertices, segments, regions);
	drawTechStroke(r, canvas, vertices, segments, regions);
	drawEditHandles(r, canvas, vertices, segments, handleVisibleVertices, toScreen, selectedHandles, hovered);
	drawEditVertices(r, canvas, vertices, selectedVertexIndices, toScreen);
}
function drawLiveShape(r, canvas, graph, nodeId, vertices, segments, regions) {
	const node = graph.getNode(nodeId);
	if (!node) return;
	const world = getWorldMatrix$1(node, graph);
	const inverse = Matrix.invert(world);
	if (!inverse) return;
	const localNetwork = transformVectorNetwork(inverse, {
		vertices,
		segments,
		regions
	});
	const invalidatePathCaches = () => {
		r.vectorPathCache.delete(nodeId);
		r.fillGeometryCache.delete(nodeId);
		r.strokeGeometryCache.delete(nodeId);
	};
	const origNetwork = node.vectorNetwork;
	const origFillGeometry = node.fillGeometry;
	const origStrokeGeometry = node.strokeGeometry;
	canvas.save();
	try {
		node.vectorNetwork = localNetwork;
		node.fillGeometry = regenerateFillGeometry(localNetwork, origFillGeometry);
		node.strokeGeometry = [];
		invalidatePathCaches();
		canvas.translate(r.panX, r.panY);
		canvas.scale(r.zoom, r.zoom);
		canvas.concat(world);
		r.renderShapeUncached(canvas, node, graph);
	} finally {
		canvas.restore();
		node.vectorNetwork = origNetwork;
		node.fillGeometry = origFillGeometry;
		node.strokeGeometry = origStrokeGeometry;
		invalidatePathCaches();
	}
}
const paintCache = /* @__PURE__ */ new WeakMap();
function ensureNodeEditPaints(r) {
	if (paintCache.has(r)) return;
	const ck = r.ck;
	const handleLinePaint = new ck.Paint();
	handleLinePaint.setStyle(ck.PaintStyle.Stroke);
	handleLinePaint.setStrokeWidth(1);
	handleLinePaint.setColor(ck.Color4f(.6, .6, .6, 1));
	handleLinePaint.setAntiAlias(true);
	const handleLineSelectedPaint = new ck.Paint();
	handleLineSelectedPaint.setStyle(ck.PaintStyle.Stroke);
	handleLineSelectedPaint.setStrokeWidth(1);
	handleLineSelectedPaint.setColor(ck.Color4f(BLUE[0], BLUE[1], BLUE[2], 1));
	handleLineSelectedPaint.setAntiAlias(true);
	const handleLineHoverPaint = new ck.Paint();
	handleLineHoverPaint.setStyle(ck.PaintStyle.Stroke);
	handleLineHoverPaint.setStrokeWidth(1);
	handleLineHoverPaint.setColor(ck.Color4f(LIGHT_BLUE[0], LIGHT_BLUE[1], LIGHT_BLUE[2], 1));
	handleLineHoverPaint.setAntiAlias(true);
	const vertexStroke1px = new ck.Paint();
	vertexStroke1px.setStyle(ck.PaintStyle.Stroke);
	vertexStroke1px.setStrokeWidth(1);
	vertexStroke1px.setColor(ck.Color4f(BLUE[0], BLUE[1], BLUE[2], 1));
	vertexStroke1px.setAntiAlias(true);
	const vertexSelectedFill = new ck.Paint();
	vertexSelectedFill.setStyle(ck.PaintStyle.Fill);
	vertexSelectedFill.setColor(ck.Color4f(BLUE[0], BLUE[1], BLUE[2], 1));
	vertexSelectedFill.setAntiAlias(true);
	const handleSelectedFill = new ck.Paint();
	handleSelectedFill.setStyle(ck.PaintStyle.Fill);
	handleSelectedFill.setColor(ck.Color4f(BLUE[0], BLUE[1], BLUE[2], 1));
	handleSelectedFill.setAntiAlias(true);
	const handleSelectedStroke = new ck.Paint();
	handleSelectedStroke.setStyle(ck.PaintStyle.Stroke);
	handleSelectedStroke.setStrokeWidth(3);
	handleSelectedStroke.setColor(ck.Color4f(1, 1, 1, 1));
	handleSelectedStroke.setAntiAlias(true);
	const handleHoverFill = new ck.Paint();
	handleHoverFill.setStyle(ck.PaintStyle.Fill);
	handleHoverFill.setColor(ck.Color4f(LIGHT_BLUE[0], LIGHT_BLUE[1], LIGHT_BLUE[2], 1));
	handleHoverFill.setAntiAlias(true);
	const handleHoverStroke = new ck.Paint();
	handleHoverStroke.setStyle(ck.PaintStyle.Stroke);
	handleHoverStroke.setStrokeWidth(3);
	handleHoverStroke.setColor(ck.Color4f(1, 1, 1, 1));
	handleHoverStroke.setAntiAlias(true);
	const techStrokePaint = new ck.Paint();
	techStrokePaint.setStyle(ck.PaintStyle.Stroke);
	techStrokePaint.setStrokeWidth(1);
	techStrokePaint.setColor(ck.Color4f(.698, .698, .698, 1));
	techStrokePaint.setAntiAlias(true);
	paintCache.set(r, {
		handleLinePaint,
		handleLineSelectedPaint,
		handleLineHoverPaint,
		vertexStroke1px,
		vertexSelectedFill,
		handleSelectedFill,
		handleSelectedStroke,
		handleHoverFill,
		handleHoverStroke,
		techStrokePaint
	});
}
function getNodeEditPaints(r) {
	const paints = paintCache.get(r);
	if (!paints) throw new Error("Node edit paints are not initialized");
	return paints;
}
function drawTechStroke(r, canvas, vertices, segments, regions) {
	const { techStrokePaint } = getNodeEditPaints(r);
	const network = {
		vertices,
		segments,
		regions
	};
	const paths = vectorNetworkToPath(r.ck, network);
	techStrokePaint.setStrokeWidth(1 / r.zoom);
	canvas.save();
	canvas.translate(r.panX, r.panY);
	canvas.scale(r.zoom, r.zoom);
	for (const p of paths) {
		canvas.drawPath(p, techStrokePaint);
		p.delete();
	}
	canvas.restore();
}
function drawEditHandles(r, canvas, vertices, segments, handleVisibleVertices, toScreen, selectedHandles, hovered) {
	const paints = getNodeEditPaints(r);
	for (let si = 0; si < segments.length; si++) {
		const seg = segments[si];
		drawSegmentHandle(r, canvas, vertices, seg, si, "tangentStart", handleVisibleVertices, toScreen, selectedHandles, hovered, paints);
		drawSegmentHandle(r, canvas, vertices, seg, si, "tangentEnd", handleVisibleVertices, toScreen, selectedHandles, hovered, paints);
	}
}
function drawSegmentHandle(r, canvas, vertices, seg, segmentIndex, tangentField, handleVisibleVertices, toScreen, selectedHandles, hovered, paints) {
	const vertexIndex = tangentField === "tangentStart" ? seg.start : seg.end;
	if (!handleVisibleVertices.has(vertexIndex)) return;
	const tangent = seg[tangentField];
	if (tangent.x === 0 && tangent.y === 0) return;
	const key = `${segmentIndex}:${tangentField}`;
	const isSel = selectedHandles.has(key);
	const isHov = !isSel && !!hovered && hovered.segmentIndex === segmentIndex && hovered.tangentField === tangentField;
	let linePaint = paints.handleLinePaint;
	if (isSel) linePaint = paints.handleLineSelectedPaint;
	else if (isHov) linePaint = paints.handleLineHoverPaint;
	const anchor = toScreen(vertices[vertexIndex].x, vertices[vertexIndex].y);
	const cp = toScreen(vertices[vertexIndex].x + tangent.x, vertices[vertexIndex].y + tangent.y);
	canvas.drawLine(anchor.x, anchor.y, cp.x, cp.y, linePaint);
	if (isSel) {
		drawHandleDiamond(r, canvas, cp.x, cp.y, paints.handleSelectedFill, paints.handleSelectedStroke);
		return;
	}
	if (isHov) {
		drawHandleDiamond(r, canvas, cp.x, cp.y, paints.handleHoverFill, paints.handleHoverStroke);
		return;
	}
	drawHandleDiamond(r, canvas, cp.x, cp.y, r.penVertexFill, paints.vertexStroke1px);
}
function drawHandleDiamond(r, canvas, x, y, fillPaint, strokePaint) {
	const s = PEN_HANDLE_RADIUS;
	const path = new r.ck.Path();
	path.moveTo(x, y - s);
	path.lineTo(x + s, y);
	path.lineTo(x, y + s);
	path.lineTo(x - s, y);
	path.close();
	canvas.drawPath(path, strokePaint);
	canvas.drawPath(path, fillPaint);
	path.delete();
}
function drawEditVertices(r, canvas, vertices, selectedVertexIndices, toScreen) {
	const vertexFill = r.penVertexFill;
	const { vertexStroke1px, vertexSelectedFill } = getNodeEditPaints(r);
	for (let i = 0; i < vertices.length; i++) {
		const v = toScreen(vertices[i].x, vertices[i].y);
		const radius = 3;
		if (selectedVertexIndices.has(i)) {
			canvas.drawCircle(v.x, v.y, radius, vertexSelectedFill);
			canvas.drawCircle(v.x, v.y, radius, vertexStroke1px);
		} else {
			canvas.drawCircle(v.x, v.y, radius, vertexFill);
			canvas.drawCircle(v.x, v.y, radius, vertexStroke1px);
		}
	}
}
//#endregion
export { drawNodeEditOverlay };

//# sourceMappingURL=node-edit-overlay.js.map
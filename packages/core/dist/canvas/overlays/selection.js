import { SELECTION_DASH_ALPHA } from "../../constants.js";
import { getWorldMatrix } from "@open-pencil/scene-graph/coordinate";
import { rotatedCorners } from "@open-pencil/scene-graph/geometry";
import Matrix from "@open-pencil/scene-graph/matrix";
//#region src/canvas/overlays/selection.ts
function getNodeTransformChain(graph, node) {
	const chain = [];
	let current = node;
	for (;;) {
		chain.unshift(current);
		if (!current.parentId) break;
		const parent = graph.getNode(current.parentId);
		if (!parent || parent.id === graph.rootId || parent.type === "CANVAS") break;
		current = parent;
	}
	return chain;
}
function drawHoverHighlight(r, canvas, graph, hoveredNodeId) {
	if (!hoveredNodeId) return;
	const node = graph.getNode(hoveredNodeId);
	if (!node) return;
	r.auxStroke.setStrokeWidth(1 / r.zoom);
	r.auxStroke.setColor(r.isComponentType(node.type) ? r.compColor() : r.selColor());
	r.auxStroke.setPathEffect(null);
	const chain = getNodeTransformChain(graph, node);
	canvas.save();
	canvas.translate(r.panX, r.panY);
	canvas.scale(r.zoom, r.zoom);
	for (const item of chain) {
		canvas.translate(item.x, item.y);
		if (item.rotation !== 0) canvas.rotate(item.rotation, item.width / 2, item.height / 2);
	}
	r.strokeNodeShape(canvas, node, r.auxStroke);
	canvas.restore();
}
function drawEnteredContainer(r, canvas, graph, enteredContainerId) {
	if (!enteredContainerId) return;
	const node = graph.getNode(enteredContainerId);
	if (!node) return;
	const abs = graph.getAbsolutePosition(node.id);
	const sx = abs.x * r.zoom + r.panX;
	const sy = abs.y * r.zoom + r.panY;
	r.auxStroke.setStrokeWidth(1);
	r.auxStroke.setColor(r.selColor(SELECTION_DASH_ALPHA));
	r.auxStroke.setPathEffect(r.ck.PathEffect.MakeDash([4, 4], 0));
	canvas.save();
	canvas.translate(sx, sy);
	if (node.rotation !== 0) {
		const cx = node.width / 2 * r.zoom;
		const cy = node.height / 2 * r.zoom;
		canvas.rotate(node.rotation, cx, cy);
	}
	canvas.drawRect(r.ck.LTRBRect(0, 0, node.width * r.zoom, node.height * r.zoom), r.auxStroke);
	canvas.restore();
	r.auxStroke.setPathEffect(null);
}
function drawSelection(r, canvas, graph, selectedIds, overlays) {
	if (selectedIds.size === 0) return;
	const nodeEditId = overlays.nodeEditState?.nodeId ?? null;
	r.drawParentFrameOutlines(canvas, graph, selectedIds);
	if (selectedIds.size === 1) {
		const id = [...selectedIds][0];
		if (overlays.editingTextId === id) return;
		if (nodeEditId === id) return;
		const node = graph.getNode(id);
		if (!node) return;
		const useComponentColor = r.isComponentType(node.type);
		r.selectionPaint.setColor(useComponentColor ? r.compColor() : r.selColor());
		r.selectionPaint.setStrokeWidth(1 / r.zoom);
		const rotation = overlays.rotationPreview?.nodeId === id ? overlays.rotationPreview.angle : node.rotation;
		r.drawNodeSelection(canvas, node, rotation, graph);
		r.drawSelectionLabels(canvas, graph, selectedIds, overlays);
		r.selectionPaint.setColor(r.selColor());
		return;
	}
	for (const id of selectedIds) {
		if (nodeEditId === id) continue;
		const node = graph.getNode(id);
		if (!node) continue;
		const useComponentColor = r.isComponentType(node.type);
		r.selectionPaint.setColor(useComponentColor ? r.compColor() : r.selColor());
		r.selectionPaint.setStrokeWidth(1);
		const rotation = overlays.rotationPreview?.nodeId === id ? overlays.rotationPreview.angle : node.rotation;
		r.drawNodeOutline(canvas, node, rotation, graph);
	}
	r.selectionPaint.setColor(r.selColor());
	const nodes = [...selectedIds].filter((id) => id !== nodeEditId).map((id) => graph.getNode(id)).filter((n) => n !== void 0);
	if (nodes.length === 0) return;
	r.drawGroupBounds(canvas, nodes, graph);
	r.drawSelectionLabels(canvas, graph, selectedIds, overlays);
}
function withNodeBounds(r, canvas, node, rotation, graph, draw) {
	const worldMatrix = getWorldMatrix({
		...node,
		rotation
	}, graph);
	canvas.save();
	canvas.translate(r.panX, r.panY);
	canvas.scale(r.zoom, r.zoom);
	canvas.concat(worldMatrix);
	draw(0, 0, node.width, node.height);
	canvas.restore();
}
function drawBoundsHandles(r, canvas, minX, minY, maxX, maxY) {
	r.drawHandle(canvas, minX, minY);
	r.drawHandle(canvas, maxX, minY);
	r.drawHandle(canvas, minX, maxY);
	r.drawHandle(canvas, maxX, maxY);
	const midX = (minX + maxX) / 2;
	const midY = (minY + maxY) / 2;
	const rotationHandleY = minY - 24 / r.zoom;
	canvas.drawLine(midX, minY, midX, rotationHandleY, r.selectionPaint);
	r.drawHandle(canvas, midX, rotationHandleY);
	r.drawHandle(canvas, midX, minY);
	r.drawHandle(canvas, midX, maxY);
	r.drawHandle(canvas, minX, midY);
	r.drawHandle(canvas, maxX, midY);
}
function drawSelectionRect(r, canvas, node, rotation, graph, afterDraw) {
	withNodeBounds(r, canvas, node, rotation, graph, (x1, y1, x2, y2) => {
		canvas.drawRect(r.ck.LTRBRect(x1, y1, x2, y2), r.selectionPaint);
		afterDraw?.(x1, y1, x2, y2);
	});
}
function drawNodeSelection(r, canvas, node, rotation, graph) {
	drawSelectionRect(r, canvas, node, rotation, graph, (x1, y1, x2, y2) => {
		drawBoundsHandles(r, canvas, x1, y1, x2, y2);
	});
}
function drawParentFrameOutlines(r, canvas, graph, selectedIds) {
	const drawn = /* @__PURE__ */ new Set();
	for (const id of selectedIds) {
		const node = graph.getNode(id);
		if (!node?.parentId) continue;
		const parent = graph.getNode(node.parentId);
		if (!parent || parent.type === "CANVAS") continue;
		if (drawn.has(parent.id) || selectedIds.has(parent.id)) continue;
		const grandparent = parent.parentId ? graph.getNode(parent.parentId) : null;
		if (!grandparent || grandparent.type === "CANVAS") continue;
		drawn.add(parent.id);
		const world = getWorldMatrix(parent, graph);
		const view = Matrix.multiply(Matrix.translated(r.panX, r.panY), Matrix.scaled(r.zoom, r.zoom));
		const m = Matrix.multiply(view, world);
		const pts = Matrix.mapPoints(m, [
			0,
			0,
			parent.width,
			0,
			parent.width,
			parent.height,
			0,
			parent.height
		]);
		const path = new r.ck.Path();
		path.moveTo(pts[0], pts[1]);
		path.lineTo(pts[2], pts[3]);
		path.lineTo(pts[4], pts[5]);
		path.lineTo(pts[6], pts[7]);
		path.close();
		canvas.drawPath(path, r.parentOutlinePaint);
	}
}
function drawNodeOutline(r, canvas, node, rotation, graph) {
	drawSelectionRect(r, canvas, node, rotation, graph);
}
function drawGroupBounds(r, canvas, nodes, graph) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const n of nodes) {
		const abs = graph.getAbsolutePosition(n.id);
		if (n.rotation !== 0) {
			const corners = r.getRotatedCorners(n, abs);
			for (const c of corners) {
				minX = Math.min(minX, c.x);
				minY = Math.min(minY, c.y);
				maxX = Math.max(maxX, c.x);
				maxY = Math.max(maxY, c.y);
			}
		} else {
			const x1 = abs.x * r.zoom + r.panX;
			const y1 = abs.y * r.zoom + r.panY;
			const x2 = (abs.x + n.width) * r.zoom + r.panX;
			const y2 = (abs.y + n.height) * r.zoom + r.panY;
			minX = Math.min(minX, x1);
			minY = Math.min(minY, y1);
			maxX = Math.max(maxX, x2);
			maxY = Math.max(maxY, y2);
		}
	}
	r.auxStroke.setStrokeWidth(1);
	r.auxStroke.setColor(r.selColor(SELECTION_DASH_ALPHA));
	r.auxStroke.setPathEffect(null);
	canvas.drawRect(r.ck.LTRBRect(minX, minY, maxX, maxY), r.auxStroke);
	drawBoundsHandlesScreenSpace(r, canvas, minX, minY, maxX, maxY);
}
function getRotatedCorners(r, n, abs) {
	return rotatedCorners((abs.x + n.width / 2) * r.zoom + r.panX, (abs.y + n.height / 2) * r.zoom + r.panY, n.width / 2 * r.zoom, n.height / 2 * r.zoom, n.rotation);
}
function drawHandle(r, canvas, x, y) {
	r.auxFill.setColor(r.ck.WHITE);
	const s = 3 / r.zoom;
	const rect = r.ck.LTRBRect(x - s, y - s, x + s, y + s);
	canvas.drawRect(rect, r.auxFill);
	canvas.drawRect(rect, r.selectionPaint);
}
function drawHandleScreenSpace(r, canvas, x, y) {
	r.auxFill.setColor(r.ck.WHITE);
	const rect = r.ck.LTRBRect(x - 3, y - 3, x + 3, y + 3);
	canvas.drawRect(rect, r.auxFill);
	canvas.drawRect(rect, r.selectionPaint);
}
function drawBoundsHandlesScreenSpace(r, canvas, minX, minY, maxX, maxY) {
	drawHandleScreenSpace(r, canvas, minX, minY);
	drawHandleScreenSpace(r, canvas, maxX, minY);
	drawHandleScreenSpace(r, canvas, minX, maxY);
	drawHandleScreenSpace(r, canvas, maxX, maxY);
	const midX = (minX + maxX) / 2;
	const midY = (minY + maxY) / 2;
	const rotationHandleY = minY - 24;
	canvas.drawLine(midX, minY, midX, rotationHandleY, r.selectionPaint);
	drawHandleScreenSpace(r, canvas, midX, rotationHandleY);
	drawHandleScreenSpace(r, canvas, midX, minY);
	drawHandleScreenSpace(r, canvas, midX, maxY);
	drawHandleScreenSpace(r, canvas, minX, midY);
	drawHandleScreenSpace(r, canvas, maxX, midY);
}
//#endregion
export { drawEnteredContainer, drawGroupBounds, drawHandle, drawHoverHighlight, drawNodeOutline, drawNodeSelection, drawParentFrameOutlines, drawSelection, getRotatedCorners };

//# sourceMappingURL=selection.js.map
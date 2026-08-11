import "../../constants.js";
import { ellipsizeLabelText } from "./text.js";
import { getAbsolutePosition, getWorldMatrix } from "@open-pencil/scene-graph/coordinate";
import { rotatedCorners } from "@open-pencil/scene-graph/geometry";
//#region src/canvas/labels/selection.ts
function getOverlayRotation(node, overlays) {
	return overlays?.rotationPreview?.nodeId === node.id ? overlays.rotationPreview.angle : node.rotation;
}
function accumulateSelectionBounds(graph, selectedIds, overlays) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	const nodes = [];
	for (const id of selectedIds) {
		const node = graph.getNode(id);
		if (!node) continue;
		nodes.push(node);
		const abs = getAbsolutePosition(node, graph);
		const rotation = getOverlayRotation(node, overlays);
		if (rotation !== 0) {
			const corners = rotatedCorners(abs.x, abs.y, node.width, node.height, rotation);
			for (const corner of corners) {
				minX = Math.min(minX, corner.x);
				minY = Math.min(minY, corner.y);
				maxX = Math.max(maxX, corner.x);
				maxY = Math.max(maxY, corner.y);
			}
			continue;
		}
		minX = Math.min(minX, abs.x);
		minY = Math.min(minY, abs.y);
		maxX = Math.max(maxX, abs.x + node.width);
		maxY = Math.max(maxY, abs.y + node.height);
	}
	return {
		nodes,
		minX,
		minY,
		maxX,
		maxY
	};
}
function drawSingleFrameTitle(r, canvas, graph, node, overlays, labelFont) {
	const parentNode = node.parentId ? graph.getNode(node.parentId) : null;
	const isTopLevel = !parentNode || parentNode.type === "CANVAS" || parentNode.type === "SECTION";
	if (node.type !== "FRAME" || !isTopLevel) return;
	const overlayRotation = getOverlayRotation(node, overlays);
	const world = getWorldMatrix({
		...node,
		rotation: overlayRotation
	}, graph);
	const origin = r.ck.Matrix.mapPoints(world, [0, 0]);
	r.auxFill.setColor(r.selColor());
	const displayText = ellipsizeLabelText(labelFont, node.name, node.width * r.zoom);
	if (!displayText) return;
	canvas.save();
	canvas.translate(origin[0] * r.zoom + r.panX, origin[1] * r.zoom + r.panY);
	if (overlayRotation !== 0) canvas.rotate(overlayRotation, 0, 0);
	canvas.drawText(displayText, 0, -8, r.auxFill, labelFont);
	canvas.restore();
}
function measureTextWidth(sizeFont, text) {
	const glyphIds = sizeFont.getGlyphIDs(text);
	const widths = sizeFont.getGlyphWidths(glyphIds);
	let textWidth = 0;
	for (const width of widths) textWidth += width;
	return textWidth;
}
function drawSizePill(r, canvas, sizeFont, text, x, y, color) {
	const pillW = measureTextWidth(sizeFont, text) + 12;
	const pillX = x - pillW / 2;
	const pillY = y + 6;
	r.auxFill.setColor(color);
	const rrect = r.ck.RRectXY(r.ck.LTRBRect(pillX, pillY, pillX + pillW, pillY + 18), 4, 4);
	canvas.drawRRect(rrect, r.auxFill);
	r.auxFill.setColor(r.ck.WHITE);
	canvas.drawText(text, pillX + 6, pillY + 13, r.auxFill, sizeFont);
}
function drawSingleSelectionSize(r, canvas, graph, node, overlays, sizeFont) {
	const sizeText = `${Math.round(node.width)} × ${Math.round(node.height)}`;
	const pillColor = r.isComponentType(node.type) ? r.compColor() : r.selColor();
	const overlayRotation = getOverlayRotation(node, overlays);
	const abs = getAbsolutePosition(node, graph);
	const cx = abs.x + node.width / 2;
	const cy = abs.y + node.height / 2;
	const rad = overlayRotation * Math.PI / 180;
	const hh = node.height / 2;
	const bottomCenterX = cx + Math.sin(rad) * hh;
	const bottomCenterY = cy + Math.cos(rad) * hh;
	drawSizePill(r, canvas, sizeFont, sizeText, bottomCenterX * r.zoom + r.panX, bottomCenterY * r.zoom + r.panY, pillColor);
}
function drawMultiSelectionSize(r, canvas, nodes, minX, minY, maxX, maxY, sizeFont) {
	const sizeText = `${Math.round(maxX - minX)} × ${Math.round(maxY - minY)}`;
	const sx1 = minX * r.zoom + r.panX;
	const sx2 = maxX * r.zoom + r.panX;
	const sy2 = maxY * r.zoom + r.panY;
	drawSizePill(r, canvas, sizeFont, sizeText, (sx1 + sx2) / 2, sy2, nodes.length > 0 && nodes.every((n) => r.isComponentType(n.type)) ? r.compColor() : r.selColor());
}
function drawSelectionLabels(r, canvas, graph, selectedIds, overlays) {
	const labelFont = r.labelFont;
	const sizeFont = r.sizeFont;
	if (!labelFont || !sizeFont) return;
	const activeOverlays = overlays ?? {};
	const { nodes, minX, minY, maxX, maxY } = accumulateSelectionBounds(graph, selectedIds, activeOverlays);
	if (nodes.length === 0) return;
	if (nodes.length === 1) {
		drawSingleFrameTitle(r, canvas, graph, nodes[0], activeOverlays, labelFont);
		drawSingleSelectionSize(r, canvas, graph, nodes[0], activeOverlays, sizeFont);
		return;
	}
	drawMultiSelectionSize(r, canvas, nodes, minX, minY, maxX, maxY, sizeFont);
}
//#endregion
export { drawSelectionLabels, drawSingleSelectionSize };

//# sourceMappingURL=selection.js.map
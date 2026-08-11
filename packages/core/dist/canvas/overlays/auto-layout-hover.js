import { AUTO_LAYOUT_HOVER_BLUE, AUTO_LAYOUT_HOVER_BLUE_FILL, AUTO_LAYOUT_HOVER_MAGENTA, AUTO_LAYOUT_HOVER_MAGENTA_FILL, AUTO_LAYOUT_HOVER_STROKE_WIDTH } from "../../constants.js";
//#region src/canvas/overlays/auto-layout-hover.ts
function visibleLayoutChildren(node, graph) {
	return node.childIds.map((id) => graph.getNode(id)).filter((child) => !!child && child.visible && child.layoutPositioning !== "ABSOLUTE");
}
function canvasColor(r, color) {
	return r.ck.Color4f(color.r, color.g, color.b, color.a);
}
function setStroke(r, color) {
	r.auxStroke.setStrokeWidth(AUTO_LAYOUT_HOVER_STROKE_WIDTH);
	r.auxStroke.setColor(canvasColor(r, color));
	r.auxStroke.setPathEffect(null);
}
function drawHorizontalTick(r, canvas, x, y) {
	canvas.drawLine(x - 12, y, x + 12, y, r.auxStroke);
}
function drawVerticalTick(r, canvas, x, y) {
	canvas.drawLine(x, y - 12, x, y + 12, r.auxStroke);
}
function toScreenRect(r, [x, y, width, height]) {
	return r.ck.LTRBRect(x * r.zoom + r.panX, y * r.zoom + r.panY, (x + width) * r.zoom + r.panX, (y + height) * r.zoom + r.panY);
}
function drawStripedRect(r, canvas, rectTuple, color, fill) {
	const [, , width, height] = rectTuple;
	if (width <= 0 || height <= 0) return;
	const rect = toScreenRect(r, rectTuple);
	r.auxFill.setColor(canvasColor(r, fill));
	canvas.drawRect(rect, r.auxFill);
	const path = new r.ck.Path();
	const left = rect[0];
	const top = rect[1];
	const right = rect[2];
	const bottom = rect[3];
	for (let sx = left - (bottom - top); sx < right; sx += 8) {
		path.moveTo(sx, bottom);
		path.lineTo(sx + (bottom - top), top);
	}
	r.auxStroke.setStrokeWidth(1);
	r.auxStroke.setColor(canvasColor(r, color));
	r.auxStroke.setPathEffect(null);
	canvas.save();
	canvas.clipRect(rect, r.ck.ClipOp.Intersect, true);
	canvas.drawPath(path, r.auxStroke);
	canvas.restore();
	path.delete();
}
function drawValuePill(r, canvas, text, x, y) {
	if (!r.labelFont) return;
	const width = Math.max(24, text.length * 8 + 10);
	const height = 22;
	const rect = r.ck.RRectXY(r.ck.LTRBRect(x - width / 2, y - height / 2, x + width / 2, y + height / 2), 5, 5);
	r.auxFill.setColor(r.selColor());
	canvas.drawRRect(rect, r.auxFill);
	r.auxFill.setColor(r.ck.Color4f(1, 1, 1, 1));
	canvas.drawText(text, x - width / 2 + 5, y + 5, r.auxFill, r.labelFont);
}
function gapRects(node, graph) {
	const children = visibleLayoutChildren(node, graph);
	if (children.length < 2 || node.itemSpacing <= 0) return [];
	const abs = graph.getAbsolutePosition(node.id);
	const isRow = node.layoutMode === "HORIZONTAL";
	const rects = [];
	for (let i = 0; i < children.length - 1; i++) {
		const prev = children[i];
		const next = children[i + 1];
		const gapStart = isRow ? prev.x + prev.width : prev.y + prev.height;
		const gapEnd = isRow ? next.x : next.y;
		if (gapEnd <= gapStart) continue;
		rects.push(isRow ? [
			abs.x + gapStart,
			abs.y + node.paddingTop,
			gapEnd - gapStart,
			node.height - node.paddingTop - node.paddingBottom
		] : [
			abs.x + node.paddingLeft,
			abs.y + gapStart,
			node.width - node.paddingLeft - node.paddingRight,
			gapEnd - gapStart
		]);
	}
	return rects;
}
function paddingRect(node, graph, side) {
	if (!side) return null;
	const abs = graph.getAbsolutePosition(node.id);
	if (side === "top") return [
		abs.x,
		abs.y,
		node.width,
		node.paddingTop
	];
	if (side === "bottom") return [
		abs.x,
		abs.y + node.height - node.paddingBottom,
		node.width,
		node.paddingBottom
	];
	if (side === "left") return [
		abs.x,
		abs.y,
		node.paddingLeft,
		node.height
	];
	return [
		abs.x + node.width - node.paddingRight,
		abs.y,
		node.paddingRight,
		node.height
	];
}
function drawBaselineTicks(r, canvas, graph, node) {
	const abs = graph.getAbsolutePosition(node.id);
	const xCenter = (abs.x + node.width / 2) * r.zoom + r.panX;
	const yCenter = (abs.y + node.height / 2) * r.zoom + r.panY;
	setStroke(r, AUTO_LAYOUT_HOVER_BLUE);
	if (node.paddingTop > 0) drawHorizontalTick(r, canvas, xCenter, (abs.y + node.paddingTop / 2) * r.zoom + r.panY);
	if (node.paddingBottom > 0) drawHorizontalTick(r, canvas, xCenter, (abs.y + node.height - node.paddingBottom / 2) * r.zoom + r.panY);
	if (node.paddingLeft > 0) drawVerticalTick(r, canvas, (abs.x + node.paddingLeft / 2) * r.zoom + r.panX, yCenter);
	if (node.paddingRight > 0) drawVerticalTick(r, canvas, (abs.x + node.width - node.paddingRight / 2) * r.zoom + r.panX, yCenter);
	setStroke(r, AUTO_LAYOUT_HOVER_MAGENTA);
	for (const rect of gapRects(node, graph)) {
		const [x, y, width, height] = rect;
		if (node.layoutMode === "HORIZONTAL") drawVerticalTick(r, canvas, (x + width / 2) * r.zoom + r.panX, yCenter);
		else drawHorizontalTick(r, canvas, xCenter, (y + height / 2) * r.zoom + r.panY);
	}
}
function drawSpacingHover(r, canvas, graph, node, showValue) {
	const rects = gapRects(node, graph);
	for (const rect of rects) drawStripedRect(r, canvas, rect, AUTO_LAYOUT_HOVER_MAGENTA, AUTO_LAYOUT_HOVER_MAGENTA_FILL);
	if (!showValue || rects.length === 0) return;
	const [x, y, width, height] = rects[0];
	drawValuePill(r, canvas, String(Math.round(node.itemSpacing)), (x + width / 2) * r.zoom + r.panX + 18, (y + height / 2) * r.zoom + r.panY - 18);
}
function drawPaddingHover(r, canvas, graph, node, hover, showValue) {
	const rect = paddingRect(node, graph, hover.side);
	if (!rect) return;
	drawStripedRect(r, canvas, rect, AUTO_LAYOUT_HOVER_BLUE, AUTO_LAYOUT_HOVER_BLUE_FILL);
	if (!showValue) return;
	const [x, y, width, height] = rect;
	const value = hover.side === "left" || hover.side === "right" ? width : height;
	drawValuePill(r, canvas, String(Math.round(value)), (x + width / 2) * r.zoom + r.panX + 18, (y + height / 2) * r.zoom + r.panY - 18);
}
function drawChildrenHover(r, canvas, graph, node) {
	r.auxStroke.setStrokeWidth(1);
	r.auxStroke.setColor(r.selColor());
	r.auxStroke.setPathEffect(r.ck.PathEffect.MakeDash([4, 4], 0));
	for (const child of visibleLayoutChildren(node, graph)) {
		const abs = graph.getAbsolutePosition(child.id);
		canvas.drawRect(r.ck.LTRBRect(abs.x * r.zoom + r.panX, abs.y * r.zoom + r.panY, (abs.x + child.width) * r.zoom + r.panX, (abs.y + child.height) * r.zoom + r.panY), r.auxStroke);
	}
	r.auxStroke.setPathEffect(null);
}
function drawAutoLayoutHover(r, canvas, graph, hover) {
	if (!hover) return;
	const node = graph.getNode(hover.nodeId);
	if (!node || node.layoutMode !== "HORIZONTAL" && node.layoutMode !== "VERTICAL") return;
	if (hover.kind === "children") drawChildrenHover(r, canvas, graph, node);
	if (hover.kind === "spacing" || hover.kind === "spacing-value") drawSpacingHover(r, canvas, graph, node, hover.kind === "spacing-value");
	if (hover.kind === "padding" || hover.kind === "padding-value") drawPaddingHover(r, canvas, graph, node, hover, hover.kind === "padding-value");
	drawBaselineTicks(r, canvas, graph, node);
}
//#endregion
export { drawAutoLayoutHover };

//# sourceMappingURL=auto-layout-hover.js.map
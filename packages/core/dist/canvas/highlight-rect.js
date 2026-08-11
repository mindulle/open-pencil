import "../constants.js";
//#region src/canvas/highlight-rect.ts
function ensureFlashPaint(r) {
	if (!r._flashPaint) {
		r._flashPaint = new r.ck.Paint();
		r._flashPaint.setStyle(r.ck.PaintStyle.Stroke);
		r._flashPaint.setAntiAlias(true);
	}
	return r._flashPaint;
}
function drawNodeHighlightRect(r, canvas, graph, nodeId, color, opacity, extraPad = 0) {
	const node = graph.getNode(nodeId);
	if (!node) return false;
	const abs = graph.getAbsolutePosition(nodeId);
	const cx = (abs.x + node.width / 2) * r.zoom + r.panX;
	const cy = (abs.y + node.height / 2) * r.zoom + r.panY;
	const hw = node.width / 2 * r.zoom;
	const hh = node.height / 2 * r.zoom;
	const pad = 5 + extraPad;
	const paint = ensureFlashPaint(r);
	paint.setColor(r.ck.Color4f(color.r, color.g, color.b, opacity));
	paint.setStrokeWidth(2);
	canvas.save();
	if (node.rotation !== 0) canvas.rotate(node.rotation, cx, cy);
	const rect = r.ck.RRectXY(r.ck.LTRBRect(cx - hw - pad, cy - hh - pad, cx + hw + pad, cy + hh + pad), 4, 4);
	canvas.drawRRect(rect, paint);
	canvas.restore();
	return true;
}
//#endregion
export { drawNodeHighlightRect, ensureFlashPaint };

//# sourceMappingURL=highlight-rect.js.map
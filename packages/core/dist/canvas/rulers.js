import { RULER_HIGHLIGHT_ALPHA, RULER_MAJOR_TICK, RULER_MAJOR_TOLERANCE, RULER_MINOR_TICK, RULER_TEXT_BASELINE } from "../constants.js";
import { computeAbsoluteBounds } from "@open-pencil/scene-graph/geometry";
//#region src/canvas/rulers.ts
function getSelectionScreenBounds(r, graph, selNodes) {
	const b = computeAbsoluteBounds(selNodes, (id) => graph.getAbsolutePosition(id));
	return {
		sx1: b.x * r.zoom + r.panX,
		sx2: (b.x + b.width) * r.zoom + r.panX,
		sy1: b.y * r.zoom + r.panY,
		sy2: (b.y + b.height) * r.zoom + r.panY
	};
}
function drawHorizontalRulerTicks(r, canvas, font, step, selBounds) {
	const R = 20;
	const vw = r.viewportWidth;
	const minorStep = step / 5;
	const badgeW = 30;
	canvas.save();
	canvas.clipRect(r.ck.LTRBRect(R, 0, vw, R), r.ck.ClipOp.Intersect, false);
	const worldLeft = -r.panX / r.zoom;
	const worldRight = (vw - r.panX) / r.zoom;
	const startX = Math.floor(worldLeft / step) * step;
	for (let wx = startX; wx <= worldRight; wx += minorStep) {
		const sx = wx * r.zoom + r.panX;
		if (sx < R) continue;
		const isMajor = Math.abs(wx % step) < RULER_MAJOR_TOLERANCE;
		const tickLen = isMajor ? R * RULER_MAJOR_TICK : R * RULER_MINOR_TICK;
		canvas.drawLine(sx, R - tickLen, sx, R, r.rulerTickPaint);
		if (isMajor) {
			if (!(selBounds != null && (Math.abs(sx - selBounds.sx1) < badgeW || Math.abs(sx - selBounds.sx2) < badgeW))) canvas.drawText(rulerLabel(wx), sx + 2, R * RULER_TEXT_BASELINE, r.rulerTextPaint, font);
		}
	}
	canvas.restore();
}
function drawVerticalRulerTicks(r, canvas, font, step, selBounds) {
	const R = 20;
	const vh = r.viewportHeight;
	const minorStep = step / 5;
	const badgeW = 30;
	canvas.save();
	canvas.clipRect(r.ck.LTRBRect(0, R, R, vh), r.ck.ClipOp.Intersect, false);
	const worldTop = -r.panY / r.zoom;
	const worldBottom = (vh - r.panY) / r.zoom;
	const startY = Math.floor(worldTop / step) * step;
	for (let wy = startY; wy <= worldBottom; wy += minorStep) {
		const sy = wy * r.zoom + r.panY;
		if (sy < R) continue;
		const isMajor = Math.abs(wy % step) < RULER_MAJOR_TOLERANCE;
		const tickLen = isMajor ? R * RULER_MAJOR_TICK : R * RULER_MINOR_TICK;
		canvas.drawLine(R - tickLen, sy, R, sy, r.rulerTickPaint);
		if (isMajor) {
			if (!(selBounds != null && (Math.abs(sy - selBounds.sy1) < badgeW || Math.abs(sy - selBounds.sy2) < badgeW))) {
				canvas.save();
				canvas.translate(R * RULER_TEXT_BASELINE, sy - 2);
				canvas.rotate(-90, 0, 0);
				canvas.drawText(rulerLabel(wy), 0, 3, r.rulerTextPaint, font);
				canvas.restore();
			}
		}
	}
	canvas.restore();
}
function drawRulers(r, canvas, graph, selectedIds) {
	const R = 20;
	const vw = r.viewportWidth;
	const vh = r.viewportHeight;
	if (vw === 0 || vh === 0) return;
	if (r.rulerTheme) {
		const { background, tick, text, label } = r.rulerTheme;
		r.rulerBgPaint.setColor(r.ck.Color4f(background.r, background.g, background.b, background.a));
		r.rulerTickPaint.setColor(r.ck.Color4f(tick.r, tick.g, tick.b, tick.a));
		r.rulerTextPaint.setColor(r.ck.Color4f(text.r, text.g, text.b, text.a));
		r.rulerLabelPaint.setColor(r.ck.Color4f(label.r, label.g, label.b, label.a));
	}
	canvas.drawRect(r.ck.LTRBRect(0, 0, vw, R), r.rulerBgPaint);
	canvas.drawRect(r.ck.LTRBRect(0, R, R, vh), r.rulerBgPaint);
	canvas.drawRect(r.ck.LTRBRect(0, 0, R, R), r.rulerBgPaint);
	const font = r.sizeFont ?? r.textFont;
	if (!font) return;
	const step = rulerStep(r);
	const selNodes = [...selectedIds].map((id) => graph.getNode(id)).filter((n) => n !== void 0);
	const selBounds = selNodes.length > 0 ? getSelectionScreenBounds(r, graph, selNodes) : null;
	drawHorizontalRulerTicks(r, canvas, font, step, selBounds);
	drawVerticalRulerTicks(r, canvas, font, step, selBounds);
	if (selBounds) {
		r.rulerHlPaint.setColor(r.selColor(RULER_HIGHLIGHT_ALPHA));
		canvas.drawRect(r.ck.LTRBRect(Math.max(R, selBounds.sx1), 0, selBounds.sx2, R), r.rulerHlPaint);
		canvas.drawRect(r.ck.LTRBRect(0, Math.max(R, selBounds.sy1), R, selBounds.sy2), r.rulerHlPaint);
		drawRulerBadge(r, canvas, font, Math.round((selBounds.sx1 - r.panX) / r.zoom).toString(), Math.max(R, selBounds.sx1), 0, "horizontal");
		drawRulerBadge(r, canvas, font, Math.round((selBounds.sx2 - r.panX) / r.zoom).toString(), selBounds.sx2, 0, "horizontal");
		drawRulerBadge(r, canvas, font, Math.round((selBounds.sy1 - r.panY) / r.zoom).toString(), 0, Math.max(R, selBounds.sy1), "vertical");
		drawRulerBadge(r, canvas, font, Math.round((selBounds.sy2 - r.panY) / r.zoom).toString(), 0, selBounds.sy2, "vertical");
	}
}
function drawRulerBadge(r, canvas, font, label, x, y, axis) {
	const R = 20;
	const glyphIds = font.getGlyphIDs(label);
	const textW = font.getGlyphWidths(glyphIds).reduce((s, w) => s + w, 0);
	const pad = 3;
	const h = 14;
	r.rulerBadgePaint.setColor(r.selColor());
	if (axis === "horizontal") {
		const bx = x - (textW + pad * 2) / 2;
		const by = (R - h) / 2;
		canvas.drawRRect(r.ck.RRectXY(r.ck.LTRBRect(bx, by, bx + textW + pad * 2, 17), 2, 2), r.rulerBadgePaint);
		canvas.drawText(label, bx + pad, R * RULER_TEXT_BASELINE, r.rulerLabelPaint, font);
	} else {
		const bw = textW + pad * 2;
		const by = y - bw / 2;
		canvas.save();
		canvas.translate(10, by + bw / 2);
		canvas.rotate(-90, 0, 0);
		canvas.drawRRect(r.ck.RRectXY(r.ck.LTRBRect(-bw / 2, -14 / 2, bw / 2, h / 2), 2, 2), r.rulerBadgePaint);
		canvas.drawText(label, -bw / 2 + pad, h / 2 - 3, r.rulerLabelPaint, font);
		canvas.restore();
	}
}
function rulerStep(r) {
	const rawStep = 100 / r.zoom;
	const magnitude = 10 ** Math.floor(Math.log10(rawStep));
	const normalized = rawStep / magnitude;
	if (normalized <= 1) return magnitude;
	if (normalized <= 2) return 2 * magnitude;
	if (normalized <= 5) return 5 * magnitude;
	return 10 * magnitude;
}
function rulerLabel(value) {
	return Math.round(value).toString();
}
//#endregion
export { drawRulerBadge, drawRulers, rulerLabel, rulerStep };

//# sourceMappingURL=rulers.js.map
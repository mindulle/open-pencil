import { FLASH_COLOR, MARQUEE_FILL_ALPHA } from "../../constants.js";
import { drawNodeHighlightRect } from "../highlight-rect.js";
//#region src/canvas/overlays/feedback.ts
function drawSnapGuides(r, canvas, guides) {
	if (!guides || guides.length === 0) return;
	for (const guide of guides) if (guide.axis === "x") {
		const x = guide.position * r.zoom + r.panX;
		const y1 = guide.from * r.zoom + r.panY;
		const y2 = guide.to * r.zoom + r.panY;
		canvas.drawLine(x, y1, x, y2, r.snapPaint);
	} else {
		const y = guide.position * r.zoom + r.panY;
		const x1 = guide.from * r.zoom + r.panX;
		const x2 = guide.to * r.zoom + r.panX;
		canvas.drawLine(x1, y, x2, y, r.snapPaint);
	}
}
function drawMarquee(r, canvas, marquee) {
	if (!marquee || marquee.width <= 0 || marquee.height <= 0) return;
	const x1 = marquee.x * r.zoom + r.panX;
	const y1 = marquee.y * r.zoom + r.panY;
	const x2 = (marquee.x + marquee.width) * r.zoom + r.panX;
	const y2 = (marquee.y + marquee.height) * r.zoom + r.panY;
	const rect = r.ck.LTRBRect(x1, y1, x2, y2);
	r.auxFill.setColor(r.selColor(MARQUEE_FILL_ALPHA));
	canvas.drawRect(rect, r.auxFill);
	canvas.drawRect(rect, r.selectionPaint);
}
function drawFlashes(r, canvas, graph) {
	if (r._flashes.length === 0) return;
	const now = performance.now();
	const totalMs = 900;
	for (let i = r._flashes.length - 1; i >= 0; i--) {
		const flash = r._flashes[i];
		const elapsed = now - flash.startTime;
		if (elapsed > totalMs) {
			r._flashes.splice(i, 1);
			continue;
		}
		let opacity;
		let extraPad;
		if (elapsed < 200) {
			const t = elapsed / 200;
			const ease = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
			opacity = ease;
			extraPad = (1 - ease) * 30;
		} else if (elapsed < 600) {
			opacity = 1;
			extraPad = 0;
		} else {
			const t = (elapsed - 200 - 400) / 300;
			opacity = 1 - t * t;
			extraPad = 0;
		}
		if (!drawNodeHighlightRect(r, canvas, graph, flash.nodeId, FLASH_COLOR, opacity, extraPad)) r._flashes.splice(i, 1);
	}
}
function drawLayoutInsertIndicator(r, canvas, indicator) {
	if (!indicator) return;
	r.auxStroke.setStrokeWidth(2);
	r.auxStroke.setColor(r.selColor());
	r.auxStroke.setPathEffect(null);
	if (indicator.direction === "HORIZONTAL") {
		const y = indicator.y * r.zoom + r.panY;
		const x1 = indicator.x * r.zoom + r.panX;
		const x2 = (indicator.x + indicator.length) * r.zoom + r.panX;
		canvas.drawLine(x1, y, x2, y, r.auxStroke);
	} else {
		const x = indicator.x * r.zoom + r.panX;
		const y1 = indicator.y * r.zoom + r.panY;
		const y2 = (indicator.y + indicator.length) * r.zoom + r.panY;
		canvas.drawLine(x, y1, x, y2, r.auxStroke);
	}
}
//#endregion
export { drawFlashes, drawLayoutInsertIndicator, drawMarquee, drawSnapGuides };

//# sourceMappingURL=feedback.js.map
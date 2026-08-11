import "../../constants.js";
import { ellipsizeLabelText } from "./text.js";
//#region src/canvas/labels/draw.ts
function drawSectionTitles(r, canvas, graph) {
	if (!r.sectionTitleFont) return;
	const sections = r.labelCache.getSections(graph, r.worldViewport);
	if (sections.length === 0) return;
	const font = r.sectionTitleFont;
	const ellipsis = "…";
	const ellipsisGlyphs = font.getGlyphIDs(ellipsis);
	const ellipsisWidth = font.getGlyphWidths(ellipsisGlyphs)[0];
	for (const { node, absX, absY, nested } of sections) drawSectionTitle(r, canvas, font, node, graph, absX, absY, nested, ellipsis, ellipsisWidth);
}
function drawSectionTitle(r, canvas, font, node, graph, absX, absY, nested, ellipsis, ellipsisWidth) {
	const screenX = absX * r.zoom + r.panX;
	const screenY = absY * r.zoom + r.panY;
	const screenW = node.width * r.zoom;
	const maxPillW = Math.max(screenW, 0);
	const glyphIds = font.getGlyphIDs(node.name);
	const widths = font.getGlyphWidths(glyphIds);
	let fullTextWidth = 0;
	for (const w of widths) fullTextWidth += w;
	const maxTextW = maxPillW - 16;
	let displayText = node.name;
	let textWidth = fullTextWidth;
	if (textWidth > maxTextW && maxTextW > ellipsisWidth) {
		let truncW = 0;
		let truncIdx = 0;
		for (let i = 0; i < widths.length; i++) {
			if (truncW + widths[i] + ellipsisWidth > maxTextW) break;
			truncW += widths[i];
			truncIdx = i + 1;
		}
		displayText = node.name.slice(0, truncIdx) + ellipsis;
		textWidth = truncW + ellipsisWidth;
	} else if (maxTextW <= ellipsisWidth) {
		displayText = ellipsis;
		textWidth = ellipsisWidth;
	}
	const pillW = Math.min(textWidth + 16, maxPillW);
	const pillH = 24;
	const localPillX = 0;
	const localPillY = nested ? 6 : -30;
	const pillColor = node.fills.length > 0 && node.fills[0].visible ? r.resolveFillColor(node.fills[0], 0, node, graph) : {
		r: .37,
		g: .37,
		b: .37,
		a: 1
	};
	canvas.save();
	canvas.translate(screenX, screenY);
	if (node.rotation !== 0) canvas.rotate(node.rotation, 0, 0);
	r.auxFill.setColor(r.ck.Color4f(pillColor.r, pillColor.g, pillColor.b, pillColor.a));
	const pillRect = r.ck.LTRBRect(localPillX, localPillY, localPillX + pillW, localPillY + pillH);
	canvas.drawRRect(r.ck.RRectXY(pillRect, 5, 5), r.auxFill);
	const lum = .299 * pillColor.r + .587 * pillColor.g + .114 * pillColor.b;
	r.auxFill.setColor(lum > .5 ? r.ck.BLACK : r.ck.WHITE);
	const textY = localPillY + pillH * .7;
	canvas.drawText(displayText, 8, textY, r.auxFill, font);
	canvas.restore();
}
function drawComponentLabels(r, canvas, graph) {
	if (!r.componentLabelFont) return;
	const components = r.labelCache.getComponents(graph, r.worldViewport);
	if (components.length === 0) return;
	const font = r.componentLabelFont;
	const compColor = r.compColor();
	const iconS = 10;
	for (const { node, absX, absY, inside } of components) {
		const screenX = absX * r.zoom + r.panX;
		const screenY = absY * r.zoom + r.panY;
		const labelX = screenX;
		let labelY;
		if (inside) labelY = screenY + 6 + 11;
		else labelY = screenY - 6;
		const maxTextWidth = node.width * r.zoom - iconS - 4;
		const displayText = ellipsizeLabelText(font, node.name, maxTextWidth);
		if (!displayText) continue;
		const iconX = labelX;
		const iconY = labelY - 11 * .75;
		const iconCx = iconX + iconS / 2;
		const iconCy = iconY + iconS / 2;
		const iconR = iconS / 2;
		r.auxFill.setColor(compColor);
		if (node.type === "COMPONENT_SET") {
			const s = iconR * .45;
			const path = new r.ck.Path();
			for (const [dx, dy] of [
				[-1, -1],
				[1, -1],
				[-1, 1],
				[1, 1]
			]) {
				const cx = iconCx + dx * 3.25;
				const cy = iconCy + dy * 3.25;
				path.moveTo(cx, cy - s);
				path.lineTo(cx + s, cy);
				path.lineTo(cx, cy + s);
				path.lineTo(cx - s, cy);
				path.close();
			}
			canvas.drawPath(path, r.auxFill);
			path.delete();
		} else {
			const path = new r.ck.Path();
			path.moveTo(iconCx, iconCy - iconR);
			path.lineTo(iconCx + iconR, iconCy);
			path.lineTo(iconCx, iconCy + iconR);
			path.lineTo(iconCx - iconR, iconCy);
			path.close();
			canvas.drawPath(path, r.auxFill);
			path.delete();
		}
		canvas.drawText(displayText, labelX + iconS + 4, labelY, r.auxFill, font);
	}
}
//#endregion
export { drawComponentLabels, drawSectionTitles };

//# sourceMappingURL=draw.js.map
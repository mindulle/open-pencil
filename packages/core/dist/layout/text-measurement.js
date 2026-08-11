import { weightToStyle } from "../text/font-style.js";
import { measureTextWithOpenType } from "../text/opentype.js";
//#region src/layout/text-measurement.ts
let globalTextMeasurer = null;
const GLYPH_WIDTH_FACTOR = .6;
function estimateTextSize(node, maxWidth) {
	const fontSize = node.fontSize || 14;
	const family = node.fontFamily || "Inter";
	const style = weightToStyle(node.fontWeight || 400, node.italic);
	const text = node.text || "";
	const measured = measureTextWithOpenType(text, fontSize, family, style, maxWidth, (node.lineHeight ?? 0) > 0 ? node.lineHeight : void 0);
	if (measured) return measured;
	const charWidth = fontSize * GLYPH_WIDTH_FACTOR;
	const singleLineWidth = Math.ceil(text.length * charWidth);
	const lineH = (node.lineHeight ?? 0) > 0 ? node.lineHeight : Math.ceil(fontSize * 1.4);
	if (maxWidth && maxWidth > 0 && singleLineWidth > maxWidth) {
		const lines = Math.ceil(singleLineWidth / maxWidth);
		return {
			width: maxWidth,
			height: Math.ceil(lines * lineH)
		};
	}
	return {
		width: singleLineWidth,
		height: lineH
	};
}
function getTextMeasurer() {
	return globalTextMeasurer;
}
function setTextMeasurer(measurer) {
	globalTextMeasurer = measurer;
}
//#endregion
export { estimateTextSize, getTextMeasurer, setTextMeasurer };

//# sourceMappingURL=text-measurement.js.map
import { parseFontStyle as parseFontStyle$1 } from "./face.js";
import { weightToFigmaStyle } from "@open-pencil/fig/node-change";
import { FONT_WEIGHT_NAMES, normalizeFontFamily, normalizeFontFamily as normalizeFontFamily$1, styleToVariant, styleToWeight, weightToStyle } from "@open-pencil/scene-graph";
//#region src/text/font-style.ts
function chooseLocalFontMatch(fonts, family, style) {
	const families = [family];
	const normalized = normalizeFontFamily$1(family);
	if (normalized !== family) families.push(normalized);
	const requested = parseFontStyle$1(style);
	for (const candidateFamily of families) {
		const exact = style ? fonts.find((font) => font.family === candidateFamily && font.style === style) : void 0;
		if (exact) return exact;
		const candidates = fonts.filter((font) => font.family === candidateFamily);
		const sameStyle = candidates.find((font) => {
			const parsed = parseFontStyle$1(font.style);
			return parsed.weight === requested.weight && parsed.italic === requested.italic;
		});
		if (sameStyle) return sameStyle;
		if (style) continue;
		const sameSlant = candidates.filter((font) => parseFontStyle$1(font.style).italic === requested.italic);
		if (sameSlant.length > 0) return sameSlant[0];
		if (candidates.length > 0) return candidates[0];
	}
}
function isVariableFont(data) {
	if (data.byteLength < 12) return false;
	const view = new DataView(data);
	const numTables = view.getUint16(4);
	for (let i = 0; i < numTables && 12 + i * 16 + 4 <= data.byteLength; i++) if (String.fromCharCode(view.getUint8(12 + i * 16), view.getUint8(12 + i * 16 + 1), view.getUint8(12 + i * 16 + 2), view.getUint8(12 + i * 16 + 3)) === "fvar") return true;
	return false;
}
//#endregion
export { FONT_WEIGHT_NAMES, chooseLocalFontMatch, isVariableFont, normalizeFontFamily, styleToVariant, styleToWeight, weightToFigmaStyle, weightToStyle };

//# sourceMappingURL=font-style.js.map
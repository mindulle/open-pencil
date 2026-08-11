import { FONT_WEIGHT_NAMES } from "../text/font-style.js";
//#region src/figma-api/fonts.ts
function weightToStyleName(weight, italic) {
	const base = FONT_WEIGHT_NAMES[weight] ?? "Regular";
	return italic ? `${base} Italic` : base;
}
const STYLE_NAME_TO_WEIGHT = Object.fromEntries([
	...Object.entries(FONT_WEIGHT_NAMES).map(([w, name]) => [name.toLowerCase(), Number(w)]),
	["ultra light", 200],
	["", 400],
	["demi bold", 600],
	["ultra bold", 800],
	["heavy", 900]
]);
function styleNameToWeight(style) {
	const lower = style.toLowerCase();
	const italic = lower.includes("italic");
	return {
		weight: STYLE_NAME_TO_WEIGHT[lower.replace(/italic/i, "").trim()] ?? 400,
		italic
	};
}
//#endregion
export { styleNameToWeight, weightToStyleName };

//# sourceMappingURL=fonts.js.map
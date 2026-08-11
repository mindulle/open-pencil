//#region src/font-style.ts
const FONT_WEIGHT_NAMES = {
	100: "Thin",
	200: "Extra Light",
	300: "Light",
	400: "Regular",
	500: "Medium",
	600: "Semi Bold",
	700: "Bold",
	800: "Extra Bold",
	900: "Black"
};
const FONT_WEIGHT_BY_STYLE = new Map([
	{
		weight: 100,
		names: [
			"thin",
			"hairline",
			"extrathin",
			"ultrathin"
		]
	},
	{
		weight: 200,
		names: ["extralight", "ultralight"]
	},
	{
		weight: 300,
		names: ["light"]
	},
	{
		weight: 400,
		names: [
			"regular",
			"normal",
			"book",
			"roman",
			"plain"
		]
	},
	{
		weight: 500,
		names: ["medium"]
	},
	{
		weight: 600,
		names: ["semibold", "demibold"]
	},
	{
		weight: 700,
		names: ["bold"]
	},
	{
		weight: 800,
		names: ["extrabold", "ultrabold"]
	},
	{
		weight: 900,
		names: ["black", "heavy"]
	}
].flatMap(({ names, weight }) => names.map((name) => [name, weight])));
function normalizeFontStyleName(style) {
	return style.toLowerCase().replace(/italic|oblique/u, "").replace(/[^a-z0-9]+/gu, "");
}
function parseFontStyle(style) {
	const raw = style ?? "";
	const italic = /(?:italic|oblique)/iu.test(raw);
	const normalized = normalizeFontStyleName(raw);
	const numericWeight = normalized.match(/(?:^|[^0-9])([1-9]00)(?:[^0-9]|$)/u)?.[1];
	return {
		weight: numericWeight ? Number(numericWeight) : FONT_WEIGHT_BY_STYLE.get(normalized) ?? 400,
		italic
	};
}
function styleToWeight(style) {
	return parseFontStyle(style).weight;
}
function normalizeFontFamily(family) {
	return family.replace(/\s+(Variable|\d+(?:pt|px|em))$/i, "");
}
function styleToVariant(style) {
	const weight = styleToWeight(style);
	const italic = style.toLowerCase().includes("italic");
	if (weight === 400 && !italic) return "regular";
	if (weight === 400 && italic) return "italic";
	return italic ? `${weight}italic` : `${weight}`;
}
function weightToStyle(weight, italic = false) {
	const label = (FONT_WEIGHT_NAMES[Math.round(weight / 100) * 100] ?? "Regular").replace(/ /g, "");
	return italic ? `${label} Italic` : label;
}
//#endregion
export { FONT_WEIGHT_NAMES, normalizeFontFamily, normalizeFontStyleName, parseFontStyle, styleToVariant, styleToWeight, weightToStyle };

//# sourceMappingURL=font-style.js.map
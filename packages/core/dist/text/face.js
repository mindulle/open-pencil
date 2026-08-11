import { normalizeFontStyleName, parseFontStyle, parseFontStyle as parseFontStyle$1, styleToWeight } from "@open-pencil/scene-graph";
//#region src/text/face.ts
function fontFaceFromFigmaFontName(fontName) {
	const style = fontName.style ?? "Regular";
	return {
		family: fontName.family ?? "Inter",
		style,
		postscriptName: fontName.postscript,
		...parseFontStyle$1(style)
	};
}
function fontFaceRenderFamily(family, style) {
	return `__op_font__${family.replace(/[^a-z0-9_-]+/giu, "_")}__${style.replace(/[^a-z0-9_-]+/giu, "_")}`;
}
//#endregion
export { fontFaceFromFigmaFontName, fontFaceRenderFamily, normalizeFontStyleName, parseFontStyle, styleToWeight };

//# sourceMappingURL=face.js.map
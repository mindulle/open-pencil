import { ParsedFontStyle, ParsedFontStyle as ParsedFontStyle$1, normalizeFontStyleName, parseFontStyle, styleToWeight } from "@open-pencil/scene-graph";

//#region src/text/face.d.ts
interface FontFaceRef extends ParsedFontStyle$1 {
  family: string;
  style: string;
  postscriptName?: string;
}
declare function fontFaceFromFigmaFontName(fontName: {
  family?: string;
  style?: string;
  postscript?: string;
}): FontFaceRef;
declare function fontFaceRenderFamily(family: string, style: string): string;
//#endregion
export { FontFaceRef, type ParsedFontStyle, fontFaceFromFigmaFontName, fontFaceRenderFamily, normalizeFontStyleName, parseFontStyle, styleToWeight };
//# sourceMappingURL=face.d.ts.map
import { FontFamilyStyle } from "@open-pencil/scene-graph";

//#region src/figma-api/fonts.d.ts
type FigmaFontName = FontFamilyStyle;
type FigmaFont = {
  fontName: FigmaFontName;
};
declare function weightToStyleName(weight: number, italic: boolean): string;
declare function styleNameToWeight(style: string): {
  weight: number;
  italic: boolean;
};
//#endregion
export { FigmaFont, FigmaFontName, styleNameToWeight, weightToStyleName };
//# sourceMappingURL=fonts.d.ts.map
import { weightToFigmaStyle } from "@open-pencil/fig/node-change";
import { FONT_WEIGHT_NAMES, FontFamilyStyle, normalizeFontFamily, styleToVariant, styleToWeight, weightToStyle } from "@open-pencil/scene-graph";

//#region src/text/font-style.d.ts
declare function chooseLocalFontMatch<T extends FontFamilyStyle>(fonts: T[], family: string, style?: string): T | undefined;
declare function isVariableFont(data: ArrayBuffer): boolean;
//#endregion
export { FONT_WEIGHT_NAMES, chooseLocalFontMatch, isVariableFont, normalizeFontFamily, styleToVariant, styleToWeight, weightToFigmaStyle, weightToStyle };
//# sourceMappingURL=font-style.d.ts.map
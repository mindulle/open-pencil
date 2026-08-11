import { FontFallbackScript } from "../fallbacks.js";

//#region src/text/resolver/coverage.d.ts
interface ObservedShapedLine {
  textRange: {
    last: number;
  };
  runs: Array<{
    glyphs: Uint16Array;
    offsets: Uint32Array;
  }>;
}
declare function missingGlyphCharacters(text: string, lines: readonly ObservedShapedLine[]): string[];
declare function missingGlyphScripts(text: string, lines: readonly ObservedShapedLine[]): FontFallbackScript[];
//#endregion
export { ObservedShapedLine, missingGlyphCharacters, missingGlyphScripts };
//# sourceMappingURL=coverage.d.ts.map
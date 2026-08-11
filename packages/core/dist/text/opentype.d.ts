//#region src/text/opentype.d.ts
interface OutlineCommand {
  type: string;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}
interface GlyphOutlineProbe {
  family: string;
  style: string;
  unitsPerEm: number;
  commandCount: number;
  firstGlyphCommandSample: OutlineCommand[];
}
declare function measureTextWithOpenType(text: string, fontSize: number, family: string, style: string, maxWidth?: number, lineHeight?: number): {
  width: number;
  height: number;
} | null;
interface GlyphOutlineMetrics {
  commands: OutlineCommand[];
  x: number;
  advance: number;
}
type FontGlyphCoverage = 'has' | 'missing' | 'unknown';
declare function fontGlyphCoverageSync(family: string, style: string, char: string): FontGlyphCoverage;
declare function fontHasGlyphSync(family: string, style: string, char: string): boolean;
declare function getGlyphOutlineMetricsSync(family: string, style: string, text: string, fontSize: number): GlyphOutlineMetrics[] | null;
declare function probeGlyphOutlineCommands(family: string, style: string, text: string, fontSize: number): Promise<GlyphOutlineProbe | null>;
//#endregion
export { FontGlyphCoverage, GlyphOutlineMetrics, GlyphOutlineProbe, OutlineCommand, fontGlyphCoverageSync, fontHasGlyphSync, getGlyphOutlineMetricsSync, measureTextWithOpenType, probeGlyphOutlineCommands };
//# sourceMappingURL=opentype.d.ts.map
import { VectorNetwork, WindingRule } from "./types2.js";

//#region src/parse-path.d.ts
type VectorPathWindingRule = WindingRule | 'NONE';
type SVGPathParseResult = {
  ok: true;
  network: VectorNetwork;
} | {
  ok: false;
  error: string;
};
/**
 * Parse an SVG path `d` attribute into a VectorNetwork.
 *
 * Uses `svgpath` to normalize all commands to absolute M/L/C/Z
 * (arcs → cubics via `.unarc()`, smooth curves → explicit via `.unshort()`).
 */
declare function parseSVGPath(d: string, windingRule?: WindingRule): VectorNetwork;
/** Parse the strict absolute command subset accepted by Figma's VectorPath API. */
declare function parsePluginVectorPath(d: string, windingRule: VectorPathWindingRule): SVGPathParseResult;
//#endregion
export { SVGPathParseResult, VectorPathWindingRule, parsePluginVectorPath, parseSVGPath };
//# sourceMappingURL=parse-path.d.ts.map
import { SVGViewportMapping } from "./transform.js";
import { Fill } from "@open-pencil/scene-graph";
import { Color as Color$1, Rect } from "@open-pencil/scene-graph/primitives";

//#region src/vector/vectorize/svg/gradients.d.ts
interface RawStop {
  offset: number;
  color: Color$1;
}
interface ParsedGradient {
  kind: 'linear' | 'radial';
  units: 'userSpaceOnUse' | 'objectBoundingBox';
  transform: string | null;
  stops: RawStop[];
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx: number;
  cy: number;
  r: number;
}
/**
 * Parse every gradient def in the SVG into a lookup by id, via an XML/DOM parse
 * (no hand-rolled markup parsing). Returns an empty map on parse failure so a
 * malformed SVG simply falls back to solid fills.
 */
declare function parseSVGGradients(svg: string): Map<string, ParsedGradient>;
/**
 * Build a scene-graph gradient Fill for `fill="url(#id)"`, with its transform
 * expressed in the path's normalized bounding-box space (`nodeBounds` in the same
 * bounds-pixel space as the parsed network).
 */
declare function resolveGradientFill(fillRef: string | null, gradients: Map<string, ParsedGradient>, elementTransform: string | null, viewport: SVGViewportMapping, nodeBounds: Rect): Fill | null;
//#endregion
export { parseSVGGradients, resolveGradientFill };
//# sourceMappingURL=gradients.d.ts.map
import { Fill, Stroke, VectorNetwork } from "@open-pencil/scene-graph";
import { Rect, Size } from "@open-pencil/scene-graph/primitives";

//#region src/vector/vectorize/svg/to-vectors.d.ts
interface VectorizedPath {
  vectorNetwork: VectorNetwork;
  fills: Fill[];
  strokes: Stroke[];
}
interface SVGVectorizeResult {
  paths: VectorizedPath[];
  /** Tight bounds of path geometry in the target coordinate space. */
  contentBounds: Rect;
}
declare function svgToVectorPaths(svgText: string, bounds: Size, options?: {
  defaultColor?: string;
  preserveAspectRatio?: boolean;
}): SVGVectorizeResult | null;
//#endregion
export { SVGVectorizeResult, VectorizedPath, svgToVectorPaths };
//# sourceMappingURL=to-vectors.d.ts.map
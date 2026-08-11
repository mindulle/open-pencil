import { Rect, Size, Vector } from "@open-pencil/scene-graph/primitives";

//#region src/vector/vectorize/svg/transform.d.ts
interface SVGViewportMapping {
  space: Rect;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}
declare function resolveSVGViewportMapping(svg: string, space: Rect, bounds: Size, preserveAspectRatio: boolean): SVGViewportMapping;
declare function mapSVGPathToViewport(d: string, mapping: SVGViewportMapping): string;
declare function mapSVGPointToViewport(x: number, y: number, elementTransform: string | null, gradientTransform: string | null, mapping: SVGViewportMapping): Vector;
/** Apply the complete SVG transform grammar through svgpath. */
declare function applySVGTransformToPath(d: string, transform: string | null): string;
//#endregion
export { SVGViewportMapping, applySVGTransformToPath, mapSVGPathToViewport, mapSVGPointToViewport, resolveSVGViewportMapping };
//# sourceMappingURL=transform.d.ts.map
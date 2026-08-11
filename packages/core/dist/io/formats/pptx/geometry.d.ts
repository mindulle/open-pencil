import { Mat3, SceneGraph, SceneNode, Vector } from "@open-pencil/scene-graph";

//#region src/io/formats/pptx/geometry.d.ts
interface PPTXGeometryContext {
  graph: SceneGraph;
  pxPerInch: number;
  toSlideSpace: Mat3;
  offsetX: number;
  offsetY: number;
}
interface SlideBox {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: number;
  flipH: boolean;
}
declare function inch(ctx: PPTXGeometryContext, px: number): number;
/** px → pt. 1in = 96px (scene units) = 72pt. */
declare function pt(ctx: PPTXGeometryContext, px: number): number;
declare function nodeBox(ctx: PPTXGeometryContext, node: SceneNode): SlideBox;
declare function hasUnsupportedTransform(ctx: PPTXGeometryContext, node: SceneNode): boolean;
declare function transformNodeVector(ctx: PPTXGeometryContext, node: SceneNode, vector: Vector): Vector;
declare function nodeScale(ctx: PPTXGeometryContext, node: SceneNode): Vector;
//#endregion
export { PPTXGeometryContext, SlideBox, hasUnsupportedTransform, inch, nodeBox, nodeScale, pt, transformNodeVector };
//# sourceMappingURL=geometry.d.ts.map
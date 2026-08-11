import { SVGVectorizeResult } from "./svg/to-vectors.js";
import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";
import { Rect } from "@open-pencil/scene-graph/primitives";

//#region src/vector/vectorize/placement.d.ts
interface VectorFramePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}
declare function resolveVectorFramePlacement(node: Pick<SceneNode, 'x' | 'y' | 'width' | 'height' | 'rotation'>, content: Rect): VectorFramePlacement;
declare function createVectorFrameChildren(graph: SceneGraph, frameId: string, vectorized: SVGVectorizeResult, placement: VectorFramePlacement): void;
/** Merge adjacent fill-only SVG paths without changing their paint order. */
declare function createFlattenedVectorFrameChildren(graph: SceneGraph, frameId: string, vectorized: SVGVectorizeResult, placement: VectorFramePlacement): void;
//#endregion
export { VectorFramePlacement, createFlattenedVectorFrameChildren, createVectorFrameChildren, resolveVectorFramePlacement };
//# sourceMappingURL=placement.d.ts.map
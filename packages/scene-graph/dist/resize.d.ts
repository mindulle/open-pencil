import { Rect } from "./primitives2.js";
import { ConstraintType, SceneNode, VectorNetwork } from "./types2.js";

//#region src/resize.d.ts
type ResizeSnapshot = Pick<SceneNode, 'x' | 'y' | 'width' | 'height' | 'vectorNetwork' | 'fillGeometry' | 'strokeGeometry'>;
interface ResizeGraph {
  getNode(id: string): SceneNode | undefined;
}
declare function constrainedChildRect(child: Rect, parentBefore: Pick<Rect, 'width' | 'height'>, parentAfter: Pick<Rect, 'width' | 'height'>, horizontal: ConstraintType, vertical: ConstraintType): Rect;
declare function scaledChildRect(child: Rect, parentBefore: Pick<Rect, 'width' | 'height'>, parentAfter: Pick<Rect, 'width' | 'height'>): Rect;
declare function scaleVectorNetworkForResize(vectorNetwork: VectorNetwork | null, originalWidth: number, originalHeight: number, width: number, height: number): VectorNetwork | null;
declare function collectResizeDescendants(graph: ResizeGraph, rootId: string): Map<string, ResizeSnapshot> | null;
declare function computeConstrainedResizeChanges(graph: ResizeGraph, rootId: string, rootBefore: Pick<Rect, 'width' | 'height'>, rootAfter: Pick<Rect, 'width' | 'height'>, originals: ReadonlyMap<string, ResizeSnapshot>): Map<string, Partial<SceneNode>>;
//#endregion
export { ResizeSnapshot, collectResizeDescendants, computeConstrainedResizeChanges, constrainedChildRect, scaleVectorNetworkForResize, scaledChildRect };
//# sourceMappingURL=resize.d.ts.map
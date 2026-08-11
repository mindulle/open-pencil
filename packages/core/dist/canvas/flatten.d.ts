import { SkiaRenderer } from "./renderer.js";
import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/flatten.d.ts
type VectorFlattenProps = Pick<SceneNode, 'name' | 'x' | 'y' | 'width' | 'height' | 'fills' | 'vectorNetwork'>;
declare function flattenNodesToVectorProps(renderer: SkiaRenderer, graph: SceneGraph, nodes: SceneNode[]): VectorFlattenProps | null;
declare function outlineStrokeNodesToVectorProps(renderer: SkiaRenderer, graph: SceneGraph, nodes: SceneNode[]): VectorFlattenProps | null;
//#endregion
export { flattenNodesToVectorProps, outlineStrokeNodesToVectorProps };
//# sourceMappingURL=flatten.d.ts.map
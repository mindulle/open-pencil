import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";
import { Node } from "yoga-layout";

//#region src/layout/grid.d.ts
declare function createGridChildNode(child: SceneNode): Node;
declare function buildGridTree(graph: SceneGraph, frame: SceneNode, inheritedDirection: 'LTR' | 'RTL'): Node;
//#endregion
export { buildGridTree, createGridChildNode };
//# sourceMappingURL=grid.d.ts.map
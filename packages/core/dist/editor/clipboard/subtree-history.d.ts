import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/clipboard/subtree-history.d.ts
declare function collectSubtrees(graph: SceneGraph, rootIds: string[]): SceneNode[];
declare function snapshotSubtree(graph: SceneGraph, rootId: string): Map<string, SceneNode>;
declare function restoreSubtree(graph: SceneGraph, snapshot: SceneNode, parentId: string, index: Map<string, SceneNode>): void;
//#endregion
export { collectSubtrees, restoreSubtree, snapshotSubtree };
//# sourceMappingURL=subtree-history.d.ts.map
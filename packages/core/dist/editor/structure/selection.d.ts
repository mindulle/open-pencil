import { EditorContext } from "../types.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/structure/selection.d.ts
declare function topLevelSelectedNodes(selectedNodes: SceneNode[]): SceneNode[];
declare function selectedNodesInSharedParent(ctx: EditorContext, selectedNodes: SceneNode[]): {
  topLevel: SceneNode[];
  parentId: string;
  parent: SceneNode;
} | null;
//#endregion
export { selectedNodesInSharedParent, topLevelSelectedNodes };
//# sourceMappingURL=selection.d.ts.map
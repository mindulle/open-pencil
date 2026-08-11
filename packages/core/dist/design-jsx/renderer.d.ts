import { TreeNode } from "./tree.js";
import { RenderOptions } from "./types.js";
import { NodeType, SceneGraph } from "@open-pencil/scene-graph";

//#region src/design-jsx/renderer.d.ts
interface RenderResult {
  id: string;
  name: string;
  type: NodeType;
  childIds: string[];
  warnings?: string[];
}
declare function renderTree(graph: SceneGraph, tree: TreeNode, options?: RenderOptions): Promise<RenderResult>;
//#endregion
export { RenderResult, renderTree };
//# sourceMappingURL=renderer.d.ts.map
import { EditorContext } from "../types.js";
import { flattenNodesToVectorProps } from "../../canvas/flatten.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/structure/flatten.d.ts
type VectorPropsFactory = typeof flattenNodesToVectorProps;
type FlattenOptions = {
  label?: string;
  canFlattenNode?: (node: SceneNode) => boolean;
  vectorPropsFactory?: VectorPropsFactory;
};
declare function flattenSelected(ctx: EditorContext, selectedNodes: SceneNode[], options?: FlattenOptions): string | null;
declare function outlineStrokeSelected(ctx: EditorContext, selectedNodes: SceneNode[]): string | null;
//#endregion
export { flattenSelected, outlineStrokeSelected };
//# sourceMappingURL=flatten.d.ts.map
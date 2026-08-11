import { SceneNode } from "./types2.js";

//#region src/preview.d.ts
type PreviewGraph = {
  nodes: Map<string, SceneNode>;
  positionPreviewVersion: number;
  clearAbsPosCache: () => void;
};
declare function updateNodePreview(graph: PreviewGraph, id: string, changes: Partial<SceneNode>): Partial<SceneNode> | null;
//#endregion
export { updateNodePreview };
//# sourceMappingURL=preview.d.ts.map
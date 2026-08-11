import { EditorContext } from "./types.js";

//#region src/editor/alignment.d.ts
declare function createAlignmentActions(ctx: EditorContext): {
  alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
  canDistributeNodes: (nodeIds: string[]) => boolean;
  distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
  flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
  rotateNodes: (nodeIds: string[], degrees: number) => void;
};
//#endregion
export { createAlignmentActions };
//# sourceMappingURL=alignment.d.ts.map
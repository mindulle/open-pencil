import { EditorContext } from "../types.js";

//#region src/editor/alignment/flip-rotate.d.ts
declare function createFlipRotateActions(ctx: EditorContext): {
  flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
  rotateNodes: (nodeIds: string[], degrees: number) => void;
};
//#endregion
export { createFlipRotateActions };
//# sourceMappingURL=flip-rotate.d.ts.map
import { EditorContext } from "../types.js";

//#region src/editor/clipboard/placement.d.ts
declare function createClipboardPlacementActions(ctx: EditorContext): {
  centerNodesAt: (nodeIds: string[], cx: number, cy: number) => void;
};
//#endregion
export { createClipboardPlacementActions };
//# sourceMappingURL=placement.d.ts.map
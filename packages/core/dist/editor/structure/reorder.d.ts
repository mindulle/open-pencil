import { EditorContext } from "../types.js";

//#region src/editor/structure/reorder.d.ts
declare function createStructureReorderActions(ctx: EditorContext): {
  reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
  reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
};
//#endregion
export { createStructureReorderActions };
//# sourceMappingURL=reorder.d.ts.map
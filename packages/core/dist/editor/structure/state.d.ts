import { EditorContext } from "../types.js";

//#region src/editor/structure/state.d.ts
declare function createStructureStateActions(ctx: EditorContext): {
  toggleNodeVisibility: (id: string) => void;
  toggleNodeLock: (id: string) => void;
  toggleVisibility: () => void;
  toggleLock: () => void;
};
//#endregion
export { createStructureStateActions };
//# sourceMappingURL=state.d.ts.map
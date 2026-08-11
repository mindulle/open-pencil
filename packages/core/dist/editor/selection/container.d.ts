import { EditorContext } from "../types.js";

//#region src/editor/selection/container.d.ts
declare function createSelectionContainerActions(ctx: EditorContext): {
  validateEnteredContainer: () => void;
  enterContainer: (id: string) => void;
  exitContainer: () => void;
};
//#endregion
export { createSelectionContainerActions };
//# sourceMappingURL=container.d.ts.map
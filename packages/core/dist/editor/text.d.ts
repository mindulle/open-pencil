import { EditorContext } from "./types.js";

//#region src/editor/text.d.ts
declare function createTextActions(ctx: EditorContext): {
  startTextEditing: (nodeId: string) => void;
  commitTextEdit: () => void;
};
//#endregion
export { createTextActions };
//# sourceMappingURL=text.d.ts.map
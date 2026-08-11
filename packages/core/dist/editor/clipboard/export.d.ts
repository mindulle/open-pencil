import { EditorContext } from "../types.js";

//#region src/editor/clipboard/export.d.ts
declare function createClipboardExportActions(ctx: EditorContext): {
  copySelectionAsText: (ids: string[]) => string;
  copySelectionAsSVG: (ids: string[]) => string | null;
  copySelectionAsJSX: (ids: string[]) => string | null;
};
//#endregion
export { createClipboardExportActions };
//# sourceMappingURL=export.d.ts.map
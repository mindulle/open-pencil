import { EditorContext } from "../types.js";

//#region src/editor/clipboard/fonts.d.ts
declare function createClipboardFontActions(ctx: EditorContext): {
  loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
};
//#endregion
export { createClipboardFontActions };
//# sourceMappingURL=fonts.d.ts.map
import { EditorContext } from "./types.js";

//#region src/editor/page-viewports.d.ts
declare function createPageViewportStore(ctx: EditorContext): {
  saveCurrentPageViewport: () => void;
  restorePageViewport: (pageId: string) => void;
  deletePageViewport: (pageId: string) => void;
  clearPageViewports: () => void;
};
//#endregion
export { createPageViewportStore };
//# sourceMappingURL=page-viewports.d.ts.map
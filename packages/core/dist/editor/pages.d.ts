import { EditorContext } from "./types.js";
import { Color } from "@open-pencil/scene-graph/primitives";

//#region src/editor/pages.d.ts
declare function createPageActions(ctx: EditorContext): {
  switchPage: (pageId: string) => Promise<void>;
  addPage: (name?: string) => string;
  deletePage: (pageId: string) => void;
  movePage: (pageId: string, index: number) => void;
  renamePage: (pageId: string, name: string) => void;
  setPageColor: (color: Color) => void;
  clearPageViewports: () => void;
};
//#endregion
export { createPageActions };
//# sourceMappingURL=pages.d.ts.map
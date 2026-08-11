import { EditorContext } from "./types.js";
import { DocumentColorSpace } from "@open-pencil/scene-graph";

//#region src/editor/color-space.d.ts
type DocumentColorProfileMode = 'assign' | 'convert';
declare function createColorSpaceActions(ctx: EditorContext): {
  setDocumentColorSpace: (colorSpace: DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
};
//#endregion
export { DocumentColorProfileMode, createColorSpaceActions };
//# sourceMappingURL=color-space.d.ts.map
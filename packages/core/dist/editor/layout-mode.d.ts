import { EditorContext } from "./types.js";
import { LayoutMode } from "@open-pencil/scene-graph";

//#region src/editor/layout-mode.d.ts
declare function createLayoutModeActions(ctx: EditorContext): {
  setLayoutMode: (id: string, mode: LayoutMode) => void;
};
//#endregion
export { createLayoutModeActions };
//# sourceMappingURL=layout-mode.d.ts.map
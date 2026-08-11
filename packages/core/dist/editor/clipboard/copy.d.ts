import { EditorContext } from "../types.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/clipboard/copy.d.ts
declare function createClipboardCopyActions(ctx: EditorContext): {
  writeCopyData: (clipboardData: DataTransfer, selectedNodes: SceneNode[]) => Promise<void>;
};
//#endregion
export { createClipboardCopyActions };
//# sourceMappingURL=copy.d.ts.map
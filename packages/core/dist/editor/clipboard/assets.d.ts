import { EditorContext } from "../types.js";

//#region src/editor/clipboard/assets.d.ts
type PushCreatedNodesUndo = (created: string[], previousSelection: Set<string>, label?: string) => void;
declare function createClipboardAssetActions(ctx: EditorContext, pushCreatedNodesUndo: PushCreatedNodesUndo): {
  storeImage: (bytes: Uint8Array) => string;
  placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
  placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
};
//#endregion
export { createClipboardAssetActions };
//# sourceMappingURL=assets.d.ts.map
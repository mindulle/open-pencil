import { createClipboardActions } from "../clipboard.js";
import { createSelectionActions } from "../selection.js";

//#region src/editor/bridges/clipboard.d.ts
type ClipboardActions = ReturnType<typeof createClipboardActions>;
type SelectionActions = ReturnType<typeof createSelectionActions>;
declare function createClipboardBridge(clipboard: ClipboardActions, selection: SelectionActions): {
  duplicateSelected: () => void;
  writeCopyData: (data: DataTransfer) => Promise<void>;
  pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
    replaceSelection?: boolean;
  }) => Promise<void>;
  deleteSelected: () => void;
  storeImage: (bytes: Uint8Array) => string;
  placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
  placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
  loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
  copySelectionAsText: (ids: string[]) => string;
  copySelectionAsSVG: (ids: string[]) => string | null;
  copySelectionAsJSX: (ids: string[]) => string | null;
};
//#endregion
export { createClipboardBridge };
//# sourceMappingURL=clipboard.d.ts.map
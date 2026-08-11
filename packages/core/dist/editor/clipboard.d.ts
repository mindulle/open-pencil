import { EditorContext } from "./types.js";
import { collectSubtrees } from "./clipboard/subtree-history.js";
import { SceneNode } from "@open-pencil/scene-graph";
import { Vector as Vector$1 } from "@open-pencil/scene-graph/primitives";

//#region src/editor/clipboard.d.ts
type PasteOptions = {
  replaceSelection?: boolean;
};
declare function createClipboardActions(ctx: EditorContext): {
  copySelectionAsText: (ids: string[]) => string;
  copySelectionAsSVG: (ids: string[]) => string | null;
  copySelectionAsJSX: (ids: string[]) => string | null;
  storeImage: (bytes: Uint8Array) => string;
  placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
  placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
  pasteFromHTML: (html: string, cursorPos?: Vector$1, options?: PasteOptions) => Promise<void>;
  warnMissingImages: (nodeIds: string[]) => boolean;
  deleteSelected: () => void;
  writeCopyData: (clipboardData: DataTransfer, selectedNodes: SceneNode[]) => Promise<void>;
  duplicateSelected: (selectedNodes: SceneNode[]) => void;
  loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
  centerNodesAt: (nodeIds: string[], cx: number, cy: number) => void;
  collectSubtrees: typeof collectSubtrees;
};
//#endregion
export { createClipboardActions };
//# sourceMappingURL=clipboard.d.ts.map
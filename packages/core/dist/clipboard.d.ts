import { OpenPencilClipboardData, TextPictureBuilder, buildOpenPencilClipboardHTML, parseOpenPencilClipboard } from "./clipboard/openpencil.js";
import { NodeChange } from "@open-pencil/kiwi/fig/codec";
import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/clipboard.d.ts
interface FigmaClipboardMeta {
  fileKey: string;
  pasteID: number;
  dataType: string;
}
declare function prefetchFigmaSchema(): Promise<void>;
declare function parseFigmaClipboard(html: string): Promise<{
  nodes: NodeChange[];
  meta: FigmaClipboardMeta;
  blobs: Uint8Array[];
} | null>;
declare function figmaNodesBounds(nodeChanges: NodeChange[]): {
  x: number;
  y: number;
  w: number;
  h: number;
} | null;
declare function importClipboardNodes(nodeChanges: NodeChange[], graph: SceneGraph, targetParentId: string, offsetX?: number, offsetY?: number, blobs?: Uint8Array[]): string[];
declare function buildFigmaClipboardHTML(nodes: SceneNode[], graph: SceneGraph): Promise<string | null>;
//#endregion
export { type OpenPencilClipboardData, type TextPictureBuilder, buildFigmaClipboardHTML, buildOpenPencilClipboardHTML, figmaNodesBounds, importClipboardNodes, parseFigmaClipboard, parseOpenPencilClipboard, prefetchFigmaSchema };
//# sourceMappingURL=clipboard.d.ts.map
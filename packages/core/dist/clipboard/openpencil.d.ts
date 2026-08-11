import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/clipboard/openpencil.d.ts
interface OpenPencilClipboardData {
  nodes: Array<SceneNode & {
    children?: SceneNode[];
  }>;
  images: Map<string, Uint8Array>;
}
declare function parseOpenPencilClipboard(html: string): OpenPencilClipboardData | null;
type TextPictureBuilder = (node: SceneNode) => Uint8Array | null;
declare function buildOpenPencilClipboardHTML(nodes: SceneNode[], graph: SceneGraph, textPictureBuilder?: TextPictureBuilder): string;
//#endregion
export { OpenPencilClipboardData, TextPictureBuilder, buildOpenPencilClipboardHTML, parseOpenPencilClipboard };
//# sourceMappingURL=openpencil.d.ts.map
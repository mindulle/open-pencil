import { ExportFormat } from "./render.js";
import { CanvasKit } from "canvaskit-wasm";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/io/formats/raster/headless.d.ts
declare function initCanvasKit(): Promise<CanvasKit>;
declare function headlessRenderNodes(graph: SceneGraph, pageId: string, nodeIds: string[], options?: {
  scale?: number;
  format?: ExportFormat;
  quality?: number;
  trimTransparent?: boolean;
}): Promise<Uint8Array | null>;
declare function headlessRenderThumbnail(graph: SceneGraph, pageId: string, width: number, height: number): Promise<Uint8Array | null>;
//#endregion
export { headlessRenderNodes, headlessRenderThumbnail, initCanvasKit };
//# sourceMappingURL=headless.d.ts.map
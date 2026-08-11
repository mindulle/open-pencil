import { SkiaRenderer } from "../../../canvas/renderer.js";
import { CanvasKit } from "canvaskit-wasm";
import { SceneGraph } from "@open-pencil/scene-graph";
import { compressFigDataSync } from "@open-pencil/fig";

//#region src/io/formats/fig/export.d.ts
declare function exportFigFile(sourceGraph: SceneGraph, ck?: CanvasKit, renderer?: SkiaRenderer, pageId?: string, renderHeadlessThumbnail?: boolean): Promise<Uint8Array>;
declare function compressFigData(schemaDeflated: Uint8Array, kiwiData: Uint8Array, thumbnailPNG: Uint8Array, metaJSON: string, imageEntries: Array<{
  name: string;
  data: Uint8Array;
}>, figKiwiVersion?: number): Promise<Uint8Array>;
//#endregion
export { compressFigData, compressFigDataSync, exportFigFile };
//# sourceMappingURL=export.d.ts.map
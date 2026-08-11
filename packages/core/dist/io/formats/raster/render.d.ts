import { RenderColorSpace } from "../../../color/management.js";
import { SkiaRenderer } from "../../../canvas/renderer.js";
import { CanvasKit } from "canvaskit-wasm";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/io/formats/raster/render.d.ts
type RasterExportFormat = 'PNG' | 'JPG' | 'WEBP';
type ExportFormat = RasterExportFormat | 'SVG';
interface RenderOptions {
  scale: number;
  format: ExportFormat;
  quality?: number;
  colorSpace?: RenderColorSpace;
  trimTransparent?: boolean;
}
declare function computeContentBounds(graph: SceneGraph, nodeIds: string[]): import("@open-pencil/scene-graph").VisualBounds | null;
declare function prepareSelectionRenderGraph(source: SceneGraph, renderGraph: SceneGraph, pageId: string, nodeIds: string[]): void;
declare function renderNodesToImage(ck: CanvasKit, renderer: SkiaRenderer, graph: SceneGraph, pageId: string, nodeIds: string[], options: RenderOptions): Uint8Array | null;
declare function renderThumbnail(ck: CanvasKit, renderer: SkiaRenderer, graph: SceneGraph, pageId: string, width: number, height: number): Uint8Array | null;
//#endregion
export { ExportFormat, RasterExportFormat, computeContentBounds, prepareSelectionRenderGraph, renderNodesToImage, renderThumbnail };
//# sourceMappingURL=render.d.ts.map
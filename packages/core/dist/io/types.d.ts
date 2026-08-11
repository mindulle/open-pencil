import { RenderColorSpace } from "../color/management.js";
import { SkiaRenderer } from "../canvas/renderer.js";
import { JSXFormat } from "./formats/jsx/export.js";
import { RasterExportFormat } from "./formats/raster/render.js";
import { CanvasKit } from "canvaskit-wasm";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/io/types.d.ts
type IOFormatRole = 'native-document' | 'interchange-document' | 'derived-export';
type IOFormatCategory = 'document' | 'raster' | 'vector' | 'code' | 'print';
type IOTextEncoding = 'utf8';
type IOBinaryData = Uint8Array;
type IOTextData = string;
type IOData = IOBinaryData | IOTextData;
interface ReadDocumentInput {
  name?: string;
  mimeType?: string;
  data: Uint8Array;
}
interface ReadDocumentResult {
  graph: SceneGraph;
  sourceFormat: string;
}
interface ExportTargetDocument {
  scope: 'document';
}
interface ExportTargetPage {
  scope: 'page';
  pageId: string;
}
interface ExportTargetSelection {
  scope: 'selection';
  nodeIds: string[];
}
interface ExportTargetNode {
  scope: 'node';
  nodeId: string;
}
type ExportTarget = ExportTargetDocument | ExportTargetPage | ExportTargetSelection | ExportTargetNode;
interface ExportRequest {
  graph: SceneGraph;
  target: ExportTarget;
  fileName?: string;
}
interface IOContext {
  canvasKit?: CanvasKit;
  renderer?: SkiaRenderer;
}
interface FigWriteOptions {
  thumbnailPageId?: string;
  renderThumbnail?: boolean;
}
interface RasterExportOptions {
  scale?: number;
  quality?: number;
  colorSpace?: RenderColorSpace;
  format: RasterExportFormat;
}
interface SVGExportOptions {
  xmlDeclaration?: boolean;
  colorSpace?: RenderColorSpace;
}
interface JSXExportOptions {
  format?: JSXFormat;
}
interface ExportResult {
  format: string;
  mimeType: string;
  extension: string;
  data: IOData;
  encoding?: IOTextEncoding;
}
interface IOFormatSupport {
  readDocument?: boolean;
  writeDocument?: boolean;
  exportDocument?: boolean;
  exportPage?: boolean;
  exportSelection?: boolean;
  exportNode?: boolean;
}
interface IOFormatExportOptions {
  scale?: boolean;
  quality?: boolean;
  colorSpace?: boolean;
}
interface IOFormatAdapter {
  id: string;
  label: string;
  role: IOFormatRole;
  category: IOFormatCategory;
  extensions: string[];
  mimeTypes: string[];
  support: IOFormatSupport;
  exportOptions?: IOFormatExportOptions;
  matchesFile?(fileName: string, mimeType?: string): boolean;
  readDocument?(input: ReadDocumentInput, context?: IOContext): Promise<ReadDocumentResult>;
  writeDocument?(graph: SceneGraph, options?: unknown, context?: IOContext): Promise<ExportResult>;
  exportContent?(request: ExportRequest, options?: unknown, context?: IOContext): Promise<ExportResult>;
}
//#endregion
export { ExportRequest, ExportResult, ExportTarget, ExportTargetDocument, ExportTargetNode, ExportTargetPage, ExportTargetSelection, FigWriteOptions, IOBinaryData, IOContext, IOData, IOFormatAdapter, IOFormatCategory, IOFormatExportOptions, IOFormatRole, IOFormatSupport, IOTextData, IOTextEncoding, JSXExportOptions, RasterExportOptions, ReadDocumentInput, ReadDocumentResult, SVGExportOptions };
//# sourceMappingURL=types.d.ts.map
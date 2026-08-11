import { ExportRequest, ExportResult, IOContext, IOFormatAdapter, ReadDocumentInput, ReadDocumentResult } from "./types.js";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/io/registry.d.ts
declare class IORegistry {
  private readonly adapters;
  constructor(adapters: IOFormatAdapter[]);
  listFormats(): IOFormatAdapter[];
  getFormat(id: string): IOFormatAdapter | null;
  listReadableFormats(): IOFormatAdapter[];
  listWritableFormats(): IOFormatAdapter[];
  listExportFormats(scope: ExportRequest['target']['scope']): IOFormatAdapter[];
  findReader(fileName: string, mimeType?: string): IOFormatAdapter | null;
  readDocument(input: ReadDocumentInput, context?: IOContext): Promise<ReadDocumentResult>;
  writeDocument(formatId: string, graph: SceneGraph, options?: unknown, context?: IOContext): Promise<ExportResult>;
  exportContent(formatId: string, request: ExportRequest, options?: unknown, context?: IOContext): Promise<ExportResult>;
}
//#endregion
export { IORegistry };
//# sourceMappingURL=registry.d.ts.map
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/io/formats/pdf/export.d.ts
interface PDFExportOptions {
  title?: string;
}
declare function renderNodesToPDF(graph: SceneGraph, pageId: string, nodeIds: string[], options?: PDFExportOptions): Promise<Uint8Array | null>;
//#endregion
export { PDFExportOptions, renderNodesToPDF };
//# sourceMappingURL=export.d.ts.map
import { PPTXExportOptions } from "./types.js";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/io/formats/pptx/export.d.ts
declare function renderNodesToPPTX(graph: SceneGraph, _pageId: string, nodeIds: string[], options?: PPTXExportOptions): Promise<Uint8Array | null>;
//#endregion
export { renderNodesToPPTX };
//# sourceMappingURL=export.d.ts.map
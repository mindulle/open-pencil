import { PPTXExportOptions, PPTXRasterize } from "./types.js";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/io/formats/pptx/rasterize.d.ts
/** Builds a rasterizer that keeps fallback subtrees transparent and isolated. */
declare function makeIsolatedRasterize(graph: SceneGraph, context?: PPTXExportOptions['context']): PPTXRasterize;
//#endregion
export { makeIsolatedRasterize };
//# sourceMappingURL=rasterize.d.ts.map
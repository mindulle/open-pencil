import { ExportTarget } from "./types.js";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/io/subgraph.d.ts
interface ExtractedGraph {
  graph: SceneGraph;
  pageId: string | null;
  nodeIds: string[];
}
declare function findPageId(source: SceneGraph, nodeId: string): string | null;
declare function extractExportGraph(source: SceneGraph, target: ExportTarget): ExtractedGraph;
//#endregion
export { ExtractedGraph, extractExportGraph, findPageId };
//# sourceMappingURL=subgraph.d.ts.map
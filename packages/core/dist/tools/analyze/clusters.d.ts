import { ToolDef } from "../schema.js";

//#region src/tools/analyze/clusters.d.ts
interface SizedItem {
  width: number;
  height: number;
  childCount: number;
}
declare function calcClusterConfidence(nodes: SizedItem[]): number;
declare const analyzeClusters: ToolDef;
//#endregion
export { analyzeClusters, calcClusterConfidence };
//# sourceMappingURL=clusters.d.ts.map
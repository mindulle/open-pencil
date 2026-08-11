import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/tools/describe/tree.d.ts
declare function describeOneNode(figma: {
  graph: SceneGraph;
}, nodeId: string, depth: number, gridSize: number): Record<string, unknown>;
declare function autoDepth(graph: SceneGraph, nodeId: string): number;
//#endregion
export { autoDepth, describeOneNode };
//# sourceMappingURL=tree.d.ts.map
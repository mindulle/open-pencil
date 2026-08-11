import { NodeProxyHost } from "./proxy.js";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/figma-api/serialization.d.ts
declare function nodeProxyToJSON(graph: SceneGraph, api: NodeProxyHost, nodeId: string, maxDepth?: number, currentDepth?: number): Record<string, unknown>;
//#endregion
export { nodeProxyToJSON };
//# sourceMappingURL=serialization.d.ts.map
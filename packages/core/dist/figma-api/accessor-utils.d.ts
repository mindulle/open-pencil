import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/figma-api/accessor-utils.d.ts
interface NodeProxyInternals {
  id: symbol;
  graph: symbol;
  api: symbol;
}
type ProxyThis = Record<symbol, unknown>;
declare function nodeId(target: ProxyThis, internals: NodeProxyInternals): string;
declare function graph(target: ProxyThis, internals: NodeProxyInternals): SceneGraph;
declare function raw(target: ProxyThis, internals: NodeProxyInternals): SceneNode;
declare function updateNode(target: ProxyThis, internals: NodeProxyInternals, changes: Partial<SceneNode>): void;
//#endregion
export { NodeProxyInternals, ProxyThis, graph, nodeId, raw, updateNode };
//# sourceMappingURL=accessor-utils.d.ts.map
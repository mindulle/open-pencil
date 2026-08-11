import { FigmaNodeProxy, NodeProxyHost } from "./proxy.js";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/figma-api/traversal.d.ts
declare function findAll(graph: SceneGraph, api: NodeProxyHost, rootId: string, callback?: (node: FigmaNodeProxy) => boolean): FigmaNodeProxy[];
declare function findOne(graph: SceneGraph, api: NodeProxyHost, rootId: string, callback: (node: FigmaNodeProxy) => boolean): FigmaNodeProxy | null;
declare function findChild(graph: SceneGraph, api: NodeProxyHost, rootId: string, callback: (node: FigmaNodeProxy) => boolean): FigmaNodeProxy | null;
declare function findChildren(graph: SceneGraph, api: NodeProxyHost, rootId: string, callback?: (node: FigmaNodeProxy) => boolean): FigmaNodeProxy[];
declare function findAllWithCriteria(graph: SceneGraph, api: NodeProxyHost, rootId: string, criteria: {
  types?: string[];
}): FigmaNodeProxy[];
//#endregion
export { findAll, findAllWithCriteria, findChild, findChildren, findOne };
//# sourceMappingURL=traversal.d.ts.map
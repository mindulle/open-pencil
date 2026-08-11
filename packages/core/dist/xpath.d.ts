import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/xpath.d.ts
interface XPathQueryOptions {
  limit?: number;
  page?: string;
}
declare function queryByXPath(graph: SceneGraph, selector: string, options?: XPathQueryOptions): Promise<SceneNode[]>;
/**
 * Build an XPath selector that uniquely identifies a node in its page.
 *
 * Strategy: walk from the node up to the page root, building path segments.
 * Each segment uses the node type as the element name. If the name is
 * unique among siblings of the same type, use `[@name='...']`.
 * Otherwise fall back to a positional predicate `[n]`.
 */
declare function nodeToXPath(graph: SceneGraph, nodeId: string): string | null;
declare function matchByXPath(graph: SceneGraph, selector: string, node: SceneNode): Promise<boolean>;
//#endregion
export { XPathQueryOptions, matchByXPath, nodeToXPath, queryByXPath };
//# sourceMappingURL=xpath.d.ts.map
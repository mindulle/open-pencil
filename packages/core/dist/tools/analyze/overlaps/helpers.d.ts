import { AnalyzeOverlapsArgs, OverlapCategory, OverlapItem, OverlapNodeSummary, OverlapScope, OverlapSeverity } from "./index.js";
import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";
import { VisualBounds } from "@open-pencil/scene-graph/geometry";
import { Rect } from "@open-pencil/scene-graph/primitives";

//#region src/tools/analyze/overlaps/helpers.d.ts
declare function parseNodeTypes(raw: string | undefined): Set<string> | undefined;
declare function visualBoundsArea(bounds: VisualBounds): number;
declare function boundsToRect(bounds: VisualBounds): Rect;
declare function toNodeSummary(node: SceneNode): OverlapNodeSummary;
declare function isEffectivelyHidden(graph: SceneGraph, node: SceneNode): boolean;
declare function isEffectivelyLocked(graph: SceneGraph, node: SceneNode): boolean;
declare function findPageId(graph: SceneGraph, node: SceneNode): string | null;
declare function findPageIdByName(graph: SceneGraph, name: string | undefined): string | undefined;
declare function pairRelationship(nodeA: SceneNode, nodeB: SceneNode, graph: SceneGraph): {
  sameParent: boolean;
  topLevel: boolean;
  insideParent: boolean;
  ancestor: 'neither' | 'a-ancestor' | 'b-ancestor';
};
declare function matchesParentOverflowScope(scope: OverlapScope): boolean;
declare function matchesScope(rel: ReturnType<typeof pairRelationship>, scope: OverlapScope): boolean;
declare function scoredSeverity(severity: OverlapSeverity): number;
declare function filterNodes(graph: SceneGraph, args: AnalyzeOverlapsArgs): {
  candidates: SceneNode[];
  totalNodes: number;
  analyzedNodes: number;
};
declare function computeNodeBounds(node: SceneNode, graph: SceneGraph): {
  bounds: VisualBounds;
  area: number;
};
declare function buildParentOverflowResult(child: SceneNode, childBounds: VisualBounds, parent: SceneNode, parentBounds: VisualBounds): OverlapItem | null;
declare function buildSiblingOverlapResult(nodeA: SceneNode, boundsA: VisualBounds, nodeB: SceneNode, boundsB: VisualBounds, graph: SceneGraph): OverlapItem | null;
declare function passesThresholds(item: OverlapItem, minArea: number, minRatio: number, categoryFilter: OverlapCategory[] | undefined, severityFilter: OverlapSeverity | undefined): boolean;
type BoundsEntry = {
  node: SceneNode;
  bounds: VisualBounds;
  area: number;
};
//#endregion
export { BoundsEntry, boundsToRect, buildParentOverflowResult, buildSiblingOverlapResult, computeNodeBounds, filterNodes, findPageId, findPageIdByName, isEffectivelyHidden, isEffectivelyLocked, matchesParentOverflowScope, matchesScope, pairRelationship, parseNodeTypes, passesThresholds, scoredSeverity, toNodeSummary, visualBoundsArea };
//# sourceMappingURL=helpers.d.ts.map
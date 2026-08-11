import { ToolDef } from "../../schema.js";
import { findPageId, findPageIdByName } from "./helpers.js";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/tools/analyze/overlaps/index.d.ts
type OverlapSeverity = 'critical' | 'major' | 'minor' | 'info';
type OverlapScope = 'all' | 'same-parent' | 'cross-parent' | 'top-level' | 'inside-parent';
type OverlapCategory = 'sibling-overlap' | 'parent-overflow' | 'overlay';
interface OverlapNodeSummary {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
}
interface OverlapIntersection {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}
interface OverlapItem {
  category: OverlapCategory;
  severity: OverlapSeverity;
  message: string;
  suggestion: string;
  area: number;
  ratio: number;
  nodeA: OverlapNodeSummary;
  nodeB: OverlapNodeSummary;
  intersection: OverlapIntersection;
}
interface AnalyzeOverlapsArgs {
  scope?: OverlapScope;
  category?: string;
  severity?: OverlapSeverity;
  min_area?: number;
  min_ratio?: number;
  include_hidden?: boolean;
  include_locked?: boolean;
  include_absolute?: boolean;
  limit?: number;
  /** Page name fallback; used only when `page_id` is not supplied. */
  page?: string;
  /** Stable page ID; takes precedence over `page`. */
  page_id?: string;
  type?: string;
}
interface AnalyzeOverlapsSummary {
  totalNodes: number;
  analyzedNodes: number;
  overlapCount: number;
  byCategory: Record<OverlapCategory, number>;
  bySeverity: Record<OverlapSeverity, number>;
}
interface AnalyzeOverlapsResult {
  overlaps: OverlapItem[];
  summary: AnalyzeOverlapsSummary;
}
/**
 * Compute overlap findings for a scoped subset of the graph.
 * Page, scope, type, and visibility filtering is applied via `args`.
 *
 * Heuristics implemented:
 *   - `sibling-overlap`: two non-ancestor nodes visually intersect.
 *   - `parent-overflow`: a child protrudes from a non-clipping parent.
 *   - `overlay`: a large node covers a much smaller sibling (modal/backdrop pattern).
 *
 * Filters:
 *   - hidden and locked nodes are skipped unless explicitly included
 *   - absolutely-positioned nodes are skipped unless explicitly included
 *   - ancestor/descendant pairs are never emitted as pair overlaps
 */
declare function computeOverlaps(graph: SceneGraph, args?: AnalyzeOverlapsArgs): AnalyzeOverlapsResult;
declare const analyzeOverlaps: ToolDef;
//#endregion
export { AnalyzeOverlapsArgs, AnalyzeOverlapsResult, AnalyzeOverlapsSummary, OverlapCategory, OverlapIntersection, OverlapItem, OverlapNodeSummary, OverlapScope, OverlapSeverity, analyzeOverlaps, computeOverlaps, findPageId, findPageIdByName };
//# sourceMappingURL=index.d.ts.map
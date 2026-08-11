import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/tools/describe/issues.d.ts
type IssueSeverity = 'error' | 'warning' | 'info';
interface DescribeIssue {
  severity?: IssueSeverity;
  message: string;
  suggestion?: string;
}
declare function detectIssues(node: SceneNode, gridSize: number, graph: SceneGraph): DescribeIssue[];
//#endregion
export { DescribeIssue, IssueSeverity, detectIssues };
//# sourceMappingURL=issues.d.ts.map
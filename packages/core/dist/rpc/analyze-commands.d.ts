import { ColorUsageEntry } from "../color/analysis.js";
import { AnalyzeOverlapsArgs, AnalyzeOverlapsResult } from "../tools/analyze/overlaps/index.js";
import { RPCCommand } from "./types.js";

//#region src/rpc/analyze-commands.d.ts
interface AnalyzeColorsArgs {
  threshold?: number;
  similar?: boolean;
}
type ColorInfo = ColorUsageEntry;
interface ColorCluster {
  colors: ColorInfo[];
  suggestedHex: string;
  totalCount: number;
}
interface AnalyzeColorsResult {
  colors: ColorInfo[];
  totalNodes: number;
  clusters: ColorCluster[];
}
declare const analyzeColorsCommand: RPCCommand<AnalyzeColorsArgs, AnalyzeColorsResult>;
type AnalyzeTypographyArgs = Record<string, never>;
interface TypographyStyle {
  family: string;
  size: number;
  weight: number;
  lineHeight: string;
  count: number;
}
interface AnalyzeTypographyResult {
  styles: TypographyStyle[];
  totalTextNodes: number;
}
declare const analyzeTypographyCommand: RPCCommand<AnalyzeTypographyArgs, AnalyzeTypographyResult>;
interface SpacingValue {
  value: number;
  count: number;
}
interface AnalyzeSpacingResult {
  gaps: SpacingValue[];
  paddings: SpacingValue[];
  totalNodes: number;
}
declare const analyzeSpacingCommand: RPCCommand<void, AnalyzeSpacingResult>;
interface AnalyzeClustersArgs {
  limit?: number;
  minSize?: number;
  minCount?: number;
}
interface ClusterNode {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  childCount: number;
}
interface AnalyzeClustersResult {
  clusters: Array<{
    signature: string;
    nodes: ClusterNode[];
  }>;
  totalNodes: number;
}
declare const analyzeClustersCommand: RPCCommand<AnalyzeClustersArgs, AnalyzeClustersResult>;
declare const analyzeOverlapsCommand: RPCCommand<AnalyzeOverlapsArgs, AnalyzeOverlapsResult>;
//#endregion
export { AnalyzeClustersArgs, AnalyzeClustersResult, AnalyzeColorsArgs, AnalyzeColorsResult, type AnalyzeOverlapsArgs, type AnalyzeOverlapsResult, AnalyzeSpacingResult, AnalyzeTypographyArgs, AnalyzeTypographyResult, SpacingValue, TypographyStyle, analyzeClustersCommand, analyzeColorsCommand, analyzeOverlapsCommand, analyzeSpacingCommand, analyzeTypographyCommand };
//# sourceMappingURL=analyze-commands.d.ts.map
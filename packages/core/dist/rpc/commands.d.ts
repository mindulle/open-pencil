import { AnalyzeOverlapsArgs, AnalyzeOverlapsResult } from "../tools/analyze/overlaps/index.js";
import { RPCCommand } from "./types.js";
import { FindArgs, FindNodeResult, InfoResult, NodeArgs, NodeResult, PageItem, QueryArgs, QueryNodeResult, TreeArgs, TreeNodeResult, TreeResult, findCommand, infoCommand, nodeCommand, pagesCommand, queryCommand, treeCommand } from "./read-commands.js";
import { VariablesArgs, VariablesResult, variablesCommand } from "./variables-command.js";
import { AnalyzeClustersArgs, AnalyzeClustersResult, AnalyzeColorsArgs, AnalyzeColorsResult, AnalyzeSpacingResult, AnalyzeTypographyArgs, AnalyzeTypographyResult, SpacingValue, TypographyStyle, analyzeClustersCommand, analyzeColorsCommand, analyzeOverlapsCommand, analyzeSpacingCommand, analyzeTypographyCommand } from "./analyze-commands.js";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/rpc/commands.d.ts
type AutomationDocumentSummary = {
  id: string;
  name: string;
  path?: string;
  active: boolean;
  current_page_id: string;
  current_page_name: string;
  pages: Array<{
    id: string;
    name: string;
  }>;
};
declare const ALL_RPC_COMMANDS: RPCCommand[];
declare function executeRPCCommand(graph: SceneGraph, name: string, args: unknown): unknown;
//#endregion
export { ALL_RPC_COMMANDS, AnalyzeClustersArgs, AnalyzeClustersResult, AnalyzeColorsArgs, AnalyzeColorsResult, type AnalyzeOverlapsArgs, type AnalyzeOverlapsResult, AnalyzeSpacingResult, AnalyzeTypographyArgs, AnalyzeTypographyResult, AutomationDocumentSummary, FindArgs, FindNodeResult, InfoResult, NodeArgs, NodeResult, PageItem, QueryArgs, QueryNodeResult, type RPCCommand, SpacingValue, TreeArgs, TreeNodeResult, TreeResult, TypographyStyle, VariablesArgs, VariablesResult, analyzeClustersCommand, analyzeColorsCommand, analyzeOverlapsCommand, analyzeSpacingCommand, analyzeTypographyCommand, executeRPCCommand, findCommand, infoCommand, nodeCommand, pagesCommand, queryCommand, treeCommand, variablesCommand };
//# sourceMappingURL=commands.d.ts.map
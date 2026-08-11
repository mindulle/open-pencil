import { FigmaAPI } from "../figma-api/index.js";
import { ToolDef } from "./schema.js";
import { tool } from "../node_modules/.bun/@ai-sdk_provider-utils@4.0.26_3c5d820c62823f0b/node_modules/@ai-sdk/provider-utils/dist/index.js";
import { index_d_exports } from "../node_modules/.bun/valibot@1.3.1_5bbfac422febb175/node_modules/valibot/dist/index.js";
import { valibotSchema } from "../node_modules/.bun/@ai-sdk_valibot@2.0.27_b8e2ece7fce68493/node_modules/@ai-sdk/valibot/dist/index.js";
import { ToolSet } from "../node_modules/.bun/ai@6.0.174_3c5d820c62823f0b/node_modules/ai/dist/index.js";

//#region src/tools/ai-adapter.d.ts
interface ToolLogEntry {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
  error?: string;
  timestamp: number;
  durationMs: number;
  mutates: boolean;
  /** For mutating tools: snapshot of target node props before execution */
  nodeBefore?: Record<string, unknown>;
  /** For mutating tools: snapshot of target node props after execution */
  nodeAfter?: Record<string, unknown>;
  /** Props that didn't change despite the tool reporting success */
  unchangedProps?: string[];
  /** True when this exact tool+args combo was already called in the session */
  isDuplicate?: boolean;
}
interface ToolDebugLog {
  entries: ToolLogEntry[];
  /** Detect repeated tool calls with identical args */
  duplicates: Array<{
    tool: string;
    args: Record<string, unknown>;
    count: number;
  }>;
  /** Entries where mutating tool succeeded but node didn't change */
  noopMutations: ToolLogEntry[];
  /** Total bytes of tool results sent to model (rough token proxy) */
  totalResultBytes: number;
}
interface StepBudget {
  current: number;
  max: number;
}
interface AIAdapterOptions {
  getFigma: () => FigmaAPI;
  onBeforeExecute?: (def: ToolDef) => void;
  onAfterExecute?: (def: ToolDef) => Promise<void> | void;
  onFlashNodes?: (nodeIds: string[]) => void;
  onToolLog?: (entry: ToolLogEntry) => void;
  getStepBudget?: () => StepBudget;
}
declare function toolsToAI(tools: ToolDef[], options: AIAdapterOptions, deps: {
  v: typeof index_d_exports;
  valibotSchema: typeof valibotSchema;
  tool: typeof tool;
}): ToolSet;
declare function buildDebugLog(entries: ToolLogEntry[]): ToolDebugLog;
//#endregion
export { AIAdapterOptions, StepBudget, ToolDebugLog, ToolLogEntry, buildDebugLog, toolsToAI };
//# sourceMappingURL=ai-adapter.d.ts.map
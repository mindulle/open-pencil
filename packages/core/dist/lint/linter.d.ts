import { LintConfig, LintResult } from "./types.js";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/lint/linter.d.ts
declare class Linter {
  private rules;
  private ruleConfigs;
  private messages;
  private nodes;
  constructor(options?: {
    config?: LintConfig;
    preset?: string;
    rules?: string[];
  });
  lintGraph(graph: SceneGraph, rootIds?: string[]): LintResult;
  private capture;
  private toLintNode;
  private lintNode;
}
declare function createLinter(options?: {
  config?: LintConfig;
  preset?: string;
  rules?: string[];
}): Linter;
//#endregion
export { Linter, createLinter };
//# sourceMappingURL=linter.d.ts.map
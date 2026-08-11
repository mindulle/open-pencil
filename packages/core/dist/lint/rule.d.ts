import { LintNode, Rule, RuleContext, RuleMeta } from "./types.js";

//#region src/lint/rule.d.ts
declare function defineRule(definition: {
  meta: Omit<RuleMeta, 'severity'> & {
    severity?: RuleMeta['severity'];
  };
  match?: string[];
  check: (node: LintNode, context: RuleContext) => void;
}): Rule;
//#endregion
export { defineRule };
//# sourceMappingURL=rule.d.ts.map
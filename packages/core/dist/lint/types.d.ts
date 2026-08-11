//#region src/lint/types.d.ts
type Severity = 'error' | 'warning' | 'info' | 'off';
type Category = 'layout' | 'accessibility' | 'naming' | 'structure' | 'components' | 'design-tokens' | 'typography';
interface RuleMeta {
  id: string;
  severity: Severity;
  category: Category;
  description: string;
}
interface LintMessage {
  ruleId: string;
  severity: Exclude<Severity, 'off'>;
  message: string;
  nodeId: string;
  nodeName: string;
  nodePath: string[];
  suggest?: string;
}
interface LintResult {
  messages: LintMessage[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
}
interface LintConfig {
  extends?: string | string[];
  rules: Record<string, Severity | {
    severity: Severity;
    options?: Record<string, unknown>;
  }>;
}
interface LintNode {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  layoutMode: string;
  itemSpacing: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  cornerRadius: number;
  childIds: string[];
  componentId?: string;
  text: string;
  fontSize: number;
  styleRunCount: number;
  boundVariables: Record<string, string>;
  fills: Array<{
    type: string;
    visible: boolean;
    opacity: number;
    color?: {
      r: number;
      g: number;
      b: number;
    };
  }>;
  strokes: Array<{
    visible: boolean;
    opacity: number;
    color?: {
      r: number;
      g: number;
      b: number;
    };
  }>;
  effects: Array<{
    type: string;
    visible: boolean;
    radius: number;
  }>;
  parent?: LintNode;
}
interface RuleContext {
  report(issue: {
    node: LintNode;
    message: string;
    suggest?: string;
  }): void;
  getConfig(): unknown;
  getParent(node: LintNode): LintNode | null;
  getChildren(node: LintNode): LintNode[];
}
interface Rule {
  meta: RuleMeta;
  match?: string[];
  check(node: LintNode, context: RuleContext): void;
}
//#endregion
export { Category, LintConfig, LintMessage, LintNode, LintResult, Rule, RuleContext, RuleMeta, Severity };
//# sourceMappingURL=types.d.ts.map
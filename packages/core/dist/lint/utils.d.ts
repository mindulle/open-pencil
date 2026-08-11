//#region src/lint/utils.d.ts
declare function isDefaultName(name: string): boolean;
declare function isMultipleOf(value: number, base: number, tolerance?: number): boolean;
interface LintPathNode {
  name: string;
  parent?: LintPathNode;
}
declare function getNodePath(node: LintPathNode): string[];
declare function relativeLuminance(rgb: {
  r: number;
  g: number;
  b: number;
}): number;
declare function contrastRatio(a: {
  r: number;
  g: number;
  b: number;
}, b: {
  r: number;
  g: number;
  b: number;
}): number;
declare const SPACING_SCALE: number[];
//#endregion
export { SPACING_SCALE, contrastRatio, getNodePath, isDefaultName, isMultipleOf, relativeLuminance };
//# sourceMappingURL=utils.d.ts.map
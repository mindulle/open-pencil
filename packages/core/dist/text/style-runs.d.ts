import { CharacterStyleOverride, StyleRun, TextDecoration } from "@open-pencil/scene-graph";

//#region src/text/style-runs.d.ts
declare function getStyleAt(runs: StyleRun[], index: number): CharacterStyleOverride;
declare function applyStyleToRange(runs: StyleRun[], start: number, end: number, patch: CharacterStyleOverride, textLength: number): StyleRun[];
declare function removeStyleFromRange(runs: StyleRun[], start: number, end: number, keys: (keyof CharacterStyleOverride)[], textLength: number): StyleRun[];
declare function selectionHasStyle(runs: StyleRun[], start: number, end: number, key: keyof CharacterStyleOverride, value: unknown): boolean;
declare function adjustRunsForInsert(runs: StyleRun[], pos: number, insertLength: number): StyleRun[];
declare function adjustRunsForDelete(runs: StyleRun[], start: number, deleteLength: number): StyleRun[];
declare function toggleBoldInRange(runs: StyleRun[], start: number, end: number, nodeWeight: number, textLength: number): {
  runs: StyleRun[];
  newWeight: number;
};
declare function toggleItalicInRange(runs: StyleRun[], start: number, end: number, nodeItalic: boolean, textLength: number): {
  runs: StyleRun[];
  newItalic: boolean;
};
declare function toggleDecorationInRange(runs: StyleRun[], start: number, end: number, deco: TextDecoration, nodeDeco: TextDecoration, textLength: number): {
  runs: StyleRun[];
  newDeco: TextDecoration;
};
//#endregion
export { adjustRunsForDelete, adjustRunsForInsert, applyStyleToRange, getStyleAt, removeStyleFromRange, selectionHasStyle, toggleBoldInRange, toggleDecorationInRange, toggleItalicInRange };
//# sourceMappingURL=style-runs.d.ts.map
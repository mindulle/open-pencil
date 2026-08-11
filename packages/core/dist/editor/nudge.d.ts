import { EditorContext } from "./types.js";

//#region src/editor/nudge.d.ts
declare function createNudgeActions(ctx: EditorContext): {
  nudgeSelected: (dx: number, dy: number) => void;
  flushNudge: () => void;
};
//#endregion
export { createNudgeActions };
//# sourceMappingURL=nudge.d.ts.map
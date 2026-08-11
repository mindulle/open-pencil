import { EditorContext } from "../types.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/selection/hit-test.d.ts
declare function createSelectionHitTestActions(ctx: EditorContext, select: (ids: string[], additive?: boolean) => void, clearSelection: () => void): {
  hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => SceneNode | null;
  selectAtPoint: (cx: number, cy: number) => void;
};
//#endregion
export { createSelectionHitTestActions };
//# sourceMappingURL=hit-test.d.ts.map
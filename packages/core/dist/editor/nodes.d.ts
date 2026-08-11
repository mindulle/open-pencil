import { EditorContext } from "./types.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/nodes.d.ts
declare function opacityFromBuffer(buffer: string): number;
declare function createNodeActions(ctx: EditorContext): {
  nudgeSelected: (dx: number, dy: number) => void;
  flushNudge: () => void;
  bindVariable: (nodeId: string, path: string, variableId: string) => void;
  unbindVariable: (nodeId: string, path: string) => void;
  setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
  updateNode: (id: string, changes: Partial<SceneNode>) => void;
  updateNodeWithUndo: (id: string, changes: Partial<SceneNode>, label?: string) => void;
  setOpacity: (opacity: number, coalesceKey?: string) => void;
};
//#endregion
export { createNodeActions, opacityFromBuffer };
//# sourceMappingURL=nodes.d.ts.map
import { createSelectionActions } from "../selection.js";
import { PageSnapshot } from "../history/snapshot.js";
import { createUndoActions } from "../undo.js";

//#region src/editor/bridges/undo.d.ts
type SelectionActions = ReturnType<typeof createSelectionActions>;
type UndoActions = ReturnType<typeof createUndoActions>;
declare function createUndoBridge(undoActions: UndoActions, selection: SelectionActions): {
  commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
  commitMoveWithReparent: (originals: Map<string, {
    x: number;
    y: number;
    parentId: string;
  }>) => void;
  commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
  commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<import("@open-pencil/scene-graph").SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
  commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
    x: number;
    y: number;
    width: number;
    height: number;
    vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
    fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
  }>) => void;
  commitRotation: (nodeId: string, origRotation: number) => void;
  commitNodeUpdate: (nodeId: string, previous: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
  undoAction: () => void;
  redoAction: () => void;
  snapshotPage: () => PageSnapshot;
  restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
  pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
};
//#endregion
export { createUndoBridge };
//# sourceMappingURL=undo.d.ts.map
import { EditorContext } from "./types.js";
import { PageSnapshot } from "./history/snapshot.js";
import { SceneNode } from "@open-pencil/scene-graph";
import { UndoEntry } from "@open-pencil/scene-graph/undo";
import { Rect, Vector as Vector$1 } from "@open-pencil/scene-graph/primitives";

//#region src/editor/undo.d.ts
type ResizeSnapshot = Pick<SceneNode, 'x' | 'y' | 'width' | 'height' | 'vectorNetwork' | 'fillGeometry' | 'strokeGeometry'>;
type ResizeOriginal = Rect & Partial<Pick<SceneNode, 'vectorNetwork' | 'fillGeometry' | 'strokeGeometry'>>;
declare function createUndoActions(ctx: EditorContext): {
  commitMove: (originals: Map<string, Vector$1>) => void;
  commitMoveWithReparent: (originals: Map<string, {
    x: number;
    y: number;
    parentId: string;
  }>) => void;
  commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
  commitResize: (nodeId: string, original: ResizeOriginal) => void;
  commitGroupResize: (nodeId: string, origRect: Rect, origChildren: Map<string, ResizeSnapshot>) => void;
  commitRotation: (nodeId: string, origRotation: number) => void;
  commitNodeUpdate: (nodeId: string, previous: Partial<SceneNode>, label?: string) => void;
  undoAction: (validateEnteredContainer: () => void) => void;
  redoAction: (validateEnteredContainer: () => void) => void;
  snapshotPage: () => PageSnapshot;
  restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
  pushUndoEntry: (entry: UndoEntry) => void;
};
//#endregion
export { createUndoActions };
//# sourceMappingURL=undo.d.ts.map
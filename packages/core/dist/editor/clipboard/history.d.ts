import { EditorContext } from "../types.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/clipboard/history.d.ts
type DeletedEntry = {
  id: string;
  parentId: string;
  index: number;
  subtree: Map<string, SceneNode>;
};
declare function recreateSnapshots(ctx: EditorContext, snapshots: SceneNode[], pageId: string): void;
declare function deleteIds(ctx: EditorContext, ids: string[]): void;
declare function restoreDeletedEntries(ctx: EditorContext, entries: DeletedEntry[]): void;
//#endregion
export { DeletedEntry, deleteIds, recreateSnapshots, restoreDeletedEntries };
//# sourceMappingURL=history.d.ts.map
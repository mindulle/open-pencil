import { EditorContext } from "../types.js";
import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/history/snapshot.d.ts
type PageSnapshot = Map<string, SceneNode>;
declare function snapshotPage(graph: SceneGraph, pageId: string): PageSnapshot;
declare function restorePageFromSnapshot(ctx: EditorContext, snapshot: PageSnapshot): void;
//#endregion
export { PageSnapshot, restorePageFromSnapshot, snapshotPage };
//# sourceMappingURL=snapshot.d.ts.map
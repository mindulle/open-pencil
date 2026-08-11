import { InstanceNodeChange } from "@open-pencil/fig/instance-overrides";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/kiwi/fig/lazy-import.d.ts
interface LazyFigImportContext {
  changeMap: Map<string, InstanceNodeChange>;
  guidToNodeId: Map<string, string>;
  blobs: Uint8Array[];
  populatedRootIds: Set<string>;
}
declare function setLazyFigImportContext(graph: SceneGraph, context: LazyFigImportContext): void;
declare function getLazyFigImportContext(graph: SceneGraph): LazyFigImportContext | undefined;
declare function populateLazyFigImportRoots(graph: SceneGraph, rootIds: Iterable<string>): boolean;
declare function populateAllLazyFigImportRoots(graph: SceneGraph): boolean;
//#endregion
export { LazyFigImportContext, getLazyFigImportContext, populateAllLazyFigImportRoots, populateLazyFigImportRoots, setLazyFigImportContext };
//# sourceMappingURL=lazy-import.d.ts.map
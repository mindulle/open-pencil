import { NodeChange } from "@open-pencil/kiwi/fig/codec";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/kiwi/fig/import.d.ts
interface FigImportOptions {
  populate?: 'all' | 'first-page' | 'none';
}
declare function importNodeChanges(nodeChanges: NodeChange[], blobs?: Uint8Array[], images?: Map<string, Uint8Array>, options?: FigImportOptions): SceneGraph;
//#endregion
export { FigImportOptions, importNodeChanges };
//# sourceMappingURL=import.d.ts.map
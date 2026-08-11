import { InstanceNodeChange } from "@open-pencil/fig/instance-overrides";
import { DocumentColorSpace, SceneGraph, SceneNode, Variable, VariableCollection } from "@open-pencil/scene-graph";

//#region src/kiwi/fig/parse/transfer.d.ts
interface SerializedLazyFigImportContext {
  changeMap: Array<[string, InstanceNodeChange]>;
  guidToNodeId: Array<[string, string]>;
  blobs: Uint8Array[];
  populatedRootIds: string[];
}
interface SerializedSceneGraph {
  rootId: string;
  nodes: Array<[string, SceneNode]>;
  images: Array<[string, Uint8Array]>;
  variables: Array<[string, Variable]>;
  variableCollections: Array<[string, VariableCollection]>;
  activeMode: Array<[string, string]>;
  instanceIndex: Array<[string, string[]]>;
  figKiwiVersion: number | null;
  figSchemaDeflated: Uint8Array | null;
  documentColorSpace: DocumentColorSpace;
  lazyFigImport?: SerializedLazyFigImportContext;
}
declare function serializeSceneGraph(graph: SceneGraph): SerializedSceneGraph;
declare function serializedSceneGraphTransferList(data: SerializedSceneGraph): Transferable[];
declare function deserializeSceneGraph(data: SerializedSceneGraph): SceneGraph;
//#endregion
export { SerializedLazyFigImportContext, SerializedSceneGraph, deserializeSceneGraph, serializeSceneGraph, serializedSceneGraphTransferList };
//# sourceMappingURL=transfer.d.ts.map
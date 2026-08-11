import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/editor/graph-reads.d.ts
declare function createGraphReadActions(getGraph: () => SceneGraph): {
  getNode: (id: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
  getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
  getChildren: (id: string) => import("@open-pencil/scene-graph").SceneNode[];
  getPages: (includeInternal?: boolean) => import("@open-pencil/scene-graph").SceneNode[];
};
//#endregion
export { createGraphReadActions };
//# sourceMappingURL=graph-reads.d.ts.map
import { SkiaRenderer } from "../canvas/renderer.js";
import { SceneGraph, SceneGraphEvents, SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/graph-events.d.ts
type EmittedGraphEventName = Exclude<keyof SceneGraphEvents, 'node:previewUpdated'>;
type GraphEventOptions = {
  getGraph: () => SceneGraph;
  getRenderers: () => Iterable<SkiaRenderer>;
  scheduleComponentSync: (nodeId: string) => void;
  requestRender: () => void;
  emitEditorEvent: <K extends EmittedGraphEventName>(event: K, ...args: Parameters<SceneGraphEvents[K]>) => void;
};
type RendererInvalidation = {
  geometryCache: boolean;
  nodePicture: boolean;
};
declare function rendererInvalidationForChanges(changes: Partial<SceneNode>, options: {
  preview: boolean;
}): RendererInvalidation;
declare function createGraphEventSubscription(options: GraphEventOptions): {
  subscribeToGraph: () => void;
};
//#endregion
export { RendererInvalidation, createGraphEventSubscription, rendererInvalidationForChanges };
//# sourceMappingURL=graph-events.d.ts.map
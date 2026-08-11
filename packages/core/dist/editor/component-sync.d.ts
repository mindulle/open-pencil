import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/editor/component-sync.d.ts
declare function createComponentSyncScheduler(getGraph: () => SceneGraph, requestRender: () => void): {
  scheduleComponentSync: (nodeId: string) => void;
};
//#endregion
export { createComponentSyncScheduler };
//# sourceMappingURL=component-sync.d.ts.map
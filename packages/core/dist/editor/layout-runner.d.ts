import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/editor/layout-runner.d.ts
declare function createLayoutRunner(getGraph: () => SceneGraph): {
  runLayoutForNode: (id: string) => void;
};
//#endregion
export { createLayoutRunner };
//# sourceMappingURL=layout-runner.d.ts.map
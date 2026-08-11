import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";
import { Node } from "yoga-layout";

//#region src/layout/apply.d.ts
type ComputeLayoutFn = (graph: SceneGraph, frameId: string) => void;
declare function applyYogaLayout(graph: SceneGraph, frame: SceneNode, yogaNode: Node, computeLayout: ComputeLayoutFn): void;
//#endregion
export { ComputeLayoutFn, applyYogaLayout };
//# sourceMappingURL=apply.d.ts.map
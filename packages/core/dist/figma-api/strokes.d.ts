import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/figma-api/strokes.d.ts
declare function setFirstStrokeWeight(graph: SceneGraph, node: SceneNode, weight: number): void;
declare function setFirstStrokeAlign(graph: SceneGraph, node: SceneNode, align: string): void;
declare function setIndependentStrokeWeight(graph: SceneGraph, nodeId: string, field: 'borderTopWeight' | 'borderRightWeight' | 'borderBottomWeight' | 'borderLeftWeight', value: number): void;
//#endregion
export { setFirstStrokeAlign, setFirstStrokeWeight, setIndependentStrokeWeight };
//# sourceMappingURL=strokes.d.ts.map
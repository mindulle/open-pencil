import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/tools/describe/summaries.d.ts
declare function describeVisual(node: SceneNode, graph?: SceneGraph): string;
declare function describeLayout(node: SceneNode): string | null;
declare function summarizeContainer(node: SceneNode, graph?: SceneGraph): string;
declare function summarizeText(node: SceneNode, graph?: SceneGraph): string;
//#endregion
export { describeLayout, describeVisual, summarizeContainer, summarizeText };
//# sourceMappingURL=summaries.d.ts.map
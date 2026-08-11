import { TextMeasurer, estimateTextSize, getTextMeasurer, setTextMeasurer } from "./layout/text-measurement.js";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/layout.d.ts
declare function computeLayout(graph: SceneGraph, frameId: string): void;
declare function computeAllLayouts(graph: SceneGraph, scopeId?: string): void;
//#endregion
export { type TextMeasurer, computeAllLayouts, computeLayout, estimateTextSize, getTextMeasurer, setTextMeasurer };
//# sourceMappingURL=layout.d.ts.map
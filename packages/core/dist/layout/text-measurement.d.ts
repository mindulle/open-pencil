import { SceneNode } from "@open-pencil/scene-graph";

//#region src/layout/text-measurement.d.ts
type TextMeasurer = (node: SceneNode, maxWidth?: number) => {
  width: number;
  height: number;
} | null;
declare function estimateTextSize(node: SceneNode, maxWidth?: number): {
  width: number;
  height: number;
};
declare function getTextMeasurer(): TextMeasurer | null;
declare function setTextMeasurer(measurer: TextMeasurer | null): void;
//#endregion
export { TextMeasurer, estimateTextSize, getTextMeasurer, setTextMeasurer };
//# sourceMappingURL=text-measurement.d.ts.map
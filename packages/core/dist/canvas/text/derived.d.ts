import { SkiaRenderer } from "../renderer.js";
import { Canvas } from "canvaskit-wasm";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/text/derived.d.ts
declare function snapFigmaDerivedGlyphBaseline(y: number): number;
declare function shouldUseHardFigmaDerivedGlyphCoverage(node: Pick<SceneNode, 'fontSize' | 'fontWeight'>): boolean;
declare function derivedUnderlineRect(node: Pick<SceneNode, 'width'>, baselineY: number): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};
declare function drawFigmaDerivedText(r: SkiaRenderer, canvas: Canvas, node: SceneNode): boolean;
//#endregion
export { derivedUnderlineRect, drawFigmaDerivedText, shouldUseHardFigmaDerivedGlyphCoverage, snapFigmaDerivedGlyphBaseline };
//# sourceMappingURL=derived.d.ts.map
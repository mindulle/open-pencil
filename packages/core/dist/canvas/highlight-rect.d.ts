import { SkiaRenderer } from "./renderer.js";
import { Canvas, Paint } from "canvaskit-wasm";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/canvas/highlight-rect.d.ts
declare function ensureFlashPaint(r: SkiaRenderer): Paint;
declare function drawNodeHighlightRect(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph, nodeId: string, color: {
  r: number;
  g: number;
  b: number;
}, opacity: number, extraPad?: number): boolean;
//#endregion
export { drawNodeHighlightRect, ensureFlashPaint };
//# sourceMappingURL=highlight-rect.d.ts.map
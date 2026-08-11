import { SkiaRenderer } from "./renderer.js";
import { Canvas, CanvasKit } from "canvaskit-wasm";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/canvas/rulers.d.ts
declare function drawRulers(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph, selectedIds: Set<string>): void;
declare function drawRulerBadge(r: SkiaRenderer, canvas: Canvas, font: InstanceType<CanvasKit['Font']>, label: string, x: number, y: number, axis: 'horizontal' | 'vertical'): void;
declare function rulerStep(r: SkiaRenderer): number;
declare function rulerLabel(value: number): string;
//#endregion
export { drawRulerBadge, drawRulers, rulerLabel, rulerStep };
//# sourceMappingURL=rulers.d.ts.map
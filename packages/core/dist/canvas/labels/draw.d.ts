import { SkiaRenderer } from "../renderer.js";
import { Canvas } from "canvaskit-wasm";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/canvas/labels/draw.d.ts
declare function drawSectionTitles(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph): void;
declare function drawComponentLabels(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph): void;
//#endregion
export { drawComponentLabels, drawSectionTitles };
//# sourceMappingURL=draw.d.ts.map
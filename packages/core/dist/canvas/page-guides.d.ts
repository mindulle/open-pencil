import { SkiaRenderer } from "./renderer.js";
import { Canvas } from "canvaskit-wasm";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/canvas/page-guides.d.ts
declare function drawPageGuides(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph): void;
//#endregion
export { drawPageGuides };
//# sourceMappingURL=page-guides.d.ts.map
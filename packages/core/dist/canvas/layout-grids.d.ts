import { SkiaRenderer } from "./renderer.js";
import { Canvas } from "canvaskit-wasm";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/layout-grids.d.ts
declare function drawLayoutGrids(r: SkiaRenderer, canvas: Canvas, node: SceneNode): void;
//#endregion
export { drawLayoutGrids };
//# sourceMappingURL=layout-grids.d.ts.map
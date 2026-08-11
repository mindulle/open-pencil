import { SkiaRenderer } from "../renderer.js";
import { Canvas } from "canvaskit-wasm";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/canvas/overlays/ai.d.ts
declare function drawAIOverlays(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph): void;
//#endregion
export { drawAIOverlays };
//# sourceMappingURL=ai.d.ts.map
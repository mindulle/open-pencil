import { RenderOverlays } from "./renderer/types.js";
import { SkiaRenderer } from "./renderer.js";
import { Canvas } from "canvaskit-wasm";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/canvas/pen-overlay.d.ts
declare function drawPenOverlay(r: SkiaRenderer, canvas: Canvas, penState: RenderOverlays['penState']): void;
declare function drawRemoteCursors(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph, cursors?: RenderOverlays['remoteCursors']): void;
//#endregion
export { drawPenOverlay, drawRemoteCursors };
//# sourceMappingURL=pen-overlay.d.ts.map
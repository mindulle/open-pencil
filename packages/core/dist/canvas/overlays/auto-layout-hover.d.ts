import { RenderOverlays } from "../renderer/types.js";
import { SkiaRenderer } from "../renderer.js";
import { Canvas } from "canvaskit-wasm";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/canvas/overlays/auto-layout-hover.d.ts
declare function drawAutoLayoutHover(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph, hover?: RenderOverlays['autoLayoutHover']): void;
//#endregion
export { drawAutoLayoutHover };
//# sourceMappingURL=auto-layout-hover.d.ts.map
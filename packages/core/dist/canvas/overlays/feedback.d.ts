import { RenderOverlays } from "../renderer/types.js";
import { SkiaRenderer } from "../renderer.js";
import { Canvas } from "canvaskit-wasm";
import { SceneGraph } from "@open-pencil/scene-graph";
import { SnapGuide } from "@open-pencil/scene-graph/snap";
import { Rect } from "@open-pencil/scene-graph/primitives";

//#region src/canvas/overlays/feedback.d.ts
declare function drawSnapGuides(r: SkiaRenderer, canvas: Canvas, guides?: SnapGuide[]): void;
declare function drawMarquee(r: SkiaRenderer, canvas: Canvas, marquee?: Rect | null): void;
declare function drawFlashes(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph): void;
declare function drawLayoutInsertIndicator(r: SkiaRenderer, canvas: Canvas, indicator?: RenderOverlays['layoutInsertIndicator']): void;
//#endregion
export { drawFlashes, drawLayoutInsertIndicator, drawMarquee, drawSnapGuides };
//# sourceMappingURL=feedback.d.ts.map
import { RenderOverlays } from "../renderer/types.js";
import { SkiaRenderer } from "../renderer.js";
import { Canvas } from "canvaskit-wasm";
import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/labels/selection.d.ts
declare function drawSingleSelectionSize(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph, node: SceneNode, overlays: RenderOverlays, sizeFont: NonNullable<SkiaRenderer['sizeFont']>): void;
declare function drawSelectionLabels(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph, selectedIds: Set<string>, overlays?: RenderOverlays): void;
//#endregion
export { drawSelectionLabels, drawSingleSelectionSize };
//# sourceMappingURL=selection.d.ts.map
import { RenderOverlays } from "./types.js";
import { EditorState } from "../../editor/types.js";
import { SkiaRenderer } from "../renderer.js";
import { Canvas } from "canvaskit-wasm";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/canvas/renderer/pipeline.d.ts
declare function renderSceneToCanvas(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph, pageId: string): void;
type RenderLayer = 'full' | 'scene' | 'overlays';
declare function renderFromEditorState(r: SkiaRenderer, state: EditorState, graph: SceneGraph, textEditor: unknown, viewportWidth: number, viewportHeight: number, showRulers?: boolean, dpr?: number, layer?: RenderLayer): void;
declare function render(r: SkiaRenderer, graph: SceneGraph, selectedIds: Set<string>, overlays?: RenderOverlays, sceneVersion?: number, layer?: RenderLayer): void;
//#endregion
export { RenderLayer, render, renderFromEditorState, renderSceneToCanvas };
//# sourceMappingURL=pipeline.d.ts.map
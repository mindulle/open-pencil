import { RenderLayer } from "./pipeline.js";
import { SkiaRenderer } from "../renderer.js";
import { Canvas } from "canvaskit-wasm";
import { SceneGraph } from "@open-pencil/scene-graph";
import { VisualBounds } from "@open-pencil/scene-graph/geometry";

//#region src/canvas/renderer/retained-backing.d.ts
declare function updateSceneBackingPreviewState(r: SkiaRenderer, layer: RenderLayer): void;
/**
 * Retained pictures are recorded in world coordinates, so their recording bounds must account for
 * the complete ancestor transform chain. The regular visual-bounds helper intentionally accepts
 * only an absolute origin and a node-local rotation; that is insufficient for descendants of
 * reflected or rotated instances and can clip otherwise valid draw commands from the picture.
 */
declare function computeRetainedSubtreeBounds(graph: SceneGraph, childId: string): VisualBounds | null;
declare function renderSceneBacking(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph, sceneVersion: number): boolean;
//#endregion
export { computeRetainedSubtreeBounds, renderSceneBacking, updateSceneBackingPreviewState };
//# sourceMappingURL=retained-backing.d.ts.map
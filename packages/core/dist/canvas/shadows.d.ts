import { SkiaRenderer } from "./renderer.js";
import { Canvas } from "canvaskit-wasm";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/shadows.d.ts
declare function renderEffects(r: SkiaRenderer, canvas: Canvas, node: SceneNode, rect: Float32Array, hasRadius: boolean, pass: 'behind' | 'front', shadowShapeChild?: SceneNode | null): void;
//#endregion
export { renderEffects };
//# sourceMappingURL=shadows.d.ts.map
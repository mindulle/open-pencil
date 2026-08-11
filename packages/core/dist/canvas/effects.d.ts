import { SkiaRenderer } from "./renderer.js";
import { Canvas, ImageFilter, MaskFilter } from "canvaskit-wasm";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/effects.d.ts
declare function getCachedDropShadow(r: SkiaRenderer, dx: number, dy: number, sigma: number, color: Float32Array): ImageFilter;
declare function getCachedBlur(r: SkiaRenderer, sigma: number): ImageFilter;
declare function getCachedDecalBlur(r: SkiaRenderer, sigma: number): ImageFilter;
declare function getCachedMaskBlur(r: SkiaRenderer, sigma: number): MaskFilter;
declare function applyClippedBlur(r: SkiaRenderer, canvas: Canvas, node: SceneNode, rect: Float32Array, hasRadius: boolean, sigma: number): void;
//#endregion
export { applyClippedBlur, getCachedBlur, getCachedDecalBlur, getCachedDropShadow, getCachedMaskBlur };
//# sourceMappingURL=effects.d.ts.map
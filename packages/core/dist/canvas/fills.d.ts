import { SkiaRenderer } from "./renderer.js";
import { Canvas, Paint } from "canvaskit-wasm";
import { Fill, SceneGraph, SceneNode } from "@open-pencil/scene-graph";
import { Rect, Vector as Vector$1 } from "@open-pencil/scene-graph/primitives";

//#region src/canvas/fills.d.ts
interface PaintFillsOptions {
  readonly bindToNodeFills?: boolean;
  readonly patternStack?: Set<string>;
}
declare function paintFills(r: SkiaRenderer, fills: readonly Fill[], node: SceneNode, graph: SceneGraph, draw: (fill: Fill) => void, options?: PaintFillsOptions): void;
declare function drawVectorMultiStyleFills(r: SkiaRenderer, canvas: Canvas, node: SceneNode, graph: SceneGraph, patternStack?: Set<string>): boolean;
declare function drawNodeFill(r: SkiaRenderer, canvas: Canvas, node: SceneNode, rect: Float32Array, hasRadius: boolean, fill?: Fill): void;
declare function applyFill(r: SkiaRenderer, fill: Fill, node: SceneNode, graph: SceneGraph, fillIndex?: number, patternStack?: Set<string>): boolean;
interface PatternTileLayout {
  rect: Rect;
  scale: number;
  positions: Vector$1[];
}
declare function patternTileLayout(source: SceneNode, fill: Fill): PatternTileLayout;
declare function linearGradientEndpoints(width: number, height: number, transform: NonNullable<Fill['gradientTransform']>): {
  start: {
    x: number;
    y: number;
  };
  end: {
    x: number;
    y: number;
  };
};
declare function applyGradientFill(r: SkiaRenderer, fill: Fill, node: SceneNode, graph: SceneGraph): void;
declare function makeImageFillLocalMatrix(r: SkiaRenderer, fill: Fill, node: SceneNode, imgW: number, imgH: number): number[];
declare function applyImageFill(r: SkiaRenderer, fill: Fill, node: SceneNode, graph: SceneGraph): boolean;
declare function makeArcPath(r: SkiaRenderer, node: SceneNode): import("canvaskit-wasm").Path | null;
declare function drawArc(r: SkiaRenderer, canvas: Canvas, node: SceneNode, paint: Paint): void;
//#endregion
export { applyFill, applyGradientFill, applyImageFill, drawArc, drawNodeFill, drawVectorMultiStyleFills, linearGradientEndpoints, makeArcPath, makeImageFillLocalMatrix, paintFills, patternTileLayout };
//# sourceMappingURL=fills.d.ts.map
import { SkiaRenderer } from "./renderer.js";
import { Canvas, Path } from "canvaskit-wasm";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/shapes.d.ts
declare function nodeHasRadius(node: SceneNode): boolean;
declare function nodeHasSmoothCorners(node: SceneNode): boolean;
declare function makeSmoothRRectPath(r: SkiaRenderer, node: SceneNode, spread?: number, offsetX?: number, offsetY?: number): Path;
declare function makeNodeShapePath(r: SkiaRenderer, node: SceneNode, rect: Float32Array, hasRadius: boolean): Path;
declare function makePolygonPath(r: SkiaRenderer, node: SceneNode): Path;
declare function makeRRect(r: SkiaRenderer, node: SceneNode): Float32Array;
declare function makeRRectWithSpread(r: SkiaRenderer, node: SceneNode, spread: number): Float32Array;
declare function makeRRectWithOffset(r: SkiaRenderer, node: SceneNode, ox: number, oy: number, spread: number): Float32Array;
declare function clipNodeShape(r: SkiaRenderer, canvas: Canvas, node: SceneNode, rect: Float32Array, hasRadius: boolean): void;
declare function getVectorPaths(r: SkiaRenderer, node: SceneNode): Path[] | null;
declare function getFillGeometry(r: SkiaRenderer, node: SceneNode): Path[] | null;
declare function getStrokeGeometry(r: SkiaRenderer, node: SceneNode): Path[] | null;
//#endregion
export { clipNodeShape, getFillGeometry, getStrokeGeometry, getVectorPaths, makeNodeShapePath, makePolygonPath, makeRRect, makeRRectWithOffset, makeRRectWithSpread, makeSmoothRRectPath, nodeHasRadius, nodeHasSmoothCorners };
//# sourceMappingURL=shapes.d.ts.map
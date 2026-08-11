import { SkiaRenderer } from "./renderer.js";
import { Canvas, EmbindEnumEntity, Paint } from "canvaskit-wasm";
import { SceneNode, Stroke } from "@open-pencil/scene-graph";
import { Color as Color$1 } from "@open-pencil/scene-graph/primitives";

//#region src/canvas/strokes.d.ts
declare function getStrokeCapEntity(r: SkiaRenderer, cap: string | undefined): EmbindEnumEntity;
declare function getStrokeJoinEntity(r: SkiaRenderer, join: string | undefined): EmbindEnumEntity;
declare function drawDashedRRectWithSolidCorners(r: SkiaRenderer, canvas: Canvas, node: SceneNode, stroke: Stroke, color: Color$1, cornerRadius: number, dashPhase?: number): void;
declare function configureStrokePaint(r: SkiaRenderer, node: SceneNode, stroke: Stroke, color: Color$1): void;
declare function drawStyledRRectStroke(r: SkiaRenderer, canvas: Canvas, rrect: Float32Array, node: SceneNode, stroke: Stroke, color: Color$1, dashPhase?: number): void;
declare function drawNodeStroke(r: SkiaRenderer, canvas: Canvas, node: SceneNode, rect: Float32Array, hasRadius: boolean): void;
declare function drawStrokeWithAlign(r: SkiaRenderer, canvas: Canvas, node: SceneNode, rect: Float32Array, hasRadius: boolean, align: 'INSIDE' | 'CENTER' | 'OUTSIDE'): void;
declare function drawRRectStrokeWithAlign(r: SkiaRenderer, canvas: Canvas, rrect: Float32Array, node: SceneNode, stroke: Stroke): void;
declare function drawIndividualSideStrokes(r: SkiaRenderer, canvas: Canvas, node: SceneNode, align: 'INSIDE' | 'CENTER' | 'OUTSIDE'): void;
declare function strokeNodeShape(r: SkiaRenderer, canvas: Canvas, node: SceneNode, paint: Paint): void;
//#endregion
export { configureStrokePaint, drawDashedRRectWithSolidCorners, drawIndividualSideStrokes, drawNodeStroke, drawRRectStrokeWithAlign, drawStrokeWithAlign, drawStyledRRectStroke, getStrokeCapEntity, getStrokeJoinEntity, strokeNodeShape };
//# sourceMappingURL=strokes.d.ts.map
import { SkiaRenderer } from "./renderer.js";
import { Canvas, Path } from "canvaskit-wasm";
import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/boolean.d.ts
declare function nodePathTransform(r: SkiaRenderer, child: SceneNode): number[];
declare function canMakeBooleanSourcePath(node: SceneNode): boolean;
declare function canMakeBooleanSourceNode(node: SceneNode, graph: SceneGraph): boolean;
declare function nodeHasVisibleStroke(node: SceneNode): boolean;
declare function makeBooleanSourcePath(r: SkiaRenderer, node: SceneNode, graph: SceneGraph): Path | null;
declare function hasVisibleStrokeSourceNode(node: SceneNode, graph: SceneGraph): boolean;
declare function makeStrokeOutlinePath(r: SkiaRenderer, node: SceneNode, graph: SceneGraph): Path | null;
declare function makeBooleanOperationPath(r: SkiaRenderer, node: SceneNode, graph: SceneGraph): Path | null;
declare function renderBooleanOperation(r: SkiaRenderer, canvas: Canvas, node: SceneNode, graph: SceneGraph): void;
//#endregion
export { canMakeBooleanSourceNode, canMakeBooleanSourcePath, hasVisibleStrokeSourceNode, makeBooleanOperationPath, makeBooleanSourcePath, makeStrokeOutlinePath, nodeHasVisibleStroke, nodePathTransform, renderBooleanOperation };
//# sourceMappingURL=boolean.d.ts.map
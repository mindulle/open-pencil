import { RenderOverlays } from "./renderer/types.js";
import { SkiaRenderer } from "./renderer.js";
import { Canvas } from "canvaskit-wasm";
import { Fill, SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/scene.d.ts
declare function renderNode(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph, nodeId: string, overlays: RenderOverlays, parentAbsX?: number, parentAbsY?: number, hasTransformedAncestor?: boolean): void;
declare function renderSection(r: SkiaRenderer, canvas: Canvas, node: SceneNode, graph: SceneGraph): void;
declare function renderComponentSet(r: SkiaRenderer, canvas: Canvas, node: SceneNode, graph: SceneGraph): void;
declare function renderShape(r: SkiaRenderer, canvas: Canvas, node: SceneNode, graph: SceneGraph): void;
declare function renderShapeUncached(r: SkiaRenderer, canvas: Canvas, node: SceneNode, graph: SceneGraph): void;
declare function textVerticalOffset(node: SceneNode, contentHeight: number): number;
declare function renderText(r: SkiaRenderer, canvas: Canvas, node: SceneNode, fill?: Fill): void;
//#endregion
export { renderComponentSet, renderNode, renderSection, renderShape, renderShapeUncached, renderText, textVerticalOffset };
//# sourceMappingURL=scene.d.ts.map
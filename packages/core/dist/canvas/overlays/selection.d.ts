import { RenderOverlays } from "../renderer/types.js";
import { SkiaRenderer } from "../renderer.js";
import { Canvas } from "canvaskit-wasm";
import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";
import { Vector as Vector$1 } from "@open-pencil/scene-graph/primitives";

//#region src/canvas/overlays/selection.d.ts
declare function drawHoverHighlight(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph, hoveredNodeId?: string | null): void;
declare function drawEnteredContainer(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph, enteredContainerId?: string | null): void;
declare function drawSelection(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph, selectedIds: Set<string>, overlays: RenderOverlays): void;
declare function drawNodeSelection(r: SkiaRenderer, canvas: Canvas, node: SceneNode, rotation: number, graph: SceneGraph): void;
declare function drawParentFrameOutlines(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph, selectedIds: Set<string>): void;
declare function drawNodeOutline(r: SkiaRenderer, canvas: Canvas, node: SceneNode, rotation: number, graph: SceneGraph): void;
declare function drawGroupBounds(r: SkiaRenderer, canvas: Canvas, nodes: SceneNode[], graph: SceneGraph): void;
declare function getRotatedCorners(r: SkiaRenderer, n: SceneNode, abs: Vector$1): Vector$1[];
declare function drawHandle(r: SkiaRenderer, canvas: Canvas, x: number, y: number): void;
//#endregion
export { drawEnteredContainer, drawGroupBounds, drawHandle, drawHoverHighlight, drawNodeOutline, drawNodeSelection, drawParentFrameOutlines, drawSelection, getRotatedCorners };
//# sourceMappingURL=selection.d.ts.map
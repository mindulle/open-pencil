import { ResolvedRenderColor } from "../../color/management.js";
import { Fill, SceneGraph, SceneNode, Stroke } from "@open-pencil/scene-graph";
import { Color as Color$1 } from "@open-pencil/scene-graph/primitives";

//#region src/canvas/renderer/colors.d.ts
declare function resolveFillColorInfo(fill: Fill, fillIndex: number, node: SceneNode, graph: SceneGraph): ResolvedRenderColor;
declare function resolveFillColor(fill: Fill, fillIndex: number, node: SceneNode, graph: SceneGraph): Color$1;
declare function resolveStrokeColorInfo(stroke: Stroke, strokeIndex: number, node: SceneNode, graph: SceneGraph): ResolvedRenderColor;
declare function resolveStrokeColor(stroke: Stroke, strokeIndex: number, node: SceneNode, graph: SceneGraph): Color$1;
//#endregion
export { resolveFillColor, resolveFillColorInfo, resolveStrokeColor, resolveStrokeColorInfo };
//# sourceMappingURL=colors.d.ts.map
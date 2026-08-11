import { RenderColorSpace } from "../../../color/management.js";
import { SVGNode } from "./node.js";
import { Effect, Fill, SceneGraph, SceneNode } from "@open-pencil/scene-graph";
import { Color as Color$1 } from "@open-pencil/scene-graph/primitives";

//#region src/io/formats/svg/defs.d.ts
interface SVGExportContext {
  defs: SVGNode[];
  defIdCounter: number;
  graph: SceneGraph;
  colorSpace: RenderColorSpace;
}
declare function nextDefId(ctx: SVGExportContext, prefix: string): string;
declare function formatColor(color: Color$1, opacity?: number, colorSpace?: RenderColorSpace): string;
declare function createFilterDef(effects: Effect[], ctx: SVGExportContext): {
  id: string;
  node: SVGNode;
} | null;
declare function resolveFill(fill: Fill, node: SceneNode, ctx: SVGExportContext): string | null;
declare const SVG_STROKE_CAP: Record<string, string>;
declare const SVG_STROKE_JOIN: Record<string, string>;
declare const SVG_BLEND_MODE: Record<string, string>;
//#endregion
export { SVGExportContext, SVG_BLEND_MODE, SVG_STROKE_CAP, SVG_STROKE_JOIN, createFilterDef, formatColor, nextDefId, resolveFill };
//# sourceMappingURL=defs.d.ts.map
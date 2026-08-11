import { OkHCLColor } from "./okhcl.js";
import { DocumentColorSpace, Fill, SceneNode, Stroke } from "@open-pencil/scene-graph";
import { Color as Color$1 } from "@open-pencil/scene-graph/primitives";

//#region src/color/management.d.ts
type RenderColorSpace = 'srgb' | 'display-p3';
type ColorIntentSpace = 'oklch' | 'srgb';
interface ColorPreviewOptions {
  colorSpace?: RenderColorSpace;
  documentColorSpace?: DocumentColorSpace;
}
interface ResolvedRenderColor {
  color: Color$1;
  cssColor: string;
  sourceSpace: ColorIntentSpace;
  targetSpace: RenderColorSpace;
  clipped: boolean;
}
declare function resolveOkHCLForPreview(color: OkHCLColor, options?: ColorPreviewOptions): ResolvedRenderColor;
declare function resolveRGBAForPreview(color: Color$1, options?: ColorPreviewOptions): ResolvedRenderColor;
declare function resolveNodeFillColor(fill: Fill, fillIndex: number, node: SceneNode, options?: ColorPreviewOptions): ResolvedRenderColor;
declare function resolveNodeStrokeColor(stroke: Stroke, strokeIndex: number, node: SceneNode, options?: ColorPreviewOptions): ResolvedRenderColor;
declare function colorToDisplayCSS(color: Color$1, options?: ColorPreviewOptions): string;
declare function getDefaultRenderColorSpace(): RenderColorSpace;
//#endregion
export { ColorIntentSpace, ColorPreviewOptions, RenderColorSpace, ResolvedRenderColor, colorToDisplayCSS, getDefaultRenderColorSpace, resolveNodeFillColor, resolveNodeStrokeColor, resolveOkHCLForPreview, resolveRGBAForPreview };
//# sourceMappingURL=management.d.ts.map
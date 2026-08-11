import { OkHCLColor, OkHCLPayload, clearNodeFillOkHCL, clearNodeStrokeOkHCL, getFillOkHCL, getNodeOkHCLPayloads, getStrokeOkHCL, okhclToRGBA, parseOkHCLPayload, rgbaToOkHCL, serializeOkHCLPayload, setNodeFillOkHCL, setNodeStrokeOkHCL } from "./okhcl.js";
import { ColorIntentSpace, ColorPreviewOptions, RenderColorSpace, ResolvedRenderColor, colorToDisplayCSS, getDefaultRenderColorSpace, resolveNodeFillColor, resolveNodeStrokeColor, resolveOkHCLForPreview, resolveRGBAForPreview } from "./management.js";
import { normalizeColor } from "./normalize.js";
import { Color } from "@open-pencil/scene-graph/primitives";

//#region src/color/index.d.ts
declare function parseColor(input: string): Color;
declare function colorToHex(color: Color): string;
declare function colorToHex8(color: Color, alpha?: number): string;
declare function colorToHexRaw(color: Color): string;
declare function colorToRgba255(color: Color): {
  r: number;
  g: number;
  b: number;
  a: number;
};
declare function colorToCSS(color: Color): string;
declare function colorToCSSCompact(color: Color): string;
declare function rgba255ToColor(r: number, g: number, b: number, a?: number): Color;
declare function colorToFill(color: string | Color): {
  type: "SOLID";
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  opacity: number;
  visible: boolean;
};
declare function colorDistance(c1: Color, c2: Color): number;
//#endregion
export { ColorIntentSpace, ColorPreviewOptions, OkHCLColor, OkHCLPayload, RenderColorSpace, ResolvedRenderColor, clearNodeFillOkHCL, clearNodeStrokeOkHCL, colorDistance, colorToCSS, colorToCSSCompact, colorToDisplayCSS, colorToFill, colorToHex, colorToHex8, colorToHexRaw, colorToRgba255, getDefaultRenderColorSpace, getFillOkHCL, getNodeOkHCLPayloads, getStrokeOkHCL, normalizeColor, okhclToRGBA, parseColor, parseOkHCLPayload, resolveNodeFillColor, resolveNodeStrokeColor, resolveOkHCLForPreview, resolveRGBAForPreview, rgba255ToColor, rgbaToOkHCL, serializeOkHCLPayload, setNodeFillOkHCL, setNodeStrokeOkHCL };
//# sourceMappingURL=index.d.ts.map
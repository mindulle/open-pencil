import { FontResolutionSettled } from "../../text/resolver/types.js";
import { CanvasKit, Paragraph, TextFontFeatures, TextFontVariations, TypefaceFontProvider } from "canvaskit-wasm";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/text/index.d.ts
interface FontReadinessRenderer {
  ck?: CanvasKit;
  fontProvider?: TypefaceFontProvider | null;
  fontsLoaded?: boolean;
  onFontResolutionSettled?: FontResolutionSettled;
  trackFontDemand?: (node: SceneNode, key: string) => void;
}
interface TextRenderer extends FontReadinessRenderer {
  ck: CanvasKit;
  fontProvider: TypefaceFontProvider | null;
  fontsLoaded: boolean;
}
type NodeFontReadiness = 'ready' | 'pending' | 'exhausted';
declare function nodeFontReadiness(r: FontReadinessRenderer, node: SceneNode): NodeFontReadiness;
declare function isNodeFontLoaded(r: FontReadinessRenderer, node: SceneNode): boolean;
declare function measureTextNode(r: TextRenderer, node: SceneNode, maxWidth?: number): {
  width: number;
  height: number;
} | null;
declare function buildTextPicture(r: TextRenderer, node: SceneNode): Uint8Array | null;
declare function textFontVariations(variations: SceneNode['fontVariations'] | undefined): TextFontVariations[] | undefined;
declare function textFontFeatures(features: SceneNode['fontFeatures'] | undefined): TextFontFeatures[] | undefined;
declare function textDecorationStyleValue<T>(ck: {
  DecorationStyle: {
    Solid: T;
    Dotted: T;
    Wavy: T;
  };
}, style: SceneNode['textDecorationStyle'] | undefined): T;
declare function textHeightBehaviorValue<T>(ck: {
  TextHeightBehavior: {
    DisableAll: T;
  };
}, leadingTrim: SceneNode['leadingTrim']): T | undefined;
declare function buildParagraph(r: TextRenderer, node: SceneNode, color?: Float32Array, {
  halfLeading
}?: {
  halfLeading?: boolean;
}): Paragraph;
//#endregion
export { NodeFontReadiness, buildParagraph, buildTextPicture, isNodeFontLoaded, measureTextNode, nodeFontReadiness, textDecorationStyleValue, textFontFeatures, textFontVariations, textHeightBehaviorValue };
//# sourceMappingURL=index.d.ts.map
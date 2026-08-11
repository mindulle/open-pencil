import { SkiaRenderer } from "../renderer.js";
import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/renderer/fonts.d.ts
declare function syncFontGeneration(r: SkiaRenderer): void;
declare function trackFontDemand(r: SkiaRenderer, node: SceneNode, key: string): void;
interface TextPictureGenerationState {
  fontGeneration: number;
  textPictureGenerations: Map<string, {
    data: Uint8Array;
    generation: number;
  }>;
}
declare function isTextPictureCurrent(r: TextPictureGenerationState, node: SceneNode): boolean;
declare function getFontProvider(r: SkiaRenderer): import("canvaskit-wasm").TypefaceFontProvider | null;
declare function loadFonts(r: SkiaRenderer, onFallbackFontsLoaded?: () => void): Promise<void>;
declare function prepareForExport(r: SkiaRenderer, graph: SceneGraph, pageId: string, nodeIds: string[]): Promise<() => void>;
//#endregion
export { getFontProvider, isTextPictureCurrent, loadFonts, prepareForExport, syncFontGeneration, trackFontDemand };
//# sourceMappingURL=fonts.d.ts.map
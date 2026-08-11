import { FontFallbackScript } from "./fallbacks.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/text/coverage.d.ts
declare function fontFallbackScriptForCharacter(char: string, language?: string | null): FontFallbackScript | null;
/**
 * Returns true only when a loaded, parseable primary font is known to miss a script glyph.
 * Unknown coverage is treated as renderable so we do not degrade fonts CanvasKit may handle.
 */
declare function textNeedsFallbackScript(node: SceneNode, script: FontFallbackScript): boolean;
declare function textNeededFallbackScripts(node: SceneNode): FontFallbackScript[];
//#endregion
export { fontFallbackScriptForCharacter, textNeededFallbackScripts, textNeedsFallbackScript };
//# sourceMappingURL=coverage.d.ts.map
//#region src/text/fallbacks.d.ts
type FontFallbackScript = 'cjk' | 'cjk-sc' | 'cjk-tc' | 'cjk-jp' | 'cjk-kr' | 'arabic';
declare function cjkFallbackScriptForLanguage(language: string | null | undefined): Extract<FontFallbackScript, 'cjk-sc' | 'cjk-tc' | 'cjk-jp' | 'cjk-kr'> | null;
interface FontFallbackManifestEntry {
  script: FontFallbackScript;
  localFamilies: string[];
  remoteFamilies: string[];
}
declare const ARABIC_LOCAL_FALLBACK_FAMILIES: string[];
declare const ARABIC_REMOTE_FALLBACK_FAMILIES: string[];
declare function cjkLocalFallbackFamilies(userAgent?: string): string[];
declare function fontFallbackManifest(userAgent?: string): Record<FontFallbackScript, FontFallbackManifestEntry>;
declare function fontFallbackEntry(script: FontFallbackScript, userAgent?: string): FontFallbackManifestEntry;
//#endregion
export { ARABIC_LOCAL_FALLBACK_FAMILIES, ARABIC_REMOTE_FALLBACK_FAMILIES, FontFallbackManifestEntry, FontFallbackScript, cjkFallbackScriptForLanguage, cjkLocalFallbackFamilies, fontFallbackEntry, fontFallbackManifest };
//# sourceMappingURL=fallbacks.d.ts.map
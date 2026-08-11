import { FontFallbackScript } from "../fallbacks.js";
import { FontCandidateSource, FontResolutionCandidate, FontResolutionDemand, FontResolutionLoader, FontResolutionSettled, FontResolutionSnapshot, FontResolutionState } from "./types.js";
import { FontResolver } from "./resolver.js";
import { ObservedShapedLine, missingGlyphCharacters, missingGlyphScripts } from "./coverage.js";

//#region src/text/resolver/index.d.ts
declare function fontFaceDemand(family: string, style: string, characters?: string): FontResolutionDemand;
declare function fontRemoteCoverageDemand(family: string, style: string, characters: readonly string[]): FontResolutionDemand;
declare function fontCoverageDemand(script: FontFallbackScript, characters?: readonly string[]): FontResolutionDemand;
declare const fontResolver: FontResolver;
//#endregion
export { FontCandidateSource, FontResolutionCandidate, FontResolutionDemand, FontResolutionLoader, FontResolutionSettled, FontResolutionSnapshot, FontResolutionState, FontResolver, ObservedShapedLine, fontCoverageDemand, fontFaceDemand, fontRemoteCoverageDemand, fontResolver, missingGlyphCharacters, missingGlyphScripts };
//# sourceMappingURL=index.d.ts.map
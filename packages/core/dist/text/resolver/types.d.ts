//#region src/text/resolver/types.d.ts
type FontResolutionState = 'idle' | 'loading' | 'loaded' | 'failed' | 'exhausted';
type FontCandidateSource = 'registered' | 'local' | 'cache' | 'remote' | 'fallback';
interface FontResolutionCandidate {
  id: string;
  family: string;
  style: string;
  source: FontCandidateSource;
}
interface FontResolutionDemand {
  key: string;
  candidates: readonly FontResolutionCandidate[];
  characters?: string;
}
interface FontResolutionSnapshot {
  key: string;
  state: FontResolutionState;
  candidate?: FontResolutionCandidate;
  source?: FontCandidateSource;
  error?: unknown;
}
type FontResolutionLoader = (candidate: FontResolutionCandidate, demand: FontResolutionDemand) => Promise<boolean>;
type FontResolutionSettled = (snapshot: FontResolutionSnapshot, nodeIds: readonly string[]) => void;
//#endregion
export { FontCandidateSource, FontResolutionCandidate, FontResolutionDemand, FontResolutionLoader, FontResolutionSettled, FontResolutionSnapshot, FontResolutionState };
//# sourceMappingURL=types.d.ts.map
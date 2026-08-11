//#region src/profiler/phase-timer.d.ts
declare class PhaseTimer {
  enabled: boolean;
  readonly averages: Map<string, number>;
  private starts;
  beginPhase(name: string): void;
  endPhase(name: string): void;
  clearPhases(): void;
}
//#endregion
export { PhaseTimer };
//# sourceMappingURL=phase-timer.d.ts.map
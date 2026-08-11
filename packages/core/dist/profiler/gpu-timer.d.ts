//#region src/profiler/gpu-timer.d.ts
declare class GPUTimer {
  private gl;
  private ext;
  private pending;
  private activeQuery;
  private _lastGpuTimeMs;
  get available(): boolean;
  get lastGpuTimeMs(): number;
  constructor(gl: WebGL2RenderingContext | null);
  beginFrame(): void;
  endFrame(): void;
  pollResults(): number | null;
  destroy(): void;
}
//#endregion
export { GPUTimer };
//# sourceMappingURL=gpu-timer.d.ts.map
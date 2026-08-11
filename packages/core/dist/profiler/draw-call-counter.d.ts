//#region src/profiler/draw-call-counter.d.ts
declare class DrawCallCounter {
  count: number;
  private originals;
  private gl;
  constructor(gl: WebGL2RenderingContext | null);
  enable(): void;
  disable(): void;
  reset(): number;
  destroy(): void;
}
//#endregion
export { DrawCallCounter };
//# sourceMappingURL=draw-call-counter.d.ts.map
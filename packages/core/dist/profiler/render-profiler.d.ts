import { DrawCallCounter } from "./draw-call-counter.js";
import { FrameCapture } from "./frame/capture.js";
import { FrameStats } from "./frame/stats.js";
import { GPUTimer } from "./gpu-timer.js";
import { PhaseTimer } from "./phase-timer.js";
import { Canvas, CanvasKit, Typeface } from "canvaskit-wasm";

//#region src/profiler/render-profiler.d.ts
declare class RenderProfiler {
  enabled: boolean;
  hudVisible: boolean;
  capturing: boolean;
  readonly stats: FrameStats;
  readonly phases: PhaseTimer;
  readonly gpuTimer: GPUTimer;
  readonly drawCallCounter: DrawCallCounter;
  private readonly hud;
  private captureSession;
  private lastCapture;
  private renderStartTime;
  constructor(ck: CanvasKit, gl: WebGL2RenderingContext | null);
  setVisible(visible: boolean): void;
  toggle(): void;
  beginFrame(): void;
  endFrame(): void;
  beginPhase(name: string): void;
  endPhase(name: string): void;
  setNodeCounts(total: number, culled: number): void;
  setCacheHit(hit: boolean): void;
  setScenePictureMode(mode: 'hit' | 'record' | 'volatile' | 'none', reason?: string): void;
  setScenePictureDrawTime(ms: number): void;
  setScenePictureRecordTime(ms: number): void;
  setFlushTime(ms: number): void;
  beginCapture(): void;
  endCapture(): FrameCapture | null;
  beginNode(nodeId: string, name: string, type: string, culled: boolean): void;
  endNode(drawCallsBefore: number): void;
  getLastCapture(): FrameCapture | null;
  exportSpeedscope(): string | null;
  downloadSpeedscope(): void;
  private syncInstrumentation;
  setTypeface(typeface: Typeface): void;
  drawHUD(canvas: Canvas, showRulers: boolean): void;
  destroy(): void;
}
//#endregion
export { RenderProfiler };
//# sourceMappingURL=render-profiler.d.ts.map
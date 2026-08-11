import { CaptureStack, FrameCapture } from "./frame/capture.js";
import { FrameStats } from "./frame/stats.js";
import { GPUTimer } from "./gpu-timer.js";

//#region src/profiler/capture-session.d.ts
type CaptureSession = {
  stack: CaptureStack;
  frameStart: number;
};
declare function createCaptureSession(frameStart: number): CaptureSession;
declare function createFrameCapture(session: CaptureSession, stats: FrameStats, gpuTimer: GPUTimer, now: () => number): FrameCapture;
//#endregion
export { CaptureSession, createCaptureSession, createFrameCapture };
//# sourceMappingURL=capture-session.d.ts.map
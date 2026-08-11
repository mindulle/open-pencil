//#region src/profiler/frame/stats.d.ts
declare class FrameStats {
  frameTime: number;
  cpuTime: number;
  gpuTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  avgFrameTime: number;
  minCpuTime: number;
  maxCpuTime: number;
  avgCpuTime: number;
  minGpuTime: number;
  maxGpuTime: number;
  avgGpuTime: number;
  smoothedFps: number;
  totalNodes: number;
  culledNodes: number;
  drawCalls: number;
  scenePictureCacheHit: boolean;
  scenePictureMode: 'hit' | 'record' | 'volatile' | 'none';
  scenePictureMissReason: string;
  scenePictureDrawTime: number;
  scenePictureRecordTime: number;
  flushTime: number;
  private frameTimeBuffer;
  private cpuTimeBuffer;
  private gpuTimeBuffer;
  private bufferIndex;
  private bufferCount;
  private lastTimestamp;
  recordFrame(cpuTimeMs: number): void;
  getFrameTimeHistory(): Float64Array;
  getCpuTimeHistory(): Float64Array;
  getGpuTimeHistory(): Float64Array;
  getBufferIndex(): number;
  getBufferCount(): number;
  private computeStats;
}
//#endregion
export { FrameStats };
//# sourceMappingURL=stats.d.ts.map
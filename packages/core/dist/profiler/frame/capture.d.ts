//#region src/profiler/frame/capture.d.ts
interface NodeProfile {
  nodeId: string;
  name: string;
  type: string;
  depth: number;
  startTime: number;
  endTime: number;
  selfTime: number;
  drawCalls: number;
  culled: boolean;
  children: NodeProfile[];
}
interface FrameCapture {
  timestamp: number;
  totalTimeMs: number;
  cpuTimeMs: number;
  gpuTimeMs: number;
  totalNodes: number;
  culledNodes: number;
  drawCalls: number;
  scenePictureCacheHit: boolean;
  scenePictureMode: 'hit' | 'record' | 'volatile' | 'none';
  scenePictureMissReason: string;
  scenePictureDrawTimeMs: number;
  scenePictureRecordTimeMs: number;
  flushTimeMs: number;
  rootProfiles: NodeProfile[];
}
declare class CaptureStack {
  private stack;
  private roots;
  private frameStart;
  begin(nodeId: string, name: string, type: string, culled: boolean): void;
  end(drawCallsDelta: number): void;
  reset(frameStart: number): void;
  getRootProfiles(): NodeProfile[];
}
declare function toSpeedscopeJSON(capture: FrameCapture): string;
//#endregion
export { CaptureStack, FrameCapture, NodeProfile, toSpeedscopeJSON };
//# sourceMappingURL=capture.d.ts.map
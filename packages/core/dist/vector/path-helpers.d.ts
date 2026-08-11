import { VectorSegment, VectorVertex } from "@open-pencil/scene-graph";

//#region src/vector/path-helpers.d.ts
/** Anything path commands can be emitted into: a canvaskit Path or a blob encoder. */
interface PathSink {
  moveTo(x: number, y: number): unknown;
  lineTo(x: number, y: number): unknown;
  cubicTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): unknown;
  close(): unknown;
}
declare function addSegmentDirected(path: PathSink, seg: VectorSegment, vertices: VectorVertex[], forward: boolean): void;
declare function findChainStart(chain: number[], segments: VectorSegment[]): number;
declare function addLoopToPath(path: PathSink, loop: number[], segments: VectorSegment[], vertices: VectorVertex[]): void;
declare function addOpenSegmentsToPath(path: PathSink, segments: VectorSegment[], vertices: VectorVertex[]): void;
declare function buildChains(segments: VectorSegment[]): number[][];
//#endregion
export { PathSink, addLoopToPath, addOpenSegmentsToPath, addSegmentDirected, buildChains, findChainStart };
//# sourceMappingURL=path-helpers.d.ts.map
import { VectorNetwork, VectorSegment } from "@open-pencil/scene-graph";
import { Rect, Vector as Vector$1 } from "@open-pencil/scene-graph/primitives";

//#region src/vector/curve-math.d.ts
interface CubicPoints {
  p0: Vector$1;
  cp1: Vector$1;
  cp2: Vector$1;
  p3: Vector$1;
}
interface NearestResult {
  t: number;
  x: number;
  y: number;
  distance: number;
}
interface NetworkNearestResult extends NearestResult {
  segmentIndex: number;
}
/** Evaluate a cubic bezier at parameter t (0..1). */
declare function evalCubic(p0x: number, p0y: number, p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number, t: number): Vector$1;
/** Split a cubic bezier at parameter t, returning two sub-curves. */
declare function splitCubicAt(p0: Vector$1, cp1: Vector$1, cp2: Vector$1, p3: Vector$1, t: number): {
  left: CubicPoints;
  right: CubicPoints;
};
/** Convert a VectorSegment's relative tangents to absolute control points. */
declare function segmentToAbsolute(network: VectorNetwork, segmentIndex: number): CubicPoints;
/** Check if a segment is a straight line (both tangents zero). */
declare function isLineSegment(seg: VectorSegment): boolean;
/**
 * Find parameter values where the cubic derivative is zero (extrema) in one axis.
 * Given cubic coefficients for one axis: B(t) = (1-t)^3*p0 + 3(1-t)^2*t*p1 + 3(1-t)*t^2*p2 + t^3*p3
 * Derivative: B'(t) = 3[(1-t)^2(p1-p0) + 2(1-t)t(p2-p1) + t^2(p3-p2)]
 * Expanding: at^2 + bt + c = 0 where:
 *   a = -p0 + 3p1 - 3p2 + p3
 *   b = 2(p0 - 2p1 + p2)
 *   c = -p0 + p1
 */
declare function cubicExtrema(p0: number, p1: number, p2: number, p3: number): number[];
/** Compute tight axis-aligned bounding box for a VectorNetwork. */
declare function computeAccurateBounds(network: VectorNetwork): Rect;
/**
 * Find the nearest point on a cubic bezier to a given point (px, py).
 * Uses coarse sampling + iterative refinement.
 */
declare function nearestPointOnCubic(px: number, py: number, p0: Vector$1, cp1: Vector$1, cp2: Vector$1, p3: Vector$1, coarseSamples?: number): NearestResult;
/** Find nearest point across all segments in a VectorNetwork. */
declare function nearestPointOnNetwork(px: number, py: number, network: VectorNetwork, threshold: number): NetworkNearestResult | null;
//#endregion
export { CubicPoints, NearestResult, NetworkNearestResult, computeAccurateBounds, cubicExtrema, evalCubic, isLineSegment, nearestPointOnCubic, nearestPointOnNetwork, segmentToAbsolute, splitCubicAt };
//# sourceMappingURL=curve-math.d.ts.map
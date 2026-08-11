import { CubicPoints, NearestResult, NetworkNearestResult, computeAccurateBounds, cubicExtrema, evalCubic, isLineSegment, nearestPointOnCubic, nearestPointOnNetwork, segmentToAbsolute, splitCubicAt } from "./curve-math.js";
import { extractSubNetwork, findConnectedComponents } from "./connectivity.js";
import { VectorNetwork } from "@open-pencil/scene-graph";
import { Vector as Vector$1 } from "@open-pencil/scene-graph/primitives";

//#region src/vector/bezier.d.ts
declare function splitSegmentAt(network: VectorNetwork, segmentIndex: number, t: number): {
  network: VectorNetwork;
  newVertexIndex: number;
};
/**
 * Remove a vertex from the network, merging adjacent segments if possible.
 * Returns null if the vertex cannot be removed (e.g., 0 vertices remain).
 */
declare function removeVertex(network: VectorNetwork, vertexIndex: number): VectorNetwork | null;
/**
 * Delete a vertex and ALL segments connected to it.
 * Unlike removeVertex (which merges adjacent segments), this breaks the path.
 * Returns null if the network would become empty.
 */
declare function deleteVertex(network: VectorNetwork, vertexIndex: number): VectorNetwork | null;
/**
 * Break the network at a vertex — duplicates the vertex so connected
 * segments are split into two groups. For closed paths this "opens" them.
 */
declare function breakAtVertex(network: VectorNetwork, vertexIndex: number): VectorNetwork;
/**
 * Remap segment indices in all region loops.
 * Map value of null means the segment was removed — the loop entry is dropped.
 */
/**
 * Given a dragged handle vector (relative to vertex), compute the mirrored opposite handle.
 */
declare function mirrorHandle(handle: Vector$1, mode: 'NONE' | 'ANGLE' | 'ANGLE_AND_LENGTH', oppositeLength?: number): Vector$1 | null;
/**
 * Find the "opposite" handle for a vertex — i.e., if we're dragging a tangent on
 * segmentIndex that touches vertexIndex, find the other segment touching the same vertex
 * and return its index and which tangent field belongs to that vertex.
 */
declare function findOppositeHandle(network: VectorNetwork, vertexIndex: number, segmentIndex: number): {
  segmentIndex: number;
  tangentField: 'tangentStart' | 'tangentEnd';
} | null;
/**
 * Find all handles (tangent fields) connected to a vertex, along with neighbor info.
 * Returns an array of { segmentIndex, tangentField, neighborVertexIndex } for each
 * segment that touches the given vertex.
 */
declare function findAllHandles(network: VectorNetwork, vertexIndex: number): {
  segmentIndex: number;
  tangentField: 'tangentStart' | 'tangentEnd';
  neighborIndex: number;
}[];
//#endregion
export { type CubicPoints, type NearestResult, type NetworkNearestResult, breakAtVertex, computeAccurateBounds, cubicExtrema, deleteVertex, evalCubic, extractSubNetwork, findAllHandles, findConnectedComponents, findOppositeHandle, isLineSegment, mirrorHandle, nearestPointOnCubic, nearestPointOnNetwork, removeVertex, segmentToAbsolute, splitCubicAt, splitSegmentAt };
//# sourceMappingURL=bezier.d.ts.map
import { computeAccurateBounds, cubicExtrema, evalCubic, isLineSegment, nearestPointOnCubic, nearestPointOnNetwork, segmentToAbsolute, splitCubicAt } from "./curve-math.js";
import { reindexRegionLoops, remapRegions } from "./regions.js";
import { extractSubNetwork, findConnectedComponents } from "./connectivity.js";
//#region src/vector/bezier.ts
function finishSplitSegment(network, newVertices, newSegments, segmentIndex, seg1, seg2, newVertexIndex) {
	const newSegIdx2 = newSegments.length;
	newSegments[segmentIndex] = seg1;
	newSegments.push(seg2);
	return {
		network: {
			vertices: newVertices,
			segments: newSegments,
			regions: reindexRegionLoops(network.regions, segmentIndex, [segmentIndex, newSegIdx2], network.segments)
		},
		newVertexIndex
	};
}
function splitSegmentAt(network, segmentIndex, t) {
	const seg = network.segments[segmentIndex];
	const v0 = network.vertices[seg.start];
	const v1 = network.vertices[seg.end];
	const newVertexIndex = network.vertices.length;
	const newVertices = [...network.vertices];
	const newSegments = [...network.segments];
	if (isLineSegment(seg)) {
		const mx = v0.x + t * (v1.x - v0.x);
		const my = v0.y + t * (v1.y - v0.y);
		newVertices.push({
			x: mx,
			y: my,
			handleMirroring: "NONE"
		});
		return finishSplitSegment(network, newVertices, newSegments, segmentIndex, {
			start: seg.start,
			end: newVertexIndex,
			tangentStart: {
				x: 0,
				y: 0
			},
			tangentEnd: {
				x: 0,
				y: 0
			}
		}, {
			start: newVertexIndex,
			end: seg.end,
			tangentStart: {
				x: 0,
				y: 0
			},
			tangentEnd: {
				x: 0,
				y: 0
			}
		}, newVertexIndex);
	}
	const { p0, cp1, cp2, p3 } = segmentToAbsolute(network, segmentIndex);
	const { left, right } = splitCubicAt(p0, cp1, cp2, p3, t);
	newVertices.push({
		x: left.p3.x,
		y: left.p3.y,
		handleMirroring: "ANGLE_AND_LENGTH"
	});
	return finishSplitSegment(network, newVertices, newSegments, segmentIndex, {
		start: seg.start,
		end: newVertexIndex,
		tangentStart: {
			x: left.cp1.x - v0.x,
			y: left.cp1.y - v0.y
		},
		tangentEnd: {
			x: left.cp2.x - left.p3.x,
			y: left.cp2.y - left.p3.y
		}
	}, {
		start: newVertexIndex,
		end: seg.end,
		tangentStart: {
			x: right.cp1.x - left.p3.x,
			y: right.cp1.y - left.p3.y
		},
		tangentEnd: {
			x: right.cp2.x - v1.x,
			y: right.cp2.y - v1.y
		}
	}, newVertexIndex);
}
function buildMergedSegmentForRemovedVertex(vertices, segments, connectedSegs, vertexIndex, reindex) {
	const segA = segments[connectedSegs[0]];
	const segB = segments[connectedSegs[1]];
	const neighborA = segA.start === vertexIndex ? segA.end : segA.start;
	const neighborB = segB.start === vertexIndex ? segB.end : segB.start;
	const dirA = segA.start === vertexIndex ? {
		x: segA.tangentEnd.x,
		y: segA.tangentEnd.y
	} : {
		x: segA.tangentStart.x,
		y: segA.tangentStart.y
	};
	const dirB = segB.start === vertexIndex ? {
		x: segB.tangentEnd.x,
		y: segB.tangentEnd.y
	} : {
		x: segB.tangentStart.x,
		y: segB.tangentStart.y
	};
	const vA = vertices[neighborA];
	const vR = vertices[vertexIndex];
	const vB = vertices[neighborB];
	const dA = Math.hypot(vR.x - vA.x, vR.y - vA.y);
	const totalLen = dA + Math.hypot(vB.x - vR.x, vB.y - vR.y);
	const t = totalLen > 1e-6 ? dA / totalLen : .5;
	const mt = 1 - t;
	const scaleA = mt > 1e-6 ? 1 / mt : 1;
	const scaleB = t > 1e-6 ? 1 / t : 1;
	const scaledTS = {
		x: dirA.x * scaleA,
		y: dirA.y * scaleA
	};
	const scaledTE = {
		x: dirB.x * scaleB,
		y: dirB.y * scaleB
	};
	const ptScaled = evalCubic(vA.x, vA.y, vA.x + scaledTS.x, vA.y + scaledTS.y, vB.x + scaledTE.x, vB.y + scaledTE.y, vB.x, vB.y, t);
	const tangents = Math.hypot(ptScaled.x - vR.x, ptScaled.y - vR.y) < totalLen * .05 ? {
		tangentStart: scaledTS,
		tangentEnd: scaledTE
	} : solveMergedTangents(vA, vR, vB, dirA, dirB, mt, t);
	return {
		start: reindex(neighborA),
		end: reindex(neighborB),
		tangentStart: tangents.tangentStart,
		tangentEnd: tangents.tangentEnd
	};
}
function solveMergedTangents(vA, vR, vB, dirA, dirB, mt, t) {
	const b1 = 3 * mt * mt * t;
	const b2 = 3 * mt * t * t;
	const rhs = {
		x: vR.x - (mt * mt * mt + b1) * vA.x - (t * t * t + b2) * vB.x,
		y: vR.y - (mt * mt * mt + b1) * vA.y - (t * t * t + b2) * vB.y
	};
	const det = b1 * dirA.x * b2 * dirB.y - b1 * dirA.y * b2 * dirB.x;
	if (Math.abs(det) > 1e-9) {
		const alpha = (rhs.x * b2 * dirB.y - rhs.y * b2 * dirB.x) / det;
		const beta = (b1 * dirA.x * rhs.y - b1 * dirA.y * rhs.x) / det;
		return {
			tangentStart: {
				x: alpha * dirA.x,
				y: alpha * dirA.y
			},
			tangentEnd: {
				x: beta * dirB.x,
				y: beta * dirB.y
			}
		};
	}
	const toRA = {
		x: vR.x - vA.x,
		y: vR.y - vA.y
	};
	const toRB = {
		x: vR.x - vB.x,
		y: vR.y - vB.y
	};
	const inner = {
		x: b1 * toRA.x + b2 * toRB.x,
		y: b1 * toRA.y + b2 * toRB.y
	};
	let c = 1;
	if (Math.abs(inner.x) > Math.abs(inner.y)) {
		if (inner.x !== 0) c = rhs.x / inner.x;
	} else if (inner.y !== 0) c = rhs.y / inner.y;
	return {
		tangentStart: {
			x: c * toRA.x,
			y: c * toRA.y
		},
		tangentEnd: {
			x: c * toRB.x,
			y: c * toRB.y
		}
	};
}
function buildSegmentsAfterRemoval(segments, reindex, removedSet, mergedSeg) {
	const newSegments = [];
	const segIndexMap = /* @__PURE__ */ new Map();
	let mergedIdx = -1;
	for (let i = 0; i < segments.length; i++) {
		if (!removedSet.has(i)) {
			const s = segments[i];
			segIndexMap.set(i, newSegments.length);
			newSegments.push({
				start: reindex(s.start),
				end: reindex(s.end),
				tangentStart: { ...s.tangentStart },
				tangentEnd: { ...s.tangentEnd }
			});
			continue;
		}
		if (!mergedSeg) {
			segIndexMap.set(i, null);
			continue;
		}
		if (mergedIdx === -1) {
			mergedIdx = newSegments.length;
			newSegments.push(mergedSeg);
		}
		segIndexMap.set(i, mergedIdx);
	}
	return {
		segments: newSegments,
		indexMap: segIndexMap
	};
}
/**
* Remove a vertex from the network, merging adjacent segments if possible.
* Returns null if the vertex cannot be removed (e.g., 0 vertices remain).
*/
function removeVertex(network, vertexIndex) {
	const { vertices, segments, regions } = network;
	const connectedSegs = [];
	for (let i = 0; i < segments.length; i++) if (segments[i].start === vertexIndex || segments[i].end === vertexIndex) connectedSegs.push(i);
	if (vertices.length <= 1) return null;
	const newVertices = vertices.filter((_, i) => i !== vertexIndex);
	const reindex = (idx) => idx > vertexIndex ? idx - 1 : idx;
	if (connectedSegs.length === 2) {
		const mergedSeg = buildMergedSegmentForRemovedVertex(vertices, segments, connectedSegs, vertexIndex, reindex);
		const result = buildSegmentsAfterRemoval(segments, reindex, new Set(connectedSegs), mergedSeg);
		const newRegions = remapRegions(regions, result.indexMap);
		return {
			vertices: newVertices,
			segments: result.segments,
			regions: newRegions
		};
	}
	const result = buildSegmentsAfterRemoval(segments, reindex, new Set(connectedSegs));
	const newRegions = remapRegions(regions, result.indexMap);
	return {
		vertices: newVertices,
		segments: result.segments,
		regions: newRegions
	};
}
/**
* Delete a vertex and ALL segments connected to it.
* Unlike removeVertex (which merges adjacent segments), this breaks the path.
* Returns null if the network would become empty.
*/
function deleteVertex(network, vertexIndex) {
	const { vertices, segments } = network;
	if (vertices.length <= 1) return null;
	const connectedSet = /* @__PURE__ */ new Set();
	for (let i = 0; i < segments.length; i++) if (segments[i].start === vertexIndex || segments[i].end === vertexIndex) connectedSet.add(i);
	const newVertices = vertices.filter((_, i) => i !== vertexIndex);
	const reindex = (idx) => idx > vertexIndex ? idx - 1 : idx;
	const newSegments = [];
	for (let i = 0; i < segments.length; i++) {
		if (connectedSet.has(i)) continue;
		newSegments.push({
			...segments[i],
			start: reindex(segments[i].start),
			end: reindex(segments[i].end)
		});
	}
	return {
		vertices: newVertices,
		segments: newSegments,
		regions: []
	};
}
/**
* Break the network at a vertex — duplicates the vertex so connected
* segments are split into two groups. For closed paths this "opens" them.
*/
function breakAtVertex(network, vertexIndex) {
	const { vertices, segments } = network;
	const incoming = [];
	const outgoing = [];
	for (let i = 0; i < segments.length; i++) {
		const s = segments[i];
		if (s.end === vertexIndex) incoming.push(i);
		else if (s.start === vertexIndex) outgoing.push(i);
	}
	if (incoming.length === 0 || outgoing.length === 0) return network;
	const dupIndex = vertices.length;
	const newVertices = [...vertices, { ...vertices[vertexIndex] }];
	const newSegments = segments.map((s, i) => {
		if (outgoing.includes(i)) return {
			...s,
			start: dupIndex
		};
		return { ...s };
	});
	for (const i of incoming) newSegments[i] = {
		...newSegments[i],
		tangentEnd: {
			x: 0,
			y: 0
		}
	};
	for (const i of outgoing) newSegments[i] = {
		...newSegments[i],
		tangentStart: {
			x: 0,
			y: 0
		}
	};
	return {
		vertices: newVertices,
		segments: newSegments,
		regions: []
	};
}
/**
* Remap segment indices in all region loops.
* Map value of null means the segment was removed — the loop entry is dropped.
*/
/**
* Given a dragged handle vector (relative to vertex), compute the mirrored opposite handle.
*/
function mirrorHandle(handle, mode, oppositeLength) {
	switch (mode) {
		case "NONE": return null;
		case "ANGLE_AND_LENGTH": return {
			x: -handle.x,
			y: -handle.y
		};
		case "ANGLE": {
			const len = oppositeLength ?? Math.hypot(handle.x, handle.y);
			const hLen = Math.hypot(handle.x, handle.y);
			if (hLen < 1e-9) return {
				x: 0,
				y: 0
			};
			const scale = len / hLen;
			return {
				x: -handle.x * scale,
				y: -handle.y * scale
			};
		}
	}
	return null;
}
/**
* Find the "opposite" handle for a vertex — i.e., if we're dragging a tangent on
* segmentIndex that touches vertexIndex, find the other segment touching the same vertex
* and return its index and which tangent field belongs to that vertex.
*/
function findOppositeHandle(network, vertexIndex, segmentIndex) {
	for (let i = 0; i < network.segments.length; i++) {
		if (i === segmentIndex) continue;
		const s = network.segments[i];
		if (s.start === vertexIndex) return {
			segmentIndex: i,
			tangentField: "tangentStart"
		};
		if (s.end === vertexIndex) return {
			segmentIndex: i,
			tangentField: "tangentEnd"
		};
	}
	return null;
}
/**
* Find all handles (tangent fields) connected to a vertex, along with neighbor info.
* Returns an array of { segmentIndex, tangentField, neighborVertexIndex } for each
* segment that touches the given vertex.
*/
function findAllHandles(network, vertexIndex) {
	const result = [];
	for (let i = 0; i < network.segments.length; i++) {
		const s = network.segments[i];
		if (s.start === vertexIndex) result.push({
			segmentIndex: i,
			tangentField: "tangentStart",
			neighborIndex: s.end
		});
		if (s.end === vertexIndex) result.push({
			segmentIndex: i,
			tangentField: "tangentEnd",
			neighborIndex: s.start
		});
	}
	return result;
}
//#endregion
export { breakAtVertex, computeAccurateBounds, cubicExtrema, deleteVertex, evalCubic, extractSubNetwork, findAllHandles, findConnectedComponents, findOppositeHandle, isLineSegment, mirrorHandle, nearestPointOnCubic, nearestPointOnNetwork, removeVertex, segmentToAbsolute, splitCubicAt, splitSegmentAt };

//# sourceMappingURL=bezier.js.map
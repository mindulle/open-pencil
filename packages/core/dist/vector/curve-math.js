//#region src/vector/curve-math.ts
/** Evaluate a cubic bezier at parameter t (0..1). */
function evalCubic(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, t) {
	const mt = 1 - t;
	const mt2 = mt * mt;
	const t2 = t * t;
	const a = mt2 * mt;
	const b = 3 * mt2 * t;
	const c = 3 * mt * t2;
	const d = t2 * t;
	return {
		x: a * p0x + b * p1x + c * p2x + d * p3x,
		y: a * p0y + b * p1y + c * p2y + d * p3y
	};
}
/** Split a cubic bezier at parameter t, returning two sub-curves. */
function splitCubicAt(p0, cp1, cp2, p3, t) {
	const mt = 1 - t;
	const m01x = mt * p0.x + t * cp1.x;
	const m01y = mt * p0.y + t * cp1.y;
	const m12x = mt * cp1.x + t * cp2.x;
	const m12y = mt * cp1.y + t * cp2.y;
	const m23x = mt * cp2.x + t * p3.x;
	const m23y = mt * cp2.y + t * p3.y;
	const m012x = mt * m01x + t * m12x;
	const m012y = mt * m01y + t * m12y;
	const m123x = mt * m12x + t * m23x;
	const m123y = mt * m12y + t * m23y;
	const mx = mt * m012x + t * m123x;
	const my = mt * m012y + t * m123y;
	return {
		left: {
			p0: {
				x: p0.x,
				y: p0.y
			},
			cp1: {
				x: m01x,
				y: m01y
			},
			cp2: {
				x: m012x,
				y: m012y
			},
			p3: {
				x: mx,
				y: my
			}
		},
		right: {
			p0: {
				x: mx,
				y: my
			},
			cp1: {
				x: m123x,
				y: m123y
			},
			cp2: {
				x: m23x,
				y: m23y
			},
			p3: {
				x: p3.x,
				y: p3.y
			}
		}
	};
}
/** Convert a VectorSegment's relative tangents to absolute control points. */
function segmentToAbsolute(network, segmentIndex) {
	const seg = network.segments[segmentIndex];
	const v0 = network.vertices[seg.start];
	const v1 = network.vertices[seg.end];
	return {
		p0: {
			x: v0.x,
			y: v0.y
		},
		cp1: {
			x: v0.x + seg.tangentStart.x,
			y: v0.y + seg.tangentStart.y
		},
		cp2: {
			x: v1.x + seg.tangentEnd.x,
			y: v1.y + seg.tangentEnd.y
		},
		p3: {
			x: v1.x,
			y: v1.y
		}
	};
}
/** Check if a segment is a straight line (both tangents zero). */
function isLineSegment(seg) {
	return seg.tangentStart.x === 0 && seg.tangentStart.y === 0 && seg.tangentEnd.x === 0 && seg.tangentEnd.y === 0;
}
/**
* Find parameter values where the cubic derivative is zero (extrema) in one axis.
* Given cubic coefficients for one axis: B(t) = (1-t)^3*p0 + 3(1-t)^2*t*p1 + 3(1-t)*t^2*p2 + t^3*p3
* Derivative: B'(t) = 3[(1-t)^2(p1-p0) + 2(1-t)t(p2-p1) + t^2(p3-p2)]
* Expanding: at^2 + bt + c = 0 where:
*   a = -p0 + 3p1 - 3p2 + p3
*   b = 2(p0 - 2p1 + p2)
*   c = -p0 + p1
*/
function cubicExtrema(p0, p1, p2, p3) {
	const a = -p0 + 3 * p1 - 3 * p2 + p3;
	const b = 2 * (p0 - 2 * p1 + p2);
	const c = -p0 + p1;
	const results = [];
	const EPS = 1e-12;
	if (Math.abs(a) < EPS) {
		if (Math.abs(b) > EPS) {
			const t = -c / b;
			if (t > 0 && t < 1) results.push(t);
		}
	} else {
		const disc = b * b - 4 * a * c;
		if (disc >= 0) {
			const sq = Math.sqrt(disc);
			const t1 = (-b + sq) / (2 * a);
			const t2 = (-b - sq) / (2 * a);
			if (t1 > 0 && t1 < 1) results.push(t1);
			if (t2 > 0 && t2 < 1 && Math.abs(t2 - t1) > EPS) results.push(t2);
		}
	}
	return results;
}
/** Compute tight axis-aligned bounding box for a VectorNetwork. */
function computeAccurateBounds(network) {
	const { vertices, segments } = network;
	if (vertices.length === 0) return {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	const update = (x, y) => {
		if (x < minX) minX = x;
		if (y < minY) minY = y;
		if (x > maxX) maxX = x;
		if (y > maxY) maxY = y;
	};
	for (const v of vertices) update(v.x, v.y);
	for (let i = 0; i < segments.length; i++) {
		const { p0, cp1, cp2, p3 } = segmentToAbsolute(network, i);
		for (const t of cubicExtrema(p0.x, cp1.x, cp2.x, p3.x)) {
			const pt = evalCubic(p0.x, p0.y, cp1.x, cp1.y, cp2.x, cp2.y, p3.x, p3.y, t);
			update(pt.x, pt.y);
		}
		for (const t of cubicExtrema(p0.y, cp1.y, cp2.y, p3.y)) {
			const pt = evalCubic(p0.x, p0.y, cp1.x, cp1.y, cp2.x, cp2.y, p3.x, p3.y, t);
			update(pt.x, pt.y);
		}
	}
	return {
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY
	};
}
/**
* Find the nearest point on a cubic bezier to a given point (px, py).
* Uses coarse sampling + iterative refinement.
*/
function nearestPointOnCubic(px, py, p0, cp1, cp2, p3, coarseSamples = 64) {
	let bestT = 0;
	let bestDist = Infinity;
	for (let i = 0; i <= coarseSamples; i++) {
		const t = i / coarseSamples;
		const pt = evalCubic(p0.x, p0.y, cp1.x, cp1.y, cp2.x, cp2.y, p3.x, p3.y, t);
		const dx = pt.x - px;
		const dy = pt.y - py;
		const d = dx * dx + dy * dy;
		if (d < bestDist) {
			bestDist = d;
			bestT = t;
		}
	}
	let lo = Math.max(0, bestT - 1 / coarseSamples);
	let hi = Math.min(1, bestT + 1 / coarseSamples);
	for (let iter = 0; iter < 5; iter++) {
		const step = (hi - lo) / 4;
		let localBestT = lo;
		let localBestDist = Infinity;
		for (let i = 0; i <= 4; i++) {
			const t = lo + step * i;
			const pt = evalCubic(p0.x, p0.y, cp1.x, cp1.y, cp2.x, cp2.y, p3.x, p3.y, t);
			const dx = pt.x - px;
			const dy = pt.y - py;
			const d = dx * dx + dy * dy;
			if (d < localBestDist) {
				localBestDist = d;
				localBestT = t;
			}
		}
		bestT = localBestT;
		bestDist = localBestDist;
		lo = Math.max(0, bestT - step);
		hi = Math.min(1, bestT + step);
	}
	const pt = evalCubic(p0.x, p0.y, cp1.x, cp1.y, cp2.x, cp2.y, p3.x, p3.y, bestT);
	return {
		t: bestT,
		x: pt.x,
		y: pt.y,
		distance: Math.sqrt(bestDist)
	};
}
/** Find nearest point on a straight line segment. */
function nearestPointOnLine(px, py, p0, p1) {
	const dx = p1.x - p0.x;
	const dy = p1.y - p0.y;
	const lenSq = dx * dx + dy * dy;
	let t;
	if (lenSq < 1e-12) t = 0;
	else t = Math.max(0, Math.min(1, ((px - p0.x) * dx + (py - p0.y) * dy) / lenSq));
	const x = p0.x + t * dx;
	const y = p0.y + t * dy;
	const ddx = x - px;
	const ddy = y - py;
	return {
		t,
		x,
		y,
		distance: Math.hypot(ddx, ddy)
	};
}
/** Find nearest point across all segments in a VectorNetwork. */
function nearestPointOnNetwork(px, py, network, threshold) {
	let best = null;
	for (let i = 0; i < network.segments.length; i++) {
		const seg = network.segments[i];
		let result;
		if (isLineSegment(seg)) {
			const v0 = network.vertices[seg.start];
			const v1 = network.vertices[seg.end];
			result = nearestPointOnLine(px, py, v0, v1);
		} else {
			const { p0, cp1, cp2, p3 } = segmentToAbsolute(network, i);
			result = nearestPointOnCubic(px, py, p0, cp1, cp2, p3);
		}
		if (result.distance <= threshold && (!best || result.distance < best.distance)) best = {
			...result,
			segmentIndex: i
		};
	}
	return best;
}
/**
* Split a segment in a VectorNetwork at parameter t, inserting a new vertex.
* Returns a new VectorNetwork with updated vertices, segments, and regions.
*/
//#endregion
export { computeAccurateBounds, cubicExtrema, evalCubic, isLineSegment, nearestPointOnCubic, nearestPointOnNetwork, segmentToAbsolute, splitCubicAt };

//# sourceMappingURL=curve-math.js.map
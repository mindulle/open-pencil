import { addOpenSegmentsToPath } from "./path-helpers.js";
//#region src/vector/centerline.ts
function fitCircleArc(pts) {
	if (pts.length < 3) return null;
	const p1 = pts[0];
	const p2 = pts[Math.floor(pts.length / 2)];
	const p3 = pts[pts.length - 1];
	const ax = p2.x - p1.x;
	const ay = p2.y - p1.y;
	const bx = p3.x - p1.x;
	const by = p3.y - p1.y;
	const d = 2 * (ax * by - ay * bx);
	if (Math.abs(d) < 1e-6) return null;
	const sqA = ax * ax + ay * ay;
	const sqB = bx * bx + by * by;
	const ux = (by * sqA - ay * sqB) / d;
	const uy = (ax * sqB - bx * sqA) / d;
	const cx = p1.x + ux;
	const cy = p1.y + uy;
	const r = Math.hypot(ux, uy);
	if (!Number.isFinite(r) || r <= 0) return null;
	const tol = Math.max(.5, r * .01);
	for (const p of pts) if (Math.abs(Math.hypot(p.x - cx, p.y - cy) - r) > tol) return null;
	const startAngleDeg = Math.atan2(p1.y - cy, p1.x - cx) * 180 / Math.PI;
	const endAngleDeg = Math.atan2(p3.y - cy, p3.x - cx) * 180 / Math.PI;
	const midAngleDeg = Math.atan2(p2.y - cy, p2.x - cx) * 180 / Math.PI;
	const norm = (a) => (a % 360 + 360) % 360;
	const sweepCW = norm(endAngleDeg - startAngleDeg);
	const sweepCCW = -norm(startAngleDeg - endAngleDeg);
	return {
		cx,
		cy,
		r,
		startAngleDeg,
		sweepDeg: norm(midAngleDeg - startAngleDeg) <= sweepCW ? sweepCW : sweepCCW
	};
}
function isClosedThinCrescent(network) {
	const { vertices, segments } = network;
	const n = vertices.length;
	if (n < 6 || n % 2 !== 0 || segments.length !== n) return null;
	const adj = /* @__PURE__ */ new Map();
	for (let i = 0; i < segments.length; i++) {
		const s = segments[i];
		let startList = adj.get(s.start);
		if (!startList) {
			startList = [];
			adj.set(s.start, startList);
		}
		startList.push(i);
		let endList = adj.get(s.end);
		if (!endList) {
			endList = [];
			adj.set(s.end, endList);
		}
		endList.push(i);
	}
	if (adj.size !== n) return null;
	for (const segs of adj.values()) if (segs.length !== 2) return null;
	const ordered = [0];
	const visited = /* @__PURE__ */ new Set();
	let current = 0;
	while (ordered.length < n) {
		const segs = adj.get(current);
		if (!segs) return null;
		const nextSeg = segs.find((s) => !visited.has(s));
		if (nextSeg === void 0) return null;
		visited.add(nextSeg);
		const seg = segments[nextSeg];
		const next = seg.start === current ? seg.end : seg.start;
		ordered.push(next);
		current = next;
	}
	const half = n / 2;
	const paired = [];
	let alongSum = 0;
	for (let i = 0; i < half; i++) {
		const a = vertices[ordered[i]];
		const b = vertices[ordered[n - 1 - i]];
		paired.push(Math.hypot(a.x - b.x, a.y - b.y));
	}
	for (let i = 0; i < half - 1; i++) {
		const a = vertices[ordered[i]];
		const b = vertices[ordered[i + 1]];
		alongSum += Math.hypot(a.x - b.x, a.y - b.y);
	}
	if (alongSum <= 0) return null;
	const pairedAvg = paired.reduce((s, v) => s + v, 0) / half;
	if (pairedAvg > alongSum * .5) return null;
	const variance = paired.reduce((s, v) => s + (v - pairedAvg) ** 2, 0) / half;
	if (pairedAvg > 0 && Math.sqrt(variance) / pairedAvg > .5) return null;
	return { ordered };
}
function buildCenterlineFromCrescent(ck, network, ordered) {
	const { vertices } = network;
	const cycleLen = ordered.length;
	const segDir = (i) => {
		const a = vertices[ordered[i]];
		const b = vertices[ordered[(i + 1) % cycleLen]];
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const m = Math.hypot(dx, dy) || 1;
		return {
			x: dx / m,
			y: dy / m
		};
	};
	const angleChangeAtVertex = (i) => {
		const dIn = segDir((i - 1 + cycleLen) % cycleLen);
		const dOut = segDir(i);
		const dot = dIn.x * dOut.x + dIn.y * dOut.y;
		return Math.acos(Math.max(-1, Math.min(1, dot)));
	};
	const cornerThreshold = Math.PI / 3;
	const isCorner = [];
	for (let i = 0; i < cycleLen; i++) isCorner.push(angleChangeAtVertex(i) > cornerThreshold);
	const caps = [];
	for (let i = 0; i < cycleLen; i++) {
		const next = (i + 1) % cycleLen;
		if (isCorner[i] && isCorner[next]) caps.push(i);
	}
	if (caps.length !== 2) return null;
	const [cap1, cap2] = caps;
	const buildSubchain = (afterCap, beforeCap) => {
		const verts = [];
		let i = (afterCap + 1) % cycleLen;
		verts.push(ordered[i]);
		while (i !== beforeCap) {
			i = (i + 1) % cycleLen;
			verts.push(ordered[i]);
		}
		return verts;
	};
	const chainA = buildSubchain(cap1, cap2);
	const chainB = buildSubchain(cap2, cap1);
	const pairCount = Math.min(chainA.length, chainB.length);
	if (pairCount < 2) return null;
	const midpoints = [];
	for (let i = 0; i < pairCount; i++) {
		const a = vertices[chainA[i]];
		const b = vertices[chainB[chainB.length - 1 - i]];
		midpoints.push({
			x: (a.x + b.x) / 2,
			y: (a.y + b.y) / 2
		});
	}
	const arcParams = fitCircleArc(midpoints);
	if (arcParams) {
		const { cx, cy, r, startAngleDeg, sweepDeg } = arcParams;
		const path = new ck.Path();
		path.addArc(ck.LTRBRect(cx - r, cy - r, cx + r, cy + r), startAngleDeg, sweepDeg);
		return path;
	}
	const path = new ck.Path();
	path.moveTo(midpoints[0].x, midpoints[0].y);
	for (let i = 1; i < midpoints.length; i++) path.lineTo(midpoints[i].x, midpoints[i].y);
	return path;
}
function vectorNetworkToCenterlinePath(ck, network) {
	const { vertices, segments } = network;
	const crescent = isClosedThinCrescent(network);
	if (crescent) {
		const result = buildCenterlineFromCrescent(ck, network, crescent.ordered);
		if (result) return result;
	}
	const path = new ck.Path();
	addOpenSegmentsToPath(path, segments, vertices);
	return path;
}
//#endregion
export { fitCircleArc, isClosedThinCrescent, vectorNetworkToCenterlinePath };

//# sourceMappingURL=centerline.js.map
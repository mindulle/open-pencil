//#region src/vector/connectivity.ts
function findConnectedComponents(network) {
	const n = network.vertices.length;
	if (n === 0) return [];
	const adj = /* @__PURE__ */ new Map();
	for (const seg of network.segments) {
		if (!adj.has(seg.start)) adj.set(seg.start, /* @__PURE__ */ new Set());
		if (!adj.has(seg.end)) adj.set(seg.end, /* @__PURE__ */ new Set());
		const from = adj.get(seg.start);
		const to = adj.get(seg.end);
		if (!from || !to) continue;
		from.add(seg.end);
		to.add(seg.start);
	}
	const visited = /* @__PURE__ */ new Set();
	const components = [];
	for (let i = 0; i < n; i++) {
		if (visited.has(i)) continue;
		const component = [];
		const stack = [i];
		while (stack.length > 0) {
			const v = stack.pop();
			if (v === void 0) continue;
			if (visited.has(v)) continue;
			visited.add(v);
			component.push(v);
			const neighbors = adj.get(v);
			if (neighbors) {
				for (const nb of neighbors) if (!visited.has(nb)) stack.push(nb);
			}
		}
		components.push(component);
	}
	return components;
}
/**
* Extract a sub-network from a VectorNetwork given a set of vertex indices.
*/
function extractSubNetwork(network, vertexIndices) {
	const indexSet = new Set(vertexIndices);
	const oldToNew = /* @__PURE__ */ new Map();
	const newVertices = [];
	for (const idx of vertexIndices) {
		oldToNew.set(idx, newVertices.length);
		newVertices.push({ ...network.vertices[idx] });
	}
	const newSegments = [];
	const segOldToNew = /* @__PURE__ */ new Map();
	for (let i = 0; i < network.segments.length; i++) {
		const s = network.segments[i];
		if (indexSet.has(s.start) && indexSet.has(s.end)) {
			segOldToNew.set(i, newSegments.length);
			const start = oldToNew.get(s.start);
			const end = oldToNew.get(s.end);
			if (start === void 0 || end === void 0) continue;
			newSegments.push({
				start,
				end,
				tangentStart: { ...s.tangentStart },
				tangentEnd: { ...s.tangentEnd }
			});
		}
	}
	const newRegions = [];
	for (const region of network.regions) {
		const newLoops = [];
		for (const loop of region.loops) {
			const newLoop = loop.map((i) => segOldToNew.get(i)).filter((i) => i !== void 0);
			if (newLoop.length >= 2) newLoops.push(newLoop);
		}
		if (newLoops.length > 0) newRegions.push({
			...region,
			loops: newLoops
		});
	}
	return {
		vertices: newVertices,
		segments: newSegments,
		regions: newRegions
	};
}
//#endregion
export { extractSubNetwork, findConnectedComponents };

//# sourceMappingURL=connectivity.js.map
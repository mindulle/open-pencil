//#region src/vector/regions.ts
function remapRegions(regions, indexMap) {
	const result = [];
	for (const region of regions) {
		const newLoops = [];
		for (const loop of region.loops) {
			const newLoop = [];
			for (const idx of loop) {
				const mapped = indexMap.get(idx);
				if (mapped == null) continue;
				if (newLoop.length > 0 && newLoop[newLoop.length - 1] === mapped) continue;
				newLoop.push(mapped);
			}
			if (newLoop.length > 1 && newLoop[0] === newLoop[newLoop.length - 1]) newLoop.pop();
			if (newLoop.length >= 2) newLoops.push(newLoop);
		}
		if (newLoops.length > 0) result.push({
			...region,
			loops: newLoops
		});
	}
	return result;
}
function reindexRegionLoops(regions, oldSegIndex, newSegIndices, segments) {
	return regions.map((region) => ({
		...region,
		loops: region.loops.map((loop) => {
			const result = [];
			for (let i = 0; i < loop.length; i++) {
				if (loop[i] !== oldSegIndex) {
					result.push(loop[i]);
					continue;
				}
				if (!segments || newSegIndices.length < 2) {
					result.push(...newSegIndices);
					continue;
				}
				const origSeg = segments[oldSegIndex];
				const nextSeg = segments[loop[(i + 1) % loop.length]];
				if (origSeg.end === nextSeg.start || origSeg.end === nextSeg.end) result.push(...newSegIndices);
				else result.push(...[...newSegIndices].reverse());
			}
			return result;
		})
	}));
}
//#endregion
export { reindexRegionLoops, remapRegions };

//# sourceMappingURL=regions.js.map
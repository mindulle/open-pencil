//#region src/profiler/frame/capture.ts
const hasPerformance = typeof performance !== "undefined";
var CaptureStack = class {
	stack = [];
	roots = [];
	frameStart = 0;
	begin(nodeId, name, type, culled) {
		const profile = {
			nodeId,
			name,
			type,
			depth: this.stack.length,
			startTime: hasPerformance ? performance.now() - this.frameStart : 0,
			endTime: 0,
			selfTime: 0,
			drawCalls: 0,
			culled,
			children: []
		};
		this.stack.push(profile);
	}
	end(drawCallsDelta) {
		const profile = this.stack.pop();
		if (!profile) return;
		profile.endTime = hasPerformance ? performance.now() - this.frameStart : 0;
		profile.drawCalls = drawCallsDelta;
		let childrenTime = 0;
		for (const child of profile.children) childrenTime += child.endTime - child.startTime;
		profile.selfTime = profile.endTime - profile.startTime - childrenTime;
		const parent = this.stack[this.stack.length - 1];
		if (parent) parent.children.push(profile);
		else this.roots.push(profile);
	}
	reset(frameStart) {
		this.stack.length = 0;
		this.roots.length = 0;
		this.frameStart = frameStart;
	}
	getRootProfiles() {
		return this.roots;
	}
};
function toSpeedscopeJSON(capture) {
	const frames = [];
	const frameIndex = /* @__PURE__ */ new Map();
	const events = [];
	function getFrameIdx(nodeId, name) {
		const key = `${nodeId}\0${name}`;
		let idx = frameIndex.get(key);
		if (idx === void 0) {
			idx = frames.length;
			frames.push({ name: `${name} (${nodeId})` });
			frameIndex.set(key, idx);
		}
		return idx;
	}
	function walk(profile) {
		const idx = getFrameIdx(profile.nodeId, profile.name);
		events.push({
			type: "O",
			at: profile.startTime,
			frame: idx
		});
		for (const child of profile.children) walk(child);
		events.push({
			type: "C",
			at: profile.endTime,
			frame: idx
		});
	}
	for (const root of capture.rootProfiles) walk(root);
	return JSON.stringify({
		$schema: "https://www.speedscope.app/file-format-schema.json",
		shared: { frames },
		profiles: [{
			type: "evented",
			name: "Frame Render",
			unit: "milliseconds",
			startValue: 0,
			endValue: capture.totalTimeMs,
			events
		}]
	}, null, 2);
}
//#endregion
export { CaptureStack, toSpeedscopeJSON };

//# sourceMappingURL=capture.js.map
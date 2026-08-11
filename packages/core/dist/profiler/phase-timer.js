//#region src/profiler/phase-timer.ts
function colorForPhase(name) {
	if (name === "frame") return "primary";
	if (name === "render:flush") return "tertiary-dark";
	if (name === "render:recordPicture") return "tertiary";
	if (name.startsWith("render:")) return "secondary";
	if (name.startsWith("layout:")) return "secondary-dark";
	return "secondary-light";
}
const SMOOTH = .05;
var PhaseTimer = class {
	enabled = false;
	averages = /* @__PURE__ */ new Map();
	starts = /* @__PURE__ */ new Map();
	beginPhase(name) {
		if (!this.enabled || typeof performance === "undefined") return;
		this.starts.set(name, performance.now());
	}
	endPhase(name) {
		if (!this.enabled || typeof performance === "undefined") return;
		const startTime = this.starts.get(name);
		if (startTime === void 0) return;
		this.starts.delete(name);
		const duration = performance.now() - startTime;
		const prev = this.averages.get(name);
		this.averages.set(name, prev === void 0 ? duration : prev + (duration - prev) * SMOOTH);
		performance.measure(name, {
			start: startTime,
			detail: { devtools: {
				dataType: "track-entry",
				track: "Renderer",
				trackGroup: "OpenPencil",
				color: colorForPhase(name)
			} }
		});
	}
	clearPhases() {
		this.starts.clear();
		this.averages.clear();
	}
};
//#endregion
export { PhaseTimer };

//# sourceMappingURL=phase-timer.js.map
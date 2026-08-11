//#region src/profiler/draw-call-counter.ts
const DRAW_METHODS = [
	"drawArrays",
	"drawElements",
	"drawArraysInstanced",
	"drawElementsInstanced"
];
var DrawCallCounter = class {
	count = 0;
	originals = /* @__PURE__ */ new Map();
	gl;
	constructor(gl) {
		this.gl = gl;
	}
	enable() {
		const gl = this.gl;
		if (!gl || this.originals.size > 0) return;
		for (const method of DRAW_METHODS) {
			const original = gl[method];
			this.originals.set(method, original);
			gl[method] = (...args) => {
				this.count++;
				original.apply(gl, args);
			};
		}
	}
	disable() {
		const gl = this.gl;
		if (!gl || this.originals.size === 0) return;
		for (const [method, fn] of this.originals) gl[method] = fn;
		this.originals.clear();
	}
	reset() {
		const prev = this.count;
		this.count = 0;
		return prev;
	}
	destroy() {
		this.disable();
		this.gl = null;
	}
};
//#endregion
export { DrawCallCounter };

//# sourceMappingURL=draw-call-counter.js.map
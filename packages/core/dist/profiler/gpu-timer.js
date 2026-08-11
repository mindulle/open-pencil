//#region src/profiler/gpu-timer.ts
const MAX_PENDING_QUERIES = 4;
var GPUTimer = class {
	gl;
	ext = null;
	pending = [];
	activeQuery = null;
	_lastGpuTimeMs = NaN;
	get available() {
		return this.ext !== null;
	}
	get lastGpuTimeMs() {
		return this._lastGpuTimeMs;
	}
	constructor(gl) {
		this.gl = gl;
		if (gl) this.ext = gl.getExtension("EXT_disjoint_timer_query_webgl2") ?? null;
	}
	beginFrame() {
		if (!this.gl || !this.ext) return;
		if (this.pending.length >= MAX_PENDING_QUERIES) return;
		const query = this.gl.createQuery();
		this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, query);
		this.activeQuery = query;
	}
	endFrame() {
		if (!this.gl || !this.ext || !this.activeQuery) return;
		this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
		this.pending.push(this.activeQuery);
		this.activeQuery = null;
	}
	pollResults() {
		if (!this.gl || !this.ext) return null;
		const disjoint = this.gl.getParameter(this.ext.GPU_DISJOINT_EXT);
		let result = null;
		const remaining = [];
		for (const query of this.pending) if (this.gl.getQueryParameter(query, this.gl.QUERY_RESULT_AVAILABLE)) {
			if (!disjoint) {
				const ns = this.gl.getQueryParameter(query, this.gl.QUERY_RESULT);
				this._lastGpuTimeMs = ns / 1e6;
				result = this._lastGpuTimeMs;
			}
			this.gl.deleteQuery(query);
		} else remaining.push(query);
		this.pending = remaining;
		return result;
	}
	destroy() {
		if (!this.gl) return;
		if (this.activeQuery) {
			if (this.ext) this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
			this.gl.deleteQuery(this.activeQuery);
			this.activeQuery = null;
		}
		for (const query of this.pending) this.gl.deleteQuery(query);
		this.pending = [];
	}
};
//#endregion
export { GPUTimer };

//# sourceMappingURL=gpu-timer.js.map
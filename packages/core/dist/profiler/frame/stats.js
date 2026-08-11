//#region src/profiler/frame/stats.ts
const BUFFER_SIZE = 120;
const hasPerformance = typeof performance !== "undefined";
var FrameStats = class {
	frameTime = 0;
	cpuTime = 0;
	gpuTime = 0;
	minFrameTime = Infinity;
	maxFrameTime = 0;
	avgFrameTime = 0;
	minCpuTime = Infinity;
	maxCpuTime = 0;
	avgCpuTime = 0;
	minGpuTime = Infinity;
	maxGpuTime = 0;
	avgGpuTime = 0;
	smoothedFps = 0;
	totalNodes = 0;
	culledNodes = 0;
	drawCalls = 0;
	scenePictureCacheHit = false;
	scenePictureMode = "none";
	scenePictureMissReason = "";
	scenePictureDrawTime = 0;
	scenePictureRecordTime = 0;
	flushTime = 0;
	frameTimeBuffer = new Float64Array(BUFFER_SIZE);
	cpuTimeBuffer = new Float64Array(BUFFER_SIZE);
	gpuTimeBuffer = new Float64Array(BUFFER_SIZE);
	bufferIndex = 0;
	bufferCount = 0;
	lastTimestamp = 0;
	recordFrame(cpuTimeMs) {
		const now = hasPerformance ? performance.now() : 0;
		if (this.lastTimestamp > 0) this.frameTime = now - this.lastTimestamp;
		this.lastTimestamp = now;
		this.cpuTime = cpuTimeMs;
		const i = this.bufferIndex;
		this.frameTimeBuffer[i] = this.frameTime;
		this.cpuTimeBuffer[i] = this.cpuTime;
		this.gpuTimeBuffer[i] = this.gpuTime;
		this.bufferIndex = (i + 1) % BUFFER_SIZE;
		if (this.bufferCount < BUFFER_SIZE) this.bufferCount++;
		this.computeStats();
	}
	getFrameTimeHistory() {
		return this.frameTimeBuffer;
	}
	getCpuTimeHistory() {
		return this.cpuTimeBuffer;
	}
	getGpuTimeHistory() {
		return this.gpuTimeBuffer;
	}
	getBufferIndex() {
		return this.bufferIndex;
	}
	getBufferCount() {
		return this.bufferCount;
	}
	computeStats() {
		const n = this.bufferCount;
		if (n === 0) return;
		let ftSum = 0;
		let ftMin = Infinity;
		let ftMax = 0;
		let cpuSum = 0;
		let cpuMin = Infinity;
		let cpuMax = 0;
		let gpuSum = 0;
		let gpuMin = Infinity;
		let gpuMax = 0;
		for (let j = 0; j < n; j++) {
			const ft = this.frameTimeBuffer[j];
			ftSum += ft;
			if (ft < ftMin) ftMin = ft;
			if (ft > ftMax) ftMax = ft;
			const cpu = this.cpuTimeBuffer[j];
			cpuSum += cpu;
			if (cpu < cpuMin) cpuMin = cpu;
			if (cpu > cpuMax) cpuMax = cpu;
			const gpu = this.gpuTimeBuffer[j];
			gpuSum += gpu;
			if (gpu < gpuMin) gpuMin = gpu;
			if (gpu > gpuMax) gpuMax = gpu;
		}
		this.minFrameTime = ftMin;
		this.maxFrameTime = ftMax;
		this.avgFrameTime = ftSum / n;
		this.minCpuTime = cpuMin;
		this.maxCpuTime = cpuMax;
		this.avgCpuTime = cpuSum / n;
		this.minGpuTime = gpuMin;
		this.maxGpuTime = gpuMax;
		this.avgGpuTime = gpuSum / n;
		this.smoothedFps = this.avgFrameTime > 0 ? 1e3 / this.avgFrameTime : 0;
	}
};
//#endregion
export { FrameStats };

//# sourceMappingURL=stats.js.map
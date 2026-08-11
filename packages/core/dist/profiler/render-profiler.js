import { createCaptureSession, createFrameCapture } from "./capture-session.js";
import { DrawCallCounter } from "./draw-call-counter.js";
import { FrameStats } from "./frame/stats.js";
import { GPUTimer } from "./gpu-timer.js";
import { HudController } from "./hud-controller.js";
import { PhaseTimer } from "./phase-timer.js";
import { exportSpeedscopeCapture } from "./speedscope-export.js";
//#region src/profiler/render-profiler.ts
const now = typeof performance !== "undefined" ? () => performance.now() : () => 0;
var RenderProfiler = class {
	enabled = false;
	hudVisible = false;
	capturing = false;
	stats = new FrameStats();
	phases = new PhaseTimer();
	gpuTimer;
	drawCallCounter;
	hud;
	captureSession = null;
	lastCapture = null;
	renderStartTime = 0;
	constructor(ck, gl) {
		this.gpuTimer = new GPUTimer(gl);
		this.drawCallCounter = new DrawCallCounter(gl);
		this.hud = new HudController(ck);
	}
	setVisible(visible) {
		this.hudVisible = visible;
		this.enabled = visible;
		this.phases.enabled = this.enabled;
		this.syncInstrumentation();
	}
	toggle() {
		this.setVisible(!this.hudVisible);
	}
	beginFrame() {
		if (!this.enabled) return;
		this.renderStartTime = now();
		this.phases.beginPhase("frame");
		this.gpuTimer.beginFrame();
		this.drawCallCounter.reset();
	}
	endFrame() {
		if (!this.enabled) return;
		this.gpuTimer.endFrame();
		this.gpuTimer.pollResults();
		const cpuTime = now() - this.renderStartTime;
		this.stats.gpuTime = this.gpuTimer.lastGpuTimeMs;
		this.stats.drawCalls = this.drawCallCounter.count;
		this.stats.recordFrame(cpuTime);
		this.phases.endPhase("frame");
	}
	beginPhase(name) {
		if (!this.enabled) return;
		this.phases.beginPhase(name);
	}
	endPhase(name) {
		if (!this.enabled) return;
		this.phases.endPhase(name);
	}
	setNodeCounts(total, culled) {
		this.stats.totalNodes = total;
		this.stats.culledNodes = culled;
	}
	setCacheHit(hit) {
		this.stats.scenePictureCacheHit = hit;
		this.stats.scenePictureMode = hit ? "hit" : "none";
		if (hit) this.stats.scenePictureMissReason = "";
	}
	setScenePictureMode(mode, reason = "") {
		this.stats.scenePictureCacheHit = mode === "hit";
		this.stats.scenePictureMode = mode;
		this.stats.scenePictureMissReason = reason;
	}
	setScenePictureDrawTime(ms) {
		this.stats.scenePictureDrawTime = ms;
	}
	setScenePictureRecordTime(ms) {
		this.stats.scenePictureRecordTime = ms;
	}
	setFlushTime(ms) {
		this.stats.flushTime = ms;
	}
	beginCapture() {
		this.capturing = true;
		this.captureSession = createCaptureSession(now());
		this.syncInstrumentation();
	}
	endCapture() {
		if (!this.capturing || !this.captureSession) return null;
		this.capturing = false;
		const capture = createFrameCapture(this.captureSession, this.stats, this.gpuTimer, now);
		this.lastCapture = capture;
		this.captureSession = null;
		this.syncInstrumentation();
		return capture;
	}
	beginNode(nodeId, name, type, culled) {
		this.captureSession?.stack.begin(nodeId, name, type, culled);
	}
	endNode(drawCallsBefore) {
		this.captureSession?.stack.end(this.drawCallCounter.count - drawCallsBefore);
	}
	getLastCapture() {
		return this.lastCapture;
	}
	exportSpeedscope() {
		return exportSpeedscopeCapture(this.lastCapture);
	}
	downloadSpeedscope() {
		const json = this.exportSpeedscope();
		if (!json || typeof document === "undefined") return;
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `openpencil-frame-${Date.now()}.speedscope.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
	syncInstrumentation() {
		if (this.enabled || this.capturing) this.drawCallCounter.enable();
		else this.drawCallCounter.disable();
	}
	setTypeface(typeface) {
		this.hud.setTypeface(typeface);
	}
	drawHUD(canvas, showRulers) {
		if (!this.hudVisible) return;
		this.hud.draw(canvas, this.stats, this.phases, showRulers);
	}
	destroy() {
		this.gpuTimer.destroy();
		this.drawCallCounter.destroy();
		this.hud.destroy();
		this.phases.clearPhases();
	}
};
//#endregion
export { RenderProfiler };

//# sourceMappingURL=render-profiler.js.map
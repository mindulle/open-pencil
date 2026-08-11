import { CaptureStack } from "./frame/capture.js";
//#region src/profiler/capture-session.ts
function createCaptureSession(frameStart) {
	const stack = new CaptureStack();
	stack.reset(frameStart);
	return {
		stack,
		frameStart
	};
}
function createFrameCapture(session, stats, gpuTimer, now) {
	return {
		timestamp: session.frameStart,
		totalTimeMs: now() - session.frameStart,
		cpuTimeMs: stats.cpuTime,
		gpuTimeMs: gpuTimer.lastGpuTimeMs,
		totalNodes: stats.totalNodes,
		culledNodes: stats.culledNodes,
		drawCalls: stats.drawCalls,
		scenePictureCacheHit: stats.scenePictureCacheHit,
		scenePictureMode: stats.scenePictureMode,
		scenePictureMissReason: stats.scenePictureMissReason,
		scenePictureDrawTimeMs: stats.scenePictureDrawTime,
		scenePictureRecordTimeMs: stats.scenePictureRecordTime,
		flushTimeMs: stats.flushTime,
		rootProfiles: session.stack.getRootProfiles()
	};
}
//#endregion
export { createCaptureSession, createFrameCapture };

//# sourceMappingURL=capture-session.js.map
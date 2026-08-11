import { toSpeedscopeJSON } from "./frame/capture.js";
//#region src/profiler/speedscope-export.ts
function exportSpeedscopeCapture(capture) {
	return capture ? toSpeedscopeJSON(capture) : null;
}
//#endregion
export { exportSpeedscopeCapture };

//# sourceMappingURL=speedscope-export.js.map
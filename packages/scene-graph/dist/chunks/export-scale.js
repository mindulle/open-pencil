//#region src/export-scale.ts
/**
* Bounds for export scale multipliers. A huge multiplier would allocate an
* enormous canvas and crash the renderer, so clamp at every boundary the value
* can enter from: the UI (edits) and the file format (imported/plugin .fig data).
*/
const MIN_EXPORT_SCALE = .01;
const MAX_EXPORT_SCALE = 1024;
function clampExportScale(scale) {
	return Math.min(MAX_EXPORT_SCALE, Math.max(MIN_EXPORT_SCALE, scale));
}
/** Accept a scale only if it is finite and within bounds (no silent clamping). */
function isValidExportScale(scale) {
	return Number.isFinite(scale) && scale >= .01 && scale <= 1024;
}
//#endregion
export { MAX_EXPORT_SCALE, MIN_EXPORT_SCALE, clampExportScale, isValidExportScale };

//# sourceMappingURL=export-scale.js.map
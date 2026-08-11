//#region src/editor/tool-cursor/index.ts
const TOOL_CURSORS = {
	SELECT: "default",
	FRAME: "crosshair",
	SECTION: "crosshair",
	RECTANGLE: "crosshair",
	ELLIPSE: "crosshair",
	LINE: "crosshair",
	POLYGON: "crosshair",
	STAR: "crosshair",
	TEXT: "text",
	PEN: "crosshair",
	HAND: "grab"
};
function toolCursor(tool, override) {
	if (override) return override;
	return TOOL_CURSORS[tool] ?? "default";
}
//#endregion
export { toolCursor };

//# sourceMappingURL=index.js.map
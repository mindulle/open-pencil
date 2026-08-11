import { estimateTextSize, getTextMeasurer } from "../../layout/text-measurement.js";
//#region src/editor/text/auto-resize.ts
const TEXT_AUTO_RESIZE_KEYS = /* @__PURE__ */ new Set([
	"text",
	"fontSize",
	"fontFamily",
	"fontWeight",
	"italic",
	"lineHeight",
	"letterSpacing",
	"styleRuns",
	"fontVariations",
	"fontFeatures",
	"textAutoResize",
	"width",
	"maxLines"
]);
const TEXT_AUTO_WIDTH_KEYS = /* @__PURE__ */ new Set([
	"text",
	"fontSize",
	"fontFamily",
	"fontWeight",
	"italic",
	"letterSpacing",
	"styleRuns",
	"fontVariations",
	"fontFeatures",
	"textAutoResize"
]);
function hasTextAutoResizeChange(changes) {
	return Object.keys(changes).some((key) => TEXT_AUTO_RESIZE_KEYS.has(key));
}
function hasTextAutoWidthChange(changes) {
	return Object.keys(changes).some((key) => TEXT_AUTO_WIDTH_KEYS.has(key));
}
function textAutoResizeChanges(node, changes) {
	if (node?.type !== "TEXT" || !hasTextAutoResizeChange(changes)) return {};
	const next = {
		...node,
		...changes
	};
	const mode = next.textAutoResize;
	if (mode !== "HEIGHT" && mode !== "WIDTH_AND_HEIGHT") return {};
	const maxWidth = mode === "HEIGHT" ? next.width : void 0;
	const measured = getTextMeasurer()?.(next, maxWidth) ?? estimateTextSize(next, maxWidth);
	const resized = {
		figmaDerivedLayout: null,
		figmaDerivedTextGlyphs: null
	};
	if (mode === "WIDTH_AND_HEIGHT" && hasTextAutoWidthChange(changes) && measured.width > 0) resized.width = measured.width;
	if (measured.height > 0) resized.height = measured.height;
	return resized;
}
//#endregion
export { TEXT_AUTO_RESIZE_KEYS, hasTextAutoResizeChange, textAutoResizeChanges };

//# sourceMappingURL=auto-resize.js.map
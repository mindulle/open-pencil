import { normalizeColor } from "../../color/normalize.js";
import { getFillOkHCL, getStrokeOkHCL } from "../../color/okhcl.js";
import { resolveNodeFillColor, resolveNodeStrokeColor } from "../../color/management.js";
//#region src/canvas/renderer/colors.ts
function resolvedVariableColor(color, graph) {
	return {
		color,
		cssColor: "",
		sourceSpace: "srgb",
		targetSpace: graph.documentColorSpace,
		clipped: false
	};
}
function resolveFillColorInfo(fill, fillIndex, node, graph) {
	const varId = node.boundVariables[`fills/${fillIndex}/color`];
	if (varId) {
		const resolved = graph.resolveColorVariableForNode(node.id, varId);
		if (resolved) return resolvedVariableColor(resolved, graph);
	}
	return resolveNodeFillColor(fill, fillIndex, node, { documentColorSpace: graph.documentColorSpace });
}
function resolveFillColor(fill, fillIndex, node, graph) {
	if (!node.boundVariables[`fills/${fillIndex}/color`] && !getFillOkHCL(node, fillIndex)) return normalizeColor(fill.color);
	return resolveFillColorInfo(fill, fillIndex, node, graph).color;
}
function resolveStrokeColorInfo(stroke, strokeIndex, node, graph) {
	const varId = node.boundVariables[`strokes/${strokeIndex}/color`];
	if (varId) {
		const resolved = graph.resolveColorVariableForNode(node.id, varId);
		if (resolved) return resolvedVariableColor(resolved, graph);
	}
	return resolveNodeStrokeColor(stroke, strokeIndex, node, { documentColorSpace: graph.documentColorSpace });
}
function resolveStrokeColor(stroke, strokeIndex, node, graph) {
	if (!node.boundVariables[`strokes/${strokeIndex}/color`] && !getStrokeOkHCL(node, strokeIndex)) return normalizeColor(stroke.color);
	return resolveStrokeColorInfo(stroke, strokeIndex, node, graph).color;
}
//#endregion
export { resolveFillColor, resolveFillColorInfo, resolveStrokeColor, resolveStrokeColorInfo };

//# sourceMappingURL=colors.js.map
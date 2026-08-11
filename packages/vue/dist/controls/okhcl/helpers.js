import { BLACK } from "@open-pencil/core/constants";
import { getFillOkHCL, getStrokeOkHCL, resolveOkHCLForPreview, rgbaToOkHCL, setNodeFillOkHCL, setNodeStrokeOkHCL } from "@open-pencil/core/color";
//#region src/controls/okhcl/helpers.ts
function fieldKey(kind, nodeId, index) {
	return `${kind}:${nodeId}:${index}`;
}
function getFillOkHCLColor(node, index) {
	return node ? getFillOkHCL(node, index)?.color ?? null : null;
}
function getStrokeOkHCLColor(node, index) {
	return node ? getStrokeOkHCL(node, index)?.color ?? null : null;
}
function fallbackFillOkHCL(node, index) {
	return getFillOkHCLColor(node, index) ?? rgbaToOkHCL(node.fills[index]?.color ?? BLACK);
}
function fallbackStrokeOkHCL(node, index) {
	return getStrokeOkHCLColor(node, index) ?? rgbaToOkHCL(node.strokes[index]?.color ?? BLACK);
}
function createOkHCLActions(editor) {
	function ensureFillOkHCL(node, index) {
		editor.updateNodeWithUndo(node.id, setNodeFillOkHCL(node, index, fallbackFillOkHCL(node, index)), "Update fill color model");
	}
	function ensureStrokeOkHCL(node, index) {
		editor.updateNodeWithUndo(node.id, setNodeStrokeOkHCL(node, index, fallbackStrokeOkHCL(node, index)), "Update stroke color model");
	}
	function updateFillOkHCL(node, index, patch) {
		const current = fallbackFillOkHCL(node, index);
		editor.updateNodeWithUndo(node.id, setNodeFillOkHCL(node, index, {
			...current,
			...patch
		}), "Change fill OkHCL");
	}
	function updateStrokeOkHCL(node, index, patch) {
		const current = fallbackStrokeOkHCL(node, index);
		editor.updateNodeWithUndo(node.id, setNodeStrokeOkHCL(node, index, {
			...current,
			...patch
		}), "Change stroke OkHCL");
	}
	return {
		ensureFillOkHCL,
		ensureStrokeOkHCL,
		updateFillOkHCL,
		updateStrokeOkHCL
	};
}
function createOkHCLPreviewHelpers(editor) {
	function getPreviewInfo(okhcl) {
		const documentColorSpace = editor.graph.documentColorSpace;
		if (!okhcl) return {
			previewColorSpace: documentColorSpace,
			clipped: false
		};
		const resolved = resolveOkHCLForPreview(okhcl, { documentColorSpace });
		return {
			previewColorSpace: resolved.targetSpace,
			clipped: resolved.clipped
		};
	}
	function getFillPreviewInfo(node, index) {
		return getPreviewInfo(getFillOkHCLColor(node, index));
	}
	function getStrokePreviewInfo(node, index) {
		return getPreviewInfo(getStrokeOkHCLColor(node, index));
	}
	return {
		getFillPreviewInfo,
		getStrokePreviewInfo
	};
}
function createOkHCLFieldFormats(fieldFormats, ensureFillOkHCL, ensureStrokeOkHCL) {
	function getFieldFormat(node, index, kind) {
		if (!node) return "rgb";
		const key = fieldKey(kind, node.id, index);
		const stored = fieldFormats.value.get(key);
		if (stored) return stored;
		return (kind === "fill" ? getFillOkHCL(node, index) : getStrokeOkHCL(node, index)) ? "okhcl" : "rgb";
	}
	function setFillFieldFormat(node, index, format) {
		fieldFormats.value.set(fieldKey("fill", node.id, index), format);
		if (format === "okhcl") ensureFillOkHCL(node, index);
	}
	function setStrokeFieldFormat(node, index, format) {
		fieldFormats.value.set(fieldKey("stroke", node.id, index), format);
		if (format === "okhcl") ensureStrokeOkHCL(node, index);
	}
	return {
		getFieldFormat,
		setFillFieldFormat,
		setStrokeFieldFormat
	};
}
const OKHCL_FIELD_OPTIONS = [
	{
		value: "rgb",
		label: "RGB"
	},
	{
		value: "hsl",
		label: "HSL"
	},
	{
		value: "hsb",
		label: "HSB"
	},
	{
		value: "okhcl",
		label: "OkHCL"
	}
];
//#endregion
export { OKHCL_FIELD_OPTIONS, createOkHCLActions, createOkHCLFieldFormats, createOkHCLPreviewHelpers, getFillOkHCLColor, getStrokeOkHCLColor };

//# sourceMappingURL=helpers.js.map
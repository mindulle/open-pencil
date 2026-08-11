import { normalizeColor } from "./normalize.js";
import { converter, toGamut } from "culori";
import { copyFill, copyStroke } from "@open-pencil/scene-graph/copy";
//#region src/color/okhcl.ts
const toRGB = converter("rgb");
const toOkHCL = converter("oklch");
const toDisplayableRGB = toGamut("rgb", "oklch");
const OKHCL_PLUGIN_KEY = "okhcl";
function clampUnit(value) {
	if (value < 0) return 0;
	if (value > 1) return 1;
	return value;
}
function normalizeHue(value) {
	const hue = value % 360;
	return hue < 0 ? hue + 360 : hue;
}
function normalizeOkHCLColor(color) {
	return {
		h: normalizeHue(color.h),
		c: Math.max(0, color.c),
		l: clampUnit(color.l),
		a: clampUnit(color.a ?? 1)
	};
}
function okhclToRGBA(color) {
	const normalized = normalizeOkHCLColor(color);
	const rgb = toRGB(toDisplayableRGB({
		mode: "oklch",
		l: normalized.l,
		c: normalized.c,
		h: normalized.h,
		alpha: normalized.a
	}));
	return normalizeColor({
		r: rgb.r,
		g: rgb.g,
		b: rgb.b,
		a: rgb.alpha ?? normalized.a
	});
}
function rgbaToOkHCL(color) {
	const oklch = toOkHCL({
		mode: "rgb",
		r: color.r,
		g: color.g,
		b: color.b,
		alpha: color.a
	});
	return normalizeOkHCLColor({
		h: oklch.h ?? 0,
		c: oklch.c,
		l: oklch.l,
		a: oklch.alpha ?? color.a
	});
}
function serializeOkHCLPayload(payload) {
	return JSON.stringify(payload);
}
function parseOkHCLPayload(value) {
	try {
		const parsed = JSON.parse(value);
		if (parsed.version !== 1) return null;
		if (parsed.kind !== "fill" && parsed.kind !== "stroke") return null;
		if (typeof parsed.index !== "number") return null;
		if (!parsed.color) return null;
		const color = parsed.color;
		if (typeof color.h !== "number" || typeof color.c !== "number" || typeof color.l !== "number") return null;
		return {
			version: 1,
			kind: parsed.kind,
			index: parsed.index,
			color: {
				h: color.h,
				c: color.c,
				l: color.l,
				a: typeof color.a === "number" ? color.a : void 0
			}
		};
	} catch {
		return null;
	}
}
function createOkHCLPayload(kind, index, color) {
	return {
		version: 1,
		kind,
		index,
		color: normalizeOkHCLColor(color)
	};
}
function filterOkHCLPayloads(entries, kind, index) {
	return entries.filter((entry) => {
		const payload = parseOkHCLPayload(entry);
		if (!payload) return true;
		if (kind === void 0 || index === void 0) return false;
		return payload.kind !== kind || payload.index !== index;
	});
}
function setNodeFillOkHCL(node, index, color) {
	const fills = node.fills.map(copyFill);
	if (index < 0 || index >= fills.length) throw new Error(`Fill ${index} not found`);
	const fill = fills[index];
	const rgba = okhclToRGBA(color);
	fills[index] = {
		...fill,
		color: rgba,
		opacity: rgba.a
	};
	const payloads = filterOkHCLPayloads(node.pluginData.map((entry) => entry.value), "fill", index);
	payloads.push(serializeOkHCLPayload(createOkHCLPayload("fill", index, color)));
	return {
		fills,
		pluginData: payloads.map((value) => ({
			pluginId: "open-pencil",
			key: OKHCL_PLUGIN_KEY,
			value
		}))
	};
}
function setNodeStrokeOkHCL(node, index, color) {
	const strokes = node.strokes.map(copyStroke);
	if (index < 0 || index >= strokes.length) throw new Error(`Stroke ${index} not found`);
	const stroke = strokes[index];
	const rgba = okhclToRGBA(color);
	strokes[index] = {
		...stroke,
		color: rgba,
		opacity: rgba.a
	};
	const payloads = filterOkHCLPayloads(node.pluginData.map((entry) => entry.value), "stroke", index);
	payloads.push(serializeOkHCLPayload(createOkHCLPayload("stroke", index, color)));
	return {
		strokes,
		pluginData: payloads.map((value) => ({
			pluginId: "open-pencil",
			key: OKHCL_PLUGIN_KEY,
			value
		}))
	};
}
function clearNodeFillOkHCL(node, index) {
	return { pluginData: filterOkHCLPayloads(node.pluginData.map((entry) => entry.value), "fill", index).map((value) => ({
		pluginId: "open-pencil",
		key: OKHCL_PLUGIN_KEY,
		value
	})) };
}
function clearNodeStrokeOkHCL(node, index) {
	return { pluginData: filterOkHCLPayloads(node.pluginData.map((entry) => entry.value), "stroke", index).map((value) => ({
		pluginId: "open-pencil",
		key: OKHCL_PLUGIN_KEY,
		value
	})) };
}
function getNodeOkHCLPayloads(node) {
	return node.pluginData.filter((entry) => entry.pluginId === "open-pencil" && entry.key === OKHCL_PLUGIN_KEY).map((entry) => parseOkHCLPayload(entry.value)).filter((payload) => payload !== null);
}
function getFillOkHCL(node, index) {
	return getNodeOkHCLPayloads(node).find((payload) => payload.kind === "fill" && payload.index === index) ?? null;
}
function getStrokeOkHCL(node, index) {
	return getNodeOkHCLPayloads(node).find((payload) => payload.kind === "stroke" && payload.index === index) ?? null;
}
//#endregion
export { clearNodeFillOkHCL, clearNodeStrokeOkHCL, getFillOkHCL, getNodeOkHCLPayloads, getStrokeOkHCL, okhclToRGBA, parseOkHCLPayload, rgbaToOkHCL, serializeOkHCLPayload, setNodeFillOkHCL, setNodeStrokeOkHCL };

//# sourceMappingURL=okhcl.js.map
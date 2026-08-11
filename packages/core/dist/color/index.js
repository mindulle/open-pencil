import { BLACK } from "../constants.js";
import { normalizeColor } from "./normalize.js";
import { clearNodeFillOkHCL, clearNodeStrokeOkHCL, getFillOkHCL, getNodeOkHCLPayloads, getStrokeOkHCL, okhclToRGBA, parseOkHCLPayload, rgbaToOkHCL, serializeOkHCLPayload, setNodeFillOkHCL, setNodeStrokeOkHCL } from "./okhcl.js";
import { colorToDisplayCSS, getDefaultRenderColorSpace, resolveNodeFillColor, resolveNodeStrokeColor, resolveOkHCLForPreview, resolveRGBAForPreview } from "./management.js";
import { converter, differenceEuclidean, formatHex, formatHex8, formatRgb, parse } from "culori";
//#region src/color/index.ts
const toRGB = converter("rgb");
function parseColor(input) {
	const parsed = parse(input);
	if (!parsed) return { ...BLACK };
	const rgb = toRGB(parsed);
	return {
		r: rgb.r,
		g: rgb.g,
		b: rgb.b,
		a: parsed.alpha ?? 1
	};
}
function colorToHex(color) {
	return formatHex({
		mode: "rgb",
		r: color.r,
		g: color.g,
		b: color.b
	}).toUpperCase();
}
function colorToHex8(color, alpha) {
	const a = alpha ?? color.a;
	if (a >= 1) return colorToHex(color);
	return formatHex8({
		mode: "rgb",
		r: color.r,
		g: color.g,
		b: color.b,
		alpha: a
	}).toUpperCase();
}
function colorToHexRaw(color) {
	return colorToHex(color).slice(1);
}
function colorToRgba255(color) {
	return {
		r: Math.round(color.r * 255),
		g: Math.round(color.g * 255),
		b: Math.round(color.b * 255),
		a: color.a
	};
}
function colorToCSS(color) {
	return formatRgb({
		mode: "rgb",
		r: color.r,
		g: color.g,
		b: color.b,
		alpha: color.a
	});
}
function colorToCSSCompact(color) {
	const { r, g, b } = colorToRgba255(color);
	const a = Number(color.a.toFixed(3));
	if (a >= 1) return `rgb(${r},${g},${b})`;
	return `rgba(${r},${g},${b},${a})`;
}
function rgba255ToColor(r, g, b, a = 1) {
	return {
		r: r / 255,
		g: g / 255,
		b: b / 255,
		a
	};
}
function colorToFill(color) {
	const rgba = typeof color === "string" ? parseColor(color) : color;
	return {
		type: "SOLID",
		color: {
			r: rgba.r,
			g: rgba.g,
			b: rgba.b,
			a: rgba.a
		},
		opacity: rgba.a,
		visible: true
	};
}
const euclideanRGB255 = differenceEuclidean("rgb");
function colorDistance(c1, c2) {
	return euclideanRGB255({
		mode: "rgb",
		r: c1.r,
		g: c1.g,
		b: c1.b
	}, {
		mode: "rgb",
		r: c2.r,
		g: c2.g,
		b: c2.b
	}) * 255;
}
//#endregion
export { clearNodeFillOkHCL, clearNodeStrokeOkHCL, colorDistance, colorToCSS, colorToCSSCompact, colorToDisplayCSS, colorToFill, colorToHex, colorToHex8, colorToHexRaw, colorToRgba255, getDefaultRenderColorSpace, getFillOkHCL, getNodeOkHCLPayloads, getStrokeOkHCL, normalizeColor, okhclToRGBA, parseColor, parseOkHCLPayload, resolveNodeFillColor, resolveNodeStrokeColor, resolveOkHCLForPreview, resolveRGBAForPreview, rgba255ToColor, rgbaToOkHCL, serializeOkHCLPayload, setNodeFillOkHCL, setNodeStrokeOkHCL };

//# sourceMappingURL=index.js.map
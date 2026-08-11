import { normalizeColor } from "./normalize.js";
import { getFillOkHCL, getStrokeOkHCL } from "./okhcl.js";
import { converter, formatCss, formatRgb, inGamut, toGamut } from "culori";
//#region src/color/management.ts
const DEFAULT_COLOR_SPACE = "display-p3";
const toRGB = converter("rgb");
const toP3 = converter("p3");
const toDisplayableRGB = toGamut("rgb", "oklch");
const toDisplayableP3 = toGamut("p3", "oklch");
const isDisplayableRGB = inGamut("rgb");
const isDisplayableP3 = inGamut("p3");
function normalizeOkLCH(color) {
	const hue = color.h % 360;
	return {
		mode: "oklch",
		l: Math.max(0, Math.min(1, color.l)),
		c: Math.max(0, color.c),
		h: hue < 0 ? hue + 360 : hue,
		alpha: Math.max(0, Math.min(1, color.a ?? 1))
	};
}
function resolveTargetSpace(options) {
	return options?.colorSpace ?? options?.documentColorSpace ?? DEFAULT_COLOR_SPACE;
}
function formatCSSForTarget(color, targetSpace) {
	if (targetSpace === "display-p3") {
		const p3 = toP3({
			mode: "rgb",
			r: color.r,
			g: color.g,
			b: color.b,
			alpha: color.a
		});
		return formatCss({
			mode: "p3",
			r: p3.r,
			g: p3.g,
			b: p3.b,
			alpha: p3.alpha ?? color.a
		});
	}
	return formatRgb({
		mode: "rgb",
		r: color.r,
		g: color.g,
		b: color.b,
		alpha: color.a
	});
}
function resolveOkHCLForPreview(color, options) {
	const oklch = normalizeOkLCH(color);
	const targetSpace = resolveTargetSpace(options);
	if (targetSpace === "display-p3") {
		const clipped = !isDisplayableP3(oklch);
		const p3 = toP3(toDisplayableP3(oklch));
		const rgb = toRGB({
			mode: "p3",
			r: p3.r,
			g: p3.g,
			b: p3.b,
			alpha: p3.alpha ?? oklch.alpha
		});
		return {
			color: normalizeColor({
				r: rgb.r,
				g: rgb.g,
				b: rgb.b,
				a: rgb.alpha ?? oklch.alpha
			}),
			cssColor: formatCss({
				mode: "p3",
				r: p3.r,
				g: p3.g,
				b: p3.b,
				alpha: p3.alpha ?? oklch.alpha
			}),
			sourceSpace: "oklch",
			targetSpace,
			clipped
		};
	}
	const clipped = !isDisplayableRGB(oklch);
	const rgb = toRGB(toDisplayableRGB(oklch));
	const resolved = normalizeColor({
		r: rgb.r,
		g: rgb.g,
		b: rgb.b,
		a: rgb.alpha ?? oklch.alpha
	});
	return {
		color: resolved,
		cssColor: formatRgb({
			mode: "rgb",
			r: resolved.r,
			g: resolved.g,
			b: resolved.b,
			alpha: resolved.a
		}),
		sourceSpace: "oklch",
		targetSpace,
		clipped
	};
}
function resolveRGBAForPreview(color, options) {
	const resolved = normalizeColor(color);
	const targetSpace = resolveTargetSpace(options);
	return {
		color: resolved,
		cssColor: formatCSSForTarget(resolved, targetSpace),
		sourceSpace: "srgb",
		targetSpace,
		clipped: false
	};
}
function resolveNodeFillColor(fill, fillIndex, node, options) {
	const okhcl = getFillOkHCL(node, fillIndex)?.color;
	if (okhcl) return resolveOkHCLForPreview(okhcl, options);
	return resolveRGBAForPreview(fill.color, options);
}
function resolveNodeStrokeColor(stroke, strokeIndex, node, options) {
	const okhcl = getStrokeOkHCL(node, strokeIndex)?.color;
	if (okhcl) return resolveOkHCLForPreview(okhcl, options);
	return resolveRGBAForPreview(stroke.color, options);
}
function colorToDisplayCSS(color, options) {
	return resolveRGBAForPreview(color, options).cssColor;
}
function getDefaultRenderColorSpace() {
	return DEFAULT_COLOR_SPACE;
}
//#endregion
export { colorToDisplayCSS, getDefaultRenderColorSpace, resolveNodeFillColor, resolveNodeStrokeColor, resolveOkHCLForPreview, resolveRGBAForPreview };

//# sourceMappingURL=management.js.map
import { convertToHsb, convertToHsl, convertToRgb } from "reka-ui";
import { colorToCSS, okhclToRGBA, rgba255ToColor, rgbaToOkHCL } from "@open-pencil/core/color";
//#region src/controls/color-model/model.ts
const OKHCL_CHROMA_MAX = .4;
const OKHCL_LIGHTNESS_MID = .5;
const OKHCL_HUE_PREVIEW_MIN_CHROMA = .15;
const OKHCL_HUE_PREVIEW_FALLBACK_LIGHTNESS = .7;
function createColorModelValue(color, okhcl) {
	const rekaColor = sceneToRekaColor(color);
	return {
		rekaColor,
		rgb: convertToRgb(rekaColor),
		hsl: convertToHsl(rekaColor),
		hsb: convertToHsb(rekaColor),
		okhcl: applyOkHCLPatch(okhcl ?? rgbaToOkHCL(color), {})
	};
}
function sceneToRekaColor(color) {
	return {
		space: "rgb",
		r: color.r * 255,
		g: color.g * 255,
		b: color.b * 255,
		alpha: color.a
	};
}
function rekaToSceneColor(color) {
	const rgb = convertToRgb(color);
	return rgba255ToColor(rgb.r, rgb.g, rgb.b, rgb.alpha);
}
function withHue(model, hue) {
	return rekaToSceneColor({
		...model.hsb,
		h: normalizeHue(hue),
		s: model.hsb.s === 0 ? 100 : model.hsb.s,
		b: model.hsb.b === 0 ? 100 : model.hsb.b
	});
}
function withAlpha(color, alpha) {
	return {
		...color,
		a: clampUnit(alpha)
	};
}
function withRGBChannel(color, channel, value255) {
	return {
		...color,
		[channel]: clampUnit(value255 / 255)
	};
}
function withHSLChannel(model, channel, value) {
	const next = {
		...model.hsl,
		[channel]: channel === "h" ? normalizeHue(value) : clampPercent(value)
	};
	if (channel === "s" && model.hsl.s === 0 && clampPercent(value) > 0) {
		if (model.hsl.l >= 100 || model.hsl.l <= 0) next.l = 50;
	}
	return rekaToSceneColor(next);
}
function withHSBChannel(model, channel, value) {
	return rekaToSceneColor({
		...model.hsb,
		[channel]: channel === "h" ? normalizeHue(value) : clampPercent(value)
	});
}
function normalizeOkHCLPatch(channel, value) {
	switch (channel) {
		case "h": return { h: normalizeHue(value) };
		case "c": return { c: Math.max(0, value) };
		case "l": return { l: clampUnit(value) };
		case "a": return { a: clampUnit(value) };
		default: throw new Error("Unsupported OkHCL channel");
	}
}
function applyOkHCLPatch(color, patch) {
	return {
		h: normalizeHue(patch.h ?? color.h),
		c: Math.max(0, patch.c ?? color.c),
		l: clampUnit(patch.l ?? color.l),
		a: clampUnit(patch.a ?? color.a ?? 1)
	};
}
function createSliderPreviewModel(model) {
	return {
		hue: rekaToSceneColor({
			...model.hsb,
			s: 100,
			b: 100
		}),
		hslSaturation: rekaToSceneColor(model.hsl),
		hslLightness: rekaToSceneColor(model.hsl),
		hsbSaturation: rekaToSceneColor(model.hsb),
		hsbBrightness: rekaToSceneColor(model.hsb)
	};
}
function createOkHCLSliderPreviewModel(color) {
	return {
		okhclHue: okhclToRGBA({
			...color,
			c: Math.max(color.c, OKHCL_HUE_PREVIEW_MIN_CHROMA),
			l: color.l <= 0 || color.l >= 1 ? OKHCL_HUE_PREVIEW_FALLBACK_LIGHTNESS : color.l
		}),
		okhclChroma: okhclToRGBA(color),
		okhclLightness: okhclToRGBA(color)
	};
}
function createSliderGradientModel(model) {
	const hslGray = rekaToSceneColor({
		...model.hsl,
		s: 0
	});
	const hslColor = rekaToSceneColor({
		...model.hsl,
		s: 100
	});
	const hslBlack = rekaToSceneColor({
		...model.hsl,
		l: 0
	});
	const hslMid = rekaToSceneColor({
		...model.hsl,
		l: 50
	});
	const hslWhite = rekaToSceneColor({
		...model.hsl,
		l: 100
	});
	const hsbGray = rekaToSceneColor({
		...model.hsb,
		s: 0
	});
	const hsbColor = rekaToSceneColor({
		...model.hsb,
		s: 100
	});
	const hsbBlack = rekaToSceneColor({
		...model.hsb,
		b: 0
	});
	const hsbBright = rekaToSceneColor({
		...model.hsb,
		b: 100
	});
	return {
		hslSaturation: gradient(hslGray, hslColor),
		hslLightness: gradient(hslBlack, hslMid, hslWhite),
		hsbSaturation: gradient(hsbGray, hsbColor),
		hsbBrightness: gradient(hsbBlack, hsbBright)
	};
}
function createOkHCLSliderGradientModel(color) {
	return {
		okhclChroma: gradient(okhclToRGBA({
			...color,
			c: 0
		}), okhclToRGBA({
			...color,
			c: OKHCL_CHROMA_MAX
		})),
		okhclLightness: gradient(okhclToRGBA({
			...color,
			l: 0
		}), okhclToRGBA({
			...color,
			l: OKHCL_LIGHTNESS_MID
		}), okhclToRGBA({
			...color,
			l: 1
		}))
	};
}
function colorsEqual(left, right) {
	return left.r === right.r && left.g === right.g && left.b === right.b && left.a === right.a;
}
function okhclPatchChangesColor(color, patch) {
	return Object.entries(patch).some(([key, value]) => color[key] !== value);
}
function applySolidFillColor(fill, color) {
	return {
		...fill,
		color,
		opacity: color.a
	};
}
function applySolidStrokeColor(color) {
	return {
		color,
		opacity: color.a
	};
}
function toPercent(value) {
	return Math.round(value * 100);
}
function fromPercent(value) {
	return clampUnit(value / 100);
}
function gradient(...colors) {
	return `background: linear-gradient(to right, ${colors.map(colorToCSS).join(", ")});`;
}
function clampUnit(value) {
	return Math.max(0, Math.min(1, value));
}
function clampPercent(value) {
	return Math.max(0, Math.min(100, value));
}
function normalizeHue(value) {
	const hue = value % 360;
	return hue < 0 ? hue + 360 : hue;
}
//#endregion
export { applyOkHCLPatch, applySolidFillColor, applySolidStrokeColor, colorsEqual, createColorModelValue, createOkHCLSliderGradientModel, createOkHCLSliderPreviewModel, createSliderGradientModel, createSliderPreviewModel, fromPercent, normalizeOkHCLPatch, okhclPatchChangesColor, rekaToSceneColor, toPercent, withAlpha, withHSBChannel, withHSLChannel, withHue, withRGBChannel };

//# sourceMappingURL=model.js.map
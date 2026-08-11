import { TRANSPARENT } from "../constants.js";
import { colorToFill, parseColor } from "../color/index.js";
//#region src/design-jsx/paints.ts
const DEFAULT_GRADIENT_TRANSFORM = {
	m00: 1,
	m01: 0,
	m02: 0,
	m10: 0,
	m11: 1,
	m12: 0
};
function toColor(color) {
	return typeof color === "string" ? parseColor(color) : color;
}
function toStop(stop) {
	if ("color" in stop) return {
		color: toColor(stop.color),
		position: stop.position
	};
	return {
		color: toColor(stop[0]),
		position: stop[1]
	};
}
function solid(color, options = {}) {
	const fill = colorToFill(color);
	return {
		...fill,
		opacity: options.opacity ?? fill.opacity,
		visible: options.visible ?? true,
		blendMode: options.blendMode
	};
}
function gradient(type, stops, options = {}) {
	return {
		type,
		color: { ...TRANSPARENT },
		opacity: options.opacity ?? 1,
		visible: options.visible ?? true,
		blendMode: options.blendMode,
		gradientStops: stops.map(toStop),
		gradientTransform: options.transform ?? DEFAULT_GRADIENT_TRANSFORM
	};
}
function linearGradient(stops, options) {
	return gradient("GRADIENT_LINEAR", stops, options);
}
function radialGradient(stops, options) {
	return gradient("GRADIENT_RADIAL", stops, options);
}
function angularGradient(stops, options) {
	return gradient("GRADIENT_ANGULAR", stops, options);
}
function diamondGradient(stops, options) {
	return gradient("GRADIENT_DIAMOND", stops, options);
}
//#endregion
export { angularGradient, diamondGradient, gradient, linearGradient, radialGradient, solid };

//# sourceMappingURL=paints.js.map
import { TRANSPARENT } from "../constants.js";
import { parseColor } from "../color/index.js";
//#region src/design-jsx/effects.ts
function toColor(color) {
	if (color === void 0) return { ...TRANSPARENT };
	return typeof color === "string" ? parseColor(color) : color;
}
function shadowEffect(type, options) {
	return {
		type,
		color: toColor(options.color ?? "rgba(0, 0, 0, 0.25)"),
		offset: options.offset ?? {
			x: options.x ?? 0,
			y: options.y ?? 4
		},
		radius: options.radius ?? 8,
		spread: options.spread ?? 0,
		visible: options.visible ?? true,
		blendMode: options.blendMode,
		showShadowBehindNode: options.showShadowBehindNode
	};
}
function blurEffect(type, radiusOrOptions = 8) {
	const options = typeof radiusOrOptions === "number" ? { radius: radiusOrOptions } : radiusOrOptions;
	return {
		type,
		color: { ...TRANSPARENT },
		offset: {
			x: 0,
			y: 0
		},
		radius: options.radius ?? 8,
		spread: 0,
		visible: options.visible ?? true
	};
}
function dropShadow(options = {}) {
	return shadowEffect("DROP_SHADOW", options);
}
function innerShadow(options = {}) {
	return shadowEffect("INNER_SHADOW", options);
}
function layerBlur(radiusOrOptions) {
	return blurEffect("LAYER_BLUR", radiusOrOptions);
}
function backgroundBlur(radiusOrOptions) {
	return blurEffect("BACKGROUND_BLUR", radiusOrOptions);
}
function foregroundBlur(radiusOrOptions) {
	return blurEffect("FOREGROUND_BLUR", radiusOrOptions);
}
//#endregion
export { backgroundBlur, dropShadow, foregroundBlur, innerShadow, layerBlur };

//# sourceMappingURL=effects.js.map
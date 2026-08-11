//#region src/canvas/blend.ts
function figmaBlendModeToSkia(ck, mode) {
	switch (mode) {
		case "DARKEN": return ck.BlendMode.Darken;
		case "MULTIPLY": return ck.BlendMode.Multiply;
		case "COLOR_BURN": return ck.BlendMode.ColorBurn;
		case "LIGHTEN": return ck.BlendMode.Lighten;
		case "SCREEN": return ck.BlendMode.Screen;
		case "COLOR_DODGE": return ck.BlendMode.ColorDodge;
		case "OVERLAY": return ck.BlendMode.Overlay;
		case "SOFT_LIGHT": return ck.BlendMode.SoftLight;
		case "HARD_LIGHT": return ck.BlendMode.HardLight;
		case "DIFFERENCE": return ck.BlendMode.Difference;
		case "EXCLUSION": return ck.BlendMode.Exclusion;
		case "HUE": return ck.BlendMode.Hue;
		case "SATURATION": return ck.BlendMode.Saturation;
		case "COLOR": return ck.BlendMode.Color;
		case "LUMINOSITY": return ck.BlendMode.Luminosity;
		default: return ck.BlendMode.SrcOver;
	}
}
function needsIsolatedBlendLayer(mode) {
	return mode !== void 0 && mode !== "NORMAL" && mode !== "PASS_THROUGH";
}
//#endregion
export { figmaBlendModeToSkia, needsIsolatedBlendLayer };

//# sourceMappingURL=blend.js.map
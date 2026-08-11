//#region src/lint/presets.ts
const recommended = { rules: {
	"no-hardcoded-colors": "warning",
	"no-default-names": "info",
	"prefer-auto-layout": "info",
	"consistent-spacing": "warning",
	"consistent-radius": "info",
	"color-contrast": "error",
	"touch-target-size": "warning",
	"text-style-required": "info",
	"min-text-size": "warning",
	"no-hidden-layers": "info",
	"no-deeply-nested": "warning",
	"no-empty-frames": "info",
	"pixel-perfect": "info",
	"no-groups": "info",
	"effect-style-required": "info",
	"no-mixed-styles": "warning",
	"no-detached-instances": "off"
} };
const strict = { rules: Object.fromEntries(Object.keys(recommended.rules).map((id) => [id, id === "color-contrast" ? "error" : "warning"])) };
const accessibility = { rules: {
	"color-contrast": "error",
	"touch-target-size": "error",
	"min-text-size": "error",
	"no-hardcoded-colors": "off",
	"no-default-names": "off",
	"prefer-auto-layout": "off",
	"consistent-spacing": "off",
	"consistent-radius": "off",
	"text-style-required": "off",
	"no-hidden-layers": "off",
	"no-deeply-nested": "off",
	"no-empty-frames": "off",
	"pixel-perfect": "off",
	"no-groups": "off",
	"effect-style-required": "off",
	"no-mixed-styles": "off",
	"no-detached-instances": "off"
} };
const presets = {
	recommended,
	strict,
	accessibility
};
//#endregion
export { accessibility, presets, recommended, strict };

//# sourceMappingURL=presets.js.map
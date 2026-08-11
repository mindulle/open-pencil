import { BLACK } from "../constants.js";
//#region src/color/normalize.ts
function normalizeColor(color) {
	if (!color) return { ...BLACK };
	return {
		r: color.r ?? 0,
		g: color.g ?? 0,
		b: color.b ?? 0,
		a: color.a ?? 1
	};
}
//#endregion
export { normalizeColor };

//# sourceMappingURL=normalize.js.map
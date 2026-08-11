import { BLACK } from "@open-pencil/scene-graph/constants";
import { converter, parse } from "culori";
//#region src/color.ts
const rgbConverter = converter("rgb");
function parseColor(input) {
	const parsedColor = parse(input);
	const rgbColor = parsedColor ? rgbConverter(parsedColor) : null;
	return rgbColor ? {
		r: rgbColor.r,
		g: rgbColor.g,
		b: rgbColor.b,
		a: parsedColor?.alpha ?? 1
	} : structuredClone(BLACK);
}
//#endregion
export { parseColor };

//# sourceMappingURL=color.js.map
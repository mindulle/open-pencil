import { IS_BROWSER } from "./constants.js";
import CanvasKitInit from "canvaskit-wasm";
//#region src/canvaskit.ts
let instance = null;
async function getCanvasKit(options) {
	if (instance) return instance;
	const defaultLocate = (file) => {
		if (!IS_BROWSER) {
			const ckPath = import.meta.resolve("canvaskit-wasm");
			return decodeURIComponent(new URL(file, ckPath).pathname);
		}
		const base = "env" in import.meta ? import.meta.env.BASE_URL : "/";
		return `${base === "/" ? "" : base.replace(/\/$/, "")}/${file}`;
	};
	instance = await CanvasKitInit({ locateFile: options?.locateFile ?? defaultLocate });
	return instance;
}
//#endregion
export { getCanvasKit };

//# sourceMappingURL=canvaskit.js.map
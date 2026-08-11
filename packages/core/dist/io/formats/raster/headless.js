import { renderNodesToImage, renderThumbnail } from "./render.js";
import { SkiaRenderer } from "../../../canvas/renderer.js";
//#region src/io/formats/raster/headless.ts
let cachedCk = null;
let cachedRenderer = null;
async function initCanvasKit() {
	if (cachedCk) return cachedCk;
	const CanvasKitInit = (await import("canvaskit-wasm/full")).default;
	const ckPath = import.meta.resolve("canvaskit-wasm/full");
	const binDir = new URL(".", ckPath).pathname;
	cachedCk = await CanvasKitInit({ locateFile: (file) => binDir + file });
	return cachedCk;
}
async function getRenderer() {
	const ck = await initCanvasKit();
	if (cachedRenderer) return {
		ck,
		renderer: cachedRenderer
	};
	const surface = ck.MakeSurface(1, 1);
	if (!surface) throw new Error("Failed to create CanvasKit surface");
	const renderer = new SkiaRenderer(ck, surface);
	renderer.viewportWidth = 1;
	renderer.viewportHeight = 1;
	renderer.dpr = 1;
	await renderer.loadFonts();
	cachedRenderer = renderer;
	return {
		ck,
		renderer
	};
}
async function headlessRenderNodes(graph, pageId, nodeIds, options = {}) {
	const { ck, renderer } = await getRenderer();
	renderer.invalidateAllPictures();
	const restoreTextMeasurer = await renderer.prepareForExport(graph, pageId, nodeIds);
	try {
		return renderNodesToImage(ck, renderer, graph, pageId, nodeIds, {
			scale: options.scale ?? 1,
			format: options.format ?? "PNG",
			quality: options.quality,
			trimTransparent: options.trimTransparent
		});
	} finally {
		restoreTextMeasurer();
	}
}
async function headlessRenderThumbnail(graph, pageId, width, height) {
	const { ck, renderer } = await getRenderer();
	renderer.invalidateAllPictures();
	return renderThumbnail(ck, renderer, graph, pageId, width, height);
}
//#endregion
export { headlessRenderNodes, headlessRenderThumbnail, initCanvasKit };

//# sourceMappingURL=headless.js.map
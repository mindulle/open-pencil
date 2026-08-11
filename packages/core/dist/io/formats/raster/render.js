import { extractExportGraph, findPageId } from "../../subgraph.js";
import { getWorldMatrix } from "@open-pencil/scene-graph";
import { computeDescendantVisualBounds } from "@open-pencil/scene-graph/geometry";
//#region src/io/formats/raster/render.ts
function ensureSinglePageSelection(graph, pageId, nodeIds) {
	return nodeIds.every((nodeId) => findPageId(graph, nodeId) === pageId);
}
function nodeNeedsSceneBackdrop(graph, nodeId) {
	const node = graph.getNode(nodeId);
	if (!node) return false;
	if (node.blendMode !== "NORMAL" && node.blendMode !== "PASS_THROUGH") return true;
	if (node.effects.some((effect) => effect.visible && effect.type === "BACKGROUND_BLUR")) return true;
	return node.childIds.some((childId) => nodeNeedsSceneBackdrop(graph, childId));
}
function computeContentBounds(graph, nodeIds) {
	return computeDescendantVisualBounds(nodeIds, (id) => graph.getNode(id), (id) => graph.getAbsolutePosition(id));
}
function ckImageFormat(ck, format) {
	switch (format) {
		case "JPG": return ck.ImageFormat.JPEG;
		case "WEBP": return ck.ImageFormat.WEBP;
		default: return ck.ImageFormat.PNG;
	}
}
function findAlphaBounds(ck, canvas, width, height) {
	const pixels = canvas.readPixels(0, 0, {
		alphaType: ck.AlphaType.Unpremul,
		colorType: ck.ColorType.RGBA_8888,
		colorSpace: ck.ColorSpace.SRGB,
		width,
		height
	});
	if (!pixels) return null;
	let minX = width;
	let minY = height;
	let maxX = -1;
	let maxY = -1;
	for (let y = 0; y < height; y++) {
		const row = y * width * 4;
		for (let x = 0; x < width; x++) {
			if (pixels[row + x * 4 + 3] === 0) continue;
			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x + 1);
			maxY = Math.max(maxY, y + 1);
		}
	}
	if (maxX < minX || maxY < minY) return null;
	return {
		minX,
		minY,
		maxX,
		maxY
	};
}
const MIN_TRANSPARENT_TRIM_INSET = 2;
function shouldTrimAlphaBounds(alphaBounds, width, height) {
	return Math.max(alphaBounds.minX, alphaBounds.minY, width - alphaBounds.maxX, height - alphaBounds.maxY) >= MIN_TRANSPARENT_TRIM_INSET;
}
function renderToSurface(ck, renderer, renderGraph, pageId, width, height, format, quality, setup, trimTransparent = false) {
	const renderScale = 2;
	const renderWidth = width * renderScale;
	const renderHeight = height * renderScale;
	const pixels = ck.Malloc(Uint8Array, renderWidth * renderHeight * 4);
	const surface = ck.MakeRasterDirectSurface({
		alphaType: ck.AlphaType.Premul,
		colorType: ck.ColorType.RGBA_8888,
		colorSpace: ck.ColorSpace.SRGB,
		width: renderWidth,
		height: renderHeight
	}, pixels, renderWidth * 4);
	if (!surface) {
		ck.Free(pixels);
		return null;
	}
	try {
		const canvas = surface.getCanvas();
		canvas.scale(renderScale, renderScale);
		setup(canvas);
		renderer.renderSceneToCanvas(canvas, renderGraph, pageId);
		surface.flush();
		const highResImage = surface.makeImageSnapshot();
		const downsamplePixels = ck.Malloc(Uint8Array, width * height * 4);
		const downsampleSurface = ck.MakeRasterDirectSurface({
			alphaType: ck.AlphaType.Premul,
			colorType: ck.ColorType.RGBA_8888,
			colorSpace: ck.ColorSpace.SRGB,
			width,
			height
		}, downsamplePixels, width * 4);
		if (!downsampleSurface) {
			ck.Free(downsamplePixels);
			highResImage.delete();
			return null;
		}
		const downsampleCanvas = downsampleSurface.getCanvas();
		downsampleCanvas.clear(ck.TRANSPARENT);
		downsampleCanvas.drawImageRectOptions(highResImage, ck.LTRBRect(0, 0, renderWidth, renderHeight), ck.LTRBRect(0, 0, width, height), ck.FilterMode.Linear, ck.MipmapMode.None, null);
		downsampleSurface.flush();
		highResImage.delete();
		const foundAlphaBounds = trimTransparent ? findAlphaBounds(ck, downsampleCanvas, width, height) : null;
		const alphaBounds = foundAlphaBounds && shouldTrimAlphaBounds(foundAlphaBounds, width, height) ? foundAlphaBounds : null;
		const image = alphaBounds ? downsampleSurface.makeImageSnapshot([
			alphaBounds.minX,
			alphaBounds.minY,
			alphaBounds.maxX,
			alphaBounds.maxY
		]) : downsampleSurface.makeImageSnapshot();
		const encoded = image.encodeToBytes(ckImageFormat(ck, format), quality);
		let resultBytes = encoded ? new Uint8Array(encoded) : null;
		if (!resultBytes && (format === "JPG" || format === "WEBP")) {
			const exportWidth = alphaBounds ? alphaBounds.maxX - alphaBounds.minX : width;
			const exportHeight = alphaBounds ? alphaBounds.maxY - alphaBounds.minY : height;
			const exportMinX = alphaBounds ? alphaBounds.minX : 0;
			const exportMinY = alphaBounds ? alphaBounds.minY : 0;
			const rawPixels = downsampleCanvas.readPixels(exportMinX, exportMinY, {
				alphaType: ck.AlphaType.Unpremul,
				colorType: ck.ColorType.RGBA_8888,
				colorSpace: ck.ColorSpace.SRGB,
				width: exportWidth,
				height: exportHeight
			});
			if (rawPixels instanceof Uint8Array) resultBytes = renderer.encodeRasterFallback(rawPixels, exportWidth, exportHeight, format, quality);
		}
		image.delete();
		downsampleSurface.delete();
		ck.Free(downsamplePixels);
		return resultBytes;
	} finally {
		surface.delete();
		ck.Free(pixels);
	}
}
function prepareSelectionRenderGraph(source, renderGraph, pageId, nodeIds) {
	const page = renderGraph.getNode(pageId);
	if (!page) return;
	page.childIds = nodeIds.filter((nodeId) => renderGraph.getNode(nodeId) !== void 0);
	for (const nodeId of page.childIds) {
		const node = renderGraph.getNode(nodeId);
		const sourceNode = source.getNode(nodeId);
		if (!node || !sourceNode) continue;
		if (sourceNode.parentId === pageId) continue;
		const world = getWorldMatrix(sourceNode, source);
		node.parentId = pageId;
		applyWorldTransform(node, world);
	}
	renderGraph.clearAbsPosCache();
}
function applyWorldTransform(node, matrix) {
	const flipX = matrix[0] * matrix[4] - matrix[1] * matrix[3] < 0;
	const rotation = Math.atan2(matrix[3], flipX ? matrix[4] : matrix[0]);
	const cos = Math.cos(rotation);
	const sin = Math.sin(rotation);
	const centerX = node.width / 2;
	const centerY = node.height / 2;
	const m00 = flipX ? -cos : cos;
	const m01 = flipX ? sin : -sin;
	const m10 = sin;
	const m11 = cos;
	node.x = matrix[2] - centerX + m00 * centerX + m01 * centerY;
	node.y = matrix[5] - centerY + m10 * centerX + m11 * centerY;
	node.rotation = rotation * (180 / Math.PI);
	node.flipX = flipX;
	node.flipY = false;
}
function renderNodesToImage(ck, renderer, graph, pageId, nodeIds, options) {
	if (!ensureSinglePageSelection(graph, pageId, nodeIds)) throw new Error("Raster export selection must stay on a single page");
	const bounds = computeContentBounds(graph, nodeIds);
	if (!bounds) return null;
	const contentW = bounds.maxX - bounds.minX;
	const contentH = bounds.maxY - bounds.minY;
	if (contentW <= 0 || contentH <= 0) return null;
	const pixelW = Math.ceil(contentW * options.scale);
	const pixelH = Math.ceil(contentH * options.scale);
	if (pixelW <= 0 || pixelH <= 0) return null;
	const extracted = extractExportGraph(graph, {
		scope: "selection",
		nodeIds
	});
	if (!extracted.pageId) return null;
	const renderGraph = nodeIds.some((nodeId) => nodeNeedsSceneBackdrop(graph, nodeId)) ? graph : extracted.graph;
	const renderPageId = renderGraph === graph ? pageId : extracted.pageId;
	if (renderGraph !== graph) prepareSelectionRenderGraph(graph, renderGraph, renderPageId, nodeIds);
	const quality = options.quality ?? (options.format === "PNG" ? 100 : 90);
	return renderToSurface(ck, renderer, renderGraph, renderPageId, pixelW, pixelH, options.format, quality, (canvas) => {
		canvas.clear(ck.TRANSPARENT);
		canvas.scale(options.scale, options.scale);
		canvas.translate(-bounds.minX, -bounds.minY);
	}, options.trimTransparent);
}
function renderThumbnail(ck, renderer, graph, pageId, width, height) {
	const page = graph.getNode(pageId);
	if (!page || page.childIds.length === 0) return null;
	const bounds = computeContentBounds(graph, page.childIds);
	if (!bounds) return null;
	const contentW = bounds.maxX - bounds.minX;
	const contentH = bounds.maxY - bounds.minY;
	if (contentW <= 0 || contentH <= 0) return null;
	const scale = Math.min(width / contentW, height / contentH, 2);
	return renderToSurface(ck, renderer, graph, pageId, width, height, "PNG", 100, (canvas) => {
		canvas.clear(ck.Color4f(renderer.pageColor.r, renderer.pageColor.g, renderer.pageColor.b, 1));
		const offsetX = (width - contentW * scale) / 2 - bounds.minX * scale;
		const offsetY = (height - contentH * scale) / 2 - bounds.minY * scale;
		canvas.translate(offsetX, offsetY);
		canvas.scale(scale, scale);
	});
}
//#endregion
export { computeContentBounds, prepareSelectionRenderGraph, renderNodesToImage, renderThumbnail };

//# sourceMappingURL=render.js.map
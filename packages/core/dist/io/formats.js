import { extractExportGraph, findPageId } from "./subgraph.js";
import { renderNodesToImage } from "./formats/raster/render.js";
import { headlessRenderNodes } from "./formats/raster/headless.js";
import { renderNodesToSVG } from "./formats/svg/export.js";
import { sceneNodeToJSX, selectionToJSX } from "./formats/jsx/export.js";
import { exportFigFile } from "./formats/fig/export.js";
import { parseFigFile } from "./formats/fig/read.js";
import { parsePenFile } from "@open-pencil/pen";
//#region src/io/formats.ts
function lowerExt(name) {
	return /\.([^.]+)$/.exec(name.toLowerCase())?.[1] ?? "";
}
function ensureSingleNode(target) {
	if (target.scope === "node") return target.nodeId;
	if (target.scope === "selection" && target.nodeIds.length === 1) return target.nodeIds[0];
	return null;
}
function resolveExportNodes(request) {
	switch (request.target.scope) {
		case "document": {
			const page = request.graph.getPages()[0];
			return {
				pageId: page.id,
				nodeIds: page.childIds
			};
		}
		case "page": {
			const page = request.graph.getNode(request.target.pageId);
			if (!page) return null;
			return {
				pageId: page.id,
				nodeIds: page.childIds
			};
		}
		case "selection": {
			const first = request.target.nodeIds[0];
			if (!first) return null;
			const pageId = findPageId(request.graph, first);
			if (!pageId) return null;
			if (!request.target.nodeIds.every((nodeId) => findPageId(request.graph, nodeId) === pageId)) throw new Error("Export selection must stay on a single page");
			return {
				pageId,
				nodeIds: request.target.nodeIds
			};
		}
		case "node": return resolveExportNodes({
			...request,
			target: {
				scope: "selection",
				nodeIds: [request.target.nodeId]
			}
		});
		default: return null;
	}
}
async function renderRaster(request, options, context) {
	const target = resolveExportNodes(request);
	if (!target) return null;
	const scale = options.scale ?? 1;
	if (context?.canvasKit && context.renderer) return renderNodesToImage(context.canvasKit, context.renderer, request.graph, target.pageId, target.nodeIds, {
		scale,
		format: options.format,
		quality: options.quality,
		trimTransparent: request.target.scope === "page" || request.target.scope === "document"
	});
	return headlessRenderNodes(request.graph, target.pageId, target.nodeIds, {
		scale,
		format: options.format,
		quality: options.quality,
		trimTransparent: request.target.scope === "page" || request.target.scope === "document"
	});
}
function rasterFormat(format) {
	const extension = format === "JPG" ? "jpg" : format.toLowerCase();
	let mimeType = "image/png";
	if (format === "JPG") mimeType = "image/jpeg";
	else if (format === "WEBP") mimeType = "image/webp";
	return {
		id: extension,
		label: format,
		role: "derived-export",
		category: "raster",
		extensions: [extension],
		mimeTypes: [mimeType],
		support: {
			exportDocument: true,
			exportPage: true,
			exportSelection: true,
			exportNode: true
		},
		exportOptions: {
			scale: true,
			quality: format !== "PNG",
			colorSpace: false
		},
		async exportContent(request, options, context) {
			const data = await renderRaster(request, {
				format,
				scale: options?.scale,
				quality: options?.quality
			}, context);
			if (!data) throw new Error("Nothing to export");
			return {
				format: extension,
				mimeType,
				extension,
				data
			};
		}
	};
}
const figFormat = {
	id: "fig",
	label: "OpenPencil Document",
	role: "native-document",
	category: "document",
	extensions: ["fig"],
	mimeTypes: ["application/octet-stream"],
	support: {
		readDocument: true,
		writeDocument: true,
		exportDocument: true,
		exportPage: true,
		exportSelection: true,
		exportNode: true
	},
	exportOptions: {
		scale: false,
		quality: false
	},
	matchesFile(fileName) {
		return lowerExt(fileName) === "fig";
	},
	async readDocument(input) {
		const data = input.data.slice().buffer;
		return {
			graph: await parseFigFile(data, { populate: "first-page" }),
			sourceFormat: "fig"
		};
	},
	async writeDocument(graph, options, context) {
		return {
			format: "fig",
			mimeType: "application/octet-stream",
			extension: "fig",
			data: await exportFigFile(graph, context?.canvasKit, context?.renderer, options?.thumbnailPageId, options?.renderThumbnail ?? false)
		};
	},
	async exportContent(request, options, context) {
		const extracted = extractExportGraph(request.graph, request.target);
		return {
			format: "fig",
			mimeType: "application/octet-stream",
			extension: "fig",
			data: await exportFigFile(extracted.graph, context?.canvasKit, context?.renderer, options?.thumbnailPageId ?? extracted.pageId ?? void 0, options?.renderThumbnail ?? false)
		};
	}
};
const penFormat = {
	id: "pen",
	label: "Pencil Document",
	role: "interchange-document",
	category: "document",
	extensions: ["pen"],
	mimeTypes: ["application/json", "text/plain"],
	support: { readDocument: true },
	matchesFile(fileName, mimeType) {
		return lowerExt(fileName) === "pen" || mimeType === "application/json";
	},
	async readDocument(input) {
		return {
			graph: parsePenFile(new TextDecoder().decode(input.data)),
			sourceFormat: "pen"
		};
	}
};
const pngFormat = rasterFormat("PNG");
const jpgFormat = rasterFormat("JPG");
const webpFormat = rasterFormat("WEBP");
const svgFormat = {
	id: "svg",
	label: "SVG",
	role: "derived-export",
	category: "vector",
	extensions: ["svg"],
	mimeTypes: ["image/svg+xml"],
	support: {
		exportDocument: true,
		exportPage: true,
		exportSelection: true,
		exportNode: true
	},
	exportOptions: {
		scale: false,
		quality: false,
		colorSpace: true
	},
	async exportContent(request, options) {
		const target = resolveExportNodes(request);
		if (!target) throw new Error("Nothing to export");
		const data = renderNodesToSVG(request.graph, target.pageId, target.nodeIds, options);
		if (!data) throw new Error("Nothing to export");
		return {
			format: "svg",
			mimeType: "image/svg+xml",
			extension: "svg",
			data,
			encoding: "utf8"
		};
	}
};
const pdfFormat = {
	id: "pdf",
	label: "PDF",
	role: "derived-export",
	category: "vector",
	extensions: ["pdf"],
	mimeTypes: ["application/pdf"],
	support: {
		exportDocument: true,
		exportPage: true,
		exportSelection: true,
		exportNode: true
	},
	exportOptions: {
		scale: false,
		quality: false
	},
	async exportContent(request) {
		const target = resolveExportNodes(request);
		if (!target) throw new Error("Nothing to export");
		const { renderNodesToPDF } = await import("./formats/pdf/index.js");
		const data = await renderNodesToPDF(request.graph, target.pageId, target.nodeIds);
		if (!data) throw new Error("Nothing to export");
		return {
			format: "pdf",
			mimeType: "application/pdf",
			extension: "pdf",
			data
		};
	}
};
/**
* Every top-level frame becomes a slide, so a PPTX document export spans all
* pages — the shared resolver only reaches the first one.
*/
function resolvePPTXExportNodes(request) {
	if (request.target.scope !== "document") return resolveExportNodes(request);
	const pages = request.graph.getPages();
	if (!pages.length) return null;
	return {
		pageId: pages[0].id,
		nodeIds: pages.flatMap((page) => page.childIds)
	};
}
const pptxFormat = {
	id: "pptx",
	label: "PowerPoint",
	role: "derived-export",
	category: "print",
	extensions: ["pptx"],
	mimeTypes: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
	support: {
		exportDocument: true,
		exportPage: true,
		exportSelection: true,
		exportNode: true
	},
	exportOptions: {
		scale: false,
		quality: false
	},
	async exportContent(request, options, context) {
		const target = resolvePPTXExportNodes(request);
		if (!target) throw new Error("Nothing to export");
		const { renderNodesToPPTX } = await import("./formats/pptx/index.js");
		const data = await renderNodesToPPTX(request.graph, target.pageId, target.nodeIds, {
			...options,
			context: options?.context ?? context
		});
		if (!data) throw new Error("Nothing to export");
		return {
			format: "pptx",
			mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
			extension: "pptx",
			data
		};
	}
};
const jsxFormat = {
	id: "jsx",
	label: "JSX",
	role: "derived-export",
	category: "code",
	extensions: ["jsx"],
	mimeTypes: ["text/plain", "text/jsx"],
	support: {
		exportSelection: true,
		exportNode: true
	},
	exportOptions: {
		scale: false,
		quality: false
	},
	async exportContent(request, options) {
		const format = options?.format ?? "openpencil";
		const nodeId = ensureSingleNode(request.target);
		let data = "";
		if (nodeId) data = sceneNodeToJSX(nodeId, request.graph, format);
		else if (request.target.scope === "selection") data = selectionToJSX(request.target.nodeIds, request.graph, format);
		if (!data) throw new Error("Nothing to export");
		return {
			format: "jsx",
			mimeType: "text/plain",
			extension: "jsx",
			data,
			encoding: "utf8"
		};
	}
};
const BUILTIN_IO_FORMATS = [
	figFormat,
	penFormat,
	pngFormat,
	jpgFormat,
	webpFormat,
	svgFormat,
	pdfFormat,
	pptxFormat,
	jsxFormat
];
//#endregion
export { BUILTIN_IO_FORMATS, figFormat, jpgFormat, jsxFormat, pdfFormat, penFormat, pngFormat, pptxFormat, svgFormat, webpFormat };

//# sourceMappingURL=formats.js.map
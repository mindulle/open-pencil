import { computeContentBounds } from "../raster/render.js";
import { renderNodesToSVG } from "../svg/export.js";
//#region src/io/formats/pdf/export.ts
async function renderNodesToPDF(graph, pageId, nodeIds, options = {}) {
	const svg = renderNodesToSVG(graph, pageId, nodeIds, { xmlDeclaration: false });
	if (!svg) return null;
	const bounds = computeContentBounds(graph, nodeIds);
	if (!bounds) return null;
	const width = bounds.maxX - bounds.minX;
	const height = bounds.maxY - bounds.minY;
	if (width <= 0 || height <= 0) return null;
	const [{ jsPDF }, { svg2pdf }] = await Promise.all([import("jspdf"), import("svg2pdf.js")]);
	const doc = new jsPDF({
		orientation: width > height ? "landscape" : "portrait",
		unit: "pt",
		format: [width, height],
		compress: true
	});
	if (options.title) doc.setProperties({ title: options.title });
	const svgDoc = new DOMParser().parseFromString(svg, "image/svg+xml");
	const svgElement = svgDoc.documentElement;
	if (svgDoc.querySelector("parsererror")) return null;
	await svg2pdf(svgElement, doc, {
		x: 0,
		y: 0,
		width,
		height
	});
	const buffer = doc.output("arraybuffer");
	return new Uint8Array(buffer);
}
//#endregion
export { renderNodesToPDF };

//# sourceMappingURL=export.js.map
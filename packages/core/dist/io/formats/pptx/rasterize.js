import { extractExportGraph } from "../../subgraph.js";
//#region src/io/formats/pptx/rasterize.ts
/** Builds a rasterizer that keeps fallback subtrees transparent and isolated. */
function makeIsolatedRasterize(graph, context) {
	return async (nodeIds, scale, options) => {
		const extracted = extractExportGraph(graph, {
			scope: "selection",
			nodeIds
		});
		if (!extracted.pageId || extracted.nodeIds.length === 0) return null;
		if (options?.paintOnly) for (const nodeId of extracted.nodeIds) {
			const node = extracted.graph.getNode(nodeId);
			if (node) node.childIds = [];
		}
		const targets = new Set(extracted.nodeIds);
		for (const nodeId of extracted.nodeIds) {
			let cursor = extracted.graph.getNode(nodeId)?.parentId ?? null;
			while (cursor) {
				const ancestor = extracted.graph.getNode(cursor);
				if (!ancestor || targets.has(ancestor.id)) break;
				ancestor.fills = [];
				ancestor.strokes = [];
				ancestor.effects = [];
				cursor = ancestor.parentId;
			}
		}
		const raster = await import("../raster/index.js");
		const ck = context?.canvasKit;
		const renderer = context?.renderer;
		if (ck && renderer) return raster.renderNodesToImage(ck, renderer, extracted.graph, extracted.pageId, extracted.nodeIds, {
			scale,
			format: "PNG"
		});
		return raster.headlessRenderNodes(extracted.graph, extracted.pageId, extracted.nodeIds, {
			scale,
			format: "PNG"
		});
	};
}
//#endregion
export { makeIsolatedRasterize };

//# sourceMappingURL=rasterize.js.map
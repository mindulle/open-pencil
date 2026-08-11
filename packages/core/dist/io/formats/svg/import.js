import { createFlattenedVectorFrameChildren } from "../../../vector/vectorize/placement.js";
import { parseSVGSize } from "./metadata.js";
import { svgToVectorPaths } from "../../../vector/vectorize/svg/to-vectors.js";
//#region src/io/formats/svg/import.ts
function prepareSVGImport(source, options = {}) {
	const { width, height } = parseSVGSize(source);
	const vectorized = svgToVectorPaths(source, {
		width,
		height
	}, {
		defaultColor: options.defaultColor,
		preserveAspectRatio: true
	});
	return vectorized ? {
		width,
		height,
		...vectorized
	} : null;
}
function createSVGNodesFromImport(graph, parentId, data, options = {}) {
	const frame = graph.createNode("FRAME", parentId, {
		name: options.name ?? "SVG",
		x: options.x ?? 0,
		y: options.y ?? 0,
		width: data.width,
		height: data.height,
		fills: []
	});
	try {
		createFlattenedVectorFrameChildren(graph, frame.id, data, {
			x: frame.x,
			y: frame.y,
			width: frame.width,
			height: frame.height,
			offsetX: 0,
			offsetY: 0
		});
		if (graph.getChildren(frame.id).length > 0) return frame;
		graph.deleteNode(frame.id);
		return null;
	} catch (error) {
		graph.deleteNode(frame.id);
		throw error;
	}
}
function createSVGNodes(graph, parentId, source, options = {}) {
	const data = prepareSVGImport(source, options);
	return data ? createSVGNodesFromImport(graph, parentId, data, options) : null;
}
//#endregion
export { createSVGNodes, createSVGNodesFromImport, prepareSVGImport };

//# sourceMappingURL=import.js.map
import { makeBooleanSourcePath, makeStrokeOutlinePath, nodePathTransform } from "./boolean.js";
import { copyFills } from "@open-pencil/scene-graph/copy";
import { parseSVGPath } from "@open-pencil/scene-graph/parse-path";
//#region src/canvas/flatten.ts
function nodesToVectorProps(renderer, graph, nodes, makeNodePath) {
	const path = new renderer.ck.Path();
	for (const node of nodes) {
		const nodePath = makeNodePath(renderer, graph, node);
		if (!nodePath) {
			path.delete();
			return null;
		}
		nodePath.transform(nodePathTransform(renderer, node));
		path.addPath(nodePath);
		nodePath.delete();
	}
	const bounds = path.getBounds();
	if (bounds[2] <= bounds[0] || bounds[3] <= bounds[1]) {
		path.delete();
		return null;
	}
	path.transform(renderer.ck.Matrix.translated(-bounds[0], -bounds[1]));
	const vectorNetwork = parseSVGPath(path.toSVGString());
	path.delete();
	return {
		name: "Flatten",
		x: bounds[0],
		y: bounds[1],
		width: bounds[2] - bounds[0],
		height: bounds[3] - bounds[1],
		fills: copyFills(nodes[0].fills),
		vectorNetwork
	};
}
function flattenNodesToVectorProps(renderer, graph, nodes) {
	return nodesToVectorProps(renderer, graph, nodes, (r, g, node) => makeBooleanSourcePath(r, node, g));
}
function outlineStrokeNodesToVectorProps(renderer, graph, nodes) {
	return nodesToVectorProps(renderer, graph, nodes, (r, g, node) => makeStrokeOutlinePath(r, node, g));
}
//#endregion
export { flattenNodesToVectorProps, outlineStrokeNodesToVectorProps };

//# sourceMappingURL=flatten.js.map
import { copyStrokes } from "@open-pencil/scene-graph/copy";
//#region src/figma-api/strokes.ts
function setFirstStrokeWeight(graph, node, weight) {
	if (node.strokes.length === 0) return;
	const strokes = copyStrokes(node.strokes);
	strokes[0].weight = weight;
	graph.updateNode(node.id, { strokes });
}
function setFirstStrokeAlign(graph, node, align) {
	if (node.strokes.length === 0) return;
	const strokes = copyStrokes(node.strokes);
	strokes[0].align = align;
	graph.updateNode(node.id, { strokes });
}
function setIndependentStrokeWeight(graph, nodeId, field, value) {
	graph.updateNode(nodeId, {
		[field]: value,
		independentStrokeWeights: true
	});
}
//#endregion
export { setFirstStrokeAlign, setFirstStrokeWeight, setIndependentStrokeWeight };

//# sourceMappingURL=strokes.js.map
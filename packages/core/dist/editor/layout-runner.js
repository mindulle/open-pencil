import { computeAllLayouts, computeLayout } from "../layout.js";
//#region src/editor/layout-runner.ts
function createLayoutRunner(getGraph) {
	function runLayoutForNode(id) {
		const graph = getGraph();
		const node = graph.getNode(id);
		if (!node) return;
		computeAllLayouts(graph, id);
		let parent = node.parentId ? graph.getNode(node.parentId) : void 0;
		while (parent) {
			if (parent.layoutMode !== "NONE") computeLayout(graph, parent.id);
			parent = parent.parentId ? graph.getNode(parent.parentId) : void 0;
		}
	}
	return { runLayoutForNode };
}
//#endregion
export { createLayoutRunner };

//# sourceMappingURL=layout-runner.js.map
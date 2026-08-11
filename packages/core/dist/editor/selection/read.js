//#region src/editor/selection/read.ts
function createSelectionReadActions(ctx) {
	function getSelectedNodes() {
		const nodes = [];
		for (const id of ctx.state.selectedIds) {
			const node = ctx.graph.getNode(id);
			if (node) nodes.push({ ...node });
		}
		return nodes;
	}
	function getSelectedNode() {
		if (ctx.state.selectedIds.size !== 1) return void 0;
		const id = ctx.state.selectedIds.values().next().value;
		const node = ctx.graph.getNode(id);
		return node ? { ...node } : void 0;
	}
	function getLayerTree() {
		return ctx.graph.flattenTree(ctx.state.currentPageId);
	}
	return {
		getSelectedNodes,
		getSelectedNode,
		getLayerTree
	};
}
//#endregion
export { createSelectionReadActions };

//# sourceMappingURL=read.js.map
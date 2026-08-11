//#region src/editor/structure/state.ts
function createStructureStateActions(ctx) {
	function toggleNodeVisibility(id) {
		const node = ctx.graph.getNode(id);
		if (!node) return;
		ctx.graph.updateNode(id, { visible: !node.visible });
		if (node.parentId) ctx.runLayoutForNode(node.parentId);
	}
	function toggleNodeLock(id) {
		const node = ctx.graph.getNode(id);
		if (!node) return;
		ctx.graph.updateNode(id, { locked: !node.locked });
	}
	function toggleVisibility() {
		for (const id of ctx.state.selectedIds) toggleNodeVisibility(id);
	}
	function toggleLock() {
		for (const id of ctx.state.selectedIds) toggleNodeLock(id);
	}
	return {
		toggleNodeVisibility,
		toggleNodeLock,
		toggleVisibility,
		toggleLock
	};
}
//#endregion
export { createStructureStateActions };

//# sourceMappingURL=state.js.map
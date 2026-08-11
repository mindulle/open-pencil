//#region src/editor/structure/selection.ts
function topLevelSelectedNodes(selectedNodes) {
	const selectedSet = new Set(selectedNodes.map((node) => node.id));
	return selectedNodes.filter((node) => !node.parentId || !selectedSet.has(node.parentId));
}
function selectedNodesInSharedParent(ctx, selectedNodes) {
	const topLevel = topLevelSelectedNodes(selectedNodes);
	if (topLevel.length === 0 || topLevel.some((node) => node.locked)) return null;
	const parentId = topLevel[0].parentId ?? ctx.state.currentPageId;
	if (!topLevel.every((node) => (node.parentId ?? ctx.state.currentPageId) === parentId)) return null;
	const parent = ctx.graph.getNode(parentId);
	return parent ? {
		topLevel,
		parentId,
		parent
	} : null;
}
//#endregion
export { selectedNodesInSharedParent, topLevelSelectedNodes };

//# sourceMappingURL=selection.js.map
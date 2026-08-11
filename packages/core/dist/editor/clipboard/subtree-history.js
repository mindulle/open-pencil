//#region src/editor/clipboard/subtree-history.ts
function collectSubtrees(graph, rootIds) {
	const result = [];
	function walk(id) {
		const node = graph.getNode(id);
		if (!node) return;
		result.push(structuredClone(node));
		for (const childId of node.childIds) walk(childId);
	}
	for (const id of rootIds) walk(id);
	return result;
}
function snapshotSubtree(graph, rootId) {
	const index = /* @__PURE__ */ new Map();
	const walk = (id) => {
		const node = graph.getNode(id);
		if (!node) return;
		index.set(id, structuredClone(node));
		for (const childId of node.childIds) walk(childId);
	};
	walk(rootId);
	return index;
}
function restoreSubtree(graph, snapshot, parentId, index) {
	const { parentId: _parentId, childIds, ...rest } = snapshot;
	graph.createNode(snapshot.type, parentId, {
		...rest,
		id: snapshot.id
	});
	for (const childId of childIds) {
		const child = index.get(childId);
		if (child) restoreSubtree(graph, child, snapshot.id, index);
	}
}
//#endregion
export { collectSubtrees, restoreSubtree, snapshotSubtree };

//# sourceMappingURL=subtree-history.js.map
import { restoreSubtree } from "./subtree-history.js";
//#region src/editor/clipboard/history.ts
function recreateSnapshots(ctx, snapshots, pageId) {
	for (const snapshot of snapshots) ctx.graph.createNode(snapshot.type, snapshot.parentId ?? pageId, {
		...snapshot,
		childIds: []
	});
}
function deleteIds(ctx, ids) {
	for (const id of [...ids].reverse()) ctx.graph.deleteNode(id);
}
function restoreDeletedEntries(ctx, entries) {
	for (const { id, parentId, index, subtree } of [...entries].reverse()) {
		const rootSnap = subtree.get(id);
		if (rootSnap) restoreSubtree(ctx.graph, rootSnap, parentId, subtree);
		if (index >= 0) ctx.graph.reorderChild(id, parentId, index);
	}
}
//#endregion
export { deleteIds, recreateSnapshots, restoreDeletedEntries };

//# sourceMappingURL=history.js.map
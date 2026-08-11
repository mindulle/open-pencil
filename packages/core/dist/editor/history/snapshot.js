import { computeAllLayouts } from "../../layout.js";
//#region src/editor/history/snapshot.ts
function snapshotPage(graph, pageId) {
	const snapshot = /* @__PURE__ */ new Map();
	const walk = (id) => {
		const node = graph.getNode(id);
		if (!node) return;
		snapshot.set(id, structuredClone(node));
		for (const childId of node.childIds) walk(childId);
	};
	walk(pageId);
	return snapshot;
}
function restorePageFromSnapshot(ctx, snapshot) {
	const pageId = ctx.state.currentPageId;
	const page = ctx.graph.getNode(pageId);
	const pageSnap = snapshot.get(pageId);
	if (!page || !pageSnap) return;
	for (const childId of page.childIds.slice()) ctx.graph.deleteNode(childId);
	restoreChildren(ctx.graph, snapshot, pageId, pageSnap.childIds);
	ctx.graph.clearAbsPosCache();
	computeAllLayouts(ctx.graph, pageId);
	ctx.setSelectedIds(/* @__PURE__ */ new Set());
	ctx.state.hoveredNodeId = null;
	ctx.requestRender();
}
function restoreChildren(graph, snapshot, parentId, childIds) {
	for (const childId of childIds) {
		const snap = snapshot.get(childId);
		if (!snap) continue;
		const { parentId: _snapParentId, childIds: snapChildIds, ...rest } = snap;
		graph.createNode(snap.type, parentId, {
			...rest,
			childIds: []
		});
		graph.reorderChild(snap.id, parentId, childIds.indexOf(childId));
		restoreChildren(graph, snapshot, snap.id, snapChildIds);
	}
}
//#endregion
export { restorePageFromSnapshot, snapshotPage };

//# sourceMappingURL=snapshot.js.map
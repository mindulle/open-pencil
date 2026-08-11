import { computeAllLayouts } from "../../layout.js";
import { collectSubtrees, snapshotSubtree } from "./subtree-history.js";
import { deleteIds, recreateSnapshots, restoreDeletedEntries } from "./history.js";
import { computeAbsoluteBounds } from "@open-pencil/scene-graph/geometry";
//#region src/editor/clipboard/paste-replace.ts
function selectedReplacementTargets(ctx) {
	const selected = [...ctx.state.selectedIds].map((id) => ctx.graph.getNode(id)).filter((node) => node != null && !node.locked);
	const selectedSet = new Set(selected.map((node) => node.id));
	return selected.filter((node) => !node.parentId || !selectedSet.has(node.parentId));
}
function reorderCreatedAtReplacementIndex(ctx, created, deleted) {
	const insertParentId = deleted[0]?.parentId;
	if (!insertParentId) return;
	const insertIndex = deleted[0]?.index ?? 0;
	for (let i = 0; i < created.length; i++) ctx.graph.reorderChild(created[i], insertParentId, insertIndex + i);
}
function pushPasteReplaceUndo(ctx, created, deleted, prevSelection) {
	const createdSnapshots = collectSubtrees(ctx.graph, created);
	const pageId = ctx.state.currentPageId;
	ctx.undo.push({
		label: "Paste to replace",
		forward: () => {
			for (const { id } of deleted) ctx.graph.deleteNode(id);
			recreateSnapshots(ctx, createdSnapshots, pageId);
			reorderCreatedAtReplacementIndex(ctx, created, deleted);
			computeAllLayouts(ctx.graph, pageId);
			ctx.setSelectedIds(new Set(created));
		},
		inverse: () => {
			deleteIds(ctx, created);
			restoreDeletedEntries(ctx, deleted);
			computeAllLayouts(ctx.graph, pageId);
			ctx.setSelectedIds(prevSelection);
		}
	});
}
function replaceTargetsWithCreated(ctx, centerNodesAt, created, targets, prevSelection) {
	if (created.length === 0 || targets.length === 0) return false;
	const deleted = targets.map((node) => {
		const parentId = node.parentId ?? ctx.state.currentPageId;
		const parent = ctx.graph.getNode(parentId);
		return {
			id: node.id,
			parentId,
			index: parent?.childIds.indexOf(node.id) ?? -1,
			subtree: snapshotSubtree(ctx.graph, node.id)
		};
	});
	const targetBounds = computeAbsoluteBounds(targets, (id) => ctx.graph.getAbsolutePosition(id));
	centerNodesAt(created, targetBounds.x + targetBounds.width / 2, targetBounds.y + targetBounds.height / 2);
	reorderCreatedAtReplacementIndex(ctx, created, deleted);
	for (const { id } of deleted) ctx.graph.deleteNode(id);
	computeAllLayouts(ctx.graph, ctx.state.currentPageId);
	ctx.setSelectedIds(new Set(created));
	pushPasteReplaceUndo(ctx, created, deleted, prevSelection);
	return true;
}
//#endregion
export { replaceTargetsWithCreated, selectedReplacementTargets };

//# sourceMappingURL=paste-replace.js.map
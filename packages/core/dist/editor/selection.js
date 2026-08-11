import { createSelectionContainerActions } from "./selection/container.js";
import { createSelectionHitTestActions } from "./selection/hit-test.js";
import { createSelectionOverlayActions } from "./selection/overlays.js";
import { createSelectionReadActions } from "./selection/read.js";
//#region src/editor/selection.ts
function createSelectionActions(ctx) {
	function select(ids, additive = false) {
		if (additive) {
			const next = new Set(ctx.state.selectedIds);
			for (const id of ids) if (next.has(id)) next.delete(id);
			else next.add(id);
			ctx.setSelectedIds(next);
		} else ctx.setSelectedIds(new Set(ids));
	}
	function clearSelection() {
		ctx.setSelectedIds(/* @__PURE__ */ new Set());
	}
	function selectAll() {
		const children = ctx.graph.getChildren(ctx.state.currentPageId);
		ctx.setSelectedIds(new Set(children.map((n) => n.id)));
	}
	function selectInverse() {
		const children = ctx.graph.getChildren(ctx.state.currentPageId);
		ctx.setSelectedIds(new Set(children.filter((node) => !ctx.state.selectedIds.has(node.id)).map((node) => node.id)));
	}
	const containerActions = createSelectionContainerActions(ctx);
	const hitTestActions = createSelectionHitTestActions(ctx, select, clearSelection);
	const overlayActions = createSelectionOverlayActions(ctx);
	const readActions = createSelectionReadActions(ctx);
	return {
		select,
		clearSelection,
		selectAll,
		selectInverse,
		...overlayActions,
		...containerActions,
		...readActions,
		...hitTestActions
	};
}
//#endregion
export { createSelectionActions };

//# sourceMappingURL=selection.js.map
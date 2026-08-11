//#region src/editor/selection/hit-test.ts
function createSelectionHitTestActions(ctx, select, clearSelection) {
	function hitTestAtPoint(cx, cy, deep = false) {
		if (!ctx.getRenderer()) return null;
		const scopeId = ctx.state.enteredContainerId;
		if (scopeId) if (!ctx.graph.getNode(scopeId)) ctx.state.enteredContainerId = null;
		else return deep ? ctx.graph.hitTestDeep(cx, cy, scopeId) : ctx.graph.hitTest(cx, cy, scopeId);
		return deep ? ctx.graph.hitTestDeep(cx, cy, ctx.state.currentPageId) : ctx.graph.hitTest(cx, cy, ctx.state.currentPageId);
	}
	function selectAtPoint(cx, cy) {
		const hit = hitTestAtPoint(cx, cy);
		if (hit) {
			if (!ctx.state.selectedIds.has(hit.id)) select([hit.id]);
		} else clearSelection();
	}
	return {
		hitTestAtPoint,
		selectAtPoint
	};
}
//#endregion
export { createSelectionHitTestActions };

//# sourceMappingURL=hit-test.js.map
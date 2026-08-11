//#region src/editor/selection/container.ts
function createSelectionContainerActions(ctx) {
	function validateEnteredContainer() {
		if (ctx.state.enteredContainerId && !ctx.graph.getNode(ctx.state.enteredContainerId)) ctx.state.enteredContainerId = null;
	}
	function enterContainer(id) {
		ctx.state.enteredContainerId = id;
	}
	function exitContainer() {
		const entered = ctx.state.enteredContainerId;
		if (!entered) return;
		const parentId = ctx.graph.getNode(entered)?.parentId;
		if (parentId && parentId !== ctx.state.currentPageId) ctx.state.enteredContainerId = parentId;
		else ctx.state.enteredContainerId = null;
		ctx.setSelectedIds(new Set(entered ? [entered] : []));
	}
	return {
		validateEnteredContainer,
		enterContainer,
		exitContainer
	};
}
//#endregion
export { createSelectionContainerActions };

//# sourceMappingURL=container.js.map
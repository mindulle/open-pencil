//#region src/editor/components/focus.ts
function createComponentFocusActions(ctx) {
	async function focusComponent(componentId, switchPage) {
		const component = ctx.graph.getNode(componentId);
		if (component?.type !== "COMPONENT" && component?.type !== "COMPONENT_SET") return;
		let page = component;
		while (page && page.type !== "CANVAS") page = page.parentId ? ctx.graph.getNode(page.parentId) : void 0;
		if (page && page.id !== ctx.state.currentPageId) await switchPage(page.id);
		ctx.setSelectedIds(/* @__PURE__ */ new Set([component.id]));
		const abs = ctx.graph.getAbsolutePosition(component.id);
		const { width: viewW, height: viewH } = ctx.getViewportSize();
		ctx.state.panX = viewW / 2 - (abs.x + component.width / 2) * ctx.state.zoom;
		ctx.state.panY = viewH / 2 - (abs.y + component.height / 2) * ctx.state.zoom;
		ctx.requestRender();
	}
	async function goToMainComponent(selectedNode, switchPage) {
		if (!selectedNode?.componentId) return;
		const main = ctx.graph.getMainComponent(selectedNode.id);
		if (!main) return;
		await focusComponent(main.id, switchPage);
	}
	return {
		focusComponent,
		goToMainComponent
	};
}
//#endregion
export { createComponentFocusActions };

//# sourceMappingURL=focus.js.map
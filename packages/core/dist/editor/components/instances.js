//#region src/editor/components/instances.ts
function createInstanceSnapshot(instance) {
	const { childIds: _childIds, parentId: _parentId, type: _type, ...snapshot } = instance;
	return snapshot;
}
function createComponentInstanceActions(ctx) {
	function createInstanceFromComponent(componentId, x, y, parentId = ctx.state.currentPageId) {
		const component = ctx.graph.getNode(componentId);
		if (component?.type !== "COMPONENT") return null;
		const previousSelection = new Set(ctx.state.selectedIds);
		const instance = ctx.graph.createInstance(componentId, parentId, {
			x: x ?? component.x + component.width + 40,
			y: y ?? component.y
		});
		if (!instance) return null;
		const instanceId = instance.id;
		const snapshot = createInstanceSnapshot(instance);
		ctx.setSelectedIds(/* @__PURE__ */ new Set([instanceId]));
		ctx.undo.push({
			label: "Create instance",
			forward: () => {
				ctx.graph.createInstance(componentId, parentId, { ...snapshot });
				ctx.setSelectedIds(/* @__PURE__ */ new Set([instanceId]));
			},
			inverse: () => {
				ctx.graph.deleteNode(instanceId);
				ctx.setSelectedIds(new Set(previousSelection));
			}
		});
		return instanceId;
	}
	function detachInstance(selectedNode) {
		if (selectedNode?.type !== "INSTANCE") return;
		const prevComponentId = selectedNode.componentId;
		ctx.graph.detachInstance(selectedNode.id);
		ctx.setSelectedIds(/* @__PURE__ */ new Set([selectedNode.id]));
		ctx.undo.push({
			label: "Detach instance",
			forward: () => {
				ctx.graph.detachInstance(selectedNode.id);
				ctx.requestRender();
			},
			inverse: () => {
				ctx.graph.updateNode(selectedNode.id, {
					type: "INSTANCE",
					componentId: prevComponentId,
					overrides: {}
				});
			}
		});
	}
	return {
		createInstanceFromComponent,
		detachInstance
	};
}
//#endregion
export { createComponentInstanceActions };

//# sourceMappingURL=instances.js.map
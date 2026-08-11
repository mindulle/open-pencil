//#region src/editor/graph-events.ts
const GEOMETRY_CACHE_KEYS = /* @__PURE__ */ new Set([
	"vectorNetwork",
	"fillGeometry",
	"strokeGeometry"
]);
const NODE_PICTURE_STABLE_PREVIEW_KEYS = /* @__PURE__ */ new Set([
	"x",
	"y",
	"rotation",
	"flipX",
	"flipY",
	"parentId"
]);
function rendererInvalidationForChanges(changes, options) {
	const keys = Object.keys(changes);
	return {
		geometryCache: keys.some((key) => GEOMETRY_CACHE_KEYS.has(key)),
		nodePicture: options.preview ? keys.some((key) => !NODE_PICTURE_STABLE_PREVIEW_KEYS.has(key)) : true
	};
}
function invalidateRenderersForChange(renderers, id, changes, invalidateNodePicture) {
	const invalidation = rendererInvalidationForChanges(changes, { preview: !invalidateNodePicture });
	for (const renderer of renderers) {
		if (invalidation.geometryCache) renderer.invalidateVectorPath(id);
		if (invalidation.nodePicture) renderer.invalidateNodePicture(id);
	}
}
function createGraphEventSubscription(options) {
	let unbindGraphEvents = null;
	function onNodeUpdated(id, changes) {
		invalidateRenderersForChange(options.getRenderers(), id, changes, true);
		options.emitEditorEvent("node:updated", id, changes);
		options.scheduleComponentSync(id);
		options.requestRender();
	}
	function onNodePreviewUpdated(id, changes) {
		const { nodePicture } = rendererInvalidationForChanges(changes, { preview: true });
		invalidateRenderersForChange(options.getRenderers(), id, changes, nodePicture);
	}
	function onNodeStructureChanged(nodeId) {
		options.scheduleComponentSync(nodeId);
		options.requestRender();
	}
	function subscribeToGraph() {
		unbindGraphEvents?.();
		unbindGraphEvents = options.getGraph().onNodeEvents({
			updated: onNodeUpdated,
			previewUpdated: onNodePreviewUpdated,
			created: (node) => {
				options.emitEditorEvent("node:created", node);
				onNodeStructureChanged(node.id);
			},
			deleted: (id) => {
				options.emitEditorEvent("node:deleted", id);
				onNodeStructureChanged(id);
			},
			reparented: (nodeId, oldParentId, newParentId) => {
				options.emitEditorEvent("node:reparented", nodeId, oldParentId, newParentId);
				onNodeStructureChanged(nodeId);
			},
			reordered: (nodeId, parentId, index) => {
				options.emitEditorEvent("node:reordered", nodeId, parentId, index);
				onNodeStructureChanged(nodeId);
			}
		});
	}
	return { subscribeToGraph };
}
//#endregion
export { createGraphEventSubscription, rendererInvalidationForChanges };

//# sourceMappingURL=graph-events.js.map
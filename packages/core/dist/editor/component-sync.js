import { computeAllLayouts } from "../layout.js";
//#region src/editor/component-sync.ts
function createComponentSyncScheduler(getGraph, requestRender) {
	let pendingComponentSync = null;
	let isFlushingComponentSync = false;
	function flushComponentSync() {
		const ids = pendingComponentSync;
		if (!ids) return;
		pendingComponentSync = null;
		isFlushingComponentSync = true;
		try {
			const graph = getGraph();
			const componentIds = /* @__PURE__ */ new Set();
			for (const id of ids) {
				let current = graph.getNode(id);
				while (current) {
					if (current.type === "COMPONENT") {
						componentIds.add(current.id);
						break;
					}
					current = current.parentId ? graph.getNode(current.parentId) : void 0;
				}
			}
			for (const compId of componentIds) graph.syncInstances(compId);
			if (componentIds.size > 0) {
				computeAllLayouts(graph);
				requestRender();
			}
		} finally {
			isFlushingComponentSync = false;
		}
	}
	function scheduleComponentSync(nodeId) {
		if (isFlushingComponentSync) return;
		if (!pendingComponentSync) {
			pendingComponentSync = /* @__PURE__ */ new Set();
			queueMicrotask(flushComponentSync);
		}
		pendingComponentSync.add(nodeId);
	}
	return { scheduleComponentSync };
}
//#endregion
export { createComponentSyncScheduler };

//# sourceMappingURL=component-sync.js.map
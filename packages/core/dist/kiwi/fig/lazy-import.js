import { populateAndApplyOverrides } from "@open-pencil/fig/instance-overrides";
//#region src/kiwi/fig/lazy-import.ts
const lazyFigImportContexts = /* @__PURE__ */ new WeakMap();
function setLazyFigImportContext(graph, context) {
	lazyFigImportContexts.set(graph, context);
}
function getLazyFigImportContext(graph) {
	return lazyFigImportContexts.get(graph);
}
function applyPopulation(graph, context, rootIds) {
	graph.preserveSourceMetadataDuring(() => {
		populateAndApplyOverrides(graph, context.changeMap, context.guidToNodeId, context.blobs, rootIds);
	});
	const populatedRootIds = rootIds ?? graph.getPages(true).map((page) => page.id);
	for (const id of populatedRootIds) context.populatedRootIds.add(id);
}
function populateRoots(graph, context, rootIds) {
	const pending = [...rootIds].filter((id) => id && !context.populatedRootIds.has(id));
	if (pending.length === 0) return false;
	applyPopulation(graph, context, pending);
	return true;
}
function populateLazyFigImportRoots(graph, rootIds) {
	const context = getLazyFigImportContext(graph);
	return context ? populateRoots(graph, context, rootIds) : false;
}
function populateAllLazyFigImportRoots(graph) {
	const context = getLazyFigImportContext(graph);
	if (!context) return false;
	if (graph.getPages(true).map((page) => page.id).every((id) => context.populatedRootIds.has(id))) return false;
	applyPopulation(graph, context);
	return true;
}
//#endregion
export { getLazyFigImportContext, populateAllLazyFigImportRoots, populateLazyFigImportRoots, setLazyFigImportContext };

//# sourceMappingURL=lazy-import.js.map
//#region src/editor/graph-reads.ts
function createGraphReadActions(getGraph) {
	return {
		getNode: (id) => getGraph().getNode(id),
		getImage: (hash) => getGraph().images.get(hash),
		getChildren: (id) => getGraph().getChildren(id),
		getPages: (includeInternal) => getGraph().getPages(includeInternal)
	};
}
//#endregion
export { createGraphReadActions };

//# sourceMappingURL=graph-reads.js.map
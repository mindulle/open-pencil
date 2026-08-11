//#region src/figma-api/accessor-utils.ts
function nodeId(target, internals) {
	return target[internals.id];
}
function graph(target, internals) {
	return target[internals.graph];
}
function raw(target, internals) {
	const id = nodeId(target, internals);
	const node = graph(target, internals).getNode(id);
	if (!node) throw new Error(`Node ${id} has been removed`);
	return node;
}
function updateNode(target, internals, changes) {
	graph(target, internals).updateNode(nodeId(target, internals), changes);
}
//#endregion
export { graph, nodeId, raw, updateNode };

//# sourceMappingURL=accessor-utils.js.map
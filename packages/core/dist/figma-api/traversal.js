//#region src/figma-api/traversal.ts
function findAll(graph, api, rootId, callback) {
	const results = [];
	const walk = (id) => {
		for (const child of graph.getChildren(id)) {
			const proxy = api.wrapNode(child.id);
			if (!callback || callback(proxy)) results.push(proxy);
			walk(child.id);
		}
	};
	walk(rootId);
	return results;
}
function findOne(graph, api, rootId, callback) {
	const walk = (id) => {
		for (const child of graph.getChildren(id)) {
			const proxy = api.wrapNode(child.id);
			if (callback(proxy)) return proxy;
			const found = walk(child.id);
			if (found) return found;
		}
		return null;
	};
	return walk(rootId);
}
function findChild(graph, api, rootId, callback) {
	for (const child of graph.getChildren(rootId)) {
		const proxy = api.wrapNode(child.id);
		if (callback(proxy)) return proxy;
	}
	return null;
}
function findChildren(graph, api, rootId, callback) {
	return graph.getChildren(rootId).map((child) => api.wrapNode(child.id)).filter((proxy) => !callback || callback(proxy));
}
function findAllWithCriteria(graph, api, rootId, criteria) {
	const types = criteria.types ? new Set(criteria.types) : null;
	return findAll(graph, api, rootId, (node) => !types || types.has(node.type));
}
//#endregion
export { findAll, findAllWithCriteria, findChild, findChildren, findOne };

//# sourceMappingURL=traversal.js.map
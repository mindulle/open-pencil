//#region src/tools/schema.ts
function defineTool(def) {
	return def;
}
var NodeNotFoundError = class extends Error {
	constructor(id) {
		super(`Node not found: ${id}`);
		this.name = "NodeNotFoundError";
	}
};
function requireNode(figma, id) {
	const node = figma.getNodeById(id);
	if (!node) throw new NodeNotFoundError(id);
	return node;
}
function nodeNotFound(id) {
	return { error: `Node "${id}" not found` };
}
function getRawNodeOrError(figma, id) {
	const node = figma.graph.getNode(id);
	return node ? { node } : nodeNotFound(id);
}
function nodeToResult(node, maxDepth) {
	return node.toJSON(maxDepth);
}
function nodeSummary(node) {
	return {
		id: node.id,
		name: node.name,
		type: node.type
	};
}
//#endregion
export { NodeNotFoundError, defineTool, getRawNodeOrError, nodeNotFound, nodeSummary, nodeToResult, requireNode };

//# sourceMappingURL=schema.js.map
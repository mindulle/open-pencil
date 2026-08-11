import { SceneGraph } from "@open-pencil/scene-graph";
//#region src/io/subgraph.ts
function includeReferencedStyles(source, ids) {
	const referencedStyleIds = /* @__PURE__ */ new Set();
	for (const id of ids) {
		const node = source.getNode(id);
		if (!node) continue;
		for (const styleId of [
			node.fillStyleId,
			node.strokeStyleId,
			node.textStyleId,
			node.effectStyleId,
			node.gridStyleId
		]) if (styleId) referencedStyleIds.add(styleId);
	}
	for (const node of source.getAllNodes()) if (node.sharedStyleType && node.source.id && referencedStyleIds.has(node.source.id)) ids.add(node.id);
}
function cloneIntoGraph(source, ids) {
	const graph = new SceneGraph();
	graph.rootId = source.rootId;
	graph.nodes = /* @__PURE__ */ new Map();
	graph.images = /* @__PURE__ */ new Map();
	graph.variables = /* @__PURE__ */ new Map();
	graph.variableCollections = /* @__PURE__ */ new Map();
	graph.activeMode = new Map(source.activeMode);
	graph.figKiwiVersion = source.figKiwiVersion;
	graph.figSchemaDeflated = source.figSchemaDeflated;
	graph.documentColorSpace = source.documentColorSpace;
	includeReferencedStyles(source, ids);
	const sortedIds = [...ids].sort((a, b) => {
		if (a === source.rootId) return -1;
		if (b === source.rootId) return 1;
		const aNode = source.getNode(a);
		const bNode = source.getNode(b);
		return depthOf(source, aNode) - depthOf(source, bNode);
	});
	for (const id of sortedIds) {
		const node = source.getNode(id);
		if (!node) continue;
		graph.nodes.set(id, structuredClone(node));
	}
	const rootClone = graph.getNode(source.rootId);
	if (rootClone) {
		rootClone.parentId = null;
		rootClone.childIds = rootClone.childIds.filter((id) => ids.has(id));
	}
	for (const id of sortedIds) {
		if (id === source.rootId) continue;
		const node = graph.getNode(id);
		if (!node) continue;
		if (!node.parentId || !ids.has(node.parentId)) node.parentId = source.rootId;
		node.childIds = node.childIds.filter((childId) => ids.has(childId));
	}
	const { imageHashes, variableIds } = collectReferencedResources(source, graph);
	for (const imageHash of imageHashes) {
		const image = source.images.get(imageHash);
		if (image) graph.images.set(imageHash, image);
	}
	for (const variableId of variableIds) {
		const variable = source.variables.get(variableId);
		if (!variable) continue;
		graph.variables.set(variableId, structuredClone(variable));
		const collection = source.variableCollections.get(variable.collectionId);
		if (!collection) continue;
		if (!graph.variableCollections.get(collection.id)) graph.variableCollections.set(collection.id, {
			...structuredClone(collection),
			variableIds: []
		});
		graph.variableCollections.get(collection.id)?.variableIds.push(variableId);
	}
	graph.clearAbsPosCache();
	return graph;
}
function collectReferencedResources(source, graph) {
	const imageHashes = /* @__PURE__ */ new Set();
	const variableIds = /* @__PURE__ */ new Set();
	for (const node of graph.nodes.values()) {
		for (const fill of node.fills) if (fill.type === "IMAGE" && fill.imageHash) imageHashes.add(fill.imageHash);
		for (const variableId of Object.values(node.boundVariables)) collectVariableClosure(source, variableId, variableIds);
	}
	return {
		imageHashes,
		variableIds
	};
}
function collectVariableClosure(source, variableId, out) {
	if (out.has(variableId)) return;
	const variable = source.variables.get(variableId);
	if (!variable) return;
	out.add(variableId);
	for (const value of Object.values(variable.valuesByMode)) if (typeof value === "object" && "aliasId" in value) collectVariableClosure(source, value.aliasId, out);
}
function depthOf(source, node) {
	let depth = 0;
	let current = node;
	while (current?.parentId) {
		depth += 1;
		current = source.getNode(current.parentId);
	}
	return depth;
}
function collectDescendants(source, id, out) {
	if (out.has(id)) return;
	out.add(id);
	const node = source.getNode(id);
	if (!node) return;
	for (const childId of node.childIds) collectDescendants(source, childId, out);
}
function collectAncestors(source, id, out) {
	let current = source.getNode(id);
	while (current?.parentId) {
		out.add(current.parentId);
		current = source.getNode(current.parentId);
	}
}
function resolveInstanceComponentId(source, componentId) {
	const seen = /* @__PURE__ */ new Set();
	let currentId = componentId;
	while (!seen.has(currentId)) {
		seen.add(currentId);
		const node = source.getNode(currentId);
		if (node?.type !== "INSTANCE" || !node.componentId) return currentId;
		currentId = node.componentId;
	}
	return componentId;
}
function collectComponentDependencies(source, ids) {
	let changed = true;
	while (changed) {
		changed = false;
		for (const id of Array.from(ids)) {
			const node = source.getNode(id);
			if (node?.type !== "INSTANCE" || !node.componentId) continue;
			const componentId = resolveInstanceComponentId(source, node.componentId);
			if (ids.has(componentId)) continue;
			const before = ids.size;
			collectAncestors(source, componentId, ids);
			collectDescendants(source, componentId, ids);
			changed ||= ids.size !== before;
		}
	}
}
function findPageId(source, nodeId) {
	let current = source.getNode(nodeId);
	while (current?.parentId) {
		const parent = source.getNode(current.parentId);
		if (!parent) return null;
		if (parent.type === "CANVAS") return parent.id;
		current = parent;
	}
	return current?.type === "CANVAS" ? current.id : null;
}
function ancestorChain(source, id) {
	const chain = [];
	let current = source.getNode(id);
	while (current?.parentId) {
		chain.push(current.parentId);
		current = source.getNode(current.parentId);
	}
	return chain.reverse();
}
function collectSelectionIds(source, nodeIds) {
	const ids = /* @__PURE__ */ new Set([source.rootId]);
	const pageIds = /* @__PURE__ */ new Set();
	for (const nodeId of nodeIds) {
		if (!source.getNode(nodeId)) continue;
		for (const ancestorId of ancestorChain(source, nodeId)) {
			ids.add(ancestorId);
			if (source.getNode(ancestorId)?.type === "CANVAS") pageIds.add(ancestorId);
		}
		collectDescendants(source, nodeId, ids);
	}
	for (const pageId of pageIds) ids.add(pageId);
	collectComponentDependencies(source, ids);
	return ids;
}
function pageNodeIds(source, pageId) {
	const ids = /* @__PURE__ */ new Set([source.rootId]);
	collectDescendants(source, pageId, ids);
	collectComponentDependencies(source, ids);
	return ids;
}
function rootNodeIds(source) {
	const ids = /* @__PURE__ */ new Set();
	for (const node of source.nodes.values()) ids.add(node.id);
	return ids;
}
function extractExportGraph(source, target) {
	switch (target.scope) {
		case "document": {
			const graph = cloneIntoGraph(source, rootNodeIds(source));
			return {
				graph,
				pageId: graph.getPages()[0]?.id ?? null,
				nodeIds: graph.getPages()[0]?.childIds ?? []
			};
		}
		case "page": {
			const graph = cloneIntoGraph(source, pageNodeIds(source, target.pageId));
			const page = graph.getNode(target.pageId);
			return {
				graph,
				pageId: page?.id ?? null,
				nodeIds: page?.childIds ?? []
			};
		}
		case "selection": {
			const graph = cloneIntoGraph(source, collectSelectionIds(source, target.nodeIds));
			const firstId = target.nodeIds[0];
			const first = firstId ? source.getNode(firstId) : void 0;
			return {
				graph,
				pageId: first ? ancestorChain(source, first.id).find((id) => source.getNode(id)?.type === "CANVAS") ?? null : null,
				nodeIds: target.nodeIds.filter((id) => graph.getNode(id) !== void 0)
			};
		}
		case "node": return extractExportGraph(source, {
			scope: "selection",
			nodeIds: [target.nodeId]
		});
		default: return extractExportGraph(source, { scope: "document" });
	}
}
//#endregion
export { extractExportGraph, findPageId };

//# sourceMappingURL=subgraph.js.map
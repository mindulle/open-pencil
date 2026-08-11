import { isEqual } from "es-toolkit/predicate";
//#region src/kiwi/fig/population/delta.ts
function installFigMutationJournal(graph) {
	const existingAtStart = new Set(graph.nodes.keys());
	const before = /* @__PURE__ */ new Map();
	const created = /* @__PURE__ */ new Set();
	const deleted = /* @__PURE__ */ new Set();
	const original = {
		createNode: graph.createNode.bind(graph),
		createNodeWithId: graph.createNodeWithId.bind(graph),
		updateNode: graph.updateNode.bind(graph),
		deleteNode: graph.deleteNode.bind(graph)
	};
	function touch(id, fields) {
		if (!id || created.has(id)) return;
		const node = graph.getNode(id);
		if (!node) return;
		const snapshot = before.get(id) ?? {};
		before.set(id, snapshot);
		for (const field of fields) if (!(field in snapshot)) Object.assign(snapshot, { [field]: structuredClone(node[field]) });
	}
	graph.createNode = ((type, parentId, overrides) => {
		touch(parentId, ["childIds"]);
		const node = original.createNode(type, parentId, overrides);
		created.add(node.id);
		return node;
	});
	graph.createNodeWithId = ((id, type, parentId, overrides) => {
		touch(parentId, ["childIds"]);
		const node = original.createNodeWithId(id, type, parentId, overrides);
		created.add(node.id);
		return node;
	});
	graph.updateNode = ((id, changes) => {
		const node = graph.getNode(id);
		if (node) {
			const fields = Object.keys(changes).filter((field) => !isEqual(node[field], changes[field]));
			if (fields.length > 0) fields.push("source");
			if ("componentId" in changes) fields.push("componentId");
			if ("fills" in changes || "strokes" in changes) fields.push("boundVariables");
			touch(id, fields);
		}
		original.updateNode(id, changes);
	});
	graph.deleteNode = ((id) => {
		const node = graph.getNode(id);
		touch(node?.parentId, ["childIds"]);
		const pending = node ? [id] : [];
		while (pending.length > 0) {
			const currentId = pending.pop();
			if (!currentId) continue;
			const current = graph.getNode(currentId);
			if (current) pending.push(...current.childIds);
			if (!existingAtStart.has(currentId)) {
				created.delete(currentId);
				before.delete(currentId);
			} else deleted.add(currentId);
		}
		original.deleteNode(id);
	});
	return {
		before,
		created,
		deleted,
		stop() {
			graph.createNode = original.createNode;
			graph.createNodeWithId = original.createNodeWithId;
			graph.updateNode = original.updateNode;
			graph.deleteNode = original.deleteNode;
		}
	};
}
function buildFigPopulationDelta(graph, journal, populatedRootIds) {
	const updated = [];
	for (const [id, previous] of journal.before) {
		const current = graph.getNode(id);
		if (!current || journal.deleted.has(id)) continue;
		const changes = {};
		for (const key of Object.keys(previous)) if (!isEqual(previous[key], current[key])) Object.assign(changes, { [key]: structuredClone(current[key]) });
		if (Object.keys(changes).length > 0) updated.push([id, changes]);
	}
	return {
		created: [...journal.created].map((id) => graph.getNode(id)).filter((node) => node !== void 0).map((node) => [node.id, structuredClone(node)]),
		updated,
		deleted: [...journal.deleted],
		instanceIndex: [...graph.instanceIndex].map(([id, ids]) => [id, [...ids]]),
		populatedRootIds: [...populatedRootIds]
	};
}
function applyFigPopulationDelta(graph, delta) {
	graph.preserveSourceMetadataDuring(() => {
		for (const [, node] of delta.created) graph.createNodeWithId(node.id, node.type, node.parentId, node);
		for (const [id, changes] of delta.updated) graph.updateNode(id, changes);
		for (const id of delta.deleted) graph.deleteNode(id);
	});
	graph.instanceIndex = new Map(delta.instanceIndex.map(([id, ids]) => [id, new Set(ids)]));
}
//#endregion
export { applyFigPopulationDelta, buildFigPopulationDelta, installFigMutationJournal };

//# sourceMappingURL=delta.js.map
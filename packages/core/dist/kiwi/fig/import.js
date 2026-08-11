import { BLACK } from "../../constants.js";
import { setLazyFigImportContext } from "./lazy-import.js";
import { populateAndApplyOverrides } from "@open-pencil/fig/instance-overrides";
import { applyStyleRefsToFields, guidToString, nodeChangeToProps, resolveVariableConsumptionEntry, setVariableColorResolver, shouldImportTextAsAutoSize, sortChildren } from "@open-pencil/fig/node-change";
import { SceneGraph } from "@open-pencil/scene-graph";
import { isNotNil } from "es-toolkit/predicate";
//#region src/kiwi/fig/import.ts
function applyImportedCanvasMetadata(page, canvasNc) {
	page.source.format = "fig";
	page.source.orderKey = canvasNc.parentIndex?.position ?? null;
	if (canvasNc.backgroundColor) page.source.fig.rawNodeFields.backgroundColor = structuredClone(canvasNc.backgroundColor);
	if (canvasNc.backgroundPaints) page.source.fig.rawNodeFields.backgroundPaints = structuredClone(canvasNc.backgroundPaints);
	if (canvasNc.guides) page.source.fig.rawNodeFields.guides = structuredClone(canvasNc.guides);
	page.source.fig.rawNodeFields.strokeJoin = canvasNc.strokeJoin;
	page.source.fig.rawNodeFields.strokeWeight = canvasNc.strokeWeight;
	if (canvasNc.pageType) page.source.fig.rawNodeFields.pageType = canvasNc.pageType;
}
function applyImportedDocumentMetadata(graph, docNc) {
	const rootNode = graph.getNode(graph.rootId);
	if (!docNc || !rootNode) return;
	rootNode.source.format = "fig";
	rootNode.source.fig.rawNodeFields.strokeJoin = docNc.strokeJoin;
	rootNode.source.fig.rawNodeFields.strokeWeight = docNc.strokeWeight;
}
function assetRefKey(assetRef) {
	return assetRef.version ? `${assetRef.key}@${assetRef.version}` : assetRef.key;
}
function buildAssetRefMap(changeMap) {
	const refs = /* @__PURE__ */ new Map();
	for (const [id, nc] of changeMap) {
		if (typeof nc.key !== "string") continue;
		if (typeof nc.version !== "string" || !refs.has(nc.key)) refs.set(nc.key, id);
		if (typeof nc.version === "string") refs.set(assetRefKey({
			key: nc.key,
			version: nc.version
		}), id);
		if (typeof nc.userFacingVersion === "string") refs.set(assetRefKey({
			key: nc.key,
			version: nc.userFacingVersion
		}), id);
	}
	return refs;
}
function resolveAliasId(alias, assetRefs) {
	if (alias.guid) return guidToString(alias.guid);
	if (!alias.assetRef) return void 0;
	return assetRefs.get(assetRefKey(alias.assetRef)) ?? assetRefs.get(alias.assetRef.key);
}
function buildVariableColorResolver(changeMap, assetRefs) {
	const varEntries = /* @__PURE__ */ new Map();
	const varSetId = /* @__PURE__ */ new Map();
	for (const [id, nc] of changeMap) {
		if (nc.type !== "VARIABLE") continue;
		varEntries.set(id, nc.variableDataValues?.entries ?? []);
		const setGuid = nc.variableSetID?.guid ? guidToString(nc.variableSetID.guid) : void 0;
		const parentGuid = nc.parentIndex?.guid ? guidToString(nc.parentIndex.guid) : void 0;
		if (setGuid) varSetId.set(id, setGuid);
		else if (parentGuid) varSetId.set(id, parentGuid);
	}
	const defaultModes = /* @__PURE__ */ new Map();
	for (const [id, nc] of changeMap) {
		if (nc.type !== "VARIABLE_SET") continue;
		const modes = nc.variableSetModes ?? [];
		if (modes.length > 0) defaultModes.set(id, guidToString(modes[0].id));
	}
	function resolveById(id, preferredModeId, depth) {
		if (depth > 10) return null;
		const entries = varEntries.get(id);
		if (!entries?.length) return null;
		const setId = varSetId.get(id);
		const defaultMode = setId ? defaultModes.get(setId) : void 0;
		let entry = preferredModeId ? entries.find((e) => guidToString(e.modeID) === preferredModeId) : void 0;
		if (!entry && defaultMode) entry = entries.find((e) => guidToString(e.modeID) === defaultMode);
		if (!entry) entry = entries[0];
		const val = entry.variableData.value;
		if (!val) return null;
		if (val.colorValue) return val.colorValue;
		if (val.alias) {
			const aliasId = resolveAliasId(val.alias, assetRefs);
			if (aliasId) return resolveById(aliasId, guidToString(entry.modeID), depth + 1);
		}
		return null;
	}
	return function resolve(alias) {
		const id = resolveAliasId(alias, assetRefs);
		return id ? resolveById(id, void 0, 0) : null;
	};
}
function buildChangeMaps(nodeChanges) {
	const changeMap = /* @__PURE__ */ new Map();
	const parentMap = /* @__PURE__ */ new Map();
	const childrenMap = /* @__PURE__ */ new Map();
	for (const nc of nodeChanges) {
		if (!nc.guid) continue;
		if (nc.phase === "REMOVED") continue;
		const id = guidToString(nc.guid);
		changeMap.set(id, nc);
		if (nc.parentIndex?.guid) {
			const pid = guidToString(nc.parentIndex.guid);
			parentMap.set(id, pid);
			let siblings = childrenMap.get(pid);
			if (!siblings) {
				siblings = [];
				childrenMap.set(pid, siblings);
			}
			siblings.push(id);
		}
	}
	for (const [parentId, children] of childrenMap) {
		const parentNc = changeMap.get(parentId);
		if (parentNc) sortChildren(children, parentNc, changeMap);
	}
	return {
		changeMap,
		parentMap,
		childrenMap
	};
}
function resolveVariableType(resolvedType) {
	if (resolvedType === "COLOR") return "COLOR";
	if (resolvedType === "BOOLEAN") return "BOOLEAN";
	if (resolvedType === "STRING") return "STRING";
	return "FLOAT";
}
function resolveVariableValue(entry, assetRefs) {
	const vd = entry.variableData;
	if (!vd.value) return void 0;
	const dt = vd.dataType ?? vd.resolvedDataType;
	if (dt === "COLOR" && vd.value.colorValue) {
		const c = vd.value.colorValue;
		return {
			r: c.r,
			g: c.g,
			b: c.b,
			a: c.a
		};
	}
	if (dt === "BOOLEAN") return vd.value.boolValue ?? false;
	if (dt === "STRING") return vd.value.textValue ?? "";
	if (dt === "ALIAS" && vd.value.alias) {
		const aliasId = resolveAliasId(vd.value.alias, assetRefs);
		if (aliasId) return { aliasId };
		return;
	}
	return vd.value.floatValue ?? 0;
}
function resolveDefaultValue(type) {
	if (type === "BOOLEAN") return false;
	if (type === "STRING") return "";
	if (type === "COLOR") return { ...BLACK };
	return 0;
}
function importCollections(changeMap, graph) {
	for (const [id, nc] of changeMap) {
		if (nc.type !== "VARIABLE_SET") continue;
		const modes = (nc.variableSetModes ?? []).map((m) => {
			return {
				modeId: guidToString(m.id),
				name: m.name
			};
		});
		if (modes.length === 0) modes.push({
			modeId: "default",
			name: "Default"
		});
		graph.addCollection({
			id,
			name: nc.name ?? "Variables",
			modes,
			defaultModeId: modes[0].modeId,
			variableIds: []
		});
	}
}
function resolveVariableCollectionId(nc, id, parentMap, assetRefs) {
	if (nc.variableSetID?.guid) return guidToString(nc.variableSetID.guid);
	const assetRef = nc.variableSetID?.assetRef;
	if (assetRef) return assetRefs.get(assetRefKey(assetRef)) ?? assetRefs.get(assetRef.key) ?? "";
	return parentMap.get(id) ?? "";
}
function addFallbackCollection(changeMap, graph, collectionId) {
	if (graph.variableCollections.has(collectionId)) return;
	const parentNc = changeMap.get(collectionId);
	graph.addCollection({
		id: collectionId,
		name: parentNc?.name ?? "Variables",
		modes: [{
			modeId: "default",
			name: "Default"
		}],
		defaultModeId: "default",
		variableIds: []
	});
}
function importVariableEntries(changeMap, parentMap, graph, assetRefs) {
	for (const [id, nc] of changeMap) {
		if (nc.type !== "VARIABLE") continue;
		const collectionId = resolveVariableCollectionId(nc, id, parentMap, assetRefs);
		addFallbackCollection(changeMap, graph, collectionId);
		const type = resolveVariableType(nc.variableResolvedType);
		const valuesByMode = {};
		if (nc.variableDataValues?.entries) for (const entry of nc.variableDataValues.entries) {
			const val = resolveVariableValue(entry, assetRefs);
			if (val !== void 0) valuesByMode[guidToString(entry.modeID)] = val;
		}
		if (Object.keys(valuesByMode).length === 0) {
			const defaultMode = graph.variableCollections.get(collectionId)?.defaultModeId ?? "default";
			valuesByMode[defaultMode] = resolveDefaultValue(type);
		}
		graph.addVariable({
			id,
			name: nc.name ?? "Variable",
			type,
			collectionId,
			valuesByMode,
			description: "",
			hiddenFromPublishing: false,
			key: typeof nc.key === "string" ? nc.key : void 0,
			version: typeof nc.version === "string" ? nc.version : void 0
		});
	}
}
function importPages(graph, changeMap, parentMap, childrenMap, created, canvasIdToPageId, createSceneNode) {
	let docId = null;
	for (const [id, nc] of changeMap) if (nc.type === "DOCUMENT" || id === "0:0") {
		docId = id;
		break;
	}
	if (docId) {
		applyImportedDocumentMetadata(graph, changeMap.get(docId));
		for (const canvasId of childrenMap.get(docId) ?? []) {
			const canvasNc = changeMap.get(canvasId);
			if (!canvasNc) continue;
			if (canvasNc.type === "CANVAS") {
				const page = graph.addPage(canvasNc.name ?? "Page");
				page.source.id = canvasId;
				applyImportedCanvasMetadata(page, canvasNc);
				canvasIdToPageId.set(canvasId, page.id);
				if (canvasNc.internalOnly) page.internalOnly = true;
				created.add(canvasId);
				for (const childId of childrenMap.get(canvasId) ?? []) createSceneNode(childId, page.id);
			} else createSceneNode(canvasId, graph.getPages()[0]?.id ?? graph.rootId);
		}
	} else {
		const roots = [];
		for (const [id] of changeMap) {
			const pid = parentMap.get(id);
			if (!pid || !changeMap.has(pid)) roots.push(id);
		}
		const page = graph.getPages()[0] ?? graph.addPage("Page 1");
		for (const rootId of roots) createSceneNode(rootId, page.id);
	}
}
function importVariableBindings(changeMap, guidToNodeId, graph) {
	for (const [ncId, nc] of changeMap) {
		if (!nc.variableConsumptionMap?.entries?.length) continue;
		const nodeId = guidToNodeId.get(ncId);
		if (!nodeId) continue;
		for (const entry of nc.variableConsumptionMap.entries) {
			const binding = resolveVariableConsumptionEntry(entry);
			if (binding) graph.bindVariable(nodeId, binding.field, binding.variableId);
		}
	}
}
function remapComponentIds(graph, guidToNodeId) {
	for (const node of graph.getAllNodes()) {
		if (node.type !== "INSTANCE" || !node.componentId) continue;
		const remapped = guidToNodeId.get(node.componentId);
		if (remapped) node.componentId = remapped;
	}
}
function applyVariantPropSpecs(graph) {
	for (const node of graph.getAllNodes()) {
		if (node.type !== "COMPONENT" || node.variantPropSpecs.length === 0 || !node.parentId) continue;
		const parent = graph.getNode(node.parentId);
		if (parent?.type !== "COMPONENT_SET") continue;
		const defs = new Map(parent.componentPropertyDefinitions.map((def) => [def.id, def.name]));
		const values = {};
		for (const spec of node.variantPropSpecs) values[defs.get(spec.propDefId) ?? spec.propDefId] = spec.value;
		graph.updateNode(node.id, { componentPropertyValues: values });
	}
}
function parseDocumentColorSpace(nodeChanges) {
	return nodeChanges.find((nc) => nc.type === "DOCUMENT")?.documentColorProfile === "DISPLAY_P3" ? "display-p3" : "srgb";
}
function applyStyleRefs(changeMap, assetRefs) {
	for (const nc of changeMap.values()) applyStyleRefsToFields(changeMap, nc, assetRefs);
}
function rememberLazyFigImportContext(graph, changeMap, guidToNodeId, blobs, populatedRootIds) {
	setLazyFigImportContext(graph, {
		changeMap,
		guidToNodeId,
		blobs,
		populatedRootIds: new Set(populatedRootIds)
	});
}
function componentPageIdsForLazyPopulation(graph) {
	const pageIds = /* @__PURE__ */ new Set();
	for (const node of graph.getAllNodes()) {
		if (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") continue;
		let current = node.parentId ? graph.getNode(node.parentId) : void 0;
		while (current?.parentId && current.type !== "CANVAS") current = graph.getNode(current.parentId);
		if (current?.type === "CANVAS") pageIds.add(current.id);
	}
	return pageIds;
}
function importNodeChanges(nodeChanges, blobs = [], images, options = {}) {
	const graph = new SceneGraph();
	graph.documentColorSpace = parseDocumentColorSpace(nodeChanges);
	if (images) for (const [hash, data] of images) graph.images.set(hash, data);
	for (const page of graph.getPages(true)) graph.deleteNode(page.id);
	const { changeMap, parentMap, childrenMap } = buildChangeMaps(nodeChanges);
	const assetRefs = buildAssetRefMap(changeMap);
	applyStyleRefs(changeMap, assetRefs);
	setVariableColorResolver(buildVariableColorResolver(changeMap, assetRefs));
	const canvasIdToPageId = /* @__PURE__ */ new Map();
	const created = /* @__PURE__ */ new Set();
	const guidToNodeId = /* @__PURE__ */ new Map();
	const getChildren = (ncId) => childrenMap.get(ncId) ?? [];
	function createSceneNode(ncId, graphParentId) {
		if (created.has(ncId)) return;
		created.add(ncId);
		const nc = changeMap.get(ncId);
		if (!nc) return;
		const { nodeType, ...props } = nodeChangeToProps(nc, blobs);
		if (props.sharedStyleType) props.internalOnly = true;
		if (nodeType === "DOCUMENT" || nodeType === "VARIABLE" || nc.type === "VARIABLE_SET") return;
		if (shouldImportTextAsAutoSize(nc, changeMap.get(parentMap.get(ncId) ?? ""))) props.textAutoResize = "WIDTH_AND_HEIGHT";
		const parentId = canvasIdToPageId.get(graphParentId) ?? graphParentId;
		const node = graph.createNode(nodeType, parentId, props);
		guidToNodeId.set(ncId, node.id);
		for (const childId of getChildren(ncId)) createSceneNode(childId, node.id);
	}
	importPages(graph, changeMap, parentMap, childrenMap, created, canvasIdToPageId, createSceneNode);
	importCollections(changeMap, graph);
	importVariableEntries(changeMap, parentMap, graph, assetRefs);
	importVariableBindings(changeMap, guidToNodeId, graph);
	remapComponentIds(graph, guidToNodeId);
	applyVariantPropSpecs(graph);
	const firstPageId = graph.getPages()[0]?.id;
	const componentPageIds = options.populate === "first-page" ? componentPageIdsForLazyPopulation(graph) : /* @__PURE__ */ new Set();
	const activeRootIds = options.populate === "first-page" ? [firstPageId, ...componentPageIds].filter(isNotNil) : void 0;
	if (options.populate !== "none") graph.preserveSourceMetadataDuring(() => {
		populateAndApplyOverrides(graph, changeMap, guidToNodeId, blobs, activeRootIds);
	});
	if (activeRootIds) rememberLazyFigImportContext(graph, changeMap, guidToNodeId, blobs, activeRootIds);
	setVariableColorResolver(null);
	if (graph.getPages(true).length === 0) graph.addPage("Page 1");
	return graph;
}
//#endregion
export { importNodeChanges };

//# sourceMappingURL=import.js.map
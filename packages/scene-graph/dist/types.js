import { BLACK } from "./constants.js";
import { CONTAINER_TYPES, cloneNodeProps, copyEffects, copyFills, copyStrokes, copyStyleRuns, createDefaultNode, normalizeVectorNetwork } from "./chunks/copy.js";
import { rotatedBBox } from "./geometry.js";
import { getAbsolutePosition } from "./chunks/coordinate.js";
import { removeStaleBindings } from "./chunks/bindings.js";
import { bindNodeEvents } from "./chunks/events.js";
import { hitTest, hitTestDeep, hitTestFrame } from "./hit-test.js";
import { createNanoEvents } from "nanoevents";
import { omit, omitBy } from "es-toolkit/object";
//#region src/instances.ts
const INSTANCE_SYNC_PROPS = [
	"width",
	"height",
	"minWidth",
	"maxWidth",
	"minHeight",
	"maxHeight",
	"fills",
	"strokes",
	"effects",
	"opacity",
	"cornerRadius",
	"topLeftRadius",
	"topRightRadius",
	"bottomRightRadius",
	"bottomLeftRadius",
	"independentCorners",
	"layoutMode",
	"layoutDirection",
	"layoutWrap",
	"primaryAxisAlign",
	"counterAxisAlign",
	"primaryAxisSizing",
	"counterAxisSizing",
	"itemSpacing",
	"counterAxisSpacing",
	"paddingTop",
	"paddingRight",
	"paddingBottom",
	"paddingLeft",
	"gridTemplateColumns",
	"gridTemplateRows",
	"gridColumnGap",
	"gridRowGap",
	"gridPosition",
	"clipsContent",
	"independentStrokeWeights",
	"borderTopWeight",
	"borderRightWeight",
	"borderBottomWeight",
	"borderLeftWeight",
	"boundVariables",
	"variableModes"
];
function setSceneProp(target, key, value) {
	target[key] = value;
}
function copyProp(target, source, key) {
	if (key === "fills") setSceneProp(target, key, copyFills(source.fills));
	else if (key === "strokes") setSceneProp(target, key, copyStrokes(source.strokes));
	else if (key === "effects") setSceneProp(target, key, copyEffects(source.effects));
	else if (key === "styleRuns") setSceneProp(target, key, copyStyleRuns(source.styleRuns));
	else if (key === "boundVariables") setSceneProp(target, key, { ...source.boundVariables });
	else if (key === "variableModes") setSceneProp(target, key, { ...source.variableModes });
	else if (key === "gridPosition") setSceneProp(target, key, source.gridPosition ? { ...source.gridPosition } : null);
	else {
		const value = source[key];
		setSceneProp(target, key, Array.isArray(value) ? structuredClone(value) : value);
	}
}
function cloneChildrenWithMapping(graph, sourceParentId, destParentId, mode = "deep") {
	const sourceParent = graph.nodes.get(sourceParentId);
	if (!sourceParent) return;
	for (const childId of sourceParent.childIds) {
		const src = graph.nodes.get(childId);
		if (!src) continue;
		const clone = graph.createNode(src.type, destParentId, cloneNodeProps(src, childId, mode));
		if (src.childIds.length > 0) cloneChildrenWithMapping(graph, childId, clone.id, mode);
	}
}
function syncChildren(graph, compParentId, instParentId, overrides) {
	const compParent = graph.nodes.get(compParentId);
	const instParent = graph.nodes.get(instParentId);
	if (!compParent || !instParent) return;
	const instChildMap = /* @__PURE__ */ new Map();
	for (const childId of instParent.childIds) {
		const child = graph.nodes.get(childId);
		if (!child) continue;
		const sourceComponentId = overrides[`${child.id}:sourceComponentId`];
		const mappedComponentId = typeof sourceComponentId === "string" ? sourceComponentId : child.componentId;
		if (mappedComponentId) instChildMap.set(mappedComponentId, child);
	}
	for (const compChildId of compParent.childIds) if (!instChildMap.has(compChildId)) {
		const src = graph.nodes.get(compChildId);
		if (!src) continue;
		const clone = graph.createNode(src.type, instParentId, cloneNodeProps(src, compChildId));
		if (src.childIds.length > 0) cloneChildrenWithMapping(graph, compChildId, clone.id);
		instChildMap.set(compChildId, clone);
	}
	for (const compChildId of compParent.childIds) {
		const compChild = graph.nodes.get(compChildId);
		const instChild = instChildMap.get(compChildId);
		if (!compChild || !instChild) continue;
		for (const key of INSTANCE_SYNC_PROPS) {
			if (`${instChild.id}:${key}` in overrides) continue;
			copyProp(instChild, compChild, key);
		}
		for (const key of [
			"name",
			"text",
			"fontSize",
			"fontWeight",
			"fontFamily",
			"textDirection"
		]) {
			if (`${instChild.id}:${key}` in overrides) continue;
			copyProp(instChild, compChild, key);
		}
		if (compChild.childIds.length > 0 && !(`${instChild.id}:componentId` in overrides)) syncChildren(graph, compChildId, instChild.id, overrides);
	}
	const compChildOrder = compParent.childIds;
	instParent.childIds.sort((a, b) => {
		const nodeA = graph.nodes.get(a);
		const nodeB = graph.nodes.get(b);
		const sourceA = nodeA ? overrides[`${nodeA.id}:sourceComponentId`] : void 0;
		const sourceB = nodeB ? overrides[`${nodeB.id}:sourceComponentId`] : void 0;
		const mappedA = typeof sourceA === "string" ? sourceA : nodeA?.componentId;
		const mappedB = typeof sourceB === "string" ? sourceB : nodeB?.componentId;
		return (mappedA ? compChildOrder.indexOf(mappedA) : -1) - (mappedB ? compChildOrder.indexOf(mappedB) : -1);
	});
}
function copyInstanceComponentProps(component) {
	const props = {};
	for (const key of INSTANCE_SYNC_PROPS) copyProp(props, component, key);
	return props;
}
function createInstance(graph, componentId, parentId, overrides = {}) {
	const component = graph.nodes.get(componentId);
	if (component?.type !== "COMPONENT") return null;
	const props = {
		...copyInstanceComponentProps(component),
		name: component.name,
		componentId
	};
	const instance = graph.createNode("INSTANCE", parentId, {
		...props,
		...overrides
	});
	cloneChildrenWithMapping(graph, component.id, instance.id);
	return instance;
}
function populateInstanceChildren(graph, instanceId, componentId, mode = "deep") {
	const instance = graph.nodes.get(instanceId);
	const component = graph.nodes.get(componentId);
	if (!instance || !component || instance.type !== "INSTANCE") return;
	cloneChildrenWithMapping(graph, componentId, instanceId, mode);
}
function swapInstanceComponent(graph, instanceId, componentId) {
	const instance = graph.nodes.get(instanceId);
	const component = graph.nodes.get(componentId);
	if (!instance || component?.type !== "COMPONENT" || instance.type !== "INSTANCE") return;
	const previousComponent = instance.componentId ? graph.nodes.get(instance.componentId) : void 0;
	const updates = { componentId };
	for (const key of INSTANCE_SYNC_PROPS) {
		if (key in instance.overrides) continue;
		copyProp(updates, component, key);
	}
	if (!previousComponent || instance.name === previousComponent.name) updates.name = component.name;
	const childIds = Array.from(instance.childIds);
	for (const childId of childIds) graph.deleteNode(childId);
	graph.updateNode(instanceId, updates);
	cloneChildrenWithMapping(graph, componentId, instanceId);
}
function syncInstances(graph, componentId) {
	const component = graph.nodes.get(componentId);
	if (component?.type !== "COMPONENT") return;
	for (const instance of getInstances(graph, componentId)) {
		for (const key of INSTANCE_SYNC_PROPS) {
			if (key in instance.overrides) continue;
			copyProp(instance, component, key);
		}
		syncChildren(graph, component.id, instance.id, instance.overrides);
	}
}
function detachInstance(graph, instanceId) {
	const node = graph.nodes.get(instanceId);
	if (node?.type !== "INSTANCE") return;
	if (node.componentId) graph.instanceIndex.get(node.componentId)?.delete(instanceId);
	node.type = "FRAME";
	node.componentId = null;
	node.overrides = {};
}
function getMainComponent(graph, instanceId) {
	const node = graph.nodes.get(instanceId);
	if (!node?.componentId) return void 0;
	return graph.nodes.get(node.componentId);
}
function getInstances(graph, componentId) {
	const ids = graph.instanceIndex.get(componentId);
	if (!ids) return [];
	const instances = [];
	for (const id of ids) {
		const node = graph.nodes.get(id);
		if (node) instances.push(node);
	}
	return instances;
}
//#endregion
//#region src/snap.ts
const SNAP_THRESHOLD = 5;
function getEdges(node) {
	return rotatedBBox(node.x, node.y, node.width, node.height, node.rotation);
}
function computeSnap(movingIds, movingBounds, allNodes) {
	const targets = allNodes.filter((n) => !movingIds.has(n.id));
	if (targets.length === 0) return {
		dx: 0,
		dy: 0,
		guides: []
	};
	const m = {
		left: movingBounds.x,
		right: movingBounds.x + movingBounds.width,
		centerX: movingBounds.x + movingBounds.width / 2,
		top: movingBounds.y,
		bottom: movingBounds.y + movingBounds.height,
		centerY: movingBounds.y + movingBounds.height / 2
	};
	let bestDx = Infinity;
	let bestDy = Infinity;
	const guides = [];
	for (const target of targets) {
		const t = getEdges(target);
		const xPairs = [
			[m.left, t.left],
			[m.left, t.right],
			[m.right, t.left],
			[m.right, t.right],
			[m.centerX, t.centerX]
		];
		for (const [mVal, tVal] of xPairs) {
			const d = tVal - mVal;
			if (Math.abs(d) < SNAP_THRESHOLD && Math.abs(d) <= Math.abs(bestDx)) {
				if (Math.abs(d) < Math.abs(bestDx)) {
					bestDx = d;
					guides.length = guides.filter((g) => g.axis === "y").length ? guides.length : guides.length;
					for (let i = guides.length - 1; i >= 0; i--) if (guides[i].axis === "x") guides.splice(i, 1);
				}
				if (Math.abs(d) === Math.abs(bestDx)) {
					const minY = Math.min(m.top, t.top);
					const maxY = Math.max(m.bottom, t.bottom);
					guides.push({
						axis: "x",
						position: tVal,
						from: minY,
						to: maxY
					});
				}
			}
		}
		const yPairs = [
			[m.top, t.top],
			[m.top, t.bottom],
			[m.bottom, t.top],
			[m.bottom, t.bottom],
			[m.centerY, t.centerY]
		];
		for (const [mVal, tVal] of yPairs) {
			const d = tVal - mVal;
			if (Math.abs(d) < SNAP_THRESHOLD && Math.abs(d) <= Math.abs(bestDy)) {
				if (Math.abs(d) < Math.abs(bestDy)) {
					for (let i = guides.length - 1; i >= 0; i--) if (guides[i].axis === "y") guides.splice(i, 1);
					bestDy = d;
				}
				if (Math.abs(d) === Math.abs(bestDy)) {
					const minX = Math.min(m.left, t.left);
					const maxX = Math.max(m.right, t.right);
					guides.push({
						axis: "y",
						position: tVal,
						from: minX,
						to: maxX
					});
				}
			}
		}
	}
	return {
		dx: Math.abs(bestDx) <= SNAP_THRESHOLD ? bestDx : 0,
		dy: Math.abs(bestDy) <= SNAP_THRESHOLD ? bestDy : 0,
		guides
	};
}
function computeSelectionBounds(nodes) {
	if (nodes.length === 0) return null;
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const n of nodes) {
		const edges = getEdges(n);
		minX = Math.min(minX, edges.left);
		minY = Math.min(minY, edges.top);
		maxX = Math.max(maxX, edges.right);
		maxY = Math.max(maxY, edges.bottom);
	}
	return {
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY
	};
}
//#endregion
//#region src/shared-styles.ts
const STYLE_REF_KEYS = {
	fill: "fillStyleId",
	stroke: "strokeStyleId",
	text: "textStyleId",
	effect: "effectStyleId",
	grid: "gridStyleId"
};
const STYLE_TYPES = {
	fill: "FILL",
	stroke: "FILL",
	text: "TEXT",
	effect: "EFFECT",
	grid: "GRID"
};
const TEXT_STYLE_KEYS = /* @__PURE__ */ new Set([
	"fontFamily",
	"fontWeight",
	"italic",
	"fontSize",
	"lineHeight",
	"letterSpacing",
	"textDecoration",
	"textCase",
	"fontFeatures"
]);
function sharedStyleRefKey(kind) {
	return STYLE_REF_KEYS[kind];
}
function sharedStyleTypeForKind(kind) {
	return STYLE_TYPES[kind];
}
function getSharedStyles(graph, kind) {
	const type = sharedStyleTypeForKind(kind);
	const styles = [];
	for (const node of graph.getAllNodes()) {
		if (node.sharedStyleType !== type || !node.source.id) continue;
		styles.push({
			id: node.source.id,
			nodeId: node.id,
			name: node.name,
			type
		});
	}
	return styles.sort((left, right) => left.name.localeCompare(right.name));
}
function styleDetachmentChanges(node, changes) {
	const next = { ...changes };
	if ("fills" in changes && !("fillStyleId" in changes) && node.fillStyleId) next.fillStyleId = null;
	if ("strokes" in changes && !("strokeStyleId" in changes) && node.strokeStyleId) next.strokeStyleId = null;
	if ("effects" in changes && !("effectStyleId" in changes) && node.effectStyleId) next.effectStyleId = null;
	if ("layoutGrids" in changes && !("gridStyleId" in changes) && node.gridStyleId) next.gridStyleId = null;
	if (Object.keys(changes).some((key) => TEXT_STYLE_KEYS.has(key)) && !("textStyleId" in changes) && node.textStyleId) next.textStyleId = null;
	return next;
}
//#endregion
//#region src/undo.ts
const DEFAULT_HISTORY_LIMIT = 200;
var UndoManager = class {
	undoStack = [];
	redoStack = [];
	batches = [];
	limit;
	constructor(options = {}) {
		this.limit = options.limit ?? DEFAULT_HISTORY_LIMIT;
	}
	apply(entry) {
		this.execute(entry);
	}
	execute(entry) {
		entry.forward();
		this.record(entry);
	}
	push(entry) {
		this.record(entry);
	}
	record(entry) {
		const batch = this.currentBatch;
		if (batch) {
			batch.entries.push(entry);
			return;
		}
		this.pushUndoEntry(entry);
	}
	undo() {
		const entry = this.undoStack.pop();
		if (!entry) return null;
		entry.inverse();
		this.redoStack.push(entry);
		return entry.label;
	}
	redo() {
		const entry = this.redoStack.pop();
		if (!entry) return null;
		entry.forward();
		this.undoStack.push(entry);
		return entry.label;
	}
	beginBatch(label, coalesceKey) {
		this.batches.push({
			label,
			entries: [],
			coalesceKey
		});
	}
	commitBatch() {
		const batch = this.batches.pop();
		if (!batch || batch.entries.length === 0) return;
		const entry = this.createBatchEntry(batch);
		const parentBatch = this.currentBatch;
		if (parentBatch) parentBatch.entries.push(entry);
		else this.pushUndoEntry(entry);
	}
	runBatch(label, fn, coalesceKey) {
		this.beginBatch(label, coalesceKey);
		try {
			const result = fn();
			this.commitBatch();
			return result;
		} catch (error) {
			this.rollbackBatch();
			throw error;
		}
	}
	rollbackBatch() {
		const batch = this.batches.pop();
		if (!batch) return;
		for (const entry of batch.entries.toReversed()) entry.inverse();
	}
	clear() {
		this.undoStack = [];
		this.redoStack = [];
		this.batches = [];
	}
	get isBatching() {
		return this.batches.length > 0;
	}
	get canUndo() {
		return this.undoStack.length > 0;
	}
	get canRedo() {
		return this.redoStack.length > 0;
	}
	get undoLabel() {
		return this.undoStack.at(-1)?.label ?? null;
	}
	get redoLabel() {
		return this.redoStack.at(-1)?.label ?? null;
	}
	get currentBatch() {
		return this.batches.at(-1) ?? null;
	}
	createBatchEntry(batch) {
		return {
			label: batch.label,
			forward: () => batch.entries.forEach((entry) => entry.forward()),
			inverse: () => batch.entries.toReversed().forEach((entry) => entry.inverse()),
			coalesceKey: batch.coalesceKey
		};
	}
	pushUndoEntry(entry) {
		const previous = this.undoStack.at(-1);
		if (entry.coalesceKey && previous?.coalesceKey === entry.coalesceKey) this.undoStack[this.undoStack.length - 1] = {
			...entry,
			inverse: previous.inverse
		};
		else this.undoStack.push(entry);
		this.redoStack = [];
		this.trimUndoStack();
	}
	trimUndoStack() {
		if (!Number.isFinite(this.limit) || this.limit <= 0) return;
		const overflow = this.undoStack.length - this.limit;
		if (overflow > 0) this.undoStack.splice(0, overflow);
	}
};
//#endregion
//#region src/text-picture.ts
const TEXT_PICTURE_KEYS = /* @__PURE__ */ new Set([
	"text",
	"fontSize",
	"fontFamily",
	"fontWeight",
	"italic",
	"textAlignHorizontal",
	"textDirection",
	"textAlignVertical",
	"lineHeight",
	"letterSpacing",
	"textDecoration",
	"textCase",
	"styleRuns",
	"fills",
	"width",
	"height"
]);
/** Properties that change imported glyph outlines or per-glyph positioning. */
const GLYPH_AFFECTING_KEYS = /* @__PURE__ */ new Set([
	"text",
	"fontSize",
	"fontFamily",
	"fontWeight",
	"italic",
	"textDirection",
	"lineHeight",
	"letterSpacing",
	"textCase",
	"styleRuns"
]);
//#endregion
//#region src/preview.ts
const LAYOUT_AFFECTING_KEYS = /* @__PURE__ */ new Set([
	"x",
	"y",
	"width",
	"height",
	"rotation",
	"parentId",
	"childIds",
	"layoutMode",
	"layoutDirection",
	"layoutWrap",
	"primaryAxisSizing",
	"counterAxisSizing",
	"itemSpacing",
	"counterAxisSpacing",
	"paddingTop",
	"paddingRight",
	"paddingBottom",
	"paddingLeft",
	"layoutGrow",
	"layoutAlignSelf",
	"layoutPositioning",
	"minWidth",
	"maxWidth",
	"minHeight",
	"maxHeight",
	"visible",
	"text",
	"fontSize",
	"lineHeight",
	"letterSpacing",
	"styleRuns",
	"textAutoResize"
]);
function updateNodePreview(graph, id, changes) {
	const node = graph.nodes.get(id);
	if (!node) return null;
	changes = Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== void 0));
	if (Object.keys(changes).every((key) => node[key] === changes[key])) return null;
	if (Object.keys(changes).some((key) => LAYOUT_AFFECTING_KEYS.has(key))) graph.clearAbsPosCache();
	if (node.type === "TEXT") {
		const textChanged = Object.keys(changes).some((key) => TEXT_PICTURE_KEYS.has(key));
		if (node.textPicture && textChanged) node.textPicture = null;
		const glyphChanged = Object.keys(changes).some((key) => GLYPH_AFFECTING_KEYS.has(key));
		if (node.figmaDerivedTextGlyphs && glyphChanged) node.figmaDerivedTextGlyphs = null;
	}
	const normalizedChanges = changes.vectorNetwork ? {
		...changes,
		vectorNetwork: normalizeVectorNetwork(changes.vectorNetwork)
	} : changes;
	graph.positionPreviewVersion++;
	Object.assign(node, normalizedChanges);
	return normalizedChanges;
}
//#endregion
//#region src/source-metadata.ts
function markSourceFieldsEdited(node, changeKeys) {
	if (changeKeys.length === 0) return;
	const editedFields = new Set(node.source.editedFields);
	for (const key of changeKeys) editedFields.add(key);
	node.source.editedFields = [...editedFields];
}
//#endregion
//#region src/variables.ts
function addVariable(graph, variable) {
	graph.variables.set(variable.id, variable);
	const collection = graph.variableCollections.get(variable.collectionId);
	if (collection && !collection.variableIds.includes(variable.id)) collection.variableIds.push(variable.id);
}
function removeVariable(graph, id) {
	const variable = graph.variables.get(id);
	if (!variable) return;
	graph.variables.delete(id);
	const collection = graph.variableCollections.get(variable.collectionId);
	if (collection) collection.variableIds = collection.variableIds.filter((vid) => vid !== id);
	for (const node of graph.nodes.values()) {
		if (!Object.values(node.boundVariables).includes(id)) continue;
		node.boundVariables = omitBy(node.boundVariables, (varId) => varId === id);
		graph.emitter.emit("node:updated", node.id, { boundVariables: { ...node.boundVariables } });
		markBoundVariablesOverrideOnInstance(graph, node.id);
	}
}
function addCollection(graph, collection) {
	graph.variableCollections.set(collection.id, collection);
	if (!graph.activeMode.has(collection.id)) graph.activeMode.set(collection.id, collection.defaultModeId);
}
function defaultVariableValue(type, value) {
	if (value !== void 0) return value;
	if (type === "COLOR") return { ...BLACK };
	if (type === "FLOAT") return 0;
	if (type === "BOOLEAN") return false;
	return "";
}
function createVariable(graph, generateId, name, type, collectionId, value) {
	const collection = graph.variableCollections.get(collectionId);
	if (!collection) throw new Error(`Collection "${collectionId}" not found`);
	const id = generateId();
	const defaultValue = defaultVariableValue(type, value);
	const valuesByMode = {};
	for (const mode of collection.modes) valuesByMode[mode.modeId] = structuredClone(defaultValue);
	const variable = {
		id,
		name,
		type,
		collectionId,
		valuesByMode,
		description: "",
		hiddenFromPublishing: false
	};
	addVariable(graph, variable);
	return variable;
}
function createCollection(graph, generateId, name) {
	const id = generateId();
	const modeId = generateId();
	const collection = {
		id,
		name,
		modes: [{
			modeId,
			name: "Mode 1"
		}],
		defaultModeId: modeId,
		variableIds: []
	};
	addCollection(graph, collection);
	return collection;
}
function removeCollection(graph, id) {
	const collection = graph.variableCollections.get(id);
	if (collection) for (const varId of Array.from(collection.variableIds)) removeVariable(graph, varId);
	graph.variableCollections.delete(id);
	graph.activeMode.delete(id);
}
function getActiveModeId(graph, collectionId) {
	const mode = graph.activeMode.get(collectionId);
	if (mode) return mode;
	return graph.variableCollections.get(collectionId)?.defaultModeId ?? "";
}
function getNodeVariableModeId(graph, nodeId, collectionId) {
	let node = graph.nodes.get(nodeId);
	while (node) {
		const modeId = node.variableModes[collectionId];
		if (modeId) return modeId;
		node = node.parentId ? graph.nodes.get(node.parentId) : void 0;
	}
	return getActiveModeId(graph, collectionId);
}
function setActiveMode(graph, collectionId, modeId) {
	graph.activeMode.set(collectionId, modeId);
}
function addMode(graph, collectionId, modeId, name, sourceMode) {
	const collection = graph.variableCollections.get(collectionId);
	if (!collection) return;
	collection.modes.push({
		modeId,
		name
	});
	const sourceModeId = sourceMode ?? collection.defaultModeId;
	for (const varId of collection.variableIds) {
		const variable = graph.variables.get(varId);
		if (!variable) continue;
		variable.valuesByMode[modeId] = structuredClone(variable.valuesByMode[sourceModeId] ?? Object.values(variable.valuesByMode)[0]);
	}
}
function removeMode(graph, collectionId, modeId) {
	const collection = graph.variableCollections.get(collectionId);
	if (!collection || collection.modes.length <= 1) return;
	collection.modes = collection.modes.filter((m) => m.modeId !== modeId);
	if (collection.defaultModeId === modeId) collection.defaultModeId = collection.modes[0].modeId;
	for (const varId of collection.variableIds) {
		const variable = graph.variables.get(varId);
		if (variable) variable.valuesByMode = omit(variable.valuesByMode, [modeId]);
	}
	if (graph.activeMode.get(collectionId) === modeId) graph.activeMode.set(collectionId, collection.defaultModeId);
}
function renameMode(graph, collectionId, modeId, name) {
	const collection = graph.variableCollections.get(collectionId);
	if (!collection) return;
	const mode = collection.modes.find((m) => m.modeId === modeId);
	if (mode) mode.name = name;
}
function setDefaultMode(graph, collectionId, modeId) {
	const collection = graph.variableCollections.get(collectionId);
	if (!collection) return;
	if (!collection.modes.some((m) => m.modeId === modeId)) return;
	collection.defaultModeId = modeId;
}
function resolveVariable(graph, variableId, modeId, visited) {
	if (visited?.has(variableId)) return void 0;
	const variable = graph.variables.get(variableId);
	if (!variable) return void 0;
	const collection = graph.variableCollections.get(variable.collectionId);
	const preferredModeId = modeId ?? getActiveModeId(graph, variable.collectionId);
	const fallbackModeId = collection?.defaultModeId;
	let value = Object.hasOwn(variable.valuesByMode, preferredModeId) ? variable.valuesByMode[preferredModeId] : void 0;
	if (value === void 0 && fallbackModeId && Object.hasOwn(variable.valuesByMode, fallbackModeId)) value = variable.valuesByMode[fallbackModeId];
	value ??= Object.values(variable.valuesByMode)[0];
	if (value && typeof value === "object" && "aliasId" in value) {
		const seen = visited ?? /* @__PURE__ */ new Set();
		seen.add(variableId);
		return resolveVariable(graph, value.aliasId, preferredModeId, seen);
	}
	return value;
}
function resolveColorVariable(graph, variableId) {
	const value = resolveVariable(graph, variableId);
	if (value && typeof value === "object" && "r" in value) return value;
}
function resolveNumberVariable(graph, variableId) {
	const value = resolveVariable(graph, variableId);
	return typeof value === "number" ? value : void 0;
}
function resolveColorVariableForNode(graph, nodeId, variableId) {
	const variable = graph.variables.get(variableId);
	if (!variable) return void 0;
	const value = resolveVariable(graph, variableId, getNodeVariableModeId(graph, nodeId, variable.collectionId));
	if (value && typeof value === "object" && "r" in value) return value;
}
function resolveNumberVariableForNode(graph, nodeId, variableId) {
	const variable = graph.variables.get(variableId);
	if (!variable) return void 0;
	const value = resolveVariable(graph, variableId, getNodeVariableModeId(graph, nodeId, variable.collectionId));
	return typeof value === "number" ? value : void 0;
}
function getVariablesForCollection(graph, collectionId) {
	const collection = graph.variableCollections.get(collectionId);
	if (!collection) return [];
	return collection.variableIds.map((id) => graph.variables.get(id)).filter((v) => v !== void 0);
}
function getVariablesByType(graph, type) {
	return [...graph.variables.values()].filter((v) => v.type === type);
}
const SCALAR_BINDING_FIELDS = /* @__PURE__ */ new Set([
	"opacity",
	"width",
	"height",
	"cornerRadius",
	"fontSize",
	"letterSpacing",
	"lineHeight",
	"itemSpacing",
	"strokeWeight",
	"paddingLeft",
	"paddingRight",
	"paddingTop",
	"paddingBottom",
	"counterAxisSpacing",
	"topLeftRadius",
	"topRightRadius",
	"bottomLeftRadius",
	"bottomRightRadius",
	"rotation",
	"x",
	"y",
	"minWidth",
	"maxWidth",
	"minHeight",
	"maxHeight",
	"borderTopWeight",
	"borderBottomWeight",
	"borderLeftWeight",
	"borderRightWeight",
	"gridRowGap",
	"gridColumnGap"
]);
const STRING_BINDING_FIELDS = /* @__PURE__ */ new Set(["fontFamily"]);
const BOOLEAN_BINDING_FIELDS = /* @__PURE__ */ new Set(["visible"]);
function bindVariable(graph, nodeId, field, variableId) {
	const node = graph.nodes.get(nodeId);
	if (!node) return;
	const variable = graph.variables.get(variableId);
	if (!variable) throw new Error(`Variable "${variableId}" not found`);
	const colorFieldMatch = field.match(/^(fills|strokes)\/(\d+)\/color$/);
	if (colorFieldMatch) {
		if (variable.type !== "COLOR") throw new Error(`Cannot bind ${variable.type} variable to color field "${field}"`);
		const arrayKey = colorFieldMatch[1];
		const index = Number.parseInt(colorFieldMatch[2], 10);
		const currentLength = node[arrayKey]?.length ?? 0;
		if (index >= currentLength) throw new Error(`Index ${index} out of range for ${arrayKey} (length ${currentLength})`);
		const topLevelKey = colorFieldMatch[1];
		if (topLevelKey in node.boundVariables) node.boundVariables = omit(node.boundVariables, [topLevelKey]);
	}
	if (SCALAR_BINDING_FIELDS.has(field) && variable.type !== "FLOAT") throw new Error(`Cannot bind ${variable.type} variable to scalar field "${field}"`);
	if (STRING_BINDING_FIELDS.has(field) && variable.type !== "STRING") throw new Error(`Cannot bind ${variable.type} variable to string field "${field}"`);
	if (BOOLEAN_BINDING_FIELDS.has(field) && variable.type !== "BOOLEAN") throw new Error(`Cannot bind ${variable.type} variable to boolean field "${field}"`);
	if (!(SCALAR_BINDING_FIELDS.has(field) || STRING_BINDING_FIELDS.has(field) || BOOLEAN_BINDING_FIELDS.has(field) || colorFieldMatch)) throw new Error(`Unknown binding field "${field}"`);
	node.boundVariables = {
		...node.boundVariables,
		[field]: variableId
	};
	graph.emitter.emit("node:updated", nodeId, { boundVariables: { ...node.boundVariables } });
	markBoundVariablesOverrideOnInstance(graph, nodeId);
}
function unbindVariable(graph, nodeId, field) {
	const node = graph.nodes.get(nodeId);
	if (!node) return;
	if (!(field in node.boundVariables)) return;
	node.boundVariables = omit(node.boundVariables, [field]);
	graph.emitter.emit("node:updated", nodeId, { boundVariables: { ...node.boundVariables } });
	markBoundVariablesOverrideOnInstance(graph, nodeId);
}
function markBoundVariablesOverrideOnInstance(graph, nodeId) {
	const node = graph.nodes.get(nodeId);
	if (!node) return;
	if (node.type === "INSTANCE") {
		node.overrides["boundVariables"] = true;
		return;
	}
	let current = node;
	while (current.parentId) {
		const parent = graph.nodes.get(current.parentId);
		if (!parent) break;
		if (parent.type === "INSTANCE") {
			parent.overrides[`${nodeId}:boundVariables`] = true;
			break;
		}
		current = parent;
	}
}
//#endregion
//#region src/index.ts
let nextLocalID = 1;
function generateId() {
	return `0:${nextLocalID++}`;
}
var SceneGraph = class SceneGraph {
	nodes = /* @__PURE__ */ new Map();
	images = /* @__PURE__ */ new Map();
	variables = /* @__PURE__ */ new Map();
	variableCollections = /* @__PURE__ */ new Map();
	activeMode = /* @__PURE__ */ new Map();
	rootId;
	figKiwiVersion = null;
	/** Deflated kiwi schema bytes from the original .fig file, preserved for roundtrip fidelity. */
	figSchemaDeflated = null;
	documentColorSpace = "display-p3";
	emitter = createNanoEvents();
	absPosCache = /* @__PURE__ */ new Map();
	previewMutationDepth = 0;
	sourceMetadataPreservationDepth = 0;
	layoutMutationDepth = 0;
	positionPreviewVersion = 0;
	instanceIndex = /* @__PURE__ */ new Map();
	constructor() {
		const root = createDefaultNode(generateId, "FRAME", {
			name: "Document",
			width: 0,
			height: 0
		});
		this.rootId = root.id;
		this.nodes.set(root.id, root);
		this.addPage("Page 1");
	}
	addPage(name) {
		return this.createNode("CANVAS", this.rootId, {
			name,
			width: 0,
			height: 0
		});
	}
	getPages(includeInternal = false) {
		return this.getChildren(this.rootId).filter((n) => n.type === "CANVAS" && (includeInternal || !n.internalOnly));
	}
	getAllNodes() {
		return this.nodes.values();
	}
	getNode(id) {
		return this.nodes.get(id);
	}
	onNodeEvents(handlers) {
		return bindNodeEvents(this.emitter, handlers);
	}
	countDescendants(nodeId) {
		const node = this.nodes.get(nodeId);
		if (!node) return 0;
		let count = 0;
		const stack = [...node.childIds];
		while (stack.length > 0) {
			const id = stack.pop();
			if (id === void 0) break;
			count++;
			const child = this.nodes.get(id);
			if (child) for (const childId of child.childIds) stack.push(childId);
		}
		return count;
	}
	addVariable(variable) {
		addVariable(this, variable);
	}
	removeVariable(id) {
		removeVariable(this, id);
	}
	addCollection(collection) {
		addCollection(this, collection);
	}
	createVariable(name, type, collectionId, value) {
		return createVariable(this, generateId, name, type, collectionId, value);
	}
	createCollection(name) {
		return createCollection(this, generateId, name);
	}
	removeCollection(id) {
		removeCollection(this, id);
	}
	getActiveModeId(collectionId) {
		return getActiveModeId(this, collectionId);
	}
	getNodeVariableModeId(nodeId, collectionId) {
		return getNodeVariableModeId(this, nodeId, collectionId);
	}
	setActiveMode(collectionId, modeId) {
		setActiveMode(this, collectionId, modeId);
	}
	addMode(collectionId, modeId, name, sourceMode) {
		addMode(this, collectionId, modeId, name, sourceMode);
	}
	removeMode(collectionId, modeId) {
		removeMode(this, collectionId, modeId);
	}
	renameMode(collectionId, modeId, name) {
		renameMode(this, collectionId, modeId, name);
	}
	setDefaultMode(collectionId, modeId) {
		setDefaultMode(this, collectionId, modeId);
	}
	resolveVariable(variableId, modeId, visited) {
		return resolveVariable(this, variableId, modeId, visited);
	}
	resolveColorVariable(variableId) {
		return resolveColorVariable(this, variableId);
	}
	resolveNumberVariable(variableId) {
		return resolveNumberVariable(this, variableId);
	}
	resolveColorVariableForNode(nodeId, variableId) {
		return resolveColorVariableForNode(this, nodeId, variableId);
	}
	resolveNumberVariableForNode(nodeId, variableId) {
		return resolveNumberVariableForNode(this, nodeId, variableId);
	}
	getVariablesForCollection(collectionId) {
		return getVariablesForCollection(this, collectionId);
	}
	getVariablesByType(type) {
		return getVariablesByType(this, type);
	}
	bindVariable(nodeId, field, variableId) {
		bindVariable(this, nodeId, field, variableId);
	}
	unbindVariable(nodeId, field) {
		unbindVariable(this, nodeId, field);
	}
	getChildren(id) {
		const node = this.nodes.get(id);
		if (!node) return [];
		return node.childIds.map((cid) => this.nodes.get(cid)).filter((n) => n !== void 0);
	}
	isContainer(id) {
		const node = this.nodes.get(id);
		return node ? CONTAINER_TYPES.has(node.type) : false;
	}
	isDescendant(childId, ancestorId) {
		let current = this.nodes.get(childId);
		while (current) {
			if (current.id === ancestorId) return true;
			current = current.parentId ? this.nodes.get(current.parentId) : void 0;
		}
		return false;
	}
	clearAbsPosCache() {
		this.absPosCache.clear();
	}
	getAbsolutePosition(id) {
		const cached = this.absPosCache.get(id);
		if (cached) return cached;
		const node = this.getNode(id);
		if (!node) return {
			x: 0,
			y: 0
		};
		const result = getAbsolutePosition(node, this);
		this.absPosCache.set(id, result);
		return result;
	}
	getAbsoluteBounds(id) {
		const pos = this.getAbsolutePosition(id);
		const node = this.nodes.get(id);
		return {
			x: pos.x,
			y: pos.y,
			width: node?.width ?? 0,
			height: node?.height ?? 0
		};
	}
	generateNodeId() {
		let id = generateId();
		while (this.nodes.has(id)) id = generateId();
		return id;
	}
	registerNode(node, parentId) {
		node.parentId = parentId;
		this.nodes.set(node.id, node);
		if (node.type === "INSTANCE" && node.componentId) {
			let set = this.instanceIndex.get(node.componentId);
			if (!set) {
				set = /* @__PURE__ */ new Set();
				this.instanceIndex.set(node.componentId, set);
			}
			set.add(node.id);
		}
		this.emitter.emit("node:created", node);
		return node;
	}
	createNode(type, parentId, overrides = {}) {
		const node = createDefaultNode(() => this.generateNodeId(), type, overrides);
		this.nodes.get(parentId)?.childIds.push(node.id);
		return this.registerNode(node, parentId);
	}
	createNodeWithId(id, type, parentId, overrides = {}) {
		const node = createDefaultNode(() => id, type, overrides);
		node.id = id;
		const parent = parentId ? this.nodes.get(parentId) : void 0;
		if (parent && !parent.childIds.includes(id)) parent.childIds.push(id);
		return this.registerNode(node, parentId);
	}
	static TEXT_PICTURE_KEYS = TEXT_PICTURE_KEYS;
	static GLYPH_AFFECTING_KEYS = GLYPH_AFFECTING_KEYS;
	static LAYOUT_AFFECTING_KEYS = /* @__PURE__ */ new Set([
		"x",
		"y",
		"width",
		"height",
		"rotation",
		"flipX",
		"flipY",
		"layoutMode",
		"layoutDirection",
		"itemSpacing",
		"counterAxisSpacing",
		"paddingLeft",
		"paddingRight",
		"paddingTop",
		"paddingBottom",
		"primaryAxisAlign",
		"counterAxisAlign",
		"counterAxisAlignContent",
		"layoutWrap",
		"primaryAxisSizing",
		"counterAxisSizing",
		"layoutPositioning",
		"layoutGrow",
		"layoutAlignSelf",
		"strokesIncludedInLayout",
		"horizontalConstraint",
		"verticalConstraint",
		"gridTemplateColumns",
		"gridTemplateRows",
		"gridColumnGap",
		"gridRowGap",
		"gridPosition",
		"minWidth",
		"maxWidth",
		"minHeight",
		"maxHeight"
	]);
	runPreviewUpdates(fn) {
		this.previewMutationDepth++;
		try {
			fn();
		} finally {
			this.previewMutationDepth--;
		}
	}
	preserveSourceMetadataDuring(fn) {
		this.sourceMetadataPreservationDepth++;
		try {
			fn();
		} finally {
			this.sourceMetadataPreservationDepth--;
		}
	}
	withLayoutMutations(fn) {
		this.layoutMutationDepth++;
		try {
			fn();
		} finally {
			this.layoutMutationDepth--;
		}
	}
	get isApplyingLayout() {
		return this.layoutMutationDepth > 0;
	}
	updateNodePositionPreview(id, x, y) {
		this.updateNodePreview(id, {
			x,
			y
		});
	}
	updateNodePreview(id, changes) {
		const appliedChanges = updateNodePreview(this, id, changes);
		if (appliedChanges) this.emitter.emit("node:previewUpdated", id, appliedChanges);
	}
	updateNode(id, changes) {
		if (this.previewMutationDepth > 0) {
			this.updateNodePreview(id, changes);
			return;
		}
		const node = this.nodes.get(id);
		if (!node) return;
		let entries = Object.entries(changes);
		changes = Object.fromEntries(entries.filter(([, value]) => value !== void 0));
		changes = styleDetachmentChanges(node, changes);
		entries = Object.entries(changes);
		changes = Object.fromEntries(entries.filter(([, value]) => value !== void 0));
		if (Object.keys(changes).some((k) => SceneGraph.LAYOUT_AFFECTING_KEYS.has(k))) this.absPosCache.clear();
		if (node.type === "INSTANCE" && "componentId" in changes && changes.componentId !== node.componentId) {
			if (node.componentId) this.instanceIndex.get(node.componentId)?.delete(id);
			if (changes.componentId) {
				let set = this.instanceIndex.get(changes.componentId);
				if (!set) {
					set = /* @__PURE__ */ new Set();
					this.instanceIndex.set(changes.componentId, set);
				}
				set.add(id);
			}
		}
		if (node.type === "TEXT") {
			const textChanged = Object.keys(changes).some((k) => TEXT_PICTURE_KEYS.has(k));
			if (node.textPicture && textChanged) node.textPicture = null;
			const glyphChanged = Object.keys(changes).some((k) => GLYPH_AFFECTING_KEYS.has(k));
			if (node.figmaDerivedTextGlyphs && glyphChanged) node.figmaDerivedTextGlyphs = null;
		}
		if (this.sourceMetadataPreservationDepth === 0) markSourceFieldsEdited(node, Object.keys(changes));
		if (changes.vectorNetwork) changes = {
			...changes,
			vectorNetwork: normalizeVectorNetwork(changes.vectorNetwork)
		};
		Object.assign(node, changes);
		if (changes.fills) removeStaleBindings(node, "fills", changes);
		if (changes.strokes) removeStaleBindings(node, "strokes", changes);
		this.emitter.emit("node:updated", id, changes);
	}
	reparentNode(nodeId, newParentId) {
		const node = this.nodes.get(nodeId);
		if (!node || nodeId === this.rootId) return;
		if (this.isDescendant(newParentId, nodeId)) return;
		const oldParent = node.parentId ? this.nodes.get(node.parentId) : void 0;
		const newParent = this.nodes.get(newParentId);
		if (!newParent) return;
		if (node.parentId === newParentId) return;
		const oldParentId = node.parentId;
		this.absPosCache.clear();
		const absPos = this.getAbsolutePosition(nodeId);
		const newParentNode = this.nodes.get(newParentId);
		const newParentAbs = newParentId === this.rootId || newParentNode?.type === "CANVAS" ? {
			x: 0,
			y: 0
		} : this.getAbsolutePosition(newParentId);
		if (oldParent) oldParent.childIds = oldParent.childIds.filter((cid) => cid !== nodeId);
		node.parentId = newParentId;
		newParent.childIds.push(nodeId);
		node.x = absPos.x - newParentAbs.x;
		node.y = absPos.y - newParentAbs.y;
		this.emitter.emit("node:reparented", nodeId, oldParentId, newParentId);
	}
	reorderChild(nodeId, parentId, insertIndex) {
		const node = this.nodes.get(nodeId);
		if (!node) return;
		const oldParent = node.parentId ? this.nodes.get(node.parentId) : void 0;
		const newParent = this.nodes.get(parentId);
		if (!newParent) return;
		if (oldParent) oldParent.childIds = oldParent.childIds.filter((cid) => cid !== nodeId);
		let idx = insertIndex;
		if (oldParent === newParent && idx > (!oldParent.childIds.includes(nodeId) ? idx : oldParent.childIds.length)) {}
		node.parentId = parentId;
		idx = Math.min(idx, newParent.childIds.length);
		newParent.childIds.splice(idx, 0, nodeId);
		this.emitter.emit("node:reordered", nodeId, parentId, idx);
	}
	insertChildAt(childId, parentId, index) {
		const oldParent = this.getNode(this.getNode(childId)?.parentId ?? "");
		if (oldParent) oldParent.childIds = oldParent.childIds.filter((id) => id !== childId);
		const newParent = this.getNode(parentId);
		if (!newParent) return;
		newParent.childIds = newParent.childIds.filter((id) => id !== childId);
		newParent.childIds.splice(index, 0, childId);
		const node = this.getNode(childId);
		if (node) node.parentId = parentId;
		this.clearAbsPosCache();
		this.emitter.emit("node:reordered", childId, parentId, index);
	}
	deleteNode(id) {
		const node = this.nodes.get(id);
		if (!node || id === this.rootId) return;
		if (node.parentId) {
			const parent = this.nodes.get(node.parentId);
			if (parent) parent.childIds = parent.childIds.filter((cid) => cid !== id);
		}
		for (const childId of Array.from(node.childIds)) this.deleteNode(childId);
		if (node.type === "INSTANCE" && node.componentId) this.instanceIndex.get(node.componentId)?.delete(id);
		this.nodes.delete(id);
		this.emitter.emit("node:deleted", id);
	}
	hitTest(px, py, scopeId) {
		return hitTest(this, px, py, scopeId);
	}
	hitTestDeep(px, py, scopeId) {
		return hitTestDeep(this, px, py, scopeId);
	}
	hitTestFrame(px, py, excludeIds, scopeId) {
		return hitTestFrame(this, px, py, excludeIds, scopeId);
	}
	cloneTree(sourceId, parentId, overrides = {}) {
		const src = this.nodes.get(sourceId);
		if (!src) return null;
		const props = cloneNodeProps(src, null);
		props.source = {
			...props.source,
			id: null,
			orderKey: null
		};
		const clone = this.createNode(src.type, parentId, {
			...props,
			...overrides
		});
		for (const childId of src.childIds) this.cloneTree(childId, clone.id);
		return clone;
	}
	createInstance(componentId, parentId, overrides = {}) {
		return createInstance(this, componentId, parentId, overrides);
	}
	populateInstanceChildren(instanceId, componentId, mode = "deep") {
		populateInstanceChildren(this, instanceId, componentId, mode);
	}
	swapInstanceComponent(instanceId, componentId) {
		swapInstanceComponent(this, instanceId, componentId);
	}
	syncInstances(componentId) {
		syncInstances(this, componentId);
	}
	detachInstance(instanceId) {
		detachInstance(this, instanceId);
	}
	getMainComponent(instanceId) {
		return getMainComponent(this, instanceId);
	}
	getInstances(componentId) {
		return getInstances(this, componentId);
	}
	flattenTree(parentId, depth = 0) {
		const id = parentId ?? this.rootId;
		const parent = this.nodes.get(id);
		if (!parent) return [];
		const result = [];
		for (const childId of parent.childIds) {
			const child = this.nodes.get(childId);
			if (!child) continue;
			result.push({
				node: child,
				depth
			});
			if (child.childIds.length > 0) result.push(...this.flattenTree(childId, depth + 1));
		}
		return result;
	}
};
//#endregion
export { GLYPH_AFFECTING_KEYS, SceneGraph, TEXT_PICTURE_KEYS, UndoManager, addCollection, addMode, addVariable, bindVariable, computeSelectionBounds, computeSnap, copyInstanceComponentProps, createCollection, createInstance, createVariable, detachInstance, generateId, getActiveModeId, getInstances, getMainComponent, getNodeVariableModeId, getSharedStyles, getVariablesByType, getVariablesForCollection, markSourceFieldsEdited, populateInstanceChildren, removeCollection, removeMode, removeVariable, renameMode, resolveColorVariable, resolveColorVariableForNode, resolveNumberVariable, resolveNumberVariableForNode, resolveVariable, setActiveMode, setDefaultMode, sharedStyleRefKey, sharedStyleTypeForKind, styleDetachmentChanges, swapInstanceComponent, syncInstances, unbindVariable, updateNodePreview };

//# sourceMappingURL=types.js.map
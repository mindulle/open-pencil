import { IS_BROWSER } from "../constants.js";
import { decodeBase64, encodeBase64 } from "../bytes/base64.js";
import { canMakeBooleanSourceNode } from "../canvas/boolean.js";
import { flattenNodesToVectorProps } from "../canvas/flatten.js";
import { FigmaNodeProxy, INTERNAL_ID, MIXED } from "./proxy.js";
import { copyEffects, copyFills, copyStrokes } from "@open-pencil/scene-graph/copy";
import { computeBounds } from "@open-pencil/scene-graph/geometry";
import { computeImageHash } from "@open-pencil/scene-graph/images";
//#region src/figma-api/index.ts
const noop = () => void 0;
var FigmaAPI = class {
	graph;
	_currentPageId;
	_selection = [];
	_nodeCache = /* @__PURE__ */ new Map();
	_pageProxies = /* @__PURE__ */ new WeakSet();
	_renderer = null;
	mixed = MIXED;
	constructor(graph) {
		this.graph = graph;
		const pages = graph.getPages();
		this._currentPageId = pages[0]?.id ?? graph.rootId;
	}
	setRenderer(renderer) {
		this._renderer = renderer;
	}
	get currentPageId() {
		return this._currentPageId;
	}
	wrapNode(id) {
		let proxy = this._nodeCache.get(id);
		if (!proxy) {
			proxy = new FigmaNodeProxy(id, this.graph, this);
			this._nodeCache.set(id, proxy);
		}
		return proxy;
	}
	_ensurePageProxy(proxy) {
		if (!this._pageProxies.has(proxy)) {
			Object.defineProperty(proxy, "selection", {
				get: () => this._selection,
				set: (nodes) => {
					this._selection = nodes;
				},
				enumerable: true,
				configurable: true
			});
			this._pageProxies.add(proxy);
		}
		return proxy;
	}
	get root() {
		return this.wrapNode(this.graph.rootId);
	}
	get currentPage() {
		return this._ensurePageProxy(this.wrapNode(this._currentPageId));
	}
	set currentPage(page) {
		this._currentPageId = page[INTERNAL_ID];
	}
	getNodeById(id) {
		return this.graph.getNode(id) ? this.wrapNode(id) : null;
	}
	_createNode(type) {
		const node = this.graph.createNode(type, this._currentPageId);
		return this.wrapNode(node.id);
	}
	createFrame() {
		return this._createNode("FRAME");
	}
	createRectangle() {
		return this._createNode("RECTANGLE");
	}
	createEllipse() {
		return this._createNode("ELLIPSE");
	}
	createText() {
		return this._createNode("TEXT");
	}
	createLine() {
		return this._createNode("LINE");
	}
	createPolygon() {
		return this._createNode("POLYGON");
	}
	createStar() {
		return this._createNode("STAR");
	}
	createVector() {
		return this._createNode("VECTOR");
	}
	createComponent() {
		return this._createNode("COMPONENT");
	}
	createSection() {
		return this._createNode("SECTION");
	}
	createPage() {
		const page = this.graph.addPage("Page");
		return this.wrapNode(page.id);
	}
	_nodeId(node) {
		return node[INTERNAL_ID];
	}
	group(nodes, parent, index) {
		const parentId = this._nodeId(parent);
		const groupNode = this.graph.createNode("GROUP", parentId);
		for (const n of nodes) this.graph.reparentNode(this._nodeId(n), groupNode.id);
		if (index != null) this.graph.reorderChild(groupNode.id, parentId, index);
		return this.wrapNode(groupNode.id);
	}
	ungroup(node) {
		const nodeId = this._nodeId(node);
		const raw = this.graph.getNode(nodeId);
		if (!raw || raw.childIds.length === 0) return [];
		const parentId = raw.parentId ?? this._currentPageId;
		const children = Array.from(raw.childIds);
		for (const childId of children) this.graph.reparentNode(childId, parentId);
		this.graph.deleteNode(nodeId);
		return children.map((id) => this.wrapNode(id));
	}
	createComponentFromNode(node) {
		const raw = this.graph.getNode(node[INTERNAL_ID]);
		if (!raw) throw new Error("Node not found");
		const parentId = raw.parentId ?? this._currentPageId;
		const comp = this.graph.createNode("COMPONENT", parentId);
		this.graph.updateNode(comp.id, {
			name: raw.name,
			width: raw.width,
			height: raw.height,
			x: raw.x,
			y: raw.y,
			fills: copyFills(raw.fills),
			strokes: copyStrokes(raw.strokes),
			effects: copyEffects(raw.effects),
			cornerRadius: raw.cornerRadius,
			topLeftRadius: raw.topLeftRadius,
			topRightRadius: raw.topRightRadius,
			bottomRightRadius: raw.bottomRightRadius,
			bottomLeftRadius: raw.bottomLeftRadius,
			independentCorners: raw.independentCorners,
			opacity: raw.opacity,
			layoutMode: raw.layoutMode,
			primaryAxisAlign: raw.primaryAxisAlign,
			counterAxisAlign: raw.counterAxisAlign,
			itemSpacing: raw.itemSpacing,
			paddingTop: raw.paddingTop,
			paddingRight: raw.paddingRight,
			paddingBottom: raw.paddingBottom,
			paddingLeft: raw.paddingLeft,
			pluginData: structuredClone(raw.pluginData),
			pluginRelaunchData: structuredClone(raw.pluginRelaunchData)
		});
		for (const childId of raw.childIds) this.graph.cloneTree(childId, comp.id);
		this.graph.deleteNode(node[INTERNAL_ID]);
		return this.wrapNode(comp.id);
	}
	getVariableById(id) {
		return this.graph.variables.get(id) ?? null;
	}
	getLocalVariables(type) {
		const vars = [...this.graph.variables.values()];
		if (type) return vars.filter((v) => v.type === type);
		return vars;
	}
	getLocalVariableCollections() {
		return [...this.graph.variableCollections.values()];
	}
	getVariableCollectionById(id) {
		return this.graph.variableCollections.get(id) ?? null;
	}
	createVariable(name, type, collectionId, value) {
		return this.graph.createVariable(name, type, collectionId, value);
	}
	setVariableValue(variableId, modeId, value) {
		const variable = this.graph.variables.get(variableId);
		if (!variable) throw new Error(`Variable "${variableId}" not found`);
		variable.valuesByMode[modeId] = value;
	}
	deleteVariable(id) {
		this.graph.removeVariable(id);
	}
	createVariableCollection(name) {
		return this.graph.createCollection(name);
	}
	deleteVariableCollection(id) {
		this.graph.removeCollection(id);
	}
	bindVariable(nodeId, field, variableId) {
		this.graph.bindVariable(nodeId, field, variableId);
	}
	unbindVariable(nodeId, field) {
		this.graph.unbindVariable(nodeId, field);
	}
	_booleanOperation(operation, nodes, parent, index) {
		if (nodes.length < 2) throw new Error("Need at least 2 nodes for boolean operation");
		const parentId = this._nodeId(parent);
		const first = this.graph.getNode(this._nodeId(nodes[0]));
		if (!first) throw new Error("Node not found");
		const group = this.graph.createNode("BOOLEAN_OPERATION", parentId, {
			name: `Boolean ${operation.toLowerCase()}`,
			x: first.x,
			y: first.y,
			width: first.width,
			height: first.height,
			booleanOperation: operation
		});
		for (const node of nodes) this.graph.reparentNode(this._nodeId(node), group.id);
		if (index != null) this.graph.reorderChild(group.id, parentId, index);
		return this.wrapNode(group.id);
	}
	_nodesById(nodeIds) {
		return nodeIds.map((id) => {
			const node = this.getNodeById(id);
			if (!node) throw new Error(`Node ${id} not found`);
			return node;
		});
	}
	booleanOperation(operation, nodeIds) {
		const first = this.graph.getNode(nodeIds[0]);
		const parent = this.wrapNode(first?.parentId ?? this._currentPageId);
		return this._booleanOperation(operation, this._nodesById(nodeIds), parent);
	}
	union(nodes, parent, index) {
		return this._booleanOperation("UNION", nodes, parent, index);
	}
	subtract(nodes, parent, index) {
		return this._booleanOperation("SUBTRACT", nodes, parent, index);
	}
	intersect(nodes, parent, index) {
		return this._booleanOperation("INTERSECT", nodes, parent, index);
	}
	exclude(nodes, parent, index) {
		return this._booleanOperation("EXCLUDE", nodes, parent, index);
	}
	flatten(nodes, parent, index) {
		if (nodes.length === 0) throw new Error("Need at least 1 node to flatten");
		const parentId = this._nodeId(parent ?? this.currentPage);
		const sourceNodes = [];
		for (const node of nodes) {
			const raw = this.graph.getNode(this._nodeId(node));
			if (!raw) throw new Error("Node not found");
			sourceNodes.push(raw);
		}
		const vector = this._renderer ? this._flattenWithRenderer(sourceNodes, parentId) : this._flattenPlaceholder(sourceNodes, parentId);
		if (index != null) this.graph.reorderChild(vector.id, parentId, index);
		for (const node of nodes) this.graph.deleteNode(this._nodeId(node));
		return this.wrapNode(vector.id);
	}
	_flattenPlaceholder(nodes, parentId) {
		const first = nodes[0];
		return this.graph.createNode("VECTOR", parentId, {
			name: "Flatten",
			x: first.x,
			y: first.y,
			width: first.width,
			height: first.height,
			fills: copyFills(first.fills)
		});
	}
	_flattenWithRenderer(nodes, parentId) {
		const renderer = this._renderer;
		if (!renderer) return this._flattenPlaceholder(nodes, parentId);
		if (nodes.some((node) => !canMakeBooleanSourceNode(node, this.graph))) throw new Error("Cannot flatten unsupported node type");
		const vectorProps = flattenNodesToVectorProps(renderer, this.graph, nodes);
		if (!vectorProps) throw new Error("Cannot flatten empty node path");
		return this.graph.createNode("VECTOR", parentId, vectorProps);
	}
	flattenNode(nodeIds) {
		const first = this.graph.getNode(nodeIds[0]);
		const parent = this.wrapNode(first?.parentId ?? this._currentPageId);
		return this.flatten(this._nodesById(nodeIds), parent);
	}
	_viewport = {
		x: 0,
		y: 0,
		zoom: 1
	};
	get viewport() {
		return {
			center: {
				x: this._viewport.x,
				y: this._viewport.y
			},
			zoom: this._viewport.zoom,
			scrollAndZoomIntoView: (nodes) => {
				const b = computeBounds(nodes.map((n) => n.absoluteBoundingBox));
				if (b.width === 0 && b.height === 0 && nodes.length === 0) return;
				const padding = 80;
				const contentW = b.width + padding * 2;
				const contentH = b.height + padding * 2;
				const viewW = IS_BROWSER ? window.innerWidth : 1280;
				const viewH = IS_BROWSER ? window.innerHeight : 720;
				const zoom = Math.min(viewW / contentW, viewH / contentH, 1);
				this._viewport = {
					x: b.x + b.width / 2,
					y: b.y + b.height / 2,
					zoom
				};
			}
		};
	}
	set viewport(v) {
		this._viewport = {
			x: v.center.x,
			y: v.center.y,
			zoom: v.zoom
		};
	}
	createImage(data) {
		const hash = computeImageHash(data);
		this.graph.images.set(hash, data);
		return { hash };
	}
	async loadFontAsync(_fontName) {}
	async listAvailableFontsAsync() {
		return [];
	}
	base64Encode(data) {
		return encodeBase64(data);
	}
	base64Decode(data) {
		return decodeBase64(data);
	}
	notify(message) {
		if (typeof console !== "undefined") console.warn(`[figma.notify] ${message}`);
		return { cancel: noop };
	}
	commitUndo() {}
	triggerUndo() {}
	exportImage;
};
//#endregion
export { FigmaAPI, FigmaNodeProxy, computeImageHash };

//# sourceMappingURL=index.js.map
import { getFillOkHCL, getStrokeOkHCL, setNodeFillOkHCL, setNodeStrokeOkHCL } from "../color/okhcl.js";
import { installBasicNodeProxyAccessors } from "./accessors/basic.js";
import { installLayoutNodeProxyAccessors } from "./accessors/layout.js";
import { installVariableModeNodeProxyAccessors } from "./accessors/variables.js";
import { installVectorNodeProxyAccessors } from "./accessors/vector.js";
import { installVisualNodeProxyAccessors } from "./accessors/visual.js";
import { getPluginData, getPluginDataKeys, getSharedPluginData, getSharedPluginDataKeys, setPluginData, setSharedPluginData } from "./plugin-data.js";
import { nodeProxyToJSON } from "./serialization.js";
import { setFirstStrokeAlign, setFirstStrokeWeight, setIndependentStrokeWeight } from "./strokes.js";
import { styleNameToWeight, weightToStyleName } from "./fonts.js";
import { deleteCharacters, getFontName, insertCharacters, setFontName } from "./text.js";
import { findAll, findAllWithCriteria, findChild, findChildren, findOne } from "./traversal.js";
//#region src/figma-api/proxy.ts
const MIXED = Symbol("mixed");
const INTERNAL_ID = Symbol("id");
const INTERNAL_GRAPH = Symbol("graph");
const INTERNAL_API = Symbol("api");
var FigmaNodeProxy = class {
	[INTERNAL_ID];
	[INTERNAL_GRAPH];
	[INTERNAL_API];
	constructor(id, graph, api) {
		this[INTERNAL_ID] = id;
		this[INTERNAL_GRAPH] = graph;
		this[INTERNAL_API] = api;
		if (graph.getNode(id)?.type === "VECTOR") installVectorNodeProxyAccessors(this, {
			id: INTERNAL_ID,
			graph: INTERNAL_GRAPH,
			api: INTERNAL_API
		}, MIXED);
	}
	_raw() {
		const n = this[INTERNAL_GRAPH].getNode(this[INTERNAL_ID]);
		if (!n) throw new Error(`Node ${this[INTERNAL_ID]} has been removed`);
		return n;
	}
	get strokeWeight() {
		const s = this._raw().strokes;
		return s.length > 0 ? s[0].weight : 0;
	}
	set strokeWeight(v) {
		setFirstStrokeWeight(this[INTERNAL_GRAPH], this._raw(), v);
	}
	get strokeAlign() {
		const s = this._raw().strokes;
		return s.length > 0 ? s[0].align : "INSIDE";
	}
	set strokeAlign(v) {
		setFirstStrokeAlign(this[INTERNAL_GRAPH], this._raw(), v);
	}
	get dashPattern() {
		return Object.freeze([...this._raw().dashPattern]);
	}
	set dashPattern(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { dashPattern: [...v] });
	}
	get strokeCap() {
		return this._raw().strokeCap;
	}
	set strokeCap(v) {
		const strokeCap = v;
		const node = this._raw();
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], {
			strokeCap,
			strokes: node.strokes.map((stroke) => ({
				...stroke,
				cap: strokeCap
			}))
		});
	}
	get strokeJoin() {
		return this._raw().strokeJoin;
	}
	set strokeJoin(v) {
		const strokeJoin = v;
		const node = this._raw();
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], {
			strokeJoin,
			strokes: node.strokes.map((stroke) => ({
				...stroke,
				join: strokeJoin
			}))
		});
	}
	get strokeMiterLimit() {
		return this._raw().strokeMiterLimit;
	}
	set strokeMiterLimit(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { strokeMiterLimit: v });
	}
	get strokeTopWeight() {
		return this._raw().borderTopWeight;
	}
	set strokeTopWeight(v) {
		setIndependentStrokeWeight(this[INTERNAL_GRAPH], this[INTERNAL_ID], "borderTopWeight", v);
	}
	get strokeBottomWeight() {
		return this._raw().borderBottomWeight;
	}
	set strokeBottomWeight(v) {
		setIndependentStrokeWeight(this[INTERNAL_GRAPH], this[INTERNAL_ID], "borderBottomWeight", v);
	}
	get strokeLeftWeight() {
		return this._raw().borderLeftWeight;
	}
	set strokeLeftWeight(v) {
		setIndependentStrokeWeight(this[INTERNAL_GRAPH], this[INTERNAL_ID], "borderLeftWeight", v);
	}
	get strokeRightWeight() {
		return this._raw().borderRightWeight;
	}
	set strokeRightWeight(v) {
		setIndependentStrokeWeight(this[INTERNAL_GRAPH], this[INTERNAL_ID], "borderRightWeight", v);
	}
	get characters() {
		return this._raw().text;
	}
	set characters(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { text: v });
	}
	get fontSize() {
		return this._raw().fontSize;
	}
	set fontSize(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { fontSize: v });
	}
	get fontName() {
		return getFontName(this._raw());
	}
	set fontName(v) {
		setFontName(this[INTERNAL_GRAPH], this[INTERNAL_ID], v);
	}
	get fontWeight() {
		return this._raw().fontWeight;
	}
	set fontWeight(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { fontWeight: v });
	}
	get textAlignHorizontal() {
		return this._raw().textAlignHorizontal;
	}
	set textAlignHorizontal(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { textAlignHorizontal: v });
	}
	get textDirection() {
		return this._raw().textDirection;
	}
	set textDirection(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { textDirection: v });
	}
	get textAlignVertical() {
		return this._raw().textAlignVertical;
	}
	set textAlignVertical(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { textAlignVertical: v });
	}
	get textAutoResize() {
		return this._raw().textAutoResize;
	}
	set textAutoResize(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { textAutoResize: v });
	}
	get letterSpacing() {
		return this._raw().letterSpacing;
	}
	set letterSpacing(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { letterSpacing: v });
	}
	get lineHeight() {
		return this._raw().lineHeight;
	}
	set lineHeight(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { lineHeight: v });
	}
	get textCase() {
		return this._raw().textCase;
	}
	set textCase(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { textCase: v });
	}
	get textDecoration() {
		return this._raw().textDecoration;
	}
	set textDecoration(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { textDecoration: v });
	}
	get maxLines() {
		return this._raw().maxLines;
	}
	set maxLines(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { maxLines: v });
	}
	get textTruncation() {
		return this._raw().textTruncation;
	}
	set textTruncation(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { textTruncation: v });
	}
	get autoRename() {
		return this._raw().autoRename;
	}
	set autoRename(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { autoRename: v });
	}
	insertCharacters(start, characters) {
		insertCharacters(this[INTERNAL_GRAPH], this._raw(), start, characters);
	}
	deleteCharacters(start, end) {
		deleteCharacters(this[INTERNAL_GRAPH], this._raw(), start, end);
	}
	get isMask() {
		return this._raw().isMask;
	}
	set isMask(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { isMask: v });
	}
	get maskType() {
		return this._raw().maskType;
	}
	set maskType(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { maskType: v });
	}
	get expanded() {
		return this._raw().expanded;
	}
	set expanded(v) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], { expanded: v });
	}
	get mainComponent() {
		const n = this._raw();
		if (!n.componentId) return null;
		const comp = this[INTERNAL_GRAPH].getNode(n.componentId);
		if (!comp) return null;
		return this[INTERNAL_API].wrapNode(comp.id);
	}
	createInstance() {
		const n = this._raw();
		if (n.type !== "COMPONENT") throw new Error("createInstance() can only be called on components");
		const pageId = this[INTERNAL_API].currentPageId;
		const inst = this[INTERNAL_GRAPH].createInstance(n.id, pageId);
		if (!inst) throw new Error("Failed to create instance");
		return this[INTERNAL_API].wrapNode(inst.id);
	}
	get parent() {
		const n = this._raw();
		if (!n.parentId) return null;
		return this[INTERNAL_API].wrapNode(n.parentId);
	}
	get children() {
		return this[INTERNAL_GRAPH].getChildren(this[INTERNAL_ID]).map((c) => this[INTERNAL_API].wrapNode(c.id));
	}
	appendChild(child) {
		this[INTERNAL_GRAPH].reparentNode(child[INTERNAL_ID], this[INTERNAL_ID]);
	}
	insertChild(index, child) {
		this[INTERNAL_GRAPH].reparentNode(child[INTERNAL_ID], this[INTERNAL_ID]);
		this[INTERNAL_GRAPH].reorderChild(child[INTERNAL_ID], this[INTERNAL_ID], index);
	}
	clone() {
		const parentId = this._raw().parentId ?? this[INTERNAL_API].currentPageId;
		const cloned = this[INTERNAL_GRAPH].cloneTree(this[INTERNAL_ID], parentId);
		if (!cloned) throw new Error(`Failed to clone node ${this[INTERNAL_ID]}`);
		return this[INTERNAL_API].wrapNode(cloned.id);
	}
	remove() {
		this[INTERNAL_GRAPH].deleteNode(this[INTERNAL_ID]);
	}
	findAll(callback) {
		return findAll(this[INTERNAL_GRAPH], this[INTERNAL_API], this[INTERNAL_ID], callback);
	}
	findOne(callback) {
		return findOne(this[INTERNAL_GRAPH], this[INTERNAL_API], this[INTERNAL_ID], callback);
	}
	findChild(callback) {
		return findChild(this[INTERNAL_GRAPH], this[INTERNAL_API], this[INTERNAL_ID], callback);
	}
	findChildren(callback) {
		return findChildren(this[INTERNAL_GRAPH], this[INTERNAL_API], this[INTERNAL_ID], callback);
	}
	findAllWithCriteria(criteria) {
		return findAllWithCriteria(this[INTERNAL_GRAPH], this[INTERNAL_API], this[INTERNAL_ID], criteria);
	}
	getPluginData(key) {
		return getPluginData(this._raw(), key);
	}
	setPluginData(key, value) {
		setPluginData(this[INTERNAL_GRAPH], this._raw(), key, value);
	}
	getPluginDataKeys() {
		return getPluginDataKeys(this._raw());
	}
	getSharedPluginData(namespace, key) {
		return getSharedPluginData(this._raw(), namespace, key);
	}
	setSharedPluginData(namespace, key, value) {
		setSharedPluginData(this[INTERNAL_GRAPH], this._raw(), namespace, key, value);
	}
	getSharedPluginDataKeys(namespace) {
		return getSharedPluginDataKeys(this._raw(), namespace);
	}
	getFillOkHCL(index = 0) {
		return getFillOkHCL(this._raw(), index);
	}
	setFillOkHCL(color, index = 0) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], setNodeFillOkHCL(this._raw(), index, color));
	}
	getStrokeOkHCL(index = 0) {
		return getStrokeOkHCL(this._raw(), index);
	}
	setStrokeOkHCL(color, index = 0) {
		this[INTERNAL_GRAPH].updateNode(this[INTERNAL_ID], setNodeStrokeOkHCL(this._raw(), index, color));
	}
	toJSON(maxDepth, currentDepth = 0) {
		return nodeProxyToJSON(this[INTERNAL_GRAPH], this[INTERNAL_API], this[INTERNAL_ID], maxDepth, currentDepth);
	}
	toString() {
		const n = this._raw();
		return `[${n.type} "${n.name}" ${n.id}]`;
	}
	[Symbol.for("nodejs.util.inspect.custom")]() {
		return this.toString();
	}
};
installBasicNodeProxyAccessors(FigmaNodeProxy.prototype, {
	id: INTERNAL_ID,
	graph: INTERNAL_GRAPH,
	api: INTERNAL_API
});
installVisualNodeProxyAccessors(FigmaNodeProxy.prototype, {
	id: INTERNAL_ID,
	graph: INTERNAL_GRAPH,
	api: INTERNAL_API
}, MIXED);
const proxyInternals = {
	id: INTERNAL_ID,
	graph: INTERNAL_GRAPH,
	api: INTERNAL_API
};
installLayoutNodeProxyAccessors(FigmaNodeProxy.prototype, proxyInternals);
installVariableModeNodeProxyAccessors(FigmaNodeProxy.prototype, proxyInternals);
//#endregion
export { FigmaNodeProxy, INTERNAL_API, INTERNAL_GRAPH, INTERNAL_ID, MIXED, styleNameToWeight, weightToStyleName };

//# sourceMappingURL=proxy.js.map
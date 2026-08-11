import { randomHex } from "../random.js";
import { computeAllLayouts } from "../layout.js";
import { parseColor } from "../color/index.js";
import { extractPaths, scalePathInfos } from "../icons/svg.js";
import { isTreeNode } from "./tree.js";
import { fetchIcons } from "../icons/index.js";
import { createIconFromPaths } from "../icons/render.js";
import { applySizeOverrides, propsToOverrides } from "./props-overrides.js";
import { isVariable } from "./vars.js";
//#region src/design-jsx/renderer.ts
const TYPE_MAP = {
	frame: "FRAME",
	view: "FRAME",
	rectangle: "RECTANGLE",
	rect: "RECTANGLE",
	ellipse: "ELLIPSE",
	text: "TEXT",
	line: "LINE",
	star: "STAR",
	polygon: "POLYGON",
	vector: "VECTOR",
	group: "GROUP",
	section: "SECTION",
	component: "COMPONENT",
	"component-set": "COMPONENT_SET",
	componentset: "COMPONENT_SET",
	div: "FRAME",
	main: "FRAME",
	header: "FRAME",
	footer: "FRAME",
	nav: "FRAME",
	article: "FRAME",
	aside: "FRAME",
	span: "TEXT",
	p: "TEXT",
	h1: "TEXT",
	h2: "TEXT",
	h3: "TEXT",
	h4: "TEXT",
	h5: "TEXT",
	h6: "TEXT"
};
async function renderTree(graph, tree, options = {}) {
	const result = await renderNode(graph, tree, options.parentId ?? graph.getPages()[0].id);
	if (options.x !== void 0) graph.updateNode(result.id, { x: options.x });
	if (options.y !== void 0) graph.updateNode(result.id, { y: options.y });
	computeAllLayouts(graph);
	return {
		id: result.id,
		name: result.name,
		type: result.type,
		childIds: result.childIds
	};
}
function isObjectRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function resolveVariableId(graph, variable) {
	if (variable.id && graph.variables.has(variable.id)) return variable.id;
	if (variable.id && !variable.name) return variable.id;
	for (const candidate of graph.variables.values()) if (candidate.name === variable.name || candidate.id === variable.name) return candidate.id;
	return variable.id;
}
function variableFallback(graph, variable) {
	if (variable.value !== void 0) return variable.value;
	const variableId = resolveVariableId(graph, variable);
	return variableId ? graph.resolveColorVariable(variableId) : void 0;
}
function bindVariableProp(graph, props, bindings, key, field) {
	const value = props[key];
	if (!isVariable(value)) return;
	const variableId = resolveVariableId(graph, value);
	if (variableId) bindings[field] = variableId;
	const fallback = variableFallback(graph, value);
	if (fallback !== void 0) props[key] = fallback;
}
function bindStyleVariableProp(graph, style, bindings, key, field) {
	const value = style[key];
	if (!isVariable(value)) return;
	const variableId = resolveVariableId(graph, value);
	if (variableId) bindings[field] = variableId;
	const fallback = variableFallback(graph, value);
	if (fallback !== void 0) style[key] = fallback;
}
function preparePropsForRender(graph, source, isText) {
	const props = { ...source };
	const bindings = {};
	if (Array.isArray(props.fills)) props.fills = props.fills.map((value, index) => {
		if (!isVariable(value)) return value;
		const variableId = resolveVariableId(graph, value);
		if (variableId) bindings[`fills/${index}/color`] = variableId;
		return variableFallback(graph, value) ?? value;
	});
	for (const key of [
		"bg",
		"fill",
		"background",
		"backgroundColor"
	]) bindVariableProp(graph, props, bindings, key, "fills/0/color");
	if (isText) bindVariableProp(graph, props, bindings, "color", "fills/0/color");
	for (const key of [
		"stroke",
		"border",
		"borderColor"
	]) bindVariableProp(graph, props, bindings, key, "strokes/0/color");
	if (isObjectRecord(props.style)) {
		const style = { ...props.style };
		for (const key of ["background", "backgroundColor"]) bindStyleVariableProp(graph, style, bindings, key, "fills/0/color");
		if (isText) bindStyleVariableProp(graph, style, bindings, "color", "fills/0/color");
		bindStyleVariableProp(graph, style, bindings, "borderColor", "strokes/0/color");
		props.style = style;
	}
	if (isObjectRecord(props.bind)) {
		for (const [field, value] of Object.entries(props.bind)) if (isVariable(value)) {
			const variableId = resolveVariableId(graph, value);
			if (variableId) bindings[field] = variableId;
		} else if (typeof value === "string") bindings[field] = value;
	}
	return {
		props,
		bindings
	};
}
function applyBindings(graph, nodeId, bindings) {
	for (const [field, variableId] of Object.entries(bindings)) graph.bindVariable(nodeId, field, variableId);
}
function applyIconSize(props, overrides, parentLayout, size) {
	const { w, h } = applySizeOverrides(props, overrides, parentLayout);
	if (typeof w !== "number") overrides.width = size;
	if (typeof h !== "number") overrides.height = size;
}
function finishIconRender(graph, icon, props, size, color, parentId) {
	const parentLayout = graph.getNode(parentId)?.layoutMode ?? "NONE";
	const overrides = {};
	if (props.label) overrides.name = props.label;
	applyIconSize(props, overrides, parentLayout, size);
	return createIconFromPaths(graph, icon, icon.name, size, color, parentId, overrides);
}
async function renderIconNode(graph, tree, parentId) {
	const props = tree.props;
	const iconName = props.name;
	if (!iconName) throw new Error("<Icon> requires a name prop (e.g. name=\"lucide:heart\")");
	const size = props.size ?? 24;
	const parsedColor = parseColor(props.color ?? "#000000");
	const icon = (await fetchIcons([iconName], size)).get(iconName);
	if (!icon || icon.paths.length === 0) throw new Error(`Icon "${iconName}" not found`);
	return finishIconRender(graph, icon, props, size, parsedColor, parentId);
}
/**
* Render an inline <svg> element into vector nodes. Reuses the same SVG-path
* pipeline as iconify icons: the body may be passed as string children or a
* `body`/`children` string prop, and is parsed with extractPaths + parseSVGPath.
*/
async function renderSVGNode(graph, tree, parentId) {
	const props = tree.props;
	const explicitW = typeof props.w === "number" ? props.w : 0;
	const explicitH = typeof props.h === "number" ? props.h : 0;
	const size = explicitW > 0 || explicitH > 0 ? Math.max(explicitW, explicitH) : props.size ?? 24;
	const parsedColor = parseColor(props.color ?? "#000000");
	const body = typeof props.body === "string" && props.body || tree.children.filter((c) => typeof c === "string").join("");
	let pathInfos = body.trim() ? extractPaths(body) : [];
	if (pathInfos.length === 0) pathInfos = tree.children.filter(isTreeNode).map((child) => {
		const d = child.props.d ?? child.props.body;
		if (!d) return null;
		return {
			d,
			fill: child.props.fill ?? "currentColor",
			stroke: child.props.stroke ?? null,
			strokeWidth: Number(child.props["stroke-width"] ?? child.props.strokeWidth ?? 1),
			strokeCap: child.props["stroke-linecap"] ?? "butt",
			strokeJoin: child.props["stroke-linejoin"] ?? "miter",
			fillRule: child.props["fill-rule"] === "evenodd" ? "EVENODD" : "NONZERO"
		};
	}).filter((p) => p !== null);
	if (pathInfos.length === 0) throw new Error("<svg> requires SVG markup as children, a body prop, or <path d=\"...\"> children");
	const vb = parseViewBox(props.viewBox);
	const scaleX = vb.w > 0 ? size / vb.w : 1;
	const scaleY = vb.h > 0 ? size / vb.h : 1;
	return finishIconRender(graph, {
		prefix: "svg",
		name: props.name ?? "custom",
		width: size,
		height: size,
		paths: scalePathInfos(pathInfos, scaleX, scaleY)
	}, props, size, parsedColor, parentId);
}
function parseViewBox(viewBox) {
	if (!viewBox) return {
		w: 0,
		h: 0
	};
	const parts = viewBox.trim().split(/[\s,]+/).map(Number);
	return {
		w: parts[2] ?? 0,
		h: parts[3] ?? 0
	};
}
function parseVariantValues(name) {
	const entries = name.split(",").map((part) => part.trim()).filter(Boolean);
	const values = {};
	for (const entry of entries) {
		const [key = "", ...rest] = entry.split("=");
		const property = key.trim();
		const value = rest.join("=").trim();
		if (property && value) values[property] = value;
	}
	return values;
}
function inferComponentSetProperties(graph, componentSetId) {
	const componentSet = graph.getNode(componentSetId);
	if (componentSet?.type !== "COMPONENT_SET") return;
	if (componentSet.componentPropertyDefinitions.length > 0) return;
	const variants = graph.getChildren(componentSetId).filter((node) => node.type === "COMPONENT");
	const options = /* @__PURE__ */ new Map();
	const valuesById = /* @__PURE__ */ new Map();
	for (const variant of variants) {
		const values = parseVariantValues(variant.name);
		valuesById.set(variant.id, values);
		for (const [property, value] of Object.entries(values)) {
			let set = options.get(property);
			if (!set) {
				set = /* @__PURE__ */ new Set();
				options.set(property, set);
			}
			set.add(value);
		}
	}
	const definitions = [...options.entries()].map(([name, values]) => {
		const variantOptions = [...values];
		return {
			id: `prop:${randomHex(8)}`,
			name,
			type: "VARIANT",
			defaultValue: variantOptions[0] ?? "",
			variantOptions
		};
	});
	if (definitions.length === 0) return;
	for (const [id, values] of valuesById) graph.updateNode(id, { componentPropertyValues: values });
	graph.updateNode(componentSetId, { componentPropertyDefinitions: definitions });
}
function findComponentByName(graph, name) {
	for (const node of graph.getAllNodes()) if (node.type === "COMPONENT" && node.name === name) return node;
}
function findVariantInSet(graph, componentSet, props) {
	const requested = Object.fromEntries(Object.entries(props).filter(([key]) => ![
		"component",
		"componentId",
		"of",
		"name",
		"children"
	].includes(key)).map(([key, value]) => [key, String(value)]));
	const variants = graph.getChildren(componentSet.id).filter((node) => node.type === "COMPONENT");
	return variants.find((variant) => Object.entries(requested).every(([key, value]) => variant.componentPropertyValues[key] === value)) ?? variants[0];
}
function resolveComponent(graph, props) {
	const ref = props.component ?? props.componentId ?? props.of;
	if (typeof ref !== "string") return void 0;
	const byId = graph.getNode(ref);
	if (byId?.type === "COMPONENT") return byId;
	if (byId?.type === "COMPONENT_SET") return findVariantInSet(graph, byId, props);
	const byName = findComponentByName(graph, ref);
	if (byName) return byName;
	for (const node of graph.getAllNodes()) if (node.type === "COMPONENT_SET" && node.name === ref) return findVariantInSet(graph, node, props);
}
async function renderInstanceNode(graph, tree, parentId) {
	const parentLayout = graph.getNode(parentId)?.layoutMode ?? "NONE";
	const { props, bindings } = preparePropsForRender(graph, tree.props, false);
	const component = resolveComponent(graph, props);
	if (!component) {
		const ref = props.component ?? props.componentId ?? props.of;
		throw new Error(`<Instance> component not found: ${typeof ref === "string" || typeof ref === "number" ? String(ref) : ""}`);
	}
	const overrides = propsToOverrides(props, false, parentLayout);
	const instance = graph.createInstance(component.id, parentId, overrides) ?? graph.createNode("FRAME", parentId);
	applyBindings(graph, instance.id, bindings);
	applyInstanceOverrides(graph, instance, tree.props.overrides);
	return instance;
}
/**
* Apply child overrides to a freshly created instance. Keys are
* `childName:prop` (e.g. 'label:text', 'icon:fills'); the child is resolved by
* name among the instance's descendants, and the value is applied to both the
* child node and the instance's overrides record so component sync keeps it.
*/
function applyInstanceOverrides(graph, instance, overridesProp) {
	if (!overridesProp || typeof overridesProp !== "object") return;
	if (Array.isArray(overridesProp)) return;
	const entries = Object.entries(overridesProp);
	if (entries.length === 0) return;
	const descendants = [];
	const walk = (id) => {
		const node = graph.getNode(id);
		if (!node) return;
		descendants.push(node);
		for (const cid of node.childIds) walk(cid);
	};
	walk(instance.id);
	const overrides = { ...instance.overrides };
	for (const [key, value] of entries) {
		const sep = key.indexOf(":");
		if (sep === -1) continue;
		const childName = key.slice(0, sep);
		const prop = key.slice(sep + 1);
		const child = descendants.find((n) => n.name === childName);
		if (!child || !(prop in child)) continue;
		graph.updateNode(child.id, { [prop]: value });
		overrides[`${child.id}:${prop}`] = value;
	}
	if (Object.keys(overrides).length > 0) graph.updateNode(instance.id, { overrides });
}
async function renderNode(graph, tree, parentId) {
	if (tree.type === "icon") return renderIconNode(graph, tree, parentId);
	if (tree.type === "svg") return renderSVGNode(graph, tree, parentId);
	if (tree.type === "instance") return renderInstanceNode(graph, tree, parentId);
	const nodeType = TYPE_MAP[tree.type];
	if (!nodeType) throw new Error(`Unknown element: <${tree.type}>`);
	const parentLayout = graph.getNode(parentId)?.layoutMode ?? "NONE";
	const isText = nodeType === "TEXT";
	const { props, bindings } = preparePropsForRender(graph, tree.props, isText);
	const overrides = propsToOverrides(props, isText, parentLayout);
	if (isText) {
		const childText = tree.children.filter((c) => typeof c === "string").join("");
		const propText = props.text ?? props.characters ?? props.content ?? props.label ?? props.value ?? props.title;
		if (childText) overrides.text = childText;
		else if (typeof propText === "string") overrides.text = propText;
	}
	const node = graph.createNode(nodeType, parentId, overrides);
	applyBindings(graph, node.id, bindings);
	for (const child of tree.children) {
		if (typeof child === "string") continue;
		if (isTreeNode(child)) await renderNode(graph, child, node.id);
	}
	if (node.type === "COMPONENT_SET") inferComponentSetProperties(graph, node.id);
	return node;
}
//#endregion
export { renderTree };

//# sourceMappingURL=renderer.js.map
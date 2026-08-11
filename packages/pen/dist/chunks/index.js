import { applyCornerRadius, applyPadding, bindIfVar, buildVarContext, convertEffects, convertFill, convertStroke, isVarRef, mapAlignItems, mapFontWeight, mapJustifyContent, mapLayoutMode, mapNodeType, mapTextAlign, mapTextAlignVertical, parseSize } from "./convert.js";
import { SceneGraph } from "@open-pencil/scene-graph";
import { copyEffects, copyFills, copyStrokes } from "@open-pencil/scene-graph/copy";
import { populateInstanceChildren } from "@open-pencil/scene-graph/instances";
import { parseSVGPath } from "@open-pencil/scene-graph/parse-path";
//#region src/read.ts
function scaleVectorNetwork(vn, targetW, targetH) {
	if (vn.vertices.length === 0) return;
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;
	for (const v of vn.vertices) {
		minX = Math.min(minX, v.x);
		maxX = Math.max(maxX, v.x);
		minY = Math.min(minY, v.y);
		maxY = Math.max(maxY, v.y);
	}
	const vnW = maxX - minX;
	const vnH = maxY - minY;
	if (vnW < .01 || vnH < .01) return;
	const sx = targetW / vnW;
	const sy = targetH / vnH;
	if (Math.abs(sx - 1) < .01 && Math.abs(sy - 1) < .01) return;
	for (const v of vn.vertices) {
		v.x = (v.x - minX) * sx;
		v.y = (v.y - minY) * sy;
	}
	for (const s of vn.segments) {
		s.tangentStart = {
			x: s.tangentStart.x * sx,
			y: s.tangentStart.y * sy
		};
		s.tangentEnd = {
			x: s.tangentEnd.x * sx,
			y: s.tangentEnd.y * sy
		};
	}
}
function resolveFontFamily(raw, ctx) {
	if (!raw) return "Inter";
	if (isVarRef(raw)) return ctx.resolveString(raw);
	return raw;
}
function buildBaseOverrides(pen) {
	return {
		id: pen.id,
		name: pen.name ?? (pen.type === "icon_font" ? pen.iconFontName ?? "Icon" : pen.type),
		x: pen.x ?? 0,
		y: pen.y ?? 0,
		visible: pen.enabled !== false,
		opacity: pen.opacity ?? 1,
		rotation: pen.rotation ?? 0,
		flipX: pen.flipX ?? false,
		flipY: pen.flipY ?? false,
		clipsContent: pen.clip ?? false,
		boundVariables: {}
	};
}
function applyAutoLayout(overrides, layoutMode, pen, widthSizing, heightSizing, ctx) {
	overrides.layoutMode = layoutMode;
	overrides.primaryAxisAlign = mapJustifyContent(pen.justifyContent);
	overrides.counterAxisAlign = mapAlignItems(pen.alignItems);
	overrides.itemSpacing = typeof pen.gap === "string" && isVarRef(pen.gap) && ctx ? ctx.resolveNumber(pen.gap) : pen.gap ?? 0;
	if (layoutMode === "VERTICAL") {
		overrides.primaryAxisSizing = heightSizing;
		overrides.counterAxisSizing = widthSizing;
	} else {
		overrides.primaryAxisSizing = widthSizing;
		overrides.counterAxisSizing = heightSizing;
	}
}
function applyTextProps(node, pen, ctx) {
	node.text = pen.type === "icon_font" ? pen.iconFontName ?? "" : pen.content ?? "";
	node.fontFamily = pen.type === "icon_font" ? pen.iconFontFamily ?? "Material Symbols Sharp" : resolveFontFamily(pen.fontFamily, ctx);
	node.fontSize = pen.fontSize ?? 14;
	node.fontWeight = mapFontWeight(pen.fontWeight ?? (pen.type === "icon_font" ? pen.weight : void 0));
	node.textAlignHorizontal = mapTextAlign(pen.textAlign);
	node.textAlignVertical = mapTextAlignVertical(pen.textAlignVertical);
	if (pen.lineHeight !== void 0) node.lineHeight = pen.lineHeight < 5 ? pen.lineHeight * node.fontSize : pen.lineHeight;
	if (pen.letterSpacing !== void 0) node.letterSpacing = pen.letterSpacing;
	node.textAutoResize = pen.textGrowth === "fixed-width" ? "HEIGHT" : "WIDTH_AND_HEIGHT";
	if (pen.fontFamily && isVarRef(pen.fontFamily)) bindIfVar(node, "fontFamily", pen.fontFamily, ctx);
}
function resolveSizing(pen, ctx) {
	const isTextLike = pen.type === "text" || pen.type === "icon_font";
	const defaultSize = isTextLike ? 20 : 100;
	const defaultW = isTextLike && pen.width === void 0 ? 1e4 : defaultSize;
	const w = parseSize(pen.width, defaultW, ctx);
	const h = parseSize(pen.height, defaultSize, ctx);
	const layout = mapLayoutMode(pen);
	if (pen.width === void 0 && layout !== "NONE") w.sizing = "HUG";
	if (pen.height === void 0 && layout !== "NONE") h.sizing = "HUG";
	return {
		w,
		h,
		layout,
		isTextLike
	};
}
function inheritLayoutFromComp(node, pen, comp) {
	const wasRow = node.layoutMode === "HORIZONTAL";
	node.layoutMode = comp.layoutMode;
	node.primaryAxisAlign = comp.primaryAxisAlign;
	node.counterAxisAlign = comp.counterAxisAlign;
	const isRow = node.layoutMode === "HORIZONTAL";
	if (wasRow !== isRow) {
		const oldP = node.primaryAxisSizing;
		node.primaryAxisSizing = node.counterAxisSizing;
		node.counterAxisSizing = oldP;
	}
	const widthAxis = isRow ? "primaryAxisSizing" : "counterAxisSizing";
	const heightAxis = isRow ? "counterAxisSizing" : "primaryAxisSizing";
	if (pen.width === void 0) node[widthAxis] = comp[widthAxis];
	if (pen.height === void 0) node[heightAxis] = comp[heightAxis];
	if (pen.gap === void 0) node.itemSpacing = comp.itemSpacing;
	if (pen.padding === void 0) {
		node.paddingTop = comp.paddingTop;
		node.paddingRight = comp.paddingRight;
		node.paddingBottom = comp.paddingBottom;
		node.paddingLeft = comp.paddingLeft;
	}
	if (pen.clip === void 0) node.clipsContent = comp.clipsContent;
}
function applyRefVisuals(node, pen, compPen, ctx) {
	if (!compPen) return;
	if (pen.fill === void 0 && compPen.fill !== void 0) node.fills = convertFill(compPen.fill, ctx, node);
	if (pen.stroke === void 0 && compPen.stroke) node.strokes = convertStroke(compPen.stroke, ctx, node);
	if (pen.effect === void 0 && compPen.effect) node.effects = convertEffects(compPen.effect);
	if (pen.cornerRadius === void 0) applyCornerRadius(node, compPen.cornerRadius, ctx);
}
function applyRefProps(node, pen, graph, componentIds, penSources, ctx) {
	if (!pen.ref) return;
	const componentId = componentIds.get(pen.ref) ?? pen.ref;
	node.componentId = componentId;
	const comp = graph.getNode(componentId);
	if (!comp) return;
	if (pen.width === void 0) node.width = comp.width;
	if (pen.height === void 0) node.height = comp.height;
	if (pen.layout === void 0) inheritLayoutFromComp(node, pen, comp);
	applyRefVisuals(node, pen, penSources.get(pen.ref), ctx);
}
function applyAllRefProps(penNodes, graph, componentIds, penSources, ctx) {
	for (const pen of penNodes) {
		if (pen.type === "ref") {
			const node = graph.getNode(pen.id);
			if (node) applyRefProps(node, pen, graph, componentIds, penSources, ctx);
		}
		if (pen.children) applyAllRefProps(pen.children, graph, componentIds, penSources, ctx);
	}
}
function applyTheme(theme, ctx) {
	const themeName = Object.values(theme)[0];
	if (themeName) ctx.setActiveTheme(themeName);
}
function createSceneNode(pen, parentId, graph, ctx, componentIds, penSources) {
	if (pen.type === "prompt") return null;
	if (pen.theme) applyTheme(pen.theme, ctx);
	const { w, h, layout, isTextLike } = resolveSizing(pen, ctx);
	const overrides = buildBaseOverrides(pen);
	overrides.width = w.value;
	overrides.height = h.value;
	const parentLayout = graph.getNode(parentId)?.layoutMode ?? "NONE";
	if (layout !== "NONE") applyAutoLayout(overrides, layout, pen, parentLayout === "NONE" && w.sizing === "FILL" ? "FIXED" : w.sizing, parentLayout === "NONE" && h.sizing === "FILL" ? "FIXED" : h.sizing, ctx);
	const node = graph.createNode(mapNodeType(pen), parentId, overrides);
	if (pen.fill !== void 0) node.fills = convertFill(pen.fill, ctx, node);
	if (pen.stroke) node.strokes = convertStroke(pen.stroke, ctx, node);
	node.effects = convertEffects(pen.effect);
	applyCornerRadius(node, pen.cornerRadius, ctx);
	applyPadding(node, pen.padding, ctx);
	if (isTextLike) {
		applyTextProps(node, pen, ctx);
		if (parentLayout === "NONE" && pen.width === void 0 && !pen.textGrowth) {
			node.textAutoResize = "NONE";
			node.width = node.text.length * node.fontSize * .65;
			node.height = node.fontSize * (node.lineHeight ? node.lineHeight / node.fontSize : 1.2);
		}
	}
	if (pen.type === "path" && pen.geometry) {
		const vectorNetwork = parseSVGPath(pen.geometry);
		node.vectorNetwork = vectorNetwork;
		scaleVectorNetwork(vectorNetwork, node.width, node.height);
	}
	if (parentLayout !== "NONE") {
		const parentVertical = parentLayout === "VERTICAL";
		if (w.sizing === "FILL") if (parentVertical) node.layoutAlignSelf = "STRETCH";
		else node.layoutGrow = 1;
		if (h.sizing === "FILL") if (parentVertical) node.layoutGrow = 1;
		else node.layoutAlignSelf = "STRETCH";
	}
	if (pen.reusable) {
		componentIds.set(pen.id, node.id);
		penSources.set(pen.id, pen);
	}
	if (pen.children) for (const child of pen.children) createSceneNode(child, node.id, graph, ctx, componentIds, penSources);
	return node.id;
}
function collectByNameType(graph, parentId, name, type, out, depth) {
	if (depth > 2) return;
	const parent = graph.getNode(parentId);
	if (!parent) return;
	for (const childId of parent.childIds) {
		const child = graph.getNode(childId);
		if (!child) continue;
		if (child.name === name && child.type === type) out.push(child);
		collectByNameType(graph, childId, name, type, out, depth + 1);
	}
}
function findCloneByComponentId(graph, parentId, origId) {
	const parent = graph.getNode(parentId);
	if (!parent) return void 0;
	for (const childId of parent.childIds) {
		const child = graph.getNode(childId);
		if (!child) continue;
		if (child.componentId === origId) return child;
		const deep = findCloneByComponentId(graph, childId, origId);
		if (deep) return deep;
	}
}
function findCloneByNameFallback(graph, parentId, origId) {
	const orig = graph.getNode(origId);
	if (!orig) return void 0;
	const matches = [];
	collectByNameType(graph, parentId, orig.name, orig.type, matches, 0);
	return matches.length === 1 ? matches[0] : void 0;
}
function applyOverrideProps(target, overrideData, ctx) {
	if (overrideData.fill !== void 0) target.fills = convertFill(overrideData.fill, ctx, target);
	if (overrideData.content !== void 0) target.text = overrideData.content;
	if (overrideData.x !== void 0) target.x = overrideData.x;
	if (overrideData.y !== void 0) target.y = overrideData.y;
	if (overrideData.enabled !== void 0) target.visible = overrideData.enabled;
	if (overrideData.width !== void 0) target.width = parseSize(overrideData.width, target.width, ctx).value;
	if (overrideData.height !== void 0) target.height = parseSize(overrideData.height, target.height, ctx).value;
	if (overrideData.rotation !== void 0) target.rotation = overrideData.rotation;
	if (overrideData.name !== void 0) target.name = overrideData.name;
}
function populateInstances(graph) {
	for (const node of graph.getAllNodes()) if (node.type === "INSTANCE" && node.componentId && node.childIds.length === 0) {
		if (graph.getNode(node.componentId)) populateInstanceChildren(graph, node.id, node.componentId);
	}
}
function applyDescendantOverrides(graph, pen, ctx, componentIds, penSources) {
	if (pen.type !== "ref" || !pen.descendants) return;
	const instanceNode = graph.getNode(pen.id);
	if (!instanceNode) return;
	for (const [origId, overrideData] of Object.entries(pen.descendants)) {
		const clone = findCloneByComponentId(graph, instanceNode.id, origId) ?? findCloneByNameFallback(graph, instanceNode.id, origId);
		if (clone) {
			if (overrideData.children) {
				const toDelete = clone.childIds.slice();
				for (const childId of toDelete) graph.deleteNode(childId);
				for (const child of overrideData.children) createSceneNode(child, clone.id, graph, ctx, componentIds, penSources);
			}
			applyOverrideProps(clone, overrideData, ctx);
			continue;
		}
		if (overrideData.type && overrideData.id) createSceneNode(overrideData, instanceNode.id, graph, ctx, componentIds, penSources);
	}
}
function walkAndApplyOverrides(nodes, graph, ctx, componentIds, penSources) {
	for (const pen of nodes) {
		applyDescendantOverrides(graph, pen, ctx, componentIds, penSources);
		if (pen.children) walkAndApplyOverrides(pen.children, graph, ctx, componentIds, penSources);
	}
}
function collectComponentIds(nodes, map) {
	for (const node of nodes) {
		if (node.reusable) map.set(node.id, node.id);
		if (node.children) collectComponentIds(node.children, map);
	}
}
function resolveNodeVars(node, graph, ctx) {
	for (const [key, varId] of Object.entries(node.boundVariables)) {
		const variable = graph.variables.get(varId);
		if (!variable) continue;
		const modeVal = variable.valuesByMode[ctx.activeModeId] ?? Object.values(variable.valuesByMode)[0];
		if (key.startsWith("fills[") && typeof modeVal === "object" && "r" in modeVal) {
			const idx = Number.parseInt(key.match(/\d+/)?.[0] ?? "0", 10);
			if (node.fills[idx]) node.fills[idx].color = modeVal;
		} else if (key.startsWith("strokes[") && typeof modeVal === "object" && "r" in modeVal) {
			const idx = Number.parseInt(key.match(/\d+/)?.[0] ?? "0", 10);
			if (node.strokes[idx]) node.strokes[idx].color = modeVal;
		}
	}
	for (const childId of node.childIds) {
		const child = graph.getNode(childId);
		if (child) resolveNodeVars(child, graph, ctx);
	}
}
function resolveThemeVariables(penNodes, graph, ctx) {
	for (const pen of penNodes) {
		if (pen.theme) applyTheme(pen.theme, ctx);
		const node = graph.getNode(pen.id);
		if (node) resolveNodeVars(node, graph, ctx);
		if (pen.children) resolveThemeVariables(pen.children, graph, ctx);
	}
}
function fixInstanceWidths(graph) {
	for (const node of graph.getAllNodes()) {
		if (node.type !== "INSTANCE" || !node.componentId) continue;
		const comp = graph.getNode(node.componentId);
		if (!comp) continue;
		if (node.width <= 100 && comp.width > 100) node.width = comp.width;
		if (node.height <= 100 && comp.height > 100) node.height = comp.height;
		if (comp.layoutGrow > 0) node.layoutGrow = comp.layoutGrow;
		if (comp.layoutAlignSelf !== "AUTO") node.layoutAlignSelf = comp.layoutAlignSelf;
		node.fills = copyFills(node.fills);
		node.strokes = copyStrokes(node.strokes);
		node.effects = copyEffects(node.effects);
	}
}
function fixTextWidths(graph) {
	for (const node of graph.getAllNodes()) {
		if (node.type !== "TEXT" || !node.text || node.text.length <= 1) continue;
		if (node.width >= node.fontSize * 2) continue;
		node.width = node.text.length * node.fontSize * .65;
	}
}
function parsePenFile(json) {
	const doc = JSON.parse(json);
	const graph = new SceneGraph();
	for (const page of graph.getPages(true)) graph.deleteNode(page.id);
	const ctx = buildVarContext(graph, doc.variables ?? {}, doc.themes ?? {});
	const componentIds = /* @__PURE__ */ new Map();
	const penSources = /* @__PURE__ */ new Map();
	collectComponentIds(doc.children, componentIds);
	const page = graph.addPage(doc.children[0]?.name ?? "Page 1");
	for (const child of doc.children) createSceneNode(child, page.id, graph, ctx, componentIds, penSources);
	applyAllRefProps(doc.children, graph, componentIds, penSources, ctx);
	populateInstances(graph);
	walkAndApplyOverrides(doc.children, graph, ctx, componentIds, penSources);
	populateInstances(graph);
	resolveThemeVariables(doc.children, graph, ctx);
	fixInstanceWidths(graph);
	fixTextWidths(graph);
	if (graph.getPages(true).length === 0) graph.addPage("Page 1");
	return graph;
}
async function readPenFile(file) {
	return parsePenFile(await file.text());
}
//#endregion
export { parsePenFile, readPenFile };

//# sourceMappingURL=index.js.map
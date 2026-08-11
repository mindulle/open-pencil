import { getTextMeasurer } from "./text-measurement.js";
//#region src/layout/effective-generated-text.ts
const MIN_EFFECTIVE_TEXT_WIDTH_CHANGE = 1.5;
const MAX_STRETCHED_TEXT_WIDTH_CHANGE = 8;
const MAX_COMPONENT_LINEAGE_DEPTH = 20;
function axisSizing(node, axis) {
	return node.layoutMode === "HORIZONTAL" && axis === "width" || node.layoutMode === "VERTICAL" && axis === "height" ? node.primaryAxisSizing : node.counterAxisSizing;
}
function canResizeIntrinsicAxis(node, axis) {
	return axisSizing(node, axis) === "HUG" || node.source.format === "fig" && node.figmaDerivedLayout?.[axis] === void 0;
}
function terminalTextSource(graph, node) {
	let current = node;
	for (let depth = 0; current.componentId && depth < MAX_COMPONENT_LINEAGE_DEPTH; depth++) {
		const source = graph.getNode(current.componentId);
		if (!source) break;
		current = source;
	}
	return current.type === "TEXT" ? current : void 0;
}
function parentHugsWidth(graph, node) {
	const parent = node.parentId ? graph.getNode(node.parentId) : void 0;
	return parent !== void 0 && axisSizing(parent, "width") === "HUG";
}
function hasFixedWidthTextAncestor(graph, node) {
	let current = node;
	for (let depth = 0; current.componentId && depth < MAX_COMPONENT_LINEAGE_DEPTH; depth++) {
		const source = graph.getNode(current.componentId);
		if (!source) break;
		if (source.type === "TEXT" && source.textAutoResize === "HEIGHT") return true;
		current = source;
	}
	return false;
}
function canShapeGeneratedText(graph, node) {
	if (node.type !== "TEXT" || node.source.format === "fig" || !node.componentId || !node.figmaDerivedLayout || node.figmaDerivedLayout.width !== node.width || node.figmaDerivedLayout.height !== node.height) return false;
	const sourceText = terminalTextSource(graph, node);
	if (sourceText?.source.format !== "fig") return false;
	if (node.textAutoResize === "WIDTH_AND_HEIGHT") return !hasFixedWidthTextAncestor(graph, node);
	return node.textAutoResize === "HEIGHT" && node.layoutAlignSelf === "STRETCH" && parentHugsWidth(graph, node) && sourceText.text === node.text;
}
function stretchesCrossAxis(child, parent) {
	return child.layoutAlignSelf === "STRETCH" || child.layoutAlignSelf === "AUTO" && parent.counterAxisAlign === "STRETCH";
}
function participatesInIntrinsicSize(node) {
	return node.visible && node.layoutPositioning !== "ABSOLUTE";
}
function intrinsicSize(graph, node, sizes) {
	if (node.layoutMode !== "HORIZONTAL" && node.layoutMode !== "VERTICAL") return null;
	const children = graph.getChildren(node.id).filter(participatesInIntrinsicSize);
	if (children.length === 0) return null;
	const childSizes = children.map((child) => sizes.get(child.id) ?? child);
	const gap = node.primaryAxisAlign === "SPACE_BETWEEN" ? 0 : node.itemSpacing * Math.max(0, children.length - 1);
	if (node.layoutMode === "HORIZONTAL") return {
		width: node.paddingLeft + node.paddingRight + childSizes.reduce((sum, child) => sum + child.width, gap),
		height: node.paddingTop + node.paddingBottom + Math.max(...childSizes.map((child) => child.height))
	};
	return {
		width: node.paddingLeft + node.paddingRight + Math.max(...childSizes.map((child) => child.width)),
		height: node.paddingTop + node.paddingBottom + childSizes.reduce((sum, child) => sum + child.height, gap)
	};
}
function intrinsicSizeWithEffectiveStretch(graph, node, sizes, affected) {
	const intrinsic = intrinsicSize(graph, node, sizes);
	if (!intrinsic || node.layoutMode !== "VERTICAL" || axisSizing(node, "width") !== "HUG") return intrinsic;
	const children = graph.getChildren(node.id).filter(participatesInIntrinsicSize);
	if (!children.some((child) => affected.has(child.id))) return intrinsic;
	const widthCandidates = children.filter((child) => affected.has(child.id) || !stretchesCrossAxis(child, node));
	if (widthCandidates.length === 0) return intrinsic;
	return {
		...intrinsic,
		width: node.paddingLeft + node.paddingRight + Math.max(...widthCandidates.map((child) => (sizes.get(child.id) ?? child).width))
	};
}
function stretchChildrenToEffectiveWidth(graph, node, oldIntrinsicWidth, nextWidth, currentSizes, affected) {
	const oldContentWidth = oldIntrinsicWidth - node.paddingLeft - node.paddingRight;
	const nextContentWidth = nextWidth - node.paddingLeft - node.paddingRight;
	for (const child of graph.getChildren(node.id)) {
		if (!participatesInIntrinsicSize(child) || !stretchesCrossAxis(child, node) || Math.abs(child.width - oldContentWidth) >= .001) continue;
		const updates = { width: nextContentWidth };
		if (child.figmaDerivedLayout) updates.figmaDerivedLayout = {
			...child.figmaDerivedLayout,
			width: nextContentWidth
		};
		graph.updateNode(child.id, updates);
		currentSizes.set(child.id, {
			width: nextContentWidth,
			height: child.height
		});
		affected.add(child.id);
	}
}
function collectPostorder(graph, rootId) {
	const result = [];
	const visit = (nodeId) => {
		const node = graph.getNode(nodeId);
		if (!node) return;
		for (const childId of node.childIds) visit(childId);
		result.push(node);
	};
	visit(rootId);
	return result;
}
function updateGeneratedTextWidths(graph, nodes, currentSizes, affected) {
	const measure = getTextMeasurer();
	if (!measure) return;
	for (const node of nodes) {
		if (!canShapeGeneratedText(graph, node)) continue;
		const measured = measure(node);
		if (!measured || measured.width <= 0) continue;
		const widthChange = node.width - measured.width;
		if (widthChange < MIN_EFFECTIVE_TEXT_WIDTH_CHANGE || node.textAutoResize === "HEIGHT" && widthChange > MAX_STRETCHED_TEXT_WIDTH_CHANGE) continue;
		graph.updateNode(node.id, {
			width: measured.width,
			figmaDerivedLayout: {
				...node.figmaDerivedLayout,
				width: measured.width
			}
		});
		currentSizes.set(node.id, {
			width: measured.width,
			height: node.height
		});
		affected.add(node.id);
	}
}
function propagateIntrinsicSizes(graph, nodes, originalSizes, currentSizes, affected) {
	for (const node of nodes) {
		if (node.type === "TEXT") continue;
		if (!graph.getChildren(node.id).some((child) => affected.has(child.id))) continue;
		const oldIntrinsic = intrinsicSize(graph, node, originalSizes);
		const nextIntrinsic = intrinsicSizeWithEffectiveStretch(graph, node, currentSizes, affected);
		const oldSize = originalSizes.get(node.id);
		if (!oldIntrinsic || !nextIntrinsic || !oldSize) continue;
		const updates = {};
		let nextWidth = oldSize.width;
		let nextHeight = oldSize.height;
		if (canResizeIntrinsicAxis(node, "width") && Math.abs(oldSize.width - oldIntrinsic.width) < .001) {
			nextWidth = nextIntrinsic.width;
			updates.width = nextWidth;
		}
		if (canResizeIntrinsicAxis(node, "height") && Math.abs(oldSize.height - oldIntrinsic.height) < .001) {
			nextHeight = nextIntrinsic.height;
			updates.height = nextHeight;
		}
		if (Object.keys(updates).length === 0) continue;
		if (node.figmaDerivedLayout) updates.figmaDerivedLayout = {
			...node.figmaDerivedLayout,
			...updates.width === void 0 ? {} : { width: nextWidth },
			...updates.height === void 0 ? {} : { height: nextHeight }
		};
		if (updates.width !== void 0) stretchChildrenToEffectiveWidth(graph, node, oldIntrinsic.width, nextWidth, currentSizes, affected);
		graph.updateNode(node.id, updates);
		currentSizes.set(node.id, {
			width: nextWidth,
			height: nextHeight
		});
		affected.add(node.id);
	}
}
function applyEffectiveGeneratedTextLayout(graph, rootId) {
	const nodes = collectPostorder(graph, rootId);
	const originalSizes = new Map(nodes.map((node) => [node.id, {
		width: node.width,
		height: node.height
	}]));
	const currentSizes = new Map(originalSizes);
	const affected = /* @__PURE__ */ new Set();
	updateGeneratedTextWidths(graph, nodes, currentSizes, affected);
	if (affected.size === 0) return false;
	propagateIntrinsicSizes(graph, nodes, originalSizes, currentSizes, affected);
	return true;
}
//#endregion
export { applyEffectiveGeneratedTextLayout };

//# sourceMappingURL=effective-generated-text.js.map
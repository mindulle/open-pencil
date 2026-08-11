import { colorToHex } from "../../color/index.js";
import { CONTAINER_TYPES, findAncestorBackground } from "./shared.js";
import { wcagLuminance } from "culori";
import { sumBy } from "es-toolkit/math";
//#region src/tools/describe/layout-issues.ts
const DARK_BG_LUMINANCE = .35;
function rgbLuminance(c) {
	return wcagLuminance({
		mode: "rgb",
		r: c.r,
		g: c.g,
		b: c.b
	});
}
function isEffectivelyFilling(node, isRow, graph) {
	const parent = node.parentId ? graph.getNode(node.parentId) : void 0;
	if (!parent) return false;
	const parentDim = isRow ? parent.width : parent.height;
	const nodeDim = isRow ? node.width : node.height;
	return parentDim > 0 && Math.abs(nodeDim - parentDim) < 2;
}
function checkAlignmentIssues(ctx) {
	const { node, isRow, children, issues } = ctx;
	if (node.primaryAxisAlign === "SPACE_BETWEEN" && children.length < 2) issues.push({
		message: `justify="between" on "${node.name}" but only ${children.length} child — needs ≥2`,
		suggestion: "Use justify=\"center\" or \"start\""
	});
	if (node.primaryAxisAlign === "SPACE_BETWEEN" && node.primaryAxisSizing === "HUG" && !isEffectivelyFilling(node, isRow, ctx.graph)) issues.push({
		message: `justify="between" on "${node.name}" with HUG sizing — no effect when parent shrinks to fit`,
		suggestion: "Set a fixed size or use w=\"fill\""
	});
	if (node.counterAxisAlign === "STRETCH") {
		if (children.length > 0 && children.every((c) => c.layoutAlignSelf === "AUTO" && (isRow ? c.height > 0 : c.width > 0))) issues.push({
			message: `items="stretch" on "${node.name}" but all children have fixed ${isRow ? "height" : "width"} — stretch ignored`,
			suggestion: "Remove fixed sizes or change items to \"center\"/\"start\""
		});
	}
	if (children.length >= 3 && children.every((c) => {
		const dim = isRow ? c.width : c.height;
		return Math.abs(dim - (isRow ? children[0].width : children[0].height)) < 2;
	}) && node.primaryAxisAlign === "MIN" && node.itemSpacing === 0) {
		const total = sumBy(children, (child) => isRow ? child.width : child.height);
		const pad = isRow ? node.paddingLeft + node.paddingRight : node.paddingTop + node.paddingBottom;
		if (total < ((isRow ? node.width : node.height) - pad) * .7) issues.push({
			message: `${children.length} equal children packed at start with no gap in "${node.name}"`,
			suggestion: "Add justify=\"between\" or gap={N}"
		});
	}
}
function checkDividerOrientation(ctx) {
	for (const child of ctx.children) {
		if (child.type !== "RECTANGLE") continue;
		if (child.width <= 2 && child.height > 10 && !ctx.isRow) ctx.issues.push({
			message: `Vertical divider "${child.name}" inside column layout`,
			suggestion: "Move to a flex=\"row\" container or change to horizontal divider"
		});
		if (child.height <= 2 && child.width > 10 && ctx.isRow) ctx.issues.push({
			message: `Horizontal divider "${child.name}" inside row layout`,
			suggestion: "Move to a flex=\"col\" container"
		});
	}
}
function willGetConcreteSize(node, isRow, graph) {
	return node.layoutGrow > 0 || node.layoutAlignSelf === "STRETCH" || isEffectivelyFilling(node, isRow, graph);
}
function checkGrowInHug(ctx) {
	const { node, isRow, graph, children, issues } = ctx;
	if (node.primaryAxisSizing !== "HUG") return;
	if (willGetConcreteSize(node, isRow, graph)) return;
	for (const child of children) if (child.layoutGrow > 0) issues.push({
		message: `"${child.name}" grow=${child.layoutGrow} inside HUG parent "${node.name}"`,
		suggestion: "Set parent to fixed size, or remove grow"
	});
}
function checkGrowSizeConflict(ctx) {
	for (const child of ctx.children) if (child.layoutGrow > 0 && child.layoutMode === "NONE") {
		if ((ctx.isRow ? child.primaryAxisSizing : child.counterAxisSizing) === "FILL") continue;
		const fixedDim = ctx.isRow ? child.width : child.height;
		if (fixedDim > 0 && fixedDim !== 100) ctx.issues.push({
			message: `"${child.name}" has fixed ${ctx.isRow ? "width" : "height"}=${fixedDim} and grow=${child.layoutGrow} — grow overrides`,
			suggestion: "Remove the fixed size or remove grow"
		});
	}
}
function checkChildOverflow(ctx) {
	const { node, graph, isRow, children, issues } = ctx;
	for (const child of children) {
		if (child.layoutPositioning === "ABSOLUTE") continue;
		for (const grandchildId of child.childIds) {
			const gc = graph.getNode(grandchildId);
			if (!gc?.visible) continue;
			const gcDim = isRow ? gc.width : gc.height;
			const parentDim = isRow ? child.width : child.height;
			if (gcDim > parentDim + 1 && !child.clipsContent && parentDim > 0) issues.push({
				message: `"${gc.name}" (${Math.round(gcDim)}px) overflows "${child.name}" (${Math.round(parentDim)}px)`,
				suggestion: `Reduce size or add overflow="hidden" on "${child.name}"`
			});
		}
	}
	if (node.primaryAxisSizing === "FIXED" && !node.clipsContent) {
		const pad = isRow ? node.paddingLeft + node.paddingRight : node.paddingTop + node.paddingBottom;
		const spacing = children.length > 1 ? (children.length - 1) * node.itemSpacing : 0;
		const available = (isRow ? node.width : node.height) - pad - spacing;
		let totalChildren = 0;
		for (const child of children) totalChildren += isRow ? child.width : child.height;
		if (totalChildren > available + 1) issues.push({
			message: `Children total ${Math.round(totalChildren)}px > available ${Math.round(available)}px on ${isRow ? "horizontal" : "vertical"} axis`,
			suggestion: "Use grow/fill, reduce sizes, or set overflow=\"hidden\""
		});
	}
}
function checkHugCollapse(ctx) {
	const { node, isRow, graph, children, issues } = ctx;
	if (children.length === 0) return;
	if (node.primaryAxisSizing === "HUG" && !willGetConcreteSize(node, isRow, graph) && children.every((c) => c.layoutGrow > 0)) issues.push({
		message: `"${node.name}" is HUG but all children use grow — collapses to zero`,
		suggestion: "Give at least one child a fixed size, or set parent to fixed"
	});
	if (node.counterAxisSizing === "HUG") {
		const allStretch = children.every((c) => c.layoutAlignSelf === "STRETCH" || node.counterAxisAlign === "STRETCH" && c.layoutAlignSelf === "AUTO");
		const noConcreteChild = children.every((c) => (isRow ? c.height : c.width) <= 0);
		if (allStretch && noConcreteChild) issues.push({
			message: `"${node.name}" is HUG on cross axis but all children stretch — collapses`,
			suggestion: "Give at least one child a fixed cross-axis size"
		});
	}
}
function checkTextVisibility(ctx) {
	const { node, graph, issues } = ctx;
	for (const childId of node.childIds) {
		const child = graph.getNode(childId);
		if (!child?.visible || child.type !== "TEXT") continue;
		const textFill = child.fills.find((f) => f.visible && f.type === "SOLID");
		if (!textFill) {
			issues.push({
				message: `"${child.name || child.text.slice(0, 20) || "Text"}" has no color — invisible`,
				suggestion: "Add color=\"#hex\""
			});
			continue;
		}
		if (rgbLuminance(textFill.color) > DARK_BG_LUMINANCE) continue;
		const bg = findAncestorBackground(child, graph);
		if (!bg) continue;
		if (rgbLuminance(bg) < DARK_BG_LUMINANCE) issues.push({
			message: `"${child.name || child.text.slice(0, 20) || "Text"}" dark on dark (${colorToHex(textFill.color)} on ${colorToHex(bg)})`,
			suggestion: "Use a light color"
		});
	}
}
function checkTextOverflow(ctx) {
	const { node, children, issues } = ctx;
	const parentAvailableW = node.width - node.paddingLeft - node.paddingRight;
	for (const child of children) {
		if (child.type !== "TEXT" || !child.visible) continue;
		if (child.textAutoResize === "WIDTH_AND_HEIGHT" && child.width > parentAvailableW + 1) issues.push({
			message: `Text "${child.text.slice(0, 25)}…" is ${Math.round(child.width)}px wide, parent has ${Math.round(parentAvailableW)}px`,
			suggestion: "Use w=\"fill\" or constrain width"
		});
		if (child.textAutoResize === "HEIGHT" && child.height > child.fontSize * 1.8 && child.maxLines === 0) {
			const approxLines = Math.round(child.height / (child.fontSize * 1.3));
			issues.push({
				message: `Text "${child.text.slice(0, 25)}" wraps to ~${approxLines} lines in ${Math.round(child.width)}px`,
				suggestion: "Widen container, use maxLines={1}, or shorten text"
			});
		}
	}
}
function checkSiblingHeightConsistency(ctx) {
	const { node, isRow, children, issues } = ctx;
	if (node.counterAxisAlign === "CENTER") return;
	const containers = children.filter((c) => CONTAINER_TYPES.has(c.type));
	if (containers.length < 2) return;
	const dim = isRow ? "height" : "width";
	const sizes = containers.map((c) => c[dim]).sort((a, b) => a - b);
	const majority = sizes[Math.floor(sizes.length / 2)];
	for (const c of containers) if (Math.abs(c[dim] - majority) > 2) issues.push({
		message: `"${c.name}" is ${Math.round(c[dim])}px ${dim} while siblings are ~${Math.round(majority)}px`,
		suggestion: `Check text overflow inside "${c.name}"`
	});
}
function visibleChildren(node, graph) {
	return node.childIds.map((childId) => graph.getNode(childId)).filter((child) => child?.visible === true);
}
function checkChildUndersize(ctx) {
	const { node, graph, issues } = ctx;
	if (node.layoutMode !== "NONE") return;
	for (const child of visibleChildren(node, graph)) if (child.width > 0 && node.width > 0 && child.width < node.width * .3 && child.height >= node.height * .5) issues.push({
		message: `"${child.name}" is ${Math.round(child.width)}px wide inside ${Math.round(node.width)}px "${node.name}" (no auto-layout)`,
		suggestion: `Add flex="col" to "${node.name}" and w="fill" to "${child.name}"`
	});
}
function checkCrossAxisOverflow(ctx) {
	const { node, isRow, children, issues } = ctx;
	if (node.clipsContent) return;
	const crossPad = isRow ? node.paddingTop + node.paddingBottom : node.paddingLeft + node.paddingRight;
	const crossAvailable = (isRow ? node.height : node.width) - crossPad;
	for (const child of children) {
		const childCross = isRow ? child.height : child.width;
		if (childCross > crossAvailable + 1 && child.layoutAlignSelf !== "STRETCH") issues.push({
			message: `"${child.name}" ${Math.round(childCross)}px on cross axis, parent has ${Math.round(crossAvailable)}px`,
			suggestion: "Reduce size, use fill, or set overflow=\"hidden\""
		});
	}
}
function checkFillWithoutFlex(ctx) {
	const { node, graph, issues } = ctx;
	if (node.layoutMode !== "NONE") return;
	for (const child of visibleChildren(node, graph)) {
		if (!CONTAINER_TYPES.has(child.type)) continue;
		if (child.primaryAxisSizing === "FILL" || child.counterAxisSizing === "FILL") issues.push({
			message: `"${child.name}" uses fill sizing but parent "${node.name}" has no auto-layout`,
			suggestion: "Add flex=\"col\" or flex=\"row\" to the parent"
		});
	}
}
function effectivelyFillsCrossAxis(child, parent, isRow) {
	const childCross = isRow ? child.height : child.width;
	const parentCrossContent = isRow ? parent.height - parent.paddingTop - parent.paddingBottom : parent.width - parent.paddingLeft - parent.paddingRight;
	return Math.abs(childCross - parentCrossContent) < 2;
}
function childNeedsFill(child, parent, isRow) {
	if (child.layoutMode === "NONE") return false;
	const crossDim = isRow ? child.width : child.height;
	const crossSizing = isRow ? child.counterAxisSizing : child.primaryAxisSizing;
	if (crossDim <= 0 && crossSizing !== "FILL") return false;
	if ((isRow ? child.primaryAxisSizing : child.counterAxisSizing) === "FIXED") return false;
	if (effectivelyFillsCrossAxis(child, parent, isRow)) return false;
	if (child.childIds.length === 0) return false;
	return isRow ? child.width < parent.width * .3 && child.counterAxisSizing !== "FILL" && child.layoutGrow <= 0 : child.height < parent.height * .3 && child.primaryAxisSizing !== "FILL" && child.layoutGrow <= 0;
}
function hasSiblingWithGrowOrFill(children, exclude, isRow) {
	return children.some((c) => {
		if (c === exclude) return false;
		if (c.layoutGrow > 0) return true;
		return (isRow ? c.counterAxisSizing : c.primaryAxisSizing) === "FILL";
	});
}
function checkNestedFlexWithoutFill(ctx) {
	const { node, isRow, children, issues } = ctx;
	if (node.layoutMode === "NONE") return;
	if (node.primaryAxisAlign !== "MIN") return;
	if (node.layoutWrap === "WRAP") return;
	for (const child of children) {
		if (!childNeedsFill(child, node, isRow)) continue;
		if (hasSiblingWithGrowOrFill(children, child, isRow)) continue;
		issues.push({
			message: `Nested flex "${child.name}" may collapse — no fill or grow in "${node.name}"`,
			suggestion: "Add w=\"fill\" or grow={1}"
		});
	}
}
function checkDuplicateNames(ctx) {
	const { node, graph, issues } = ctx;
	const nameCounts = /* @__PURE__ */ new Map();
	for (const child of visibleChildren(node, graph)) nameCounts.set(child.name, (nameCounts.get(child.name) ?? 0) + 1);
	for (const [name, count] of nameCounts) if (count > 1 && name !== "path") issues.push({
		message: `${count} children named "${name}" in "${node.name}" — ambiguous for node operations`,
		suggestion: "Give unique names to distinguish siblings"
	});
}
function detectLayoutIssues(node, graph, issues) {
	if (!CONTAINER_TYPES.has(node.type)) return;
	const isRow = node.layoutMode === "HORIZONTAL";
	const children = node.childIds.map((id) => graph.getNode(id)).filter((c) => c?.visible === true && c.layoutPositioning !== "ABSOLUTE");
	const ctx = {
		node,
		graph,
		isRow,
		children,
		issues
	};
	checkTextVisibility(ctx);
	checkDuplicateNames(ctx);
	checkFillWithoutFlex(ctx);
	checkChildUndersize(ctx);
	if (node.layoutMode === "NONE") return;
	if (node.layoutWrap === "WRAP" && node.counterAxisSpacing <= 0 && children.length > 1) issues.push({
		message: `"${node.name}" uses wrap but no rowGap — rows stick together`,
		suggestion: "Add rowGap={8}"
	});
	checkAlignmentIssues(ctx);
	checkDividerOrientation(ctx);
	checkGrowInHug(ctx);
	checkGrowSizeConflict(ctx);
	checkChildOverflow(ctx);
	checkHugCollapse(ctx);
	checkTextOverflow(ctx);
	checkCrossAxisOverflow(ctx);
	checkSiblingHeightConsistency(ctx);
	checkNestedFlexWithoutFill(ctx);
}
//#endregion
export { detectLayoutIssues };

//# sourceMappingURL=layout-issues.js.map
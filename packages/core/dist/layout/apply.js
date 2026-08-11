import { usesDetachedDerivedLayout } from "./derived.js";
//#region src/layout/apply.ts
function preservesImportedHugCrossSize(graph, frame, axis) {
	if (frame.source.format !== "fig" || frame.counterAxisSizing !== "HUG") return false;
	const expectedMode = axis === "width" ? "VERTICAL" : "HORIZONTAL";
	if (frame.layoutMode !== expectedMode) return false;
	return graph.getChildren(frame.id).some((child) => child.layoutAlignSelf === "STRETCH" && child.figmaDerivedLayout?.[axis] !== void 0);
}
function applyFrameSize(graph, frame, yogaNode) {
	if (frame.layoutMode === "GRID") {
		if (frame.gridTemplateRows.length === 0) graph.updateNode(frame.id, { height: yogaNode.getComputedHeight() });
		return;
	}
	if (frame.primaryAxisSizing !== "HUG" && frame.counterAxisSizing !== "HUG") return;
	const computedW = yogaNode.getComputedWidth();
	const computedH = yogaNode.getComputedHeight();
	const updates = {};
	const derived = frame.figmaDerivedLayout;
	if (frame.primaryAxisSizing === "HUG") if (frame.layoutMode === "HORIZONTAL") updates.width = derived?.width ?? computedW;
	else updates.height = derived?.height ?? computedH;
	if (frame.counterAxisSizing === "HUG") if (frame.layoutMode === "HORIZONTAL") updates.height = preservesImportedHugCrossSize(graph, frame, "height") ? frame.height : derived?.height ?? computedH;
	else updates.width = preservesImportedHugCrossSize(graph, frame, "width") ? frame.width : derived?.width ?? computedW;
	graph.updateNode(frame.id, updates);
}
function frameSourceIsFig(graph, parentId) {
	return parentId ? graph.getNode(parentId)?.source.format === "fig" : false;
}
function computedChildPosition(child, yogaChild, axis, preservesImportedGeometry) {
	if (preservesImportedGeometry) return child[axis];
	const computed = axis === "x" ? yogaChild.getComputedLeft() : yogaChild.getComputedTop();
	if (child.type === "INSTANCE") return computed;
	return child.figmaDerivedLayout?.[axis] ?? computed;
}
function preservesStaleImportedTextSize(child, axis) {
	const derivedSize = child.figmaDerivedLayout?.[axis];
	return child.type === "TEXT" && child.source.format === "fig" && derivedSize !== void 0 && Math.abs(child[axis] - derivedSize) > .001;
}
function computedChildSize(child, yogaChild, axis, preservesImportedFrameGeometry) {
	if (preservesImportedFrameGeometry || preservesStaleImportedTextSize(child, axis)) return child[axis];
	const computed = axis === "width" ? yogaChild.getComputedWidth() : yogaChild.getComputedHeight();
	if (child.type === "TEXT" && child.source.format === "fig") return computed > 0 ? computed : child[axis];
	return child.figmaDerivedLayout?.[axis] ?? computed;
}
function updateChildFromYoga(graph, child, yogaChild) {
	if (!child.visible || child.layoutPositioning === "ABSOLUTE") return;
	const preservesImportedFrameGeometry = child.type === "FRAME" && child.source.format === "fig" && frameSourceIsFig(graph, child.parentId);
	const preservesImportedPosition = preservesImportedFrameGeometry || child.source.format === "fig" && Math.abs(child.rotation) > .001;
	graph.updateNode(child.id, {
		x: computedChildPosition(child, yogaChild, "x", preservesImportedPosition),
		y: computedChildPosition(child, yogaChild, "y", preservesImportedPosition),
		width: computedChildSize(child, yogaChild, "width", preservesImportedFrameGeometry),
		height: computedChildSize(child, yogaChild, "height", preservesImportedFrameGeometry)
	});
}
function preservesImportedInstanceInternals(child) {
	return child.type === "INSTANCE" && child.source.format === "fig";
}
function recomputeGridChild(graph, child, computeLayout) {
	const updated = graph.getNode(child.id);
	if (!updated || updated.layoutMode === "NONE") return;
	const savedPrimary = updated.primaryAxisSizing;
	const savedCounter = updated.counterAxisSizing;
	const updates = {};
	if (savedPrimary === "HUG") updates.primaryAxisSizing = "FIXED";
	if (savedCounter === "HUG") updates.counterAxisSizing = "FIXED";
	if (Object.keys(updates).length > 0) graph.updateNode(child.id, updates);
	computeLayout(graph, child.id);
	const restore = {};
	if (updates.primaryAxisSizing) restore.primaryAxisSizing = savedPrimary;
	if (updates.counterAxisSizing) restore.counterAxisSizing = savedCounter;
	if (Object.keys(restore).length > 0) graph.updateNode(child.id, restore);
}
function applyYogaLayout(graph, frame, yogaNode, computeLayout) {
	applyFrameSize(graph, frame, yogaNode);
	const children = graph.getChildren(frame.id);
	let yogaIndex = 0;
	for (const child of children) {
		if (yogaIndex >= yogaNode.getChildCount()) continue;
		const yogaChild = yogaNode.getChild(yogaIndex);
		yogaIndex++;
		updateChildFromYoga(graph, child, yogaChild);
		if (!child.visible) continue;
		if (preservesImportedInstanceInternals(child)) continue;
		if (usesDetachedDerivedLayout(child)) {
			computeLayout(graph, child.id);
			continue;
		}
		if (child.layoutMode !== "NONE") if (child.layoutMode === "GRID" && child.layoutPositioning !== "ABSOLUTE") computeLayout(graph, child.id);
		else if (frame.layoutMode === "GRID" && child.layoutPositioning !== "ABSOLUTE") recomputeGridChild(graph, child, computeLayout);
		else applyYogaLayout(graph, child, yogaChild, computeLayout);
	}
}
//#endregion
export { applyYogaLayout };

//# sourceMappingURL=apply.js.map
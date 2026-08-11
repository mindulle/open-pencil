//#region src/controls/constraints/model.ts
const CONSTRAINT_PARENT_TYPES = /* @__PURE__ */ new Set([
	"FRAME",
	"COMPONENT",
	"COMPONENT_SET",
	"INSTANCE"
]);
function isConstraintEligible(graph, node) {
	if (node.type === "GROUP" || !node.parentId) return false;
	const parent = graph.getNode(node.parentId);
	if (!parent || !CONSTRAINT_PARENT_TYPES.has(parent.type)) return false;
	return parent.layoutMode === "NONE" || node.layoutPositioning === "ABSOLUTE";
}
function constraintPins(value) {
	return {
		leading: value === "MIN" || value === "STRETCH",
		trailing: value === "MAX" || value === "STRETCH",
		center: value === "CENTER",
		scale: value === "SCALE"
	};
}
function toggleConstraintPin(value, edge, additive) {
	if (!additive) return edge === "leading" ? "MIN" : "MAX";
	const pins = constraintPins(value);
	const leading = edge === "leading" ? !pins.leading : pins.leading;
	const trailing = edge === "trailing" ? !pins.trailing : pins.trailing;
	if (leading && trailing) return "STRETCH";
	if (leading) return "MIN";
	if (trailing) return "MAX";
	return "CENTER";
}
//#endregion
export { constraintPins, isConstraintEligible, toggleConstraintPin };

//# sourceMappingURL=model.js.map
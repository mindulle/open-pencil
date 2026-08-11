//#region src/tools/describe/shared.ts
const CONTAINER_TYPES = /* @__PURE__ */ new Set([
	"FRAME",
	"COMPONENT",
	"INSTANCE"
]);
const BUTTON_MAX_WIDTH = 200;
const BUTTON_MAX_HEIGHT = 50;
const BUTTON_MIN_HEIGHT = 28;
const BUTTON_MIN_RADIUS = 2;
function findAncestorBackground(node, graph) {
	let current = node.parentId ? graph.getNode(node.parentId) : null;
	while (current) {
		const solidFill = current.fills.find((f) => f.visible && f.type === "SOLID" && f.opacity > .5);
		if (solidFill) return solidFill.color;
		current = current.parentId ? graph.getNode(current.parentId) : null;
	}
	return null;
}
function looksLikeButton(node) {
	if (!CONTAINER_TYPES.has(node.type)) return false;
	if (node.width > 200 || node.height > 50 || node.height < 28) return false;
	if (node.fills.length === 0 && node.strokes.length === 0) return false;
	if (node.cornerRadius < 2) return false;
	return node.childIds.length > 0;
}
//#endregion
export { BUTTON_MAX_HEIGHT, BUTTON_MAX_WIDTH, BUTTON_MIN_HEIGHT, BUTTON_MIN_RADIUS, CONTAINER_TYPES, findAncestorBackground, looksLikeButton };

//# sourceMappingURL=shared.js.map
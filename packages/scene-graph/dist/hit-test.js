import { Matrix, getWorldMatrix } from "./chunks/coordinate.js";
//#region src/hit-test.ts
const CONTAINER_TYPES = /* @__PURE__ */ new Set([
	"CANVAS",
	"FRAME",
	"GROUP",
	"SECTION",
	"COMPONENT",
	"COMPONENT_SET",
	"INSTANCE"
]);
const OPAQUE_CONTAINER_TYPES = /* @__PURE__ */ new Set(["COMPONENT", "INSTANCE"]);
function hasVisibleFillOrStroke(node) {
	return node.fills.some((f) => f.visible) || node.strokes.some((s) => s.visible);
}
function containsPoint(px, py, node, graph) {
	const m = getWorldMatrix(node, graph);
	const inv = Matrix.invert(m);
	if (!inv) return false;
	const [localX, localY] = Matrix.mapPoints(inv, [px, py]);
	return localX >= 0 && localX <= node.width && localY >= 0 && localY <= node.height;
}
function hitTestOpaqueContainer(graph, px, py, child, childId, deep) {
	if (!containsPoint(px, py, child, graph)) return null;
	if (hitTestChildren(graph, px, py, childId, deep)) return child;
	if (hasVisibleFillOrStroke(child)) return child;
	return null;
}
function hitTestTransparentContainer(graph, px, py, child, childId, deep) {
	if (child.type === "GROUP") {
		if (!containsPoint(px, py, child, graph)) return null;
		if (deep) return hitTestChildren(graph, px, py, childId, deep) ?? child;
		return child;
	}
	const childHit = hitTestChildren(graph, px, py, childId, deep);
	if (childHit) {
		if (child.locked) return child;
		return childHit;
	}
	if (containsPoint(px, py, child, graph) && hasVisibleFillOrStroke(child)) return child;
	return null;
}
function hitTestChildren(graph, px, py, parentId, deep = false) {
	const parent = graph.nodes.get(parentId);
	if (!parent) return null;
	if (parent.clipsContent) {
		if (!containsPoint(px, py, parent, graph)) return null;
	}
	for (let i = parent.childIds.length - 1; i >= 0; i--) {
		const childId = parent.childIds[i];
		const child = graph.nodes.get(childId);
		if (!child || child.internalOnly || !child.visible) continue;
		if (CONTAINER_TYPES.has(child.type)) {
			if (OPAQUE_CONTAINER_TYPES.has(child.type) && !deep) {
				const hit = hitTestOpaqueContainer(graph, px, py, child, childId, deep);
				if (hit) return hit;
				continue;
			}
			const hit = hitTestTransparentContainer(graph, px, py, child, childId, deep);
			if (hit) return hit;
			continue;
		}
		if (containsPoint(px, py, child, graph)) return child;
	}
	return null;
}
function hitTest(graph, px, py, scopeId) {
	return hitTestChildren(graph, px, py, scopeId ?? graph.rootId, false);
}
function hitTestDeep(graph, px, py, scopeId) {
	return hitTestChildren(graph, px, py, scopeId ?? graph.rootId, true);
}
function hitTestFrameChildren(graph, px, py, parentId, offsetX, offsetY, excludeIds) {
	const parent = graph.nodes.get(parentId);
	if (!parent) return null;
	let best = null;
	for (const childId of parent.childIds) {
		if (excludeIds.has(childId)) continue;
		const child = graph.nodes.get(childId);
		if (!child || child.internalOnly || !child.visible) continue;
		const ax = offsetX + child.x;
		const ay = offsetY + child.y;
		if (!CONTAINER_TYPES.has(child.type)) continue;
		if (px < ax || px > ax + child.width || py < ay || py > ay + child.height) continue;
		best = child;
		const deeper = hitTestFrameChildren(graph, px, py, childId, ax, ay, excludeIds);
		if (deeper) best = deeper;
	}
	return best;
}
function hitTestFrame(graph, px, py, excludeIds, scopeId) {
	return hitTestFrameChildren(graph, px, py, scopeId ?? graph.rootId, 0, 0, excludeIds);
}
//#endregion
export { hitTest, hitTestDeep, hitTestFrame };

//# sourceMappingURL=hit-test.js.map
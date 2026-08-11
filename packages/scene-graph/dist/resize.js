import { cloneVectorNetwork, copyGeometryPaths, scaleGeometryPaths } from "./chunks/copy.js";
//#region src/resize.ts
const CONSTRAINT_CONTAINER_TYPES = /* @__PURE__ */ new Set([
	"FRAME",
	"COMPONENT",
	"COMPONENT_SET",
	"INSTANCE",
	"GROUP",
	"BOOLEAN_OPERATION"
]);
function constrainedAxis(position, size, parentBefore, parentAfter, constraint) {
	const delta = parentAfter - parentBefore;
	if (constraint === "MAX") return {
		position: position + delta,
		size
	};
	if (constraint === "CENTER") return {
		position: position + delta / 2,
		size
	};
	if (constraint === "STRETCH") return {
		position,
		size: Math.max(1, size + delta)
	};
	if (constraint === "SCALE" && parentBefore > 0) {
		const scale = parentAfter / parentBefore;
		return {
			position: position * scale,
			size: Math.max(1, size * scale)
		};
	}
	return {
		position,
		size
	};
}
function constrainedChildRect(child, parentBefore, parentAfter, horizontal, vertical) {
	const x = constrainedAxis(child.x, child.width, parentBefore.width, parentAfter.width, horizontal);
	const y = constrainedAxis(child.y, child.height, parentBefore.height, parentAfter.height, vertical);
	return {
		x: Math.round(x.position),
		y: Math.round(y.position),
		width: Math.round(x.size),
		height: Math.round(y.size)
	};
}
function scaledChildRect(child, parentBefore, parentAfter) {
	return constrainedChildRect(child, parentBefore, parentAfter, "SCALE", "SCALE");
}
function scaleVectorNetworkForResize(vectorNetwork, originalWidth, originalHeight, width, height) {
	if (!vectorNetwork || originalWidth <= 0 || originalHeight <= 0) return null;
	const scaleX = width / originalWidth;
	const scaleY = height / originalHeight;
	if (scaleX === 1 && scaleY === 1) return null;
	return {
		vertices: vectorNetwork.vertices.map((vertex) => ({
			...vertex,
			x: vertex.x * scaleX,
			y: vertex.y * scaleY
		})),
		segments: vectorNetwork.segments.map((segment) => ({
			...segment,
			tangentStart: {
				x: segment.tangentStart.x * scaleX,
				y: segment.tangentStart.y * scaleY
			},
			tangentEnd: {
				x: segment.tangentEnd.x * scaleX,
				y: segment.tangentEnd.y * scaleY
			}
		})),
		regions: vectorNetwork.regions
	};
}
function collectResizeDescendants(graph, rootId) {
	const root = graph.getNode(rootId);
	if (!root || !CONSTRAINT_CONTAINER_TYPES.has(root.type)) return null;
	const snapshots = /* @__PURE__ */ new Map();
	const collect = (parentId) => {
		const parent = graph.getNode(parentId);
		if (!parent) return;
		for (const childId of parent.childIds) {
			const child = graph.getNode(childId);
			if (!child) continue;
			snapshots.set(childId, {
				x: child.x,
				y: child.y,
				width: child.width,
				height: child.height,
				vectorNetwork: child.vectorNetwork ? cloneVectorNetwork(child.vectorNetwork) : null,
				fillGeometry: copyGeometryPaths(child.fillGeometry),
				strokeGeometry: copyGeometryPaths(child.strokeGeometry)
			});
			collect(childId);
		}
	};
	collect(rootId);
	return snapshots.size > 0 ? snapshots : null;
}
function computeConstrainedResizeChanges(graph, rootId, rootBefore, rootAfter, originals) {
	const changes = /* @__PURE__ */ new Map();
	const compute = (parentId, parentBefore, parentAfter) => {
		const parent = graph.getNode(parentId);
		if (!parent) return;
		const scalesChildren = parent.type === "GROUP" || parent.type === "BOOLEAN_OPERATION";
		for (const childId of parent.childIds) {
			const original = originals.get(childId);
			const child = graph.getNode(childId);
			if (!original || !child) continue;
			if (parent.layoutMode !== "NONE" && child.layoutPositioning !== "ABSOLUTE") {
				compute(childId, original, child);
				continue;
			}
			const rect = scalesChildren ? scaledChildRect(original, parentBefore, parentAfter) : constrainedChildRect(original, parentBefore, parentAfter, child.horizontalConstraint, child.verticalConstraint);
			const childChanges = { ...rect };
			const vectorNetwork = scaleVectorNetworkForResize(original.vectorNetwork, original.width, original.height, rect.width, rect.height);
			if (vectorNetwork) childChanges.vectorNetwork = vectorNetwork;
			if (original.width > 0 && original.height > 0) {
				const scaleX = rect.width / original.width;
				const scaleY = rect.height / original.height;
				if (scaleX !== 1 || scaleY !== 1) {
					if (original.fillGeometry.length > 0) childChanges.fillGeometry = scaleGeometryPaths(original.fillGeometry, scaleX, scaleY);
					if (original.strokeGeometry.length > 0) childChanges.strokeGeometry = scaleGeometryPaths(original.strokeGeometry, scaleX, scaleY);
				}
			}
			changes.set(childId, childChanges);
			compute(childId, original, child.layoutMode === "NONE" ? rect : child);
		}
	};
	compute(rootId, rootBefore, rootAfter);
	return changes;
}
//#endregion
export { collectResizeDescendants, computeConstrainedResizeChanges, constrainedChildRect, scaleVectorNetworkForResize, scaledChildRect };

//# sourceMappingURL=resize.js.map
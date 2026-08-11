import { getTextOutlineSupport } from "../text/outlines.js";
import { nodeHasRadius } from "./shapes.js";
import { makeArcPath } from "./fills.js";
import { textNodeToOutlinePath } from "./text/outlines.js";
//#region src/canvas/boolean.ts
const BOOLEAN_PATH_OP = {
	UNION: "Union",
	SUBTRACT: "Difference",
	INTERSECT: "Intersect",
	EXCLUDE: "XOR"
};
function nodePathTransform(r, child) {
	const transforms = [r.ck.Matrix.translated(child.x, child.y)];
	if (child.rotation !== 0) transforms.push(r.ck.Matrix.rotated(child.rotation * Math.PI / 180, child.width / 2, child.height / 2));
	if (child.flipX || child.flipY) transforms.push(r.ck.Matrix.scaled(child.flipX ? -1 : 1, child.flipY ? -1 : 1, child.width / 2, child.height / 2));
	if (transforms.length === 1) return transforms[0];
	return r.ck.Matrix.multiply(...transforms);
}
function hasVisibleImageFill(node) {
	return node.fills.some((fill) => fill.visible && fill.type === "IMAGE");
}
function canMakeTextSourcePath(node) {
	return getTextOutlineSupport(node).supported;
}
function canMakeBooleanSourcePath(node) {
	if (node.type === "TEXT") return canMakeTextSourcePath(node) && !hasVisibleImageFill(node);
	return node.type !== "SECTION" && node.type !== "COMPONENT_SET" && !hasVisibleImageFill(node);
}
function canMakeBooleanSourceNode(node, graph) {
	if (!canMakeBooleanSourcePath(node)) return false;
	if (!canContainFlattenableChildren(node)) return true;
	return node.childIds.every((childId) => {
		const child = graph.getNode(childId);
		return !child || !child.visible || canMakeBooleanSourceNode(child, graph);
	});
}
function lineStrokePath(r, node) {
	const path = new r.ck.Path();
	path.moveTo(0, 0);
	path.lineTo(node.width, node.height);
	const stroke = node.strokes.find((item) => item.visible);
	const outline = path.stroke({ width: stroke?.weight ?? 1 });
	if (outline !== path) path.delete();
	return outline;
}
function baseShapePath(r, node) {
	if (node.type === "TEXT") return textNodeToOutlinePath(r, node);
	if (node.type === "LINE") return lineStrokePath(r, node);
	if (node.type === "ELLIPSE" && node.arcData) return makeArcPath(r, node);
	const rect = r.ck.LTRBRect(0, 0, node.width, node.height);
	return r.makeNodeShapePath(node, rect, nodeHasRadius(node));
}
function nodeHasVisibleFill(node) {
	return node.fills.some((fill) => fill.visible);
}
function nodeHasVisibleStroke(node) {
	return node.strokes.some((stroke) => stroke.visible && stroke.weight > 0);
}
function addVisibleStrokeOutlines(target, source, node) {
	for (const stroke of node.strokes) {
		if (!stroke.visible || stroke.weight <= 0) continue;
		const outline = source.stroke({ width: stroke.weight });
		if (!outline) continue;
		target.addPath(outline);
	}
}
function canContainFlattenableChildren(node) {
	return node.type === "GROUP" || node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE";
}
function appendVisibleChildPaths(r, graph, parent, target, makeChildPath, failOnMissing) {
	let hasPath = false;
	for (const childId of parent.childIds) {
		const child = graph.getNode(childId);
		if (!child || !child.visible) continue;
		const childPath = makeChildPath(child);
		if (!childPath) {
			if (failOnMissing) return null;
			continue;
		}
		childPath.transform(nodePathTransform(r, child));
		target.addPath(childPath);
		childPath.delete();
		hasPath = true;
	}
	return hasPath;
}
function containerSourcePath(r, node, graph) {
	const path = new r.ck.Path();
	let hasPath = false;
	if (nodeHasVisibleFill(node) || nodeHasVisibleStroke(node)) {
		const ownPath = baseShapePath(r, node);
		if (ownPath) {
			if (nodeHasVisibleFill(node)) path.addPath(ownPath);
			addVisibleStrokeOutlines(path, ownPath, node);
			ownPath.delete();
			hasPath = true;
		}
	}
	const childPaths = appendVisibleChildPaths(r, graph, node, path, (child) => makeBooleanSourcePath(r, child, graph), true);
	if (childPaths === null) {
		path.delete();
		return null;
	}
	hasPath ||= childPaths;
	if (!hasPath) {
		path.delete();
		return null;
	}
	return path;
}
function makeBooleanSourcePath(r, node, graph) {
	if (node.type === "BOOLEAN_OPERATION") return makeBooleanOperationPath(r, node, graph);
	if (!canMakeBooleanSourcePath(node)) return null;
	if (canContainFlattenableChildren(node)) return containerSourcePath(r, node, graph);
	if (node.type === "LINE") return baseShapePath(r, node);
	const path = baseShapePath(r, node);
	if (!path) return null;
	if (nodeHasVisibleStroke(node)) addVisibleStrokeOutlines(path, path, node);
	return path;
}
function hasVisibleStrokeSourceNode(node, graph) {
	if (nodeHasVisibleStroke(node)) return true;
	if (!canContainFlattenableChildren(node)) return false;
	return node.childIds.some((childId) => {
		const child = graph.getNode(childId);
		return child?.visible === true && hasVisibleStrokeSourceNode(child, graph);
	});
}
function makeStrokeOutlinePath(r, node, graph) {
	if (!canMakeBooleanSourcePath(node)) return null;
	if (canContainFlattenableChildren(node)) {
		const path = new r.ck.Path();
		let hasPath = false;
		if (nodeHasVisibleStroke(node)) {
			const ownPath = baseShapePath(r, node);
			if (ownPath) {
				addVisibleStrokeOutlines(path, ownPath, node);
				ownPath.delete();
				hasPath = true;
			}
		}
		hasPath ||= appendVisibleChildPaths(r, graph, node, path, (child) => makeStrokeOutlinePath(r, child, graph), false) ?? false;
		if (hasPath) return path;
		path.delete();
		return null;
	}
	if (!nodeHasVisibleStroke(node)) return null;
	const path = node.type === "BOOLEAN_OPERATION" ? makeBooleanOperationPath(r, node, graph) : baseShapePath(r, node);
	if (!path) return null;
	if (node.type === "LINE") return path;
	const outline = new r.ck.Path();
	addVisibleStrokeOutlines(outline, path, node);
	return outline;
}
function transformedShapePath(r, child, graph) {
	const path = makeBooleanSourcePath(r, child, graph);
	if (!path) return null;
	path.transform(nodePathTransform(r, child));
	return path;
}
function operationForNode(r, node) {
	const operation = node.booleanOperation ?? "UNION";
	return r.ck.PathOp[BOOLEAN_PATH_OP[operation]];
}
function makeImportedFillGeometryPath(r, node) {
	if (typeof r.getFillGeometry !== "function") return null;
	const fillGeometry = r.getFillGeometry(node);
	if (!fillGeometry) return null;
	const result = new r.ck.Path();
	for (const path of fillGeometry) result.addPath(path);
	return result;
}
function makeBooleanOperationPath(r, node, graph) {
	const childPaths = [];
	for (const childId of node.childIds) {
		const child = graph.getNode(childId);
		if (!child || !child.visible) continue;
		const path = transformedShapePath(r, child, graph);
		if (path) childPaths.push(path);
	}
	if (childPaths.length === 0) return makeImportedFillGeometryPath(r, node);
	const result = childPaths[0];
	const operation = operationForNode(r, node);
	for (let index = 1; index < childPaths.length; index++) {
		const path = childPaths[index];
		const didApply = result.op(path, operation);
		path.delete();
		if (!didApply) {
			result.delete();
			for (const remaining of childPaths.slice(index + 1)) remaining.delete();
			return makeImportedFillGeometryPath(r, node);
		}
	}
	return result;
}
function renderBooleanOperation(r, canvas, node, graph) {
	const path = makeBooleanOperationPath(r, node, graph);
	if (!path) return;
	try {
		for (let fillIndex = 0; fillIndex < node.fills.length; fillIndex++) {
			const fill = node.fills[fillIndex];
			if (!fill.visible || !r.applyFill(fill, node, graph, fillIndex)) continue;
			r.fillPaint.setAlphaf(fill.opacity);
			try {
				canvas.drawPath(path, r.fillPaint);
			} finally {
				r.fillPaint.setShader(null);
			}
		}
		for (const stroke of node.strokes) {
			if (!stroke.visible) continue;
			const color = r.resolveStrokeColor(stroke, 0, node, graph);
			r.strokePaint.setColor(r.ck.Color4f(color.r, color.g, color.b, color.a));
			r.strokePaint.setStrokeWidth(stroke.weight);
			r.strokePaint.setAlphaf(stroke.opacity);
			canvas.drawPath(path, r.strokePaint);
		}
	} finally {
		path.delete();
	}
}
//#endregion
export { canMakeBooleanSourceNode, canMakeBooleanSourcePath, hasVisibleStrokeSourceNode, makeBooleanOperationPath, makeBooleanSourcePath, makeStrokeOutlinePath, nodeHasVisibleStroke, nodePathTransform, renderBooleanOperation };

//# sourceMappingURL=boolean.js.map
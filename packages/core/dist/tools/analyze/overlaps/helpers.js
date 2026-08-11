import { getWorldMatrix } from "@open-pencil/scene-graph/coordinate";
import { clipPolygon, effectOverflow, geometryBlobBounds, intersectVisualBounds, strokeOverflow, unionVisualBounds } from "@open-pencil/scene-graph/geometry";
import Matrix from "@open-pencil/scene-graph/matrix";
//#region src/tools/analyze/overlaps/helpers.ts
const SEVERITY_RANK = {
	critical: 4,
	major: 3,
	minor: 2,
	info: 1
};
function parseNodeTypes(raw) {
	if (!raw) return void 0;
	const types = raw.split(",").map((v) => v.trim().toUpperCase()).filter((v) => v.length > 0);
	return types.length > 0 ? new Set(types) : void 0;
}
function visualBoundsArea(bounds) {
	const width = bounds.maxX - bounds.minX;
	const height = bounds.maxY - bounds.minY;
	return width > 0 && height > 0 ? width * height : 0;
}
function boundsToRect(bounds) {
	return {
		x: bounds.minX,
		y: bounds.minY,
		width: bounds.maxX - bounds.minX,
		height: bounds.maxY - bounds.minY
	};
}
function toNodeSummary(node) {
	return {
		id: node.id,
		name: node.name,
		type: node.type,
		parentId: node.parentId,
		x: Math.round(node.x),
		y: Math.round(node.y),
		width: Math.round(node.width),
		height: Math.round(node.height),
		rotation: Math.round(node.rotation),
		opacity: node.opacity,
		visible: node.visible,
		locked: node.locked
	};
}
function isEffectivelyHidden(graph, node) {
	let current = node;
	while (current) {
		if (!current.visible) return true;
		current = current.parentId ? graph.getNode(current.parentId) : void 0;
	}
	return false;
}
function isEffectivelyLocked(graph, node) {
	let current = node;
	while (current) {
		if (current.locked) return true;
		current = current.parentId ? graph.getNode(current.parentId) : void 0;
	}
	return false;
}
function findPageId(graph, node) {
	let current = node;
	while (current) {
		if (current.type === "CANVAS") return current.id;
		if (current.parentId === null) return null;
		current = graph.getNode(current.parentId);
	}
	return null;
}
function findPageIdByName(graph, name) {
	if (!name) return void 0;
	return graph.getPages().find((p) => p.name === name)?.id;
}
function pairRelationship(nodeA, nodeB, graph) {
	const sameParent = nodeA.parentId === nodeB.parentId && nodeA.parentId !== null;
	const parentA = nodeA.parentId ? graph.getNode(nodeA.parentId) : void 0;
	const parentB = nodeB.parentId ? graph.getNode(nodeB.parentId) : void 0;
	const topLevel = parentA?.type === "CANVAS" && parentB?.type === "CANVAS";
	const insideParent = sameParent && parentA?.type !== "CANVAS";
	let ancestor = "neither";
	if (nodeA.id !== nodeB.id) {
		if (graph.isDescendant(nodeB.id, nodeA.id)) ancestor = "a-ancestor";
		else if (graph.isDescendant(nodeA.id, nodeB.id)) ancestor = "b-ancestor";
	}
	return {
		sameParent,
		topLevel,
		insideParent,
		ancestor
	};
}
function matchesParentOverflowScope(scope) {
	return scope === "all" || scope === "inside-parent";
}
function matchesScope(rel, scope) {
	switch (scope) {
		case "all": return true;
		case "same-parent": return rel.sameParent;
		case "cross-parent": return !rel.sameParent;
		case "top-level": return rel.topLevel;
		case "inside-parent": return rel.insideParent;
		default: return true;
	}
}
function scoredSeverity(severity) {
	return SEVERITY_RANK[severity];
}
function parentOverflowSeverity(outRatio) {
	if (outRatio > .25) return "critical";
	if (outRatio > .05) return "major";
	return "minor";
}
function siblingOverlapSeverity(intersectionArea, smallerArea) {
	if (smallerArea <= 0) return "info";
	const ratio = intersectionArea / smallerArea;
	if (ratio > .5) return "major";
	if (ratio > .08) return "minor";
	return "info";
}
function isCandidate(node, graph, options) {
	if (node.type === "CANVAS") return false;
	if (!options.includeHidden && isEffectivelyHidden(graph, node)) return false;
	if (!options.includeLocked && isEffectivelyLocked(graph, node)) return false;
	if (!options.includeAbsolute && node.layoutPositioning === "ABSOLUTE") return false;
	if (options.pageId && findPageId(graph, node) !== options.pageId) return false;
	return true;
}
function filterNodes(graph, args) {
	const includeHidden = args.include_hidden === true;
	const includeLocked = args.include_locked === true;
	const includeAbsolute = args.include_absolute === true;
	const pageIdFilter = args.page_id?.trim();
	const typeFilter = parseNodeTypes(args.type);
	const allNodes = [...graph.getAllNodes()];
	const candidates = [];
	let totalNodes = 0;
	for (const node of allNodes) {
		if (node.type === "CANVAS") continue;
		if (pageIdFilter && findPageId(graph, node) !== pageIdFilter) continue;
		totalNodes++;
		if (!isCandidate(node, graph, {
			includeHidden,
			includeLocked,
			includeAbsolute,
			pageId: void 0
		})) continue;
		if (typeFilter && !typeFilter.has(node.type)) continue;
		candidates.push(node);
	}
	return {
		candidates,
		totalNodes,
		analyzedNodes: candidates.length
	};
}
const EMPTY_BOUNDS = {
	minX: 0,
	maxX: 0,
	minY: 0,
	maxY: 0
};
/**
* Map a node's 4 local corners through the world matrix to canvas space.
* Unlike `getAbsolutePosition` + `rotatedBBox` (which only applies the node's
* own rotation), this correctly accounts for all ancestor transforms
* including nested rotations.
*/
function nodeWorldCorners(node, graph) {
	const matrix = getWorldMatrix(node, graph);
	const pts = Matrix.mapPoints(matrix, [
		0,
		0,
		node.width,
		0,
		node.width,
		node.height,
		0,
		node.height
	]);
	return [
		{
			x: pts[0],
			y: pts[1]
		},
		{
			x: pts[2],
			y: pts[3]
		},
		{
			x: pts[4],
			y: pts[5]
		},
		{
			x: pts[6],
			y: pts[7]
		}
	];
}
function aabbFromCorners(corners) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const c of corners) {
		if (c.x < minX) minX = c.x;
		if (c.y < minY) minY = c.y;
		if (c.x > maxX) maxX = c.x;
		if (c.y > maxY) maxY = c.y;
	}
	return {
		minX,
		minY,
		maxX,
		maxY
	};
}
/**
* Compute a node's visual bounds in canvas space using the world matrix,
* correctly handling nested ancestor rotations. This replaces the previous
* `nodeVisualBounds` call which used `rotatedBBox` with the node's LOCAL
* rotation and the rotated origin — wrong when ancestors are rotated.
*
* Includes stroke overflow (uniform), effect overflow (directional),
* fill/stroke geometry (transformed through the world matrix), and
* text-decoration overflow (approximate: adds to canvas maxY).
*/
function computeNodeVisualBounds(node, graph) {
	const matrix = getWorldMatrix(node, graph);
	const stroke = strokeOverflow(node.strokes);
	const baseCorners = Matrix.mapPoints(matrix, [
		-stroke,
		-stroke,
		node.width + stroke,
		-stroke,
		node.width + stroke,
		node.height + stroke,
		-stroke,
		node.height + stroke
	]);
	let bounds = aabbFromCorners([
		{
			x: baseCorners[0],
			y: baseCorners[1]
		},
		{
			x: baseCorners[2],
			y: baseCorners[3]
		},
		{
			x: baseCorners[4],
			y: baseCorners[5]
		},
		{
			x: baseCorners[6],
			y: baseCorners[7]
		}
	]);
	const effects = effectOverflow(node.effects);
	bounds.minX -= effects.left;
	bounds.minY -= effects.top;
	bounds.maxX += effects.right;
	bounds.maxY += effects.bottom;
	const hasNonInsideStroke = node.strokes.some((stroke) => stroke.visible && stroke.align !== "INSIDE");
	const localGeometry = geometryBlobBounds([...node.fillGeometry, ...hasNonInsideStroke ? node.strokeGeometry : []]);
	if (localGeometry) {
		const geomCorners = Matrix.mapPoints(matrix, [
			localGeometry.x,
			localGeometry.y,
			localGeometry.x + localGeometry.width,
			localGeometry.y,
			localGeometry.x + localGeometry.width,
			localGeometry.y + localGeometry.height,
			localGeometry.x,
			localGeometry.y + localGeometry.height
		]);
		const geomBounds = aabbFromCorners([
			{
				x: geomCorners[0],
				y: geomCorners[1]
			},
			{
				x: geomCorners[2],
				y: geomCorners[3]
			},
			{
				x: geomCorners[4],
				y: geomCorners[5]
			},
			{
				x: geomCorners[6],
				y: geomCorners[7]
			}
		]);
		bounds = unionVisualBounds(bounds, geomBounds) ?? bounds;
	}
	if (node.type === "TEXT" && node.textDecoration !== "NONE") {
		const fontSize = node.fontSize;
		const underlineOffset = node.textUnderlineOffset ?? fontSize * .18;
		const thickness = node.textDecorationThickness ?? Math.max(1, fontSize / 16);
		bounds.maxY += underlineOffset + thickness + fontSize * .35;
	}
	return bounds;
}
/**
* Collect clipping ancestors as rotated polygons (4 canvas-space corners each).
* Unlike the previous axis-aligned approach, this correctly represents rotated
* clip frames by mapping their local corners through the world matrix.
*/
function collectClipChain(graph, node) {
	const clips = [];
	let currentId = node.parentId;
	while (currentId) {
		const current = graph.getNode(currentId);
		if (!current) break;
		if (current.type === "CANVAS") break;
		if (current.clipsContent && (current.type === "FRAME" || current.type === "COMPONENT" || current.type === "INSTANCE")) clips.push(nodeWorldCorners(current, graph));
		currentId = current.parentId;
	}
	return clips;
}
function computeNodeBounds(node, graph) {
	const visual = computeNodeVisualBounds(node, graph);
	const clips = collectClipChain(graph, node);
	if (clips.length === 0) return {
		bounds: visual,
		area: visualBoundsArea(visual)
	};
	let polygon = [
		{
			x: visual.minX,
			y: visual.minY
		},
		{
			x: visual.maxX,
			y: visual.minY
		},
		{
			x: visual.maxX,
			y: visual.maxY
		},
		{
			x: visual.minX,
			y: visual.maxY
		}
	];
	for (const clip of clips) {
		polygon = clipPolygon(polygon, clip);
		if (!polygon) return {
			bounds: EMPTY_BOUNDS,
			area: 0
		};
	}
	const bounds = aabbFromCorners(polygon);
	return {
		bounds,
		area: visualBoundsArea(bounds)
	};
}
function makeOverlapItem(category, severity, nodeA, boundsA, nodeB, boundsB, intersection, message, suggestion, areaField = "intersection") {
	const intersectionRect = boundsToRect(intersection);
	const area = areaField === "intersection" ? visualBoundsArea(intersection) : visualBoundsArea(boundsA) - visualBoundsArea(intersection);
	const ratio = areaField === "intersection" ? area / Math.max(1, Math.min(visualBoundsArea(boundsA), visualBoundsArea(boundsB))) : area / Math.max(1, visualBoundsArea(boundsA));
	return {
		category,
		severity,
		message,
		suggestion,
		area: Math.round(area),
		ratio: Math.round(ratio * 1e3) / 1e3,
		nodeA: toNodeSummary(nodeA),
		nodeB: toNodeSummary(nodeB),
		intersection: {
			...intersectionRect,
			area: Math.round(visualBoundsArea(intersection))
		}
	};
}
function buildParentOverflowResult(child, childBounds, parent, parentBounds) {
	if (parent.clipsContent) return null;
	const childArea = visualBoundsArea(childBounds);
	if (childArea <= 0) return null;
	const intersection = intersectVisualBounds(childBounds, parentBounds);
	const outArea = intersection ? childArea - visualBoundsArea(intersection) : childArea;
	if (outArea <= 0) return null;
	const severity = parentOverflowSeverity(outArea / childArea);
	const message = `${child.type === "TEXT" ? "Text" : `Node`} "${child.name}" extends ${Math.round(outArea)}px outside parent "${parent.name}"`;
	const suggestion = child.type === "TEXT" ? "Set the parent to clip content or constrain text sizing (textAutoResize, maxLines)." : `Reposition inside "${parent.name}" or enable clip content on the parent.`;
	return makeOverlapItem("parent-overflow", severity, child, childBounds, parent, parentBounds, intersection ?? EMPTY_BOUNDS, message, suggestion, "overflow");
}
function isNodeAbove(ancestorGraph, above, below) {
	if (above.parentId !== below.parentId || above.parentId === null) return false;
	const parent = ancestorGraph.getNode(above.parentId);
	if (!parent) return false;
	return parent.childIds.indexOf(above.id) > parent.childIds.indexOf(below.id);
}
function detectSiblingOverlay(nodeA, boundsA, nodeB, boundsB, graph) {
	const areaA = visualBoundsArea(boundsA);
	const areaB = visualBoundsArea(boundsB);
	const smallerArea = Math.min(areaA, areaB);
	const largerArea = Math.max(areaA, areaB);
	const intersection = intersectVisualBounds(boundsA, boundsB);
	if (!intersection || smallerArea <= 0) return "sibling-overlap";
	const coversSmall = visualBoundsArea(intersection) / smallerArea > .85;
	if (largerArea / Math.max(1, smallerArea) < 5 || !coversSmall) return "sibling-overlap";
	return isNodeAbove(graph, areaA >= areaB ? nodeA : nodeB, areaA >= areaB ? nodeB : nodeA) ? "overlay" : "sibling-overlap";
}
function buildSiblingOverlapResult(nodeA, boundsA, nodeB, boundsB, graph) {
	const intersection = intersectVisualBounds(boundsA, boundsB);
	if (!intersection) return null;
	const areaA = visualBoundsArea(boundsA);
	const areaB = visualBoundsArea(boundsB);
	const smallerArea = Math.min(areaA, areaB);
	const category = detectSiblingOverlay(nodeA, boundsA, nodeB, boundsB, graph);
	const intersectionArea = visualBoundsArea(intersection);
	let severity;
	if (category === "overlay") severity = smallerArea > 0 && intersectionArea / smallerArea > .98 ? "info" : "minor";
	else severity = siblingOverlapSeverity(intersectionArea, smallerArea);
	const larger = areaA >= areaB ? nodeA : nodeB;
	const smaller = areaA >= areaB ? nodeB : nodeA;
	const message = category === "overlay" ? `"${larger.name}" appears to be an overlay covering "${smaller.name}"` : `"${nodeA.name}" overlaps "${nodeB.name}"`;
	return makeOverlapItem(category, severity, nodeA, boundsA, nodeB, boundsB, intersection, message, category === "overlay" ? "If intentional (modal/backdrop/dropdown), no action needed. Otherwise reposition or adjust z-order." : "Review stacking and spacing — this overlap is likely unintended.");
}
function passesThresholds(item, minArea, minRatio, categoryFilter, severityFilter) {
	if (item.area < minArea) return false;
	if (item.ratio < minRatio) return false;
	if (categoryFilter && !categoryFilter.includes(item.category)) return false;
	if (severityFilter && scoredSeverity(item.severity) < scoredSeverity(severityFilter)) return false;
	return true;
}
//#endregion
export { boundsToRect, buildParentOverflowResult, buildSiblingOverlapResult, computeNodeBounds, filterNodes, findPageId, findPageIdByName, isEffectivelyHidden, isEffectivelyLocked, matchesParentOverflowScope, matchesScope, pairRelationship, parseNodeTypes, passesThresholds, scoredSeverity, toNodeSummary, visualBoundsArea };

//# sourceMappingURL=helpers.js.map
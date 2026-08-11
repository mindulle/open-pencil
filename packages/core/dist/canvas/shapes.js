import { geometryBlobToPath, vectorNetworkToPath } from "../vector/index.js";
import { polygonVertices } from "@open-pencil/scene-graph/geometry";
//#region src/canvas/shapes.ts
function nodeHasRadius(node) {
	return node.cornerRadius > 0 || node.independentCorners && (node.topLeftRadius > 0 || node.topRightRadius > 0 || node.bottomRightRadius > 0 || node.bottomLeftRadius > 0);
}
function nodeHasSmoothCorners(node) {
	if (!(node.cornerSmoothing > 0)) return false;
	if (node.independentCorners) return node.topLeftRadius > 0 || node.topRightRadius > 0 || node.bottomRightRadius > 0 || node.bottomLeftRadius > 0;
	return node.cornerRadius > 0;
}
function smoothCornerRadii(node, width, height, spread) {
	const radius = (value) => Math.max(0, value + spread);
	const radii = node.independentCorners ? {
		topLeft: radius(node.topLeftRadius),
		topRight: radius(node.topRightRadius),
		bottomRight: radius(node.bottomRightRadius),
		bottomLeft: radius(node.bottomLeftRadius)
	} : {
		topLeft: radius(node.cornerRadius),
		topRight: radius(node.cornerRadius),
		bottomRight: radius(node.cornerRadius),
		bottomLeft: radius(node.cornerRadius)
	};
	if (radii.topLeft === radii.topRight && radii.topRight === radii.bottomRight && radii.bottomRight === radii.bottomLeft) {
		const budget = Math.min(width, height) / 2;
		const clampedRadius = Math.min(radii.topLeft, budget);
		return {
			topLeft: {
				radius: clampedRadius,
				budget
			},
			topRight: {
				radius: clampedRadius,
				budget
			},
			bottomRight: {
				radius: clampedRadius,
				budget
			},
			bottomLeft: {
				radius: clampedRadius,
				budget
			}
		};
	}
	const budgets = {
		topLeft: -1,
		topRight: -1,
		bottomRight: -1,
		bottomLeft: -1
	};
	const adjacentByCorner = {
		topLeft: [{
			corner: "topRight",
			sideLength: width
		}, {
			corner: "bottomLeft",
			sideLength: height
		}],
		topRight: [{
			corner: "topLeft",
			sideLength: width
		}, {
			corner: "bottomRight",
			sideLength: height
		}],
		bottomRight: [{
			corner: "bottomLeft",
			sideLength: width
		}, {
			corner: "topRight",
			sideLength: height
		}],
		bottomLeft: [{
			corner: "bottomRight",
			sideLength: width
		}, {
			corner: "topLeft",
			sideLength: height
		}]
	};
	for (const corner of Object.keys(radii).sort((a, b) => radii[b] - radii[a])) {
		const cornerRadius = radii[corner];
		const budget = Math.min(...adjacentByCorner[corner].map((adjacent) => {
			const adjacentRadius = radii[adjacent.corner];
			if (cornerRadius === 0 && adjacentRadius === 0) return 0;
			if (budgets[adjacent.corner] >= 0) return adjacent.sideLength - budgets[adjacent.corner];
			return cornerRadius / (cornerRadius + adjacentRadius) * adjacent.sideLength;
		}));
		budgets[corner] = budget;
		radii[corner] = Math.min(cornerRadius, budget);
	}
	return {
		topLeft: {
			radius: radii.topLeft,
			budget: budgets.topLeft
		},
		topRight: {
			radius: radii.topRight,
			budget: budgets.topRight
		},
		bottomRight: {
			radius: radii.bottomRight,
			budget: budgets.bottomRight
		},
		bottomLeft: {
			radius: radii.bottomLeft,
			budget: budgets.bottomLeft
		}
	};
}
function degreesToRadians(degrees) {
	return degrees * Math.PI / 180;
}
function smoothCornerPathParams(corner, smoothing) {
	let cornerSmoothing = smoothing;
	let p = (1 + cornerSmoothing) * corner.radius;
	if (corner.radius > 0) {
		const maxSmoothing = corner.budget / corner.radius - 1;
		cornerSmoothing = Math.min(cornerSmoothing, maxSmoothing);
		p = Math.min(p, corner.budget);
	}
	const arcMeasure = 90 * (1 - cornerSmoothing);
	const arcSectionLength = Math.sin(degreesToRadians(arcMeasure / 2)) * corner.radius * Math.sqrt(2);
	const angleAlpha = (90 - arcMeasure) / 2;
	const p3ToP4Distance = corner.radius * Math.tan(degreesToRadians(angleAlpha / 2));
	const angleBeta = 45 * cornerSmoothing;
	const c = p3ToP4Distance * Math.cos(degreesToRadians(angleBeta));
	const d = c * Math.tan(degreesToRadians(angleBeta));
	const b = (p - arcSectionLength - c - d) / 3;
	return {
		a: 2 * b,
		b,
		c,
		d,
		p,
		radius: corner.radius,
		arcSectionLength
	};
}
function drawTopRightSmoothCorner(path, corner, x, y) {
	if (corner.radius === 0) {
		path.lineTo(x + corner.p, y);
		return;
	}
	path.cubicTo(x + corner.a, y, x + corner.a + corner.b, y, x + corner.a + corner.b + corner.c, y + corner.d);
	path.arcToRotated(corner.radius, corner.radius, 0, true, false, x + corner.p - corner.d, y + corner.p - corner.a - corner.b - corner.c);
	path.cubicTo(x + corner.p, y + corner.p - corner.a - corner.b, x + corner.p, y + corner.p - corner.a, x + corner.p, y + corner.p);
}
function drawBottomRightSmoothCorner(path, corner, x, y) {
	if (corner.radius === 0) {
		path.lineTo(x, y + corner.p);
		return;
	}
	path.cubicTo(x, y + corner.a, x, y + corner.a + corner.b, x - corner.d, y + corner.a + corner.b + corner.c);
	path.arcToRotated(corner.radius, corner.radius, 0, true, false, x - corner.p + corner.a + corner.b + corner.c, y + corner.p - corner.d);
	path.cubicTo(x - corner.p + corner.a + corner.b, y + corner.p, x - corner.p + corner.a, y + corner.p, x - corner.p, y + corner.p);
}
function drawBottomLeftSmoothCorner(path, corner, x, y) {
	if (corner.radius === 0) {
		path.lineTo(x - corner.p, y);
		return;
	}
	path.cubicTo(x - corner.a, y, x - corner.a - corner.b, y, x - corner.a - corner.b - corner.c, y - corner.d);
	path.arcToRotated(corner.radius, corner.radius, 0, true, false, x - corner.p + corner.d, y - corner.p + corner.a + corner.b + corner.c);
	path.cubicTo(x - corner.p, y - corner.p + corner.a + corner.b, x - corner.p, y - corner.p + corner.a, x - corner.p, y - corner.p);
}
function drawTopLeftSmoothCorner(path, corner, x, y) {
	if (corner.radius === 0) {
		path.lineTo(x, y - corner.p);
		return;
	}
	path.cubicTo(x, y - corner.a, x, y - corner.a - corner.b, x + corner.d, y - corner.a - corner.b - corner.c);
	path.arcToRotated(corner.radius, corner.radius, 0, true, false, x + corner.p - corner.a - corner.b - corner.c, y - corner.p + corner.d);
	path.cubicTo(x + corner.p - corner.a - corner.b, y - corner.p, x + corner.p - corner.a, y - corner.p, x + corner.p, y - corner.p);
}
function makeSmoothRRectPath(r, node, spread = 0, offsetX = 0, offsetY = 0) {
	const path = new r.ck.Path();
	const left = offsetX - spread;
	const top = offsetY - spread;
	const right = offsetX + node.width + spread;
	const bottom = offsetY + node.height + spread;
	const width = right - left;
	const height = bottom - top;
	if (width <= 0 || height <= 0) {
		path.addRect(r.ck.LTRBRect(left, top, Math.max(left, right), Math.max(top, bottom)));
		return path;
	}
	const smoothing = Math.max(0, Math.min(node.cornerSmoothing, 1));
	const corners = smoothCornerRadii(node, width, height, spread);
	const topLeftCorner = smoothCornerPathParams(corners.topLeft, smoothing);
	const topRightCorner = smoothCornerPathParams(corners.topRight, smoothing);
	const bottomRightCorner = smoothCornerPathParams(corners.bottomRight, smoothing);
	const bottomLeftCorner = smoothCornerPathParams(corners.bottomLeft, smoothing);
	if (topLeftCorner.radius === 0 && topRightCorner.radius === 0 && bottomRightCorner.radius === 0 && bottomLeftCorner.radius === 0) {
		path.addRect(r.ck.LTRBRect(left, top, right, bottom));
		return path;
	}
	path.moveTo(right - topRightCorner.p, top);
	drawTopRightSmoothCorner(path, topRightCorner, right - topRightCorner.p, top);
	path.lineTo(right, bottom - bottomRightCorner.p);
	drawBottomRightSmoothCorner(path, bottomRightCorner, right, bottom - bottomRightCorner.p);
	path.lineTo(left + bottomLeftCorner.p, bottom);
	drawBottomLeftSmoothCorner(path, bottomLeftCorner, left + bottomLeftCorner.p, bottom);
	path.lineTo(left, top + topLeftCorner.p);
	drawTopLeftSmoothCorner(path, topLeftCorner, left, top + topLeftCorner.p);
	path.close();
	return path;
}
function makeNodeShapePath(r, node, rect, hasRadius) {
	const path = new r.ck.Path();
	switch (node.type) {
		case "ELLIPSE":
			path.addOval(rect);
			break;
		case "VECTOR": {
			const vps = r.getVectorPaths(node);
			if (vps) for (const vp of vps) path.addPath(vp);
			break;
		}
		case "POLYGON":
		case "STAR": {
			const polyPath = r.makePolygonPath(node);
			path.addPath(polyPath);
			polyPath.delete();
			break;
		}
		default: if (nodeHasSmoothCorners(node)) {
			const smoothPath = makeSmoothRRectPath(r, node);
			path.addPath(smoothPath);
			smoothPath.delete();
		} else if (hasRadius) path.addRRect(r.makeRRect(node));
		else path.addRect(rect);
	}
	return path;
}
function makePolygonPath(r, node) {
	const path = new r.ck.Path();
	polygonVertices(node).forEach((point, index) => {
		if (index === 0) path.moveTo(point.x, point.y);
		else path.lineTo(point.x, point.y);
	});
	path.close();
	return path;
}
function makeRRect(r, node) {
	if (node.independentCorners) return new Float32Array([
		0,
		0,
		node.width,
		node.height,
		node.topLeftRadius,
		node.topLeftRadius,
		node.topRightRadius,
		node.topRightRadius,
		node.bottomRightRadius,
		node.bottomRightRadius,
		node.bottomLeftRadius,
		node.bottomLeftRadius
	]);
	return r.ck.RRectXY(r.ck.LTRBRect(0, 0, node.width, node.height), node.cornerRadius, node.cornerRadius);
}
function makeRRectWithSpread(r, node, spread) {
	if (node.independentCorners) return new Float32Array([
		-spread,
		-spread,
		node.width + spread,
		node.height + spread,
		Math.max(0, node.topLeftRadius + spread),
		Math.max(0, node.topLeftRadius + spread),
		Math.max(0, node.topRightRadius + spread),
		Math.max(0, node.topRightRadius + spread),
		Math.max(0, node.bottomRightRadius + spread),
		Math.max(0, node.bottomRightRadius + spread),
		Math.max(0, node.bottomLeftRadius + spread),
		Math.max(0, node.bottomLeftRadius + spread)
	]);
	return r.ck.RRectXY(r.ck.LTRBRect(-spread, -spread, node.width + spread, node.height + spread), Math.max(0, node.cornerRadius + spread), Math.max(0, node.cornerRadius + spread));
}
function makeRRectWithOffset(r, node, ox, oy, spread) {
	const s = spread;
	if (node.independentCorners) return new Float32Array([
		ox + s,
		oy + s,
		node.width + ox - s,
		node.height + oy - s,
		Math.max(0, node.topLeftRadius - s),
		Math.max(0, node.topLeftRadius - s),
		Math.max(0, node.topRightRadius - s),
		Math.max(0, node.topRightRadius - s),
		Math.max(0, node.bottomRightRadius - s),
		Math.max(0, node.bottomRightRadius - s),
		Math.max(0, node.bottomLeftRadius - s),
		Math.max(0, node.bottomLeftRadius - s)
	]);
	return r.ck.RRectXY(r.ck.LTRBRect(ox + s, oy + s, node.width + ox - s, node.height + oy - s), Math.max(0, node.cornerRadius - s), Math.max(0, node.cornerRadius - s));
}
function clipNodeShape(r, canvas, node, rect, hasRadius) {
	if (node.type === "ELLIPSE") {
		const clipPath = new r.ck.Path();
		clipPath.addOval(rect);
		canvas.clipPath(clipPath, r.ck.ClipOp.Intersect, true);
		clipPath.delete();
	} else if (nodeHasSmoothCorners(node)) {
		const clipPath = makeSmoothRRectPath(r, node);
		canvas.clipPath(clipPath, r.ck.ClipOp.Intersect, true);
		clipPath.delete();
	} else if (hasRadius) canvas.clipRRect(r.makeRRect(node), r.ck.ClipOp.Intersect, true);
	else canvas.clipRect(rect, r.ck.ClipOp.Intersect, true);
}
function getVectorPaths(r, node) {
	if (!node.vectorNetwork) return null;
	const cached = r.vectorPathCache.get(node.id);
	if (cached) return cached;
	const paths = vectorNetworkToPath(r.ck, node.vectorNetwork);
	r.vectorPathCache.set(node.id, paths);
	return paths;
}
function getFillGeometry(r, node) {
	if (node.fillGeometry.length === 0) return null;
	const cached = r.fillGeometryCache.get(node.id);
	if (cached) return cached;
	const paths = node.fillGeometry.map((g) => geometryBlobToPath(r.ck, g.commandsBlob, g.windingRule));
	r.fillGeometryCache.set(node.id, paths);
	return paths;
}
function getStrokeGeometry(r, node) {
	if (node.strokeGeometry.length === 0) return null;
	const cached = r.strokeGeometryCache.get(node.id);
	if (cached) return cached;
	const paths = node.strokeGeometry.map((g) => geometryBlobToPath(r.ck, g.commandsBlob, g.windingRule));
	r.strokeGeometryCache.set(node.id, paths);
	return paths;
}
//#endregion
export { clipNodeShape, getFillGeometry, getStrokeGeometry, getVectorPaths, makeNodeShapePath, makePolygonPath, makeRRect, makeRRectWithOffset, makeRRectWithSpread, makeSmoothRRectPath, nodeHasRadius, nodeHasSmoothCorners };

//# sourceMappingURL=shapes.js.map
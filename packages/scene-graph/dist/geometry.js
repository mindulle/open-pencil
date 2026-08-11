//#region src/geometry.ts
function degToRad(degrees) {
	return degrees * Math.PI / 180;
}
function radToDeg(radians) {
	return radians * 180 / Math.PI;
}
function rotatePoint(px, py, cx, cy, rad) {
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	return {
		x: cx + (px - cx) * cos - (py - cy) * sin,
		y: cy + (px - cx) * sin + (py - cy) * cos
	};
}
function rotatedCorners(cx, cy, hw, hh, rotationDeg) {
	const rad = degToRad(rotationDeg);
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	return [
		{
			x: cx + -hw * cos - -hh * sin,
			y: cy + -hw * sin + -hh * cos
		},
		{
			x: cx + hw * cos - -hh * sin,
			y: cy + hw * sin + -hh * cos
		},
		{
			x: cx + hw * cos - hh * sin,
			y: cy + hw * sin + hh * cos
		},
		{
			x: cx + -hw * cos - hh * sin,
			y: cy + -hw * sin + hh * cos
		}
	];
}
function rotatedBBox(x, y, w, h, rotationDeg) {
	if (rotationDeg === 0) return {
		left: x,
		right: x + w,
		top: y,
		bottom: y + h,
		centerX: x + w / 2,
		centerY: y + h / 2
	};
	const corners = rotatedCorners(x + w / 2, y + h / 2, w / 2, h / 2, rotationDeg);
	let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
	for (const c of corners) {
		left = Math.min(left, c.x);
		right = Math.max(right, c.x);
		top = Math.min(top, c.y);
		bottom = Math.max(bottom, c.y);
	}
	return {
		left,
		right,
		top,
		bottom,
		centerX: (left + right) / 2,
		centerY: (top + bottom) / 2
	};
}
function createBoundsAccumulator() {
	return {
		minX: Infinity,
		minY: Infinity,
		maxX: -Infinity,
		maxY: -Infinity
	};
}
function includePoint(bounds, x, y) {
	bounds.minX = Math.min(bounds.minX, x);
	bounds.minY = Math.min(bounds.minY, y);
	bounds.maxX = Math.max(bounds.maxX, x);
	bounds.maxY = Math.max(bounds.maxY, y);
}
function includeRect(bounds, rect) {
	includePoint(bounds, rect.x, rect.y);
	includePoint(bounds, rect.x + rect.width, rect.y + rect.height);
}
function boundsToRect(bounds) {
	return bounds.minX === Infinity ? {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	} : {
		x: bounds.minX,
		y: bounds.minY,
		width: bounds.maxX - bounds.minX,
		height: bounds.maxY - bounds.minY
	};
}
function computeBounds(items) {
	const bounds = createBoundsAccumulator();
	for (const item of items) includeRect(bounds, item);
	return boundsToRect(bounds);
}
function polygonVertices(node) {
	const cx = node.width / 2;
	const cy = node.height / 2;
	const rx = node.width / 2;
	const ry = node.height / 2;
	const pointCount = Math.max(3, node.pointCount);
	const isStar = node.type === "STAR";
	const innerRatio = isStar ? node.starInnerRadius : 1;
	const totalPoints = isStar ? pointCount * 2 : pointCount;
	const angleOffset = -Math.PI / 2;
	return Array.from({ length: totalPoints }, (_, index) => {
		const angle = angleOffset + 2 * Math.PI * index / totalPoints;
		const radius = isStar && index % 2 === 1 ? innerRatio : 1;
		return {
			x: cx + rx * radius * Math.cos(angle),
			y: cy + ry * radius * Math.sin(angle)
		};
	});
}
function strokeOverflow(strokes) {
	let overflow = 0;
	for (const stroke of strokes ?? []) {
		if (!stroke.visible) continue;
		let extra = 0;
		if (stroke.align === "OUTSIDE") extra = stroke.weight;
		else if (stroke.align === "CENTER") extra = stroke.weight / 2;
		overflow = Math.max(overflow, extra);
	}
	return overflow;
}
function effectOverflow(effects) {
	let left = 0;
	let right = 0;
	let top = 0;
	let bottom = 0;
	for (const effect of effects ?? []) {
		if (!effect.visible) continue;
		if (effect.type !== "DROP_SHADOW" && effect.type !== "LAYER_BLUR" && effect.type !== "FOREGROUND_BLUR") continue;
		const blurSpread = effect.radius + effect.spread;
		left = Math.max(left, blurSpread + Math.max(0, -effect.offset.x));
		right = Math.max(right, blurSpread + Math.max(0, effect.offset.x));
		top = Math.max(top, blurSpread + Math.max(0, -effect.offset.y));
		bottom = Math.max(bottom, blurSpread + Math.max(0, effect.offset.y));
	}
	return {
		left,
		right,
		top,
		bottom
	};
}
function computeAbsoluteBounds(nodes, getAbsolutePosition) {
	const bounds = createBoundsAccumulator();
	for (const n of nodes) {
		const abs = getAbsolutePosition(n.id);
		includeRect(bounds, {
			x: abs.x,
			y: abs.y,
			width: n.width,
			height: n.height
		});
	}
	return boundsToRect(bounds);
}
function computeVisualBounds(nodes, getAbsolutePosition) {
	const bounds = createBoundsAccumulator();
	for (const n of nodes) {
		const abs = getAbsolutePosition(n.id);
		const bbox = rotatedBBox(abs.x, abs.y, n.width, n.height, n.rotation ?? 0);
		const stroke = strokeOverflow(n.strokes);
		const effects = effectOverflow(n.effects);
		includePoint(bounds, bbox.left - stroke - effects.left, bbox.top - stroke - effects.top);
		includePoint(bounds, bbox.right + stroke + effects.right, bbox.bottom + stroke + effects.bottom);
	}
	return boundsToRect(bounds);
}
function unionVisualBounds(a, b) {
	if (!a) return b;
	if (!b) return a;
	return {
		minX: Math.min(a.minX, b.minX),
		minY: Math.min(a.minY, b.minY),
		maxX: Math.max(a.maxX, b.maxX),
		maxY: Math.max(a.maxY, b.maxY)
	};
}
function intersectVisualBounds(a, b) {
	const minX = Math.max(a.minX, b.minX);
	const minY = Math.max(a.minY, b.minY);
	const maxX = Math.min(a.maxX, b.maxX);
	const maxY = Math.min(a.maxY, b.maxY);
	return minX < maxX && minY < maxY ? {
		minX,
		minY,
		maxX,
		maxY
	} : null;
}
function geometryCommandCoordCount(command) {
	if (command === 0) return 0;
	if (command === 1 || command === 2) return 1;
	if (command === 4) return 3;
	return null;
}
function geometryBlobBounds(paths) {
	const bounds = createBoundsAccumulator();
	for (const path of paths) {
		const blob = path.commandsBlob;
		const dv = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
		let offset = 0;
		while (offset < blob.length) {
			const command = blob[offset++];
			const coords = geometryCommandCoordCount(command);
			if (coords == null) break;
			for (let i = 0; i < coords; i++) {
				if (offset + 8 > blob.length) break;
				includePoint(bounds, dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true));
				offset += 8;
			}
		}
	}
	return bounds.minX === Infinity ? null : boundsToRect(bounds);
}
function transformLocalPoint(node, point) {
	let x = node.flipX ? node.width - point.x : point.x;
	let y = node.flipY ? node.height - point.y : point.y;
	const rotation = node.rotation ?? 0;
	if (rotation !== 0) {
		const rotated = rotatePoint(x, y, node.width / 2, node.height / 2, degToRad(rotation));
		x = rotated.x;
		y = rotated.y;
	}
	return {
		x,
		y
	};
}
function transformedLocalBounds(node, local, abs) {
	const points = [
		{
			x: local.x,
			y: local.y
		},
		{
			x: local.x + local.width,
			y: local.y
		},
		{
			x: local.x + local.width,
			y: local.y + local.height
		},
		{
			x: local.x,
			y: local.y + local.height
		}
	].map((point) => transformLocalPoint(node, point));
	return {
		minX: abs.x + Math.min(...points.map((point) => point.x)),
		minY: abs.y + Math.min(...points.map((point) => point.y)),
		maxX: abs.x + Math.max(...points.map((point) => point.x)),
		maxY: abs.y + Math.max(...points.map((point) => point.y))
	};
}
function nodeVisualBounds(node, getAbsolutePosition) {
	const abs = getAbsolutePosition(node.id);
	const base = computeVisualBounds([node], getAbsolutePosition);
	let bounds = {
		minX: base.x,
		minY: base.y,
		maxX: base.x + base.width,
		maxY: base.y + base.height
	};
	const hasNonInsideStroke = node.strokes?.some((stroke) => stroke.visible && stroke.align !== "INSIDE");
	const localGeometry = geometryBlobBounds([...node.fillGeometry ?? [], ...hasNonInsideStroke ? node.strokeGeometry ?? [] : []]);
	if (localGeometry) bounds = unionVisualBounds(bounds, transformedLocalBounds(node, localGeometry, abs)) ?? bounds;
	if (node.type === "TEXT" && node.textDecoration && node.textDecoration !== "NONE") {
		const fontSize = node.fontSize ?? 14;
		const underlineOffset = node.textUnderlineOffset ?? fontSize * .18;
		const thickness = node.textDecorationThickness ?? Math.max(1, fontSize / 16);
		bounds.maxY += underlineOffset + thickness + fontSize * .35;
	}
	return bounds;
}
function collectDescendantVisualBounds(nodeId, getNode, getAbsolutePosition, clip = null) {
	const node = getNode(nodeId);
	if (!node?.visible) return null;
	const own = nodeVisualBounds(node, getAbsolutePosition);
	let bounds = clip ? intersectVisualBounds(own, clip) : own;
	const isClippableContainer = node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE";
	let childClip = clip;
	if (isClippableContainer && node.clipsContent) {
		const abs = getAbsolutePosition(node.id);
		const nodeClip = {
			minX: abs.x,
			minY: abs.y,
			maxX: abs.x + node.width,
			maxY: abs.y + node.height
		};
		childClip = childClip ? intersectVisualBounds(childClip, nodeClip) : nodeClip;
		if (!childClip) return bounds;
	}
	for (const childId of node.childIds ?? []) bounds = unionVisualBounds(bounds, collectDescendantVisualBounds(childId, getNode, getAbsolutePosition, childClip));
	return bounds;
}
function computeDescendantVisualBounds(nodeIds, getNode, getAbsolutePosition) {
	let bounds = null;
	for (const nodeId of nodeIds) bounds = unionVisualBounds(bounds, collectDescendantVisualBounds(nodeId, getNode, getAbsolutePosition));
	return bounds;
}
function crossProduct(a, b, p) {
	return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}
function lineSegmentIntersect(p1, p2, p3, p4) {
	const dx1 = p2.x - p1.x;
	const dy1 = p2.y - p1.y;
	const dx2 = p4.x - p3.x;
	const dy2 = p4.y - p3.y;
	const denom = dx1 * dy2 - dy1 * dx2;
	if (denom === 0) return p1;
	const t = ((p3.x - p1.x) * dy2 - (p3.y - p1.y) * dx2) / denom;
	return {
		x: p1.x + t * dx1,
		y: p1.y + t * dy1
	};
}
function clipHalfPlane(polygon, a, b, wantPositive) {
	const output = [];
	const isInside = (p) => {
		const cross = crossProduct(a, b, p);
		return wantPositive ? cross >= 0 : cross <= 0;
	};
	for (let i = 0; i < polygon.length; i++) {
		const curr = polygon[i];
		const prev = polygon[i === 0 ? polygon.length - 1 : i - 1];
		const currInside = isInside(curr);
		const prevInside = isInside(prev);
		if (currInside) {
			if (!prevInside) output.push(lineSegmentIntersect(prev, curr, a, b));
			output.push(curr);
		} else if (prevInside) output.push(lineSegmentIntersect(prev, curr, a, b));
	}
	return output;
}
/**
* Clip a subject polygon against a convex polygon (e.g. the 4 canvas-space
* corners of a rotated clipping ancestor).
*
* Uses Sutherland–Hodgman polygon clipping with centroid-based interior
* detection, making it robust to either winding order of the clip polygon.
* Returns the clipped polygon, or null if the subject is fully outside the
* clip polygon. When `clipCorners` has fewer than 3 points the subject is
* returned unchanged (no clipping).
*
* Preserving the polygon (rather than collapsing to an AABB) lets callers
* chain multiple clips without reintroducing corners removed by an inner clip.
*/
function clipPolygon(subject, clipCorners) {
	if (clipCorners.length < 3) return subject;
	let cx = 0;
	let cy = 0;
	for (const c of clipCorners) {
		cx += c.x;
		cy += c.y;
	}
	cx /= clipCorners.length;
	cy /= clipCorners.length;
	let polygon = subject;
	for (let i = 0; i < clipCorners.length; i++) {
		if (polygon.length === 0) return null;
		const a = clipCorners[i];
		const b = clipCorners[(i + 1) % clipCorners.length];
		const centroidCross = crossProduct(a, b, {
			x: cx,
			y: cy
		});
		polygon = clipHalfPlane(polygon, a, b, centroidCross >= 0);
	}
	return polygon.length === 0 ? null : polygon;
}
/**
* Clip an axis-aligned VisualBounds rectangle against a convex polygon
* (e.g. the 4 canvas-space corners of a rotated clipping ancestor).
*
* Returns the AABB of the intersection, or null if the bounds are fully
* outside the clip polygon. Delegates to {@link clipPolygon}.
*
* For a non-rotated clip (axis-aligned corners) the result is identical
* to `intersectVisualBounds`.
*/
function clipBoundsToPolygon(bounds, clipCorners) {
	if (clipCorners.length < 3) return bounds;
	const polygon = clipPolygon([
		{
			x: bounds.minX,
			y: bounds.minY
		},
		{
			x: bounds.maxX,
			y: bounds.minY
		},
		{
			x: bounds.maxX,
			y: bounds.maxY
		},
		{
			x: bounds.minX,
			y: bounds.maxY
		}
	], clipCorners);
	if (!polygon) return null;
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const p of polygon) {
		if (p.x < minX) minX = p.x;
		if (p.y < minY) minY = p.y;
		if (p.x > maxX) maxX = p.x;
		if (p.y > maxY) maxY = p.y;
	}
	return minX < maxX && minY < maxY ? {
		minX,
		minY,
		maxX,
		maxY
	} : null;
}
//#endregion
export { clipBoundsToPolygon, clipPolygon, computeAbsoluteBounds, computeBounds, computeDescendantVisualBounds, computeVisualBounds, degToRad, effectOverflow, geometryBlobBounds, intersectVisualBounds, nodeVisualBounds, polygonVertices, radToDeg, rotatePoint, rotatedBBox, rotatedCorners, strokeOverflow, unionVisualBounds };

//# sourceMappingURL=geometry.js.map
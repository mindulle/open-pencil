import { parseColor } from "../../../color/index.js";
import { parseSVGDocument } from "../../../io/formats/svg/document.js";
import { mapSVGPointToViewport } from "./transform.js";
//#region src/vector/vectorize/svg/gradients.ts
/** Coordinate value: bare number (userSpaceOnUse) or percent/fraction (objectBoundingBox). */
function coord(value, fallback) {
	if (value == null) return fallback;
	const trimmed = value.trim();
	if (trimmed.endsWith("%")) return Number.parseFloat(trimmed) / 100;
	const n = Number.parseFloat(trimmed);
	return Number.isFinite(n) ? n : fallback;
}
function readStops(gradient) {
	const stops = [];
	const stopEls = Array.from(gradient.getElementsByTagName("stop"));
	for (const [i, stop] of stopEls.entries()) {
		const offset = coord(stop.getAttribute("offset"), i === 0 ? 0 : 1);
		const color = parseColor(stop.getAttribute("stop-color") ?? "#000000");
		const opacity = stop.getAttribute("stop-opacity");
		if (opacity != null) {
			const a = Number.parseFloat(opacity);
			if (Number.isFinite(a)) color.a = a;
		}
		stops.push({
			offset: Math.min(1, Math.max(0, offset)),
			color
		});
	}
	return stops.sort((a, b) => a.offset - b.offset);
}
/**
* Parse every gradient def in the SVG into a lookup by id, via an XML/DOM parse
* (no hand-rolled markup parsing). Returns an empty map on parse failure so a
* malformed SVG simply falls back to solid fills.
*/
function parseSVGGradients(svg) {
	const map = /* @__PURE__ */ new Map();
	const doc = parseSVGDocument(svg);
	if (!doc) return map;
	for (const kind of ["linear", "radial"]) {
		const els = Array.from(doc.getElementsByTagName(`${kind}Gradient`));
		for (const el of els) {
			const id = el.getAttribute("id");
			if (!id) continue;
			const units = el.getAttribute("gradientUnits") === "userSpaceOnUse" ? "userSpaceOnUse" : "objectBoundingBox";
			map.set(id, {
				kind,
				units,
				transform: el.getAttribute("gradientTransform"),
				stops: readStops(el),
				x1: coord(el.getAttribute("x1"), 0),
				y1: coord(el.getAttribute("y1"), 0),
				x2: coord(el.getAttribute("x2"), units === "objectBoundingBox" ? 1 : 0),
				y2: coord(el.getAttribute("y2"), 0),
				cx: coord(el.getAttribute("cx"), .5),
				cy: coord(el.getAttribute("cy"), .5),
				r: coord(el.getAttribute("r"), .5)
			});
		}
	}
	return map;
}
function gradientIdFromFill(fill) {
	const value = fill?.trim();
	if (!value?.startsWith("url(") || !value.endsWith(")")) return null;
	const reference = value.slice(4, -1).trim();
	if (!reference.startsWith("#")) return null;
	const id = reference.slice(1).trim();
	return id && !id.includes(" ") ? id : null;
}
function gradientStops(stops) {
	return stops.map((s) => ({
		color: s.color,
		position: s.offset
	}));
}
/**
* Build a scene-graph gradient Fill for `fill="url(#id)"`, with its transform
* expressed in the path's normalized bounding-box space (`nodeBounds` in the same
* bounds-pixel space as the parsed network).
*/
function resolveGradientFill(fillRef, gradients, elementTransform, viewport, nodeBounds) {
	const id = gradientIdFromFill(fillRef);
	if (!id) return null;
	const grad = gradients.get(id);
	if (!grad || grad.stops.length === 0) return null;
	if (nodeBounds.width <= 0 || nodeBounds.height <= 0) return null;
	const toLocal = (px, py) => {
		const mapped = grad.units === "objectBoundingBox" ? {
			x: nodeBounds.x + px * nodeBounds.width,
			y: nodeBounds.y + py * nodeBounds.height
		} : mapSVGPointToViewport(px, py, elementTransform, grad.transform, viewport);
		return {
			x: (mapped.x - nodeBounds.x) / nodeBounds.width,
			y: (mapped.y - nodeBounds.y) / nodeBounds.height
		};
	};
	const baseColor = grad.stops[0].color;
	const stops = gradientStops(grad.stops);
	if (grad.kind === "radial") {
		const center = toLocal(grad.cx, grad.cy);
		const edgeX = toLocal(grad.cx + grad.r, grad.cy);
		const edgeY = toLocal(grad.cx, grad.cy + grad.r);
		return {
			type: "GRADIENT_RADIAL",
			color: baseColor,
			opacity: 1,
			visible: true,
			gradientStops: stops,
			gradientTransform: {
				m00: edgeX.x - center.x,
				m01: edgeY.x - center.x,
				m02: center.x,
				m10: edgeX.y - center.y,
				m11: edgeY.y - center.y,
				m12: center.y
			}
		};
	}
	const start = toLocal(grad.x1, grad.y1);
	const end = toLocal(grad.x2, grad.y2);
	const ax = end.x - start.x;
	const ay = end.y - start.y;
	return {
		type: "GRADIENT_LINEAR",
		color: baseColor,
		opacity: 1,
		visible: true,
		gradientStops: stops,
		gradientTransform: {
			m00: ax,
			m01: -ay,
			m02: start.x,
			m10: ay,
			m11: ax,
			m12: start.y
		}
	};
}
//#endregion
export { parseSVGGradients, resolveGradientFill };

//# sourceMappingURL=gradients.js.map
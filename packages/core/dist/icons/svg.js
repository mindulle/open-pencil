import { parseSVGFragment } from "../io/formats/svg/document.js";
import { parseSVGPath } from "@open-pencil/scene-graph/parse-path";
import { iconToSVG } from "@iconify/utils";
import svgpath from "svgpath";
//#region src/icons/svg.ts
const DEFAULT_PRESENTATION = {
	fill: "currentColor",
	stroke: "none",
	strokeWidth: "1",
	strokeCap: "butt",
	strokeJoin: "miter",
	fillRule: "nonzero"
};
const SHAPE_NAMES = /* @__PURE__ */ new Set([
	"path",
	"circle",
	"ellipse",
	"rect",
	"line",
	"polygon",
	"polyline"
]);
const NON_RENDERED_CONTAINERS = /* @__PURE__ */ new Set([
	"defs",
	"clipPath",
	"mask",
	"symbol"
]);
function isElement(node) {
	return node.nodeType === node.ELEMENT_NODE;
}
function inlineStyles(element) {
	const styles = /* @__PURE__ */ new Map();
	for (const declaration of (element.getAttribute("style") ?? "").split(";")) {
		const separator = declaration.indexOf(":");
		if (separator <= 0) continue;
		const name = declaration.slice(0, separator).trim();
		const value = declaration.slice(separator + 1).trim();
		if (name && value) styles.set(name, value);
	}
	return styles;
}
function inheritedAttribute(element, styles, name, inherited) {
	return styles.get(name) ?? (element.hasAttribute(name) ? element.getAttribute(name) ?? inherited : inherited);
}
function presentationFor(element, inherited) {
	const styles = inlineStyles(element);
	return {
		fill: inheritedAttribute(element, styles, "fill", inherited.fill),
		stroke: inheritedAttribute(element, styles, "stroke", inherited.stroke),
		strokeWidth: inheritedAttribute(element, styles, "stroke-width", inherited.strokeWidth),
		strokeCap: inheritedAttribute(element, styles, "stroke-linecap", inherited.strokeCap),
		strokeJoin: inheritedAttribute(element, styles, "stroke-linejoin", inherited.strokeJoin),
		fillRule: inheritedAttribute(element, styles, "fill-rule", inherited.fillRule)
	};
}
function num(element, attr, fallback = 0) {
	const value = element.getAttribute(attr);
	if (value === null) return fallback;
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}
function circleToD(element) {
	const cx = num(element, "cx");
	const cy = num(element, "cy");
	const r = num(element, "r");
	return r > 0 ? `M${cx - r},${cy}A${r},${r},0,1,0,${cx + r},${cy}A${r},${r},0,1,0,${cx - r},${cy}Z` : null;
}
function ellipseToD(element) {
	const cx = num(element, "cx");
	const cy = num(element, "cy");
	const rx = num(element, "rx");
	const ry = num(element, "ry");
	return rx > 0 && ry > 0 ? `M${cx - rx},${cy}A${rx},${ry},0,1,0,${cx + rx},${cy}A${rx},${ry},0,1,0,${cx - rx},${cy}Z` : null;
}
function rectToD(element) {
	const x = num(element, "x");
	const y = num(element, "y");
	const width = num(element, "width");
	const height = num(element, "height");
	if (width <= 0 || height <= 0) return null;
	const rx = Math.min(num(element, "rx"), width / 2);
	const ry = Math.min(num(element, "ry", rx), height / 2);
	if (rx > 0 || ry > 0) {
		const arcX = rx || ry;
		const arcY = ry || rx;
		return `M${x + arcX},${y}H${x + width - arcX}A${arcX},${arcY},0,0,1,${x + width},${y + arcY}V${y + height - arcY}A${arcX},${arcY},0,0,1,${x + width - arcX},${y + height}H${x + arcX}A${arcX},${arcY},0,0,1,${x},${y + height - arcY}V${y + arcY}A${arcX},${arcY},0,0,1,${x + arcX},${y}Z`;
	}
	return `M${x},${y}H${x + width}V${y + height}H${x}Z`;
}
function pointsToD(element, close) {
	const points = element.getAttribute("points");
	if (!points) return null;
	const values = points.trim().split(/[\s,]+/).map(Number);
	if (values.length < 4 || values.length % 2 !== 0) return null;
	let path = `M${values[0]},${values[1]}`;
	for (let index = 2; index < values.length; index += 2) path += `L${values[index]},${values[index + 1]}`;
	return close ? `${path}Z` : path;
}
function shapeToD(tagName, element) {
	switch (tagName) {
		case "circle": return circleToD(element);
		case "ellipse": return ellipseToD(element);
		case "rect": return rectToD(element);
		case "line": return `M${num(element, "x1")},${num(element, "y1")}L${num(element, "x2")},${num(element, "y2")}`;
		case "polygon": return pointsToD(element, true);
		case "polyline": return pointsToD(element, false);
		default: return null;
	}
}
function combinedTransform(parent, element) {
	const current = element.getAttribute("transform");
	if (parent && current) return `${parent} ${current}`;
	return current ?? parent;
}
function normalizeSVGPaint(value) {
	return value?.trim().toLowerCase() === "none" ? null : value;
}
function appendShapePath(tagName, element, presentation, transform, result) {
	if (!SHAPE_NAMES.has(tagName)) return;
	const pathData = tagName === "path" ? element.getAttribute("d") : shapeToD(tagName, element);
	if (!pathData) return;
	const strokeWidth = Number.parseFloat(presentation.strokeWidth);
	result.push({
		d: pathData,
		fill: normalizeSVGPaint(presentation.fill),
		stroke: normalizeSVGPaint(presentation.stroke),
		strokeWidth: Number.isFinite(strokeWidth) ? strokeWidth : 1,
		strokeCap: presentation.strokeCap,
		strokeJoin: presentation.strokeJoin,
		fillRule: presentation.fillRule === "evenodd" ? "EVENODD" : "NONZERO",
		transform
	});
}
function collectUsePaths(element, presentation, transform, result, elementsById, useStack) {
	if ((element.localName || element.tagName) !== "use") return false;
	const x = num(element, "x");
	const y = num(element, "y");
	const useTransform = x !== 0 || y !== 0 ? `${transform ?? ""} translate(${x} ${y})`.trim() : transform;
	const href = element.getAttribute("href") ?? element.getAttribute("xlink:href");
	const target = href?.startsWith("#") ? elementsById.get(href.slice(1)) : null;
	if (target && !useStack.has(target)) collectPaths(target, presentation, useTransform, result, elementsById, /* @__PURE__ */ new Set([...useStack, target]), true);
	return true;
}
function collectPaths(element, inherited, parentTransform, result, elementsById, useStack = /* @__PURE__ */ new Set(), referenced = false) {
	const tagName = element.localName || element.tagName;
	if (NON_RENDERED_CONTAINERS.has(tagName) && !referenced) return;
	const presentation = presentationFor(element, inherited);
	const transform = combinedTransform(parentTransform, element);
	if (collectUsePaths(element, presentation, transform, result, elementsById, useStack)) return;
	appendShapePath(tagName, element, presentation, transform, result);
	for (const child of Array.from(element.childNodes)) if (isElement(child)) collectPaths(child, presentation, transform, result, elementsById, useStack, referenced);
}
function extractPaths(svgBody) {
	const root = parseSVGFragment(svgBody)?.documentElement;
	if (!root) return [];
	const elementsById = /* @__PURE__ */ new Map();
	for (const element of Array.from(root.getElementsByTagName("*"))) {
		const id = element.getAttribute("id");
		if (id) elementsById.set(id, element);
	}
	const result = [];
	collectPaths(root, DEFAULT_PRESENTATION, null, result, elementsById);
	return result;
}
function buildIconData(iconEntry, prefix, iconName, defaultW, defaultH, size) {
	const rendered = iconToSVG({
		body: iconEntry.body,
		width: iconEntry.width ?? defaultW,
		height: iconEntry.height ?? defaultH
	});
	const [, , viewBoxWidth, viewBoxHeight] = rendered.viewBox;
	const scaleX = size / viewBoxWidth;
	const scaleY = size / viewBoxHeight;
	return {
		prefix,
		name: iconName,
		width: size,
		height: size,
		paths: scalePathInfos(extractPaths(rendered.body), scaleX, scaleY)
	};
}
/** Scale extracted SVG path info into IconData paths (shared by buildIconData and design-jsx <svg>). */
function scalePathInfos(pathInfos, scaleX, scaleY) {
	return pathInfos.map((path) => {
		return {
			vectorNetwork: parseSVGPath(scaleX === 1 && scaleY === 1 ? path.d : svgpath(path.d).scale(scaleX, scaleY).round(2).toString(), path.fillRule),
			fill: normalizeSVGPaint(path.fill),
			stroke: normalizeSVGPaint(path.stroke),
			strokeWidth: path.strokeWidth * Math.min(scaleX, scaleY),
			strokeCap: path.strokeCap,
			strokeJoin: path.strokeJoin
		};
	});
}
//#endregion
export { buildIconData, extractPaths, scalePathInfos };

//# sourceMappingURL=svg.js.map
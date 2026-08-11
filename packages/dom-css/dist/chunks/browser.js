import { decodeBase64 } from "@open-pencil/core/bytes";
import { twirl } from "twirlwind";
import { SceneGraph } from "@open-pencil/scene-graph";
import { TRANSPARENT } from "@open-pencil/scene-graph/constants";
import { computeImageHash } from "@open-pencil/scene-graph/images";
import valueParser from "postcss-value-parser";
import { colorToCSS, parseColor } from "@open-pencil/core/color";
//#region src/serialize.ts
const VOID_ELEMENTS = /* @__PURE__ */ new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr"
]);
function splitWhitespace(value) {
	const parts = [];
	let current = "";
	for (const char of value) if (char === " " || char === "\n" || char === "	" || char === "\r" || char === "\f") {
		if (current.length > 0) parts.push(current);
		current = "";
	} else current += char;
	if (current.length > 0) parts.push(current);
	return parts;
}
function escapeText(value) {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function escapeAttr(value) {
	return escapeText(value).replaceAll("\"", "&quot;");
}
function serializeText(node) {
	return escapeText(node.text);
}
function serializeStyle(node) {
	if (!node.inlineStyle || Object.keys(node.inlineStyle).length === 0) return void 0;
	return Object.entries(node.inlineStyle).filter(([, value]) => value !== "").map(([property, value]) => `${property}: ${value}`).join("; ");
}
function serializeTailwindClasses(node) {
	const style = serializeStyle(node);
	if (!style) return void 0;
	const className = twirl(style);
	return className.length > 0 ? className : void 0;
}
function mergeClassNames(...values) {
	const className = values.flatMap((value) => value ? splitWhitespace(value) : []).map((value) => value.trim()).filter((value) => value.length > 0).join(" ");
	return className.length > 0 ? className : void 0;
}
function serializeAttrs(node, options) {
	const style = serializeStyle(node);
	const tailwindClass = options.style === "tailwind" ? serializeTailwindClasses(node) : void 0;
	const attrsWithoutStyle = { ...node.attrs };
	delete attrsWithoutStyle.style;
	const attrs = {
		...options.style === "tailwind" && tailwindClass ? attrsWithoutStyle : node.attrs,
		...tailwindClass ? { class: mergeClassNames(node.attrs.class, tailwindClass) } : {},
		...style && options.style !== "tailwind" ? { style } : {}
	};
	const serialized = Object.entries(attrs).filter(([, value]) => value !== "").map(([name, value]) => `${name}="${escapeAttr(value)}"`);
	if (serialized.length === 0) return "";
	return ` ${serialized.join(" ")}`;
}
function serializeElement(node, options) {
	const tagName = node.tagName.toLowerCase();
	const attrs = serializeAttrs(node, options);
	if (VOID_ELEMENTS.has(tagName)) return `<${tagName}${attrs}>`;
	return `<${tagName}${attrs}>${node.children.map((child) => serializeNode(child, options)).join("")}</${tagName}>`;
}
function serializeNode(node, options = {}) {
	return node.type === "text" ? serializeText(node) : serializeElement(node, options);
}
function serializeHTML(document, options = {}) {
	return document.children.map((node) => serializeNode(node, options)).join("");
}
//#endregion
//#region src/runtime/browser.ts
const DEFAULT_COMPUTED_PROPERTIES = [
	"align-items",
	"aspect-ratio",
	"background-color",
	"background-image",
	"border-bottom-color",
	"border-bottom-style",
	"border-bottom-left-radius",
	"border-bottom-right-radius",
	"border-bottom-width",
	"border-left-color",
	"border-left-style",
	"border-left-width",
	"border-radius",
	"border-right-color",
	"border-right-style",
	"border-right-width",
	"border-top-color",
	"border-top-style",
	"border-top-left-radius",
	"border-top-right-radius",
	"border-top-width",
	"box-shadow",
	"color",
	"column-gap",
	"display",
	"align-self",
	"bottom",
	"flex-direction",
	"flex-wrap",
	"font-family",
	"font-size",
	"font-style",
	"font-weight",
	"gap",
	"height",
	"justify-content",
	"letter-spacing",
	"left",
	"line-height",
	"max-height",
	"max-width",
	"min-height",
	"min-width",
	"object-fit",
	"opacity",
	"overflow",
	"padding-bottom",
	"padding-left",
	"padding-right",
	"padding-top",
	"position",
	"right",
	"row-gap",
	"text-align",
	"text-decoration-line",
	"text-shadow",
	"text-transform",
	"top",
	"white-space",
	"width"
];
function resolveBrowserDocument$1(documentOverride) {
	if (documentOverride) return documentOverride;
	if (typeof document === "undefined") throw new TypeError("Browser CSS runtime requires a DOM document");
	return document;
}
function attributesToRecord(element) {
	const attrs = {};
	for (const attr of Array.from(element.attributes)) attrs[attr.name] = attr.value;
	return attrs;
}
function styleToRecord(style) {
	const entries = {};
	for (const property of Array.from(style)) {
		const value = style.getPropertyValue(property);
		if (value) entries[property] = value;
	}
	return Object.keys(entries).length > 0 ? entries : void 0;
}
const NON_RENDERED_TAGS = /* @__PURE__ */ new Set([
	"head",
	"link",
	"meta",
	"script",
	"style",
	"template",
	"title"
]);
function domNodeToDesignNode(node) {
	if (node.nodeType === 3) {
		const text = node.textContent ?? "";
		return text.length > 0 ? {
			type: "text",
			text
		} : null;
	}
	if (node.nodeType !== 1) return null;
	const element = node;
	if (NON_RENDERED_TAGS.has(element.tagName.toLowerCase())) return null;
	const children = Array.from(element.childNodes).map(domNodeToDesignNode).filter((child) => child !== null);
	const style = "style" in element ? element.style : void 0;
	return {
		type: "element",
		tagName: element.tagName.toLowerCase(),
		attrs: attributesToRecord(element),
		children,
		inlineStyle: style ? styleToRecord(style) : void 0
	};
}
function parseHTMLWithDocument(browserDocument, html) {
	const Parser = browserDocument.defaultView?.DOMParser;
	if (!Parser) throw new TypeError("Browser CSS runtime requires DOMParser");
	const parsed = new Parser().parseFromString(html, "text/html");
	return {
		type: "document",
		children: Array.from(parsed.body.childNodes).map(domNodeToDesignNode).filter((node) => node !== null)
	};
}
function collectElementPairs(designNode, domNode, pairs) {
	if (designNode.type === "text") return;
	const view = domNode.ownerDocument?.defaultView;
	if (!view || !(domNode instanceof view.Element)) return;
	pairs.push([designNode, domNode]);
	const elementChildren = designNode.children.filter((child) => child.type === "element");
	const domChildren = Array.from(domNode.children);
	for (const [index, child] of elementChildren.entries()) {
		const domChild = domChildren.at(index);
		if (domChild) collectElementPairs(child, domChild, pairs);
	}
}
function computedStyleToRecord(style, options) {
	const entries = {};
	const properties = options.includeBrowserDefaults ? Array.from(style) : DEFAULT_COMPUTED_PROPERTIES;
	for (const property of properties) {
		const value = style.getPropertyValue(property);
		if (value) entries[property] = value;
	}
	return entries;
}
function requestFrame(browserDocument) {
	const requestAnimationFrame = browserDocument.defaultView?.requestAnimationFrame;
	if (!requestAnimationFrame) return Promise.resolve();
	return new Promise((resolve) => {
		requestAnimationFrame(() => resolve());
	});
}
function applySandboxHostStyle(element) {
	element.style.cssText = [
		"position: fixed",
		"left: -100000px",
		"top: 0",
		"width: 1000px",
		"height: auto",
		"visibility: hidden",
		"pointer-events: none",
		"contain: layout style paint"
	].join(";");
}
async function computeStylesInShadowRoot(browserDocument, designDocument, cssText, options) {
	const host = browserDocument.createElement("div");
	applySandboxHostStyle(host);
	const shadow = host.attachShadow({ mode: "open" });
	const style = browserDocument.createElement("style");
	style.textContent = cssText;
	shadow.append(style);
	const content = browserDocument.createElement("div");
	content.innerHTML = serializeHTML(designDocument);
	shadow.append(content);
	browserDocument.body.append(host);
	try {
		await requestFrame(browserDocument);
		return copyComputedStyles(designDocument, content, options);
	} finally {
		host.remove();
	}
}
async function computeStylesInIframe(browserDocument, designDocument, cssText, options) {
	const iframe = browserDocument.createElement("iframe");
	applySandboxHostStyle(iframe);
	browserDocument.body.append(iframe);
	try {
		const iframeDocument = iframe.contentDocument;
		if (!iframeDocument) throw new TypeError("Browser CSS runtime could not create iframe document");
		iframeDocument.open();
		iframeDocument.write(`<!doctype html><html><head></head><body></body></html>`);
		iframeDocument.close();
		const style = iframeDocument.createElement("style");
		style.textContent = cssText;
		iframeDocument.head.append(style);
		const content = iframeDocument.createElement("div");
		content.innerHTML = serializeHTML(designDocument);
		iframeDocument.body.append(content);
		await requestFrame(iframeDocument);
		return copyComputedStyles(designDocument, content, options);
	} finally {
		iframe.remove();
	}
}
function copyComputedStyles(designDocument, content, options) {
	const view = content.ownerDocument.defaultView;
	if (!view) throw new TypeError("Browser CSS runtime requires getComputedStyle");
	const nextDocument = structuredClone(designDocument);
	const pairs = [];
	const domChildren = Array.from(content.childNodes);
	for (const [index, child] of nextDocument.children.entries()) {
		const domChild = domChildren.at(index);
		if (domChild) collectElementPairs(child, domChild, pairs);
	}
	for (const [designElement, domElement] of pairs) designElement.computedStyle = computedStyleToRecord(view.getComputedStyle(domElement), options);
	return nextDocument;
}
function createBrowserCSSRuntime(options = {}) {
	const browserDocument = resolveBrowserDocument$1(options.document);
	const sandbox = options.sandbox ?? "shadow-root";
	return {
		kind: "browser",
		parseHTML: (html) => parseHTMLWithDocument(browserDocument, html),
		serializeHTML,
		computeStyles: (designDocument, cssText = "", computeOptions = {}) => sandbox === "iframe" ? computeStylesInIframe(browserDocument, designDocument, cssText, computeOptions) : computeStylesInShadowRoot(browserDocument, designDocument, cssText, computeOptions)
	};
}
//#endregion
//#region src/css-text.ts
function mergeCSSText(...parts) {
	const text = parts.map((part) => part?.trim()).filter((part) => !!part);
	return text.length > 0 ? text.join("\n") : void 0;
}
//#endregion
//#region src/css-values.ts
const TRANSPARENT_KEYWORDS = /* @__PURE__ */ new Set([
	"transparent",
	"rgba(0, 0, 0, 0)",
	"rgb(0 0 0 / 0)"
]);
function parseCSSNumber(value) {
	if (!value) return null;
	const trimmed = value.trim();
	if (trimmed.length === 0 || trimmed === "auto") return null;
	const parsed = Number.parseFloat(trimmed);
	if (!Number.isFinite(parsed)) return null;
	return trimmed.endsWith("rem") ? parsed * 16 : parsed;
}
function parseCSSColor(value) {
	if (!value) return null;
	const trimmed = value.trim();
	if (trimmed.length === 0 || TRANSPARENT_KEYWORDS.has(trimmed.toLowerCase())) return null;
	return parseColor(trimmed);
}
function fillToCSS(fill) {
	if (fill?.type !== "SOLID" || !fill.visible) return void 0;
	return colorToCSS({
		...fill.color,
		a: fill.opacity
	});
}
function colorToFillFromCSS(value) {
	const color = parseCSSColor(value);
	if (!color) return [];
	return [{
		type: "SOLID",
		color,
		opacity: color.a,
		visible: true
	}];
}
function strokeColorToCSS(stroke) {
	if (!stroke?.visible) return void 0;
	return colorToCSS({
		...stroke.color,
		a: stroke.opacity
	});
}
function strokeToCSS(stroke) {
	const color = strokeColorToCSS(stroke);
	if (!color || !stroke) return void 0;
	return `${stroke.weight}px solid ${color}`;
}
function colorToStrokeFromCSS(colorValue, weightValue) {
	const color = parseCSSColor(colorValue);
	const weight = parseCSSNumber(weightValue);
	if (!color || weight === null || weight <= 0) return [];
	return [{
		color,
		weight,
		opacity: color.a,
		visible: true,
		align: "INSIDE"
	}];
}
function dropShadowToCSS(effect) {
	if (effect?.type !== "DROP_SHADOW" || !effect.visible) return void 0;
	return `${effect.offset.x}px ${effect.offset.y}px ${effect.radius}px ${effect.spread}px ${colorToCSS({
		...effect.color,
		a: effect.color.a
	})}`;
}
function firstShadowLayerNodes(value) {
	const nodes = [];
	for (const node of valueParser(value).nodes) {
		if (node.type === "div" && node.value === ",") return nodes;
		nodes.push(node);
	}
	return nodes;
}
function shadowColorFromNodes(nodes) {
	for (const node of nodes) {
		if (node.type === "function") {
			const color = parseCSSColor(valueParser.stringify(node));
			if (color) return color;
			continue;
		}
		if (node.type !== "word") continue;
		const color = parseCSSColor(node.value);
		if (color) return color;
	}
	return null;
}
function shadowNumbersFromNodes(nodes) {
	return nodes.filter((node) => node.type === "word" && valueParser.unit(node.value) !== false).map((node) => parseCSSNumber(node.value)).filter((number) => number !== null);
}
function dropShadowFromCSS(value) {
	if (!value || value.trim() === "none") return [];
	const nodes = firstShadowLayerNodes(value);
	if (nodes.some((node) => node.type === "word" && node.value === "inset")) return [];
	const color = shadowColorFromNodes(nodes);
	if (!color) return [];
	const [offsetX = 0, offsetY = 0, radius = 0, spread = 0] = shadowNumbersFromNodes(nodes);
	return [{
		type: "DROP_SHADOW",
		color,
		offset: {
			x: offsetX,
			y: offsetY
		},
		radius,
		spread,
		visible: true,
		blendMode: "NORMAL"
	}];
}
function pickStyle(elementStyle, property) {
	return elementStyle?.[property];
}
function mergedStyle(node) {
	return {
		...node.inlineStyle,
		...node.computedStyle
	};
}
function sceneNodeSizeStyle(node) {
	const style = {};
	if (node.width > 0) style.width = `${node.width}px`;
	if (node.height > 0) style.height = `${node.height}px`;
	return style;
}
//#endregion
//#region src/to-scene-graph.ts
const DOM_CSS_PLUGIN_ID = "open-pencil-dom-css";
const IMAGE_SOURCE_URL_KEY = "image-source-url";
function textContent(node) {
	if (node.type === "text") return node.text;
	return node.children.map(textContent).join("");
}
function isTextLikeElement(node) {
	return [
		"span",
		"p",
		"label",
		"strong",
		"em",
		"button",
		"a",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6"
	].includes(node.tagName.toLowerCase());
}
function firstCSSNumber(style, ...properties) {
	for (const property of properties) {
		const parsed = parseCSSNumber(pickStyle(style, property));
		if (parsed !== null) return parsed;
	}
	return null;
}
function fillsFromStyle(style, property) {
	return colorToFillFromCSS(pickStyle(style, property));
}
function aspectRatioFromCSS(value) {
	if (!value || value === "auto") return null;
	const parts = value.split("/").map((part) => Number.parseFloat(part.trim())).filter(Number.isFinite);
	if (parts.length === 1 && parts[0] > 0) return parts[0];
	if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) return parts[0] / parts[1];
	return null;
}
function setNodeBox(node, style) {
	const width = firstCSSNumber(style, "width");
	const height = firstCSSNumber(style, "height");
	const minWidth = firstCSSNumber(style, "min-width");
	const maxWidth = firstCSSNumber(style, "max-width");
	const minHeight = firstCSSNumber(style, "min-height");
	const maxHeight = firstCSSNumber(style, "max-height");
	const aspectRatio = aspectRatioFromCSS(pickStyle(style, "aspect-ratio"));
	if (width !== null) node.width = width;
	if (height !== null) node.height = height;
	if (height === null && width !== null && aspectRatio !== null) node.height = width / aspectRatio;
	if (width === null && height !== null && aspectRatio !== null) node.width = height * aspectRatio;
	if (minWidth !== null) node.minWidth = minWidth;
	if (maxWidth !== null) node.maxWidth = maxWidth;
	if (minHeight !== null) node.minHeight = minHeight;
	if (maxHeight !== null) node.maxHeight = maxHeight;
}
function firstStrokeColor(style) {
	return pickStyle(style, "border-color") ?? pickStyle(style, "border-top-color") ?? pickStyle(style, "border-right-color") ?? pickStyle(style, "border-bottom-color") ?? pickStyle(style, "border-left-color");
}
function strokeWeightFromStyle(style) {
	const borderWidth = firstCSSNumber(style, "border-width");
	if (borderWidth !== null) return borderWidth;
	const sideWeights = [
		firstCSSNumber(style, "border-top-width"),
		firstCSSNumber(style, "border-right-width"),
		firstCSSNumber(style, "border-bottom-width"),
		firstCSSNumber(style, "border-left-width")
	].filter((weight) => weight !== null);
	if (sideWeights.length === 0) return null;
	return Math.max(...sideWeights);
}
function borderStyleFromCSS(style) {
	return pickStyle(style, "border-style") ?? pickStyle(style, "border-top-style") ?? pickStyle(style, "border-right-style") ?? pickStyle(style, "border-bottom-style") ?? pickStyle(style, "border-left-style");
}
function dashPatternFromCSS(style, strokeWeight) {
	const borderStyle = borderStyleFromCSS(style);
	if (borderStyle === "dashed") return [strokeWeight * 3, strokeWeight * 2];
	if (borderStyle === "dotted") return [strokeWeight, strokeWeight];
	return [];
}
function setBorderWeights(node, style, stroke) {
	const top = firstCSSNumber(style, "border-top-width") ?? stroke.weight;
	const right = firstCSSNumber(style, "border-right-width") ?? stroke.weight;
	const bottom = firstCSSNumber(style, "border-bottom-width") ?? stroke.weight;
	const left = firstCSSNumber(style, "border-left-width") ?? stroke.weight;
	node.borderTopWeight = top;
	node.borderRightWeight = right;
	node.borderBottomWeight = bottom;
	node.borderLeftWeight = left;
	node.independentStrokeWeights = [
		top,
		right,
		bottom,
		left
	].some((weight) => weight !== stroke.weight);
}
function applyCornerRadii(node, style) {
	const cornerRadius = firstCSSNumber(style, "border-radius");
	const topLeft = firstCSSNumber(style, "border-top-left-radius");
	const topRight = firstCSSNumber(style, "border-top-right-radius");
	const bottomRight = firstCSSNumber(style, "border-bottom-right-radius");
	const bottomLeft = firstCSSNumber(style, "border-bottom-left-radius");
	if (cornerRadius !== null) node.cornerRadius = cornerRadius;
	if (topLeft === null && topRight === null && bottomRight === null && bottomLeft === null) return;
	const fallback = cornerRadius ?? 0;
	node.topLeftRadius = topLeft ?? fallback;
	node.topRightRadius = topRight ?? fallback;
	node.bottomRightRadius = bottomRight ?? fallback;
	node.bottomLeftRadius = bottomLeft ?? fallback;
	node.independentCorners = [
		node.topLeftRadius,
		node.topRightRadius,
		node.bottomRightRadius,
		node.bottomLeftRadius
	].some((radius) => radius !== fallback);
}
function primaryAxisAlignFromCSS(value) {
	if (value === "center") return "CENTER";
	if (value === "end" || value === "flex-end") return "MAX";
	if (value === "space-between") return "SPACE_BETWEEN";
	return "MIN";
}
function counterAxisAlignFromCSS(value) {
	if (value === "center") return "CENTER";
	if (value === "end" || value === "flex-end") return "MAX";
	if (value === "stretch") return "STRETCH";
	if (value === "baseline") return "BASELINE";
	return "MIN";
}
function layoutAlignSelfFromCSS(value) {
	if (value === "center") return "CENTER";
	if (value === "end" || value === "flex-end") return "MAX";
	if (value === "stretch") return "STRETCH";
	if (value === "baseline") return "BASELINE";
	if (value === "start" || value === "flex-start") return "MIN";
	return "AUTO";
}
function textCaseFromCSS(value) {
	if (value === "uppercase") return "UPPER";
	if (value === "lowercase") return "LOWER";
	if (value === "capitalize") return "TITLE";
	return "ORIGINAL";
}
function applyFlexGap(node, style) {
	const gap = firstCSSNumber(style, "gap");
	const rowGap = firstCSSNumber(style, "row-gap");
	const columnGap = firstCSSNumber(style, "column-gap");
	const isHorizontal = node.layoutMode === "HORIZONTAL";
	const isWrapped = node.layoutWrap === "WRAP";
	node.itemSpacing = (isHorizontal ? columnGap : rowGap) ?? gap ?? 0;
	node.counterAxisSpacing = (isHorizontal ? rowGap : columnGap) ?? (isWrapped ? gap ?? 0 : 0);
}
function applyPositioning(node, style) {
	const position = pickStyle(style, "position");
	if (position === "absolute" || position === "fixed") node.layoutPositioning = "ABSOLUTE";
	const left = firstCSSNumber(style, "left");
	const top = firstCSSNumber(style, "top");
	if (left !== null) node.x = left;
	if (top !== null) node.y = top;
}
function applyPadding(node, style) {
	node.paddingTop = firstCSSNumber(style, "padding-top", "padding-block", "padding") ?? 0;
	node.paddingRight = firstCSSNumber(style, "padding-right", "padding-inline", "padding") ?? 0;
	node.paddingBottom = firstCSSNumber(style, "padding-bottom", "padding-block", "padding") ?? 0;
	node.paddingLeft = firstCSSNumber(style, "padding-left", "padding-inline", "padding") ?? 0;
}
function imageScaleModeFromObjectFit(value) {
	if (value === "contain" || value === "scale-down") return "FIT";
	if (value === "cover") return "FILL";
	return null;
}
function bytesFromDataURL(value) {
	if (!value?.startsWith("data:")) return null;
	const commaIndex = value.indexOf(",");
	if (commaIndex === -1) return null;
	const metadata = value.slice(0, commaIndex);
	const body = value.slice(commaIndex + 1);
	if (!metadata.endsWith(";base64")) return null;
	return decodeBase64(body);
}
function applyImageFill(graph, node, element, style) {
	if (element.tagName.toLowerCase() !== "img") return;
	const source = element.attrs.src;
	const bytes = bytesFromDataURL(source);
	if (!bytes) {
		if (source) node.pluginData.push({
			pluginId: DOM_CSS_PLUGIN_ID,
			key: IMAGE_SOURCE_URL_KEY,
			value: source
		});
		return;
	}
	const imageHash = computeImageHash(bytes);
	graph.images.set(imageHash, bytes);
	node.fills = [{
		type: "IMAGE",
		imageHash,
		imageScaleMode: imageScaleModeFromObjectFit(pickStyle(style, "object-fit")) ?? "FILL",
		color: TRANSPARENT,
		opacity: 1,
		visible: true
	}];
}
function applyElementStyle(graph, node, element, style) {
	setNodeBox(node, style);
	applyPositioning(node, style);
	applyPadding(node, style);
	const fills = fillsFromStyle(style, "background-color");
	if (fills.length > 0) node.fills = fills;
	applyImageFill(graph, node, element, style);
	const strokes = colorToStrokeFromCSS(firstStrokeColor(style), strokeWeightFromStyle(style)?.toString());
	if (strokes.length > 0) {
		const dashPattern = dashPatternFromCSS(style, strokes[0].weight);
		if (dashPattern.length > 0) {
			strokes[0].dashPattern = dashPattern;
			node.dashPattern = dashPattern;
		}
		node.strokes = strokes;
		setBorderWeights(node, style, strokes[0]);
	}
	const effects = dropShadowFromCSS(pickStyle(style, "box-shadow"));
	if (effects.length > 0) node.effects = effects;
	const opacity = parseCSSNumber(pickStyle(style, "opacity"));
	if (opacity !== null) node.opacity = opacity;
	applyCornerRadii(node, style);
	const overflow = pickStyle(style, "overflow");
	if (overflow === "hidden" || overflow === "clip") node.clipsContent = true;
	const alignSelf = layoutAlignSelfFromCSS(pickStyle(style, "align-self"));
	if (alignSelf !== "AUTO") node.layoutAlignSelf = alignSelf;
	const display = pickStyle(style, "display");
	if (display === "flex" || display === "inline-flex") {
		node.layoutMode = pickStyle(style, "flex-direction") === "column" ? "VERTICAL" : "HORIZONTAL";
		node.primaryAxisAlign = primaryAxisAlignFromCSS(pickStyle(style, "justify-content"));
		node.counterAxisAlign = counterAxisAlignFromCSS(pickStyle(style, "align-items"));
		node.layoutWrap = pickStyle(style, "flex-wrap") === "wrap" ? "WRAP" : "NO_WRAP";
		applyFlexGap(node, style);
	}
}
function applyTextStyle(node, style) {
	setNodeBox(node, style);
	applyPositioning(node, style);
	const fills = fillsFromStyle(style, "color");
	if (fills.length > 0) node.fills = fills;
	const fontSize = parseCSSNumber(pickStyle(style, "font-size"));
	if (fontSize !== null) node.fontSize = fontSize;
	const fontWeight = parseCSSNumber(pickStyle(style, "font-weight"));
	if (fontWeight !== null) node.fontWeight = fontWeight;
	const lineHeight = parseCSSNumber(pickStyle(style, "line-height"));
	if (lineHeight !== null) node.lineHeight = lineHeight;
	const letterSpacing = parseCSSNumber(pickStyle(style, "letter-spacing"));
	if (letterSpacing !== null) node.letterSpacing = letterSpacing;
	const opacity = parseCSSNumber(pickStyle(style, "opacity"));
	if (opacity !== null) node.opacity = opacity;
	const effects = dropShadowFromCSS(pickStyle(style, "text-shadow"));
	if (effects.length > 0) node.effects = effects;
	const fontFamily = pickStyle(style, "font-family");
	if (fontFamily) node.fontFamily = fontFamily.split(",")[0]?.replaceAll("\"", "").trim() || node.fontFamily;
	node.italic = pickStyle(style, "font-style") === "italic";
	const textAlign = pickStyle(style, "text-align")?.toUpperCase();
	if (textAlign === "CENTER" || textAlign === "RIGHT" || textAlign === "JUSTIFIED") node.textAlignHorizontal = textAlign;
	const textDecoration = pickStyle(style, "text-decoration-line");
	if (textDecoration === "underline") node.textDecoration = "UNDERLINE";
	if (textDecoration === "line-through") node.textDecoration = "STRIKETHROUGH";
	const textCase = textCaseFromCSS(pickStyle(style, "text-transform"));
	if (textCase !== "ORIGINAL") node.textCase = textCase;
	if (pickStyle(style, "white-space") === "nowrap") node.maxLines = 1;
}
function createTextNode(graph, parentId, text, style) {
	const node = graph.createNode("TEXT", parentId, {
		name: text.slice(0, 32) || "Text",
		text,
		width: Math.max(text.length * 8, 1),
		height: 20
	});
	applyTextStyle(node, style);
	return node;
}
function hasBoxStyle(style) {
	return [
		"aspect-ratio",
		"background-color",
		"border-color",
		"border-style",
		"border-width",
		"border-top-style",
		"border-top-width",
		"border-right-style",
		"border-right-width",
		"border-bottom-style",
		"border-bottom-width",
		"border-left-style",
		"border-left-width",
		"border-radius",
		"box-shadow",
		"display",
		"height",
		"padding",
		"padding-top",
		"padding-right",
		"padding-bottom",
		"padding-left",
		"padding-block",
		"padding-inline",
		"width",
		"min-width",
		"max-width",
		"min-height",
		"max-height",
		"object-fit",
		"overflow",
		"position",
		"top",
		"right",
		"bottom",
		"left",
		"flex-wrap",
		"align-self"
	].some((property) => pickStyle(style, property) !== void 0);
}
function createElementNode(graph, parentId, element) {
	const style = mergedStyle(element);
	if (isTextLikeElement(element) && !hasBoxStyle(style) && element.children.every((child) => child.type === "text")) return createTextNode(graph, parentId, textContent(element), style);
	const node = graph.createNode("FRAME", parentId, {
		name: element.attrs.id || element.attrs.class || element.tagName,
		clipsContent: false
	});
	applyElementStyle(graph, node, element, style);
	for (const child of element.children) createDesignNode(graph, node.id, child, style);
	return node;
}
function createDesignNode(graph, parentId, node, inheritedStyle = {}) {
	if (node.type === "text") {
		if (node.text.trim().length === 0) return null;
		return createTextNode(graph, parentId, node.text, inheritedStyle);
	}
	return createElementNode(graph, parentId, node);
}
function fitPageToChildren(page, graph) {
	const children = graph.getChildren(page.id);
	if (children.length === 0) return;
	page.width = Math.max(...children.map((child) => child.x + child.width));
	page.height = Math.max(...children.map((child) => child.y + child.height));
}
function designDocumentToSceneGraph(document, options = {}) {
	const graph = new SceneGraph();
	const page = graph.getPages().find((node) => node.type === "CANVAS") ?? graph.addPage("DesignDOM");
	page.name = options.pageName ?? "DesignDOM";
	for (const child of document.children) createDesignNode(graph, page.id, child);
	fitPageToChildren(page, graph);
	return graph;
}
//#endregion
//#region src/jsx/core.ts
const Fragment = Symbol.for("open-pencil.dom-css.fragment");
function cssPropertyName(name) {
	if (name.startsWith("--")) return name;
	return name.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
}
function styleObjectToDeclaration(style) {
	const entries = Object.entries(style).filter((entry) => entry[1] !== null && entry[1] !== void 0).map(([property, value]) => [cssPropertyName(property), String(value)]).filter(([, value]) => value.length > 0);
	if (entries.length === 0) return void 0;
	return Object.fromEntries(entries);
}
function styleStringToDeclaration(style) {
	const entries = style.split(";").map((declaration) => declaration.split(":")).filter((parts) => parts.length >= 2).map(([property, ...value]) => [property.trim().toLowerCase(), value.join(":").trim()]).filter(([property, value]) => property.length > 0 && value.length > 0);
	if (entries.length === 0) return void 0;
	return Object.fromEntries(entries);
}
function styleToDeclaration(style) {
	if (typeof style === "string") return styleStringToDeclaration(style);
	if (style) return styleObjectToDeclaration(style);
}
function attributeValue(value) {
	if (value === null || value === void 0 || value === false) return void 0;
	if (value === true) return "";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "bigint") return String(value);
}
function propsToAttrs(props) {
	const attrs = {};
	const classValue = props.class ?? props.className;
	if (classValue) attrs.class = classValue;
	for (const [name, value] of Object.entries(props)) {
		if (name === "children" || name === "class" || name === "className" || name === "style") continue;
		if (name === "key" || name.startsWith("on")) continue;
		const attr = attributeValue(value);
		if (attr !== void 0) attrs[name] = attr;
	}
	return attrs;
}
function normalizeChild(child, nodes) {
	if (child === null || child === void 0 || typeof child === "boolean") return;
	if (Array.isArray(child)) {
		for (const item of child) normalizeChild(item, nodes);
		return;
	}
	if (typeof child === "string" || typeof child === "number") {
		nodes.push({
			type: "text",
			text: String(child)
		});
		return;
	}
	nodes.push(child);
}
function normalizeJSXChildren(children) {
	const nodes = [];
	normalizeChild(children, nodes);
	return nodes;
}
function jsx(tag, props = {}) {
	if (tag === Fragment) return normalizeJSXChildren(props.children);
	if (typeof tag === "function") return normalizeJSXChildren(tag(props));
	return {
		type: "element",
		tagName: tag,
		attrs: propsToAttrs(props),
		inlineStyle: styleToDeclaration(props.style),
		children: normalizeJSXChildren(props.children)
	};
}
const jsxs = jsx;
function jsxToDesignDocumentCore(input) {
	return {
		type: "document",
		children: normalizeJSXChildren(input)
	};
}
//#endregion
//#region src/browser.ts
function createRuntime(options) {
	return createBrowserCSSRuntime({
		sandbox: "iframe",
		...options
	});
}
async function compileBrowserTailwindCSS(candidates, options) {
	const { compileTailwindCSS } = await import("./convert.js").then((n) => n.tailwind_exports);
	return compileTailwindCSS(candidates, options);
}
function resolveBrowserDocument(documentOverride) {
	if (documentOverride) return documentOverride;
	if (typeof document === "undefined") throw new TypeError("Browser DOM/CSS helpers require a DOM document");
	return document;
}
function extractEmbeddedCSSText(html, browserDocument) {
	const Parser = browserDocument.defaultView?.DOMParser;
	if (!Parser) throw new TypeError("Browser DOM/CSS helpers require DOMParser");
	const parsed = new Parser().parseFromString(html, "text/html");
	const styles = Array.from(parsed.querySelectorAll("style")).map((style) => style.textContent ? style.textContent.trim() : "").filter((css) => !!css);
	return styles.length > 0 ? styles.join("\n") : void 0;
}
async function browserHTMLToDesignDocument(html, options = {}) {
	const browserDocument = resolveBrowserDocument(options.document);
	const runtime = createRuntime({
		...options,
		document: browserDocument
	});
	const document = runtime.parseHTML(html);
	const cssText = mergeCSSText(extractEmbeddedCSSText(html, browserDocument), options.cssText);
	return runtime.computeStyles(document, cssText, options.compute);
}
async function browserHTMLToSceneGraph(html, options = {}) {
	return designDocumentToSceneGraph(await browserHTMLToDesignDocument(html, options), options);
}
async function browserTailwindHTMLToDesignDocument(html, candidates, options = {}) {
	const cssText = await compileBrowserTailwindCSS(candidates, options);
	return browserHTMLToDesignDocument(html, {
		...options,
		cssText
	});
}
async function browserTailwindHTMLToSceneGraph(html, candidates, options = {}) {
	return designDocumentToSceneGraph(await browserTailwindHTMLToDesignDocument(html, candidates, options), options);
}
async function browserJSXToDesignDocument(input, options = {}) {
	const document = jsxToDesignDocumentCore(input);
	return createRuntime(options).computeStyles(document, options.cssText, options.compute);
}
async function browserJSXToSceneGraph(input, options = {}) {
	return designDocumentToSceneGraph(await browserJSXToDesignDocument(input, options), options);
}
async function browserTailwindJSXToDesignDocument(input, candidates, options = {}) {
	const cssText = await compileBrowserTailwindCSS(candidates, options);
	return browserJSXToDesignDocument(input, {
		...options,
		cssText
	});
}
async function browserTailwindJSXToSceneGraph(input, candidates, options = {}) {
	return designDocumentToSceneGraph(await browserTailwindJSXToDesignDocument(input, candidates, options), options);
}
//#endregion
export { Fragment, browserHTMLToDesignDocument, browserHTMLToSceneGraph, browserJSXToDesignDocument, browserJSXToSceneGraph, browserTailwindHTMLToDesignDocument, browserTailwindHTMLToSceneGraph, browserTailwindJSXToDesignDocument, browserTailwindJSXToSceneGraph, createBrowserCSSRuntime, designDocumentToSceneGraph, dropShadowToCSS, fillToCSS, jsx, jsxToDesignDocumentCore, jsxs, mergeCSSText, mergeClassNames, sceneNodeSizeStyle, serializeHTML, serializeNode, splitWhitespace, strokeColorToCSS, strokeToCSS };

//# sourceMappingURL=browser.js.map
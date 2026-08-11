import { mergeClassNames, serializeHTML, splitWhitespace } from "./browser.js";
import { CSSFontFaceRule } from "@acemir/cssom";
import { parseFragment, serialize } from "parse5";
import { decodeBase64 } from "@open-pencil/core/bytes";
import { normalizeFontFamily } from "@open-pencil/core/text";
import { exportWebFontFaceAssets } from "@open-pencil/core/text/web-font/assets";
//#region src/html-export.ts
const RESET_CSS = "*,*::before,*::after{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#fff}";
function styleToCSS(style) {
	return Object.entries(style).filter(([, value]) => value !== "").map(([property, value]) => `${property}: ${value}`).join("; ");
}
function cloneNode(node) {
	if (node.type === "text") return { ...node };
	return {
		...node,
		attrs: { ...node.attrs },
		inlineStyle: node.inlineStyle ? { ...node.inlineStyle } : void 0,
		children: node.children.map(cloneNode)
	};
}
function standaloneStyleForNode(node, parent, origin) {
	const style = { ...node.inlineStyle };
	const source = node.sourceSceneNode;
	if (!source) return style;
	style.position = "absolute";
	style.left = `${source.x - (parent ? 0 : origin.minX)}px`;
	style.top = `${source.y - (parent ? 0 : origin.minY)}px`;
	return style;
}
function standaloneNode(node, origin, parent) {
	if (node.type === "text") return cloneNode(node);
	const standalone = {
		...node,
		attrs: { ...node.attrs },
		inlineStyle: standaloneStyleForNode(node, parent, origin),
		children: []
	};
	standalone.children = node.children.map((child) => standaloneNode(child, origin, node));
	return standalone;
}
function nodeBounds(node) {
	if (node.type === "text" || !node.sourceSceneNode) return void 0;
	return {
		minX: node.sourceSceneNode.x,
		minY: node.sourceSceneNode.y,
		width: node.sourceSceneNode.width,
		height: node.sourceSceneNode.height
	};
}
function standaloneSize(document) {
	const bounds = document.children.map(nodeBounds).filter((value) => value !== void 0);
	const minX = bounds.length > 0 ? Math.min(...bounds.map((bound) => bound.minX)) : 0;
	const minY = bounds.length > 0 ? Math.min(...bounds.map((bound) => bound.minY)) : 0;
	const maxX = bounds.length > 0 ? Math.max(...bounds.map((bound) => bound.minX + bound.width)) : 1;
	const maxY = bounds.length > 0 ? Math.max(...bounds.map((bound) => bound.minY + bound.height)) : 1;
	return {
		minX,
		minY,
		width: Math.max(1, maxX - minX),
		height: Math.max(1, maxY - minY)
	};
}
function standaloneDocument(document, size) {
	return {
		...document,
		children: document.children.map((node) => standaloneNode(node, size))
	};
}
function cssClassName(index) {
	return `op-${index.toString(36)}`;
}
function extractInlineStyles(node, rules, nextIndex) {
	if (node.type === "text") return node;
	const children = node.children.map((child) => extractInlineStyles(child, rules, nextIndex));
	if (!node.inlineStyle || Object.keys(node.inlineStyle).length === 0) return {
		...node,
		children
	};
	const className = cssClassName(nextIndex.value);
	nextIndex.value += 1;
	rules.push(`.${className}{${styleToCSS(node.inlineStyle)}}`);
	return {
		...node,
		attrs: {
			...node.attrs,
			class: mergeClassNames(node.attrs.class, className) ?? className
		},
		inlineStyle: void 0,
		children
	};
}
function isElement(node) {
	return "attrs" in node && "tagName" in node;
}
function walkParseTree(node, visit) {
	if (isElement(node)) visit(node);
	if ("childNodes" in node) for (const child of node.childNodes) walkParseTree(child, visit);
}
function classNamesFromHTML(html) {
	const fragment = parseFragment(html);
	const classes = /* @__PURE__ */ new Set();
	walkParseTree(fragment, (element) => {
		const classAttr = element.attrs.find((attr) => attr.name === "class");
		if (!classAttr) return;
		for (const className of splitWhitespace(classAttr.value)) classes.add(className);
	});
	return [...classes];
}
async function compileTailwindClasses(classNames) {
	if (classNames.length === 0) return "";
	const [{ compile }, { readFile }] = await Promise.all([import("tailwindcss"), import("node:fs/promises")]);
	const [themeCSS, utilitiesCSS] = await Promise.all([readFile(new URL(import.meta.resolve("tailwindcss/theme.css")), "utf8"), readFile(new URL(import.meta.resolve("tailwindcss/utilities.css")), "utf8")]);
	return (await compile(`${themeCSS}\n${utilitiesCSS}`)).build(classNames);
}
function stripFontFamilyQuotes(value) {
	if (value.length < 2) return value;
	const first = value[0];
	const last = value[value.length - 1];
	if (first === "\"" && last === "\"" || first === "'" && last === "'") return value.slice(1, -1);
	return value;
}
function firstFontFamily(value) {
	const commaIndex = value.indexOf(",");
	return stripFontFamilyQuotes((commaIndex !== -1 ? value.slice(0, commaIndex) : value).trim());
}
function collectFontRequests(node, fonts) {
	if (node.type === "text") return;
	const source = node.sourceSceneNode;
	if (source?.type === "TEXT") {
		const family = normalizeFontFamily(firstFontFamily(source.fontFamily));
		const style = source.italic ? "italic" : "normal";
		const key = `${family}|${source.fontWeight}|${style}`;
		fonts.set(key, {
			family,
			weight: source.fontWeight,
			style
		});
	}
	for (const child of node.children) collectFontRequests(child, fonts);
}
function serializeFontWeight(weight) {
	return Array.isArray(weight) ? weight.join(" ") : String(weight);
}
function fontSourceValue(asset) {
	const escapedPath = new URL(asset.path, "file:///").pathname.slice(1);
	return [
		"url(",
		JSON.stringify(escapedPath),
		") format(",
		JSON.stringify(asset.format),
		")"
	].join("");
}
function fontFaceCSS(asset) {
	const rule = new CSSFontFaceRule();
	rule.style.setProperty("font-family", JSON.stringify(asset.family));
	rule.style.setProperty("src", fontSourceValue(asset));
	rule.style.setProperty("font-weight", serializeFontWeight(asset.weight));
	rule.style.setProperty("font-style", asset.style);
	rule.style.setProperty("font-display", asset.display ?? "swap");
	if (asset.stretch) rule.style.setProperty("font-stretch", asset.stretch);
	if (asset.unicodeRange && asset.unicodeRange.length > 0) rule.style.setProperty("unicode-range", asset.unicodeRange.join(","));
	return rule.cssText;
}
async function fontFaceAssets(document, options) {
	if (options.fonts === "none" || options.assets !== "external") return {
		css: "",
		files: []
	};
	const requests = /* @__PURE__ */ new Map();
	for (const child of document.children) collectFontRequests(child, requests);
	const result = await exportWebFontFaceAssets({
		fonts: [...requests.values()],
		assetBasePath: `${options.assetBasePath}/fonts`
	});
	return {
		css: result.assets.map(fontFaceCSS).join(""),
		files: result.assets
	};
}
function dataImageParts(value) {
	if (!value.startsWith("data:image/")) return void 0;
	const markerIndex = value.indexOf(";base64,");
	if (markerIndex === -1) return void 0;
	return {
		mime: value.slice(5, markerIndex),
		base64: value.slice(markerIndex + 8)
	};
}
function extensionForMime(mime) {
	if (mime === "image/jpeg") return "jpg";
	if (mime === "image/webp") return "webp";
	if (mime === "image/gif") return "gif";
	if (mime === "image/svg+xml") return "svg";
	return "png";
}
function extractImageAssets(html, assetBasePath) {
	const fragment = parseFragment(html);
	const files = [];
	const sources = /* @__PURE__ */ new Map();
	walkParseTree(fragment, (element) => {
		const src = element.attrs.find((attr) => attr.name === "src");
		if (!src) return;
		const parts = dataImageParts(src.value);
		if (!parts) return;
		const cachedPath = sources.get(src.value);
		if (cachedPath) {
			src.value = cachedPath;
			return;
		}
		const path = `${assetBasePath}/images/image-${sources.size + 1}.${extensionForMime(parts.mime)}`;
		sources.set(src.value, path);
		files.push({
			path,
			content: decodeBase64(parts.base64)
		});
		src.value = path;
	});
	return {
		html: serialize(fragment),
		files
	};
}
function stylesheetLink(path) {
	return `<link rel="stylesheet" href="${path}">`;
}
function styleTag(css) {
	return css ? `<style>${css}</style>` : "";
}
async function exportStandaloneHTML(document, options) {
	const size = standaloneSize(document);
	const doc = standaloneDocument(document, size);
	const stageCSS = `.op-stage{position:relative;width:${size.width}px;height:${size.height}px;overflow:hidden;background:transparent}`;
	let body;
	let css = `${RESET_CSS}${stageCSS}`;
	if (options.style === "tailwind") {
		body = serializeHTML(doc, { style: "tailwind" });
		css += await compileTailwindClasses(classNamesFromHTML(body));
	} else {
		const rules = [];
		const index = { value: 0 };
		body = serializeHTML({
			...doc,
			children: doc.children.map((node) => extractInlineStyles(node, rules, index))
		});
		css += rules.join("");
	}
	if (options.assets === "external") {
		const [extracted, fonts] = await Promise.all([Promise.resolve(extractImageAssets(body, options.assetBasePath)), fontFaceAssets(document, options)]);
		body = extracted.html;
		const cssPath = `${options.assetBasePath}/openpencil.css`;
		return {
			entrypoint: "index.html",
			files: [
				{
					path: "index.html",
					content: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${stylesheetLink(cssPath)}</head><body><main data-open-pencil-html="standalone" class="op-stage">${body}</main></body></html>`
				},
				{
					path: cssPath,
					content: `${fonts.css}${css}`
				},
				...fonts.files,
				...extracted.files
			]
		};
	}
	return {
		entrypoint: "index.html",
		files: [{
			path: "index.html",
			content: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${styleTag(css)}</head><body><main data-open-pencil-html="standalone" class="op-stage">${body}</main></body></html>`
		}]
	};
}
async function exportHTMLBundle(document, options = {}) {
	const resolvedOptions = {
		html: options.html ?? "fragment",
		style: options.style ?? "inline",
		assets: options.assets ?? "inline",
		fonts: options.fonts ?? "none",
		assetBasePath: options.assetBasePath ?? "assets"
	};
	if (resolvedOptions.html === "standalone") return exportStandaloneHTML(document, resolvedOptions);
	return {
		entrypoint: "index.html",
		files: [{
			path: "index.html",
			content: serializeHTML(document, { style: resolvedOptions.style })
		}]
	};
}
//#endregion
export { exportHTMLBundle };

//# sourceMappingURL=html-export.js.map
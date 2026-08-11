import { createBrowserCSSRuntime, designDocumentToSceneGraph, mergeCSSText, serializeHTML } from "./browser.js";
import { parse } from "@acemir/cssom";
import { parse as parse$1, parseFragment } from "parse5";
import { compile } from "tailwindcss";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region src/headless-css.ts
const INHERITED_PROPERTIES = /* @__PURE__ */ new Set([
	"color",
	"font-family",
	"font-size",
	"font-weight",
	"line-height"
]);
function styleToRecord(style, customProperties = {}) {
	const result = {};
	for (const property of Array.from({ length: style.length }, (_, index) => style[index])) {
		const value = resolveCSSValue(style.getPropertyValue(property), customProperties);
		if (property && value) result[property] = value;
	}
	return expandStyleShorthands(result);
}
function isStyleRule(rule) {
	return typeof rule === "object" && rule !== null && "selectorText" in rule && "style" in rule && typeof rule.selectorText === "string";
}
function isGroupingRule(rule) {
	return typeof rule === "object" && rule !== null && "cssRules" in rule && Array.isArray(rule.cssRules);
}
function collectStyleRules(rules) {
	return rules.flatMap((rule) => {
		if (isStyleRule(rule)) return [rule];
		if (isGroupingRule(rule)) return collectStyleRules(rule.cssRules);
		return [];
	});
}
function parseRules(cssText) {
	let order = 0;
	const styleRules = collectStyleRules(parse(cssText).cssRules);
	const customProperties = collectCustomProperties(styleRules);
	return {
		rules: styleRules.flatMap((rule) => {
			const style = styleToRecord(rule.style, customProperties);
			return rule.selectorText.split(",").map((selector) => selector.trim()).filter((selector) => selector.length > 0).map((selector) => ({
				selector,
				specificity: selectorSpecificity(selector),
				order: order++,
				style
			}));
		}),
		customProperties
	};
}
function collectCustomProperties(rules) {
	const customProperties = {};
	for (const rule of rules) {
		if (!rule.selectorText.split(",").some((selector) => selector.trim() === ":root")) continue;
		Object.assign(customProperties, styleToRecord(rule.style));
	}
	return customProperties;
}
function resolveCSSValue(value, customProperties) {
	return resolveSimpleCalc(value.replaceAll(/var\((--[\w-]+)(?:,[^)]+)?\)/g, (_, name) => {
		return customProperties[name] ?? "";
	}));
}
function resolveSimpleCalc(value) {
	const calc = value.match(/^calc\(([-\d.]+)(rem|px)?\s*\*\s*([-\d.]+)\)$/);
	if (!calc?.[1] || !calc[3]) return value;
	const base = Number.parseFloat(calc[1]);
	const multiplier = Number.parseFloat(calc[3]);
	const unit = calc[2] ?? "px";
	if (!Number.isFinite(base) || !Number.isFinite(multiplier)) return value;
	return `${unit === "rem" ? base * multiplier * 16 : base * multiplier}px`;
}
function expandStyleShorthands(style) {
	const result = { ...style };
	expandBoxShorthand(result, "margin");
	expandBoxShorthand(result, "padding");
	expandBorderShorthand(result);
	expandBackgroundShorthand(result);
	return result;
}
function expandBoxShorthand(style, property) {
	const value = style[property];
	if (!value) return;
	const [top, right = top, bottom = top, left = right] = splitWhitespace(value);
	if (!top || !right || !bottom || !left) return;
	style[`${property}-top`] ??= top;
	style[`${property}-right`] ??= right;
	style[`${property}-bottom`] ??= bottom;
	style[`${property}-left`] ??= left;
}
function expandBorderShorthand(style) {
	const value = style.border;
	if (!value) return;
	const parts = splitWhitespace(value);
	const color = parts.find(isLikelyColor);
	const width = parts.find((part) => /^\d/.test(part));
	if (color) style["border-color"] ??= color;
	if (width) style["border-width"] ??= width;
}
function expandBackgroundShorthand(style) {
	const value = style.background;
	if (!value || style["background-color"]) return;
	const color = splitWhitespace(value).find(isLikelyColor);
	if (color) style["background-color"] = color;
}
function splitWhitespace(value) {
	return value.trim().split(/\s+/).filter((part) => part.length > 0);
}
function isLikelyColor(value) {
	return value.startsWith("#") || value.startsWith("rgb") || value.startsWith("hsl") || [
		"black",
		"white",
		"transparent",
		"red",
		"green",
		"blue"
	].includes(value.toLowerCase());
}
function classList(element) {
	const className = "class" in element.attrs ? element.attrs.class : "";
	return new Set(className.split(/\s+/).filter((name) => name.length > 0));
}
function elementId(element) {
	return "id" in element.attrs ? element.attrs.id : void 0;
}
function selectorSpecificity(selector) {
	const idCount = selector.match(/#[\w-]+/g)?.length ?? 0;
	const classCount = selector.match(/\.[\w-]+/g)?.length ?? 0;
	const tagCount = selector.split(/[\s>]+/).filter((part) => part && !part.startsWith(".") && !part.startsWith("#")).length;
	return idCount * 100 + classCount * 10 + tagCount;
}
function matchesSimpleSelector(element, selector) {
	if (selector.includes(":") || selector.includes("[")) return false;
	const idMatch = selector.match(/#([\w-]+)/);
	if (idMatch?.[1] && elementId(element) !== idMatch[1]) return false;
	const classes = selector.match(/\.[\w-]+/g) ?? [];
	const elementClasses = classList(element);
	if (!classes.every((name) => elementClasses.has(name.slice(1)))) return false;
	const tag = selector.replace(/#[\w-]+/g, "").replace(/\.[\w-]+/g, "");
	return tag.length === 0 || element.tagName.toLowerCase() === tag.toLowerCase();
}
function matchesSelector(element, selector, parent) {
	const childParts = selector.split(">").map((part) => part.trim());
	if (childParts.length > 1) return matchesChildSelector(element, childParts, parent);
	const descendantParts = selector.split(/\s+/).filter((part) => part.length > 0);
	if (descendantParts.length > 1) return matchesDescendantSelector(element, descendantParts, parent);
	return matchesSimpleSelector(element, selector);
}
function matchesSelectorParts(element, parts, parent, directParentOnly) {
	const current = parts.at(-1);
	if (!current || !matchesSimpleSelector(element, current)) return false;
	let ancestor = parent;
	for (const selector of parts.slice(0, -1).reverse()) {
		if (!directParentOnly) while (ancestor && !matchesSimpleSelector(ancestor.element, selector)) ancestor = ancestor.parent;
		if (!ancestor || !matchesSimpleSelector(ancestor.element, selector)) return false;
		ancestor = ancestor.parent;
	}
	return true;
}
function matchesChildSelector(element, parts, parent) {
	return matchesSelectorParts(element, parts, parent, true);
}
function matchesDescendantSelector(element, parts, parent) {
	return matchesSelectorParts(element, parts, parent, false);
}
function applyComputedStyles(node, rules, parent, inheritedStyle) {
	if (node.type === "text") return node;
	const computedStyle = pickInheritedStyle(inheritedStyle);
	const matchingRules = rules.filter((rule) => matchesSelector(node, rule.selector, parent)).sort((left, right) => left.specificity - right.specificity || left.order - right.order);
	for (const rule of matchingRules) Object.assign(computedStyle, rule.style);
	Object.assign(computedStyle, expandStyleShorthands(node.inlineStyle ?? {}));
	const context = {
		element: node,
		parent
	};
	return {
		...node,
		computedStyle: Object.keys(computedStyle).length > 0 ? computedStyle : void 0,
		children: node.children.map((child) => applyComputedStyles(child, rules, context, computedStyle))
	};
}
function pickInheritedStyle(style) {
	const inherited = {};
	for (const property of INHERITED_PROPERTIES) {
		const value = style[property];
		if (value) inherited[property] = value;
	}
	return inherited;
}
function computeHeadlessStyles(document, cssText = "") {
	const { rules } = parseRules([document.stylesheets?.map((sheet) => sheet.cssText).join("\n"), cssText].filter((text) => !!text).join("\n"));
	return {
		...document,
		children: document.children.map((child) => applyComputedStyles(child, rules, null, {}))
	};
}
//#endregion
//#region src/style-attribute.ts
function firstStyleRule(cssText) {
	const [rule] = parse(cssText).cssRules;
	if (!rule || typeof rule !== "object" || !("style" in rule)) return null;
	return rule;
}
function parseStyleAttribute(value) {
	if (!value) return void 0;
	const rule = firstStyleRule(`*{${value}}`);
	if (!rule) return void 0;
	const style = {};
	for (const property of Array.from(rule.style)) {
		const propertyValue = rule.style.getPropertyValue(property);
		if (propertyValue) style[property] = propertyValue;
	}
	return Object.keys(style).length > 0 ? style : void 0;
}
//#endregion
//#region src/runtime/headless.ts
function attrsToRecord(attrs) {
	const result = {};
	for (const attr of attrs) result[attr.name] = attr.value;
	return result;
}
function isTextNode(node) {
	return node.nodeName === "#text";
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
function childToDesignNode(node) {
	if (isTextNode(node)) return node.value.trim().length > 0 ? {
		type: "text",
		text: node.value
	} : null;
	if (!("tagName" in node)) return null;
	if (NON_RENDERED_TAGS.has(node.tagName.toLowerCase())) return null;
	const attrs = attrsToRecord(node.attrs);
	const element = {
		type: "element",
		tagName: node.tagName.toLowerCase(),
		attrs,
		children: node.childNodes.map(childToDesignNode).filter((child) => child !== null)
	};
	const inlineStyle = parseStyleAttribute(attrs.style);
	if (inlineStyle) element.inlineStyle = inlineStyle;
	return element;
}
function parseHTML(html) {
	return {
		type: "document",
		children: parseFragment(html).childNodes.map(childToDesignNode).filter((node) => node !== null)
	};
}
function createHeadlessCSSRuntime() {
	return {
		kind: "headless",
		parseHTML,
		serializeHTML(document) {
			return serializeHTML(document);
		},
		async computeStyles(document, cssText = "") {
			return computeHeadlessStyles(document, cssText);
		}
	};
}
//#endregion
//#region src/runtime/index.ts
var runtime_exports = /* @__PURE__ */ __exportAll({ createCSSRuntime: () => createCSSRuntime });
function createCSSRuntime() {
	return typeof document !== "undefined" ? createBrowserCSSRuntime() : createHeadlessCSSRuntime();
}
//#endregion
//#region src/tailwind.ts
var tailwind_exports = /* @__PURE__ */ __exportAll({ compileTailwindCSS: () => compileTailwindCSS });
const DEFAULT_TAILWIND_CSS = "@import \"tailwindcss\";";
async function compileTailwindCSS(classes, options = {}) {
	return (await compile(options.css ?? DEFAULT_TAILWIND_CSS, {
		base: options.base,
		loadStylesheet: async (id, base) => {
			return {
				path: id,
				base,
				content: options.loadStylesheet ? await options.loadStylesheet(id, base) : await loadTailwindStylesheet(id)
			};
		}
	})).build(normalizeClasses(classes));
}
function normalizeClasses(classes) {
	return (typeof classes === "string" ? [classes] : Array.from(classes)).flatMap((className) => className.split(/\s+/)).map((className) => className.trim()).filter((className) => className.length > 0);
}
async function loadTailwindStylesheet(id) {
	const stylesheet = id === "tailwindcss" ? "tailwindcss/index.css" : id;
	const url = new URL(import.meta.resolve(stylesheet));
	const { readFile } = await import(
		/* @vite-ignore */
		"node:fs/promises"
);
	return readFile(url, "utf8");
}
//#endregion
//#region src/convert.ts
function runtimeForOptions(runtime) {
	return runtime ?? createCSSRuntime();
}
function getChildNodes(node) {
	return "childNodes" in node ? node.childNodes : [];
}
function textContent(node) {
	if (node.nodeName === "#text" && "value" in node) return node.value;
	return getChildNodes(node).map(textContent).join("");
}
function collectStyleText(node, styles) {
	if ("tagName" in node && node.tagName.toLowerCase() === "style") {
		const css = textContent(node).trim();
		if (css) styles.push(css);
		return;
	}
	for (const child of getChildNodes(node)) collectStyleText(child, styles);
}
function extractEmbeddedCSSText(html) {
	const styles = [];
	collectStyleText(parse$1(html), styles);
	return styles.length > 0 ? styles.join("\n") : void 0;
}
async function htmlToDesignDocument(html, options = {}) {
	const runtime = runtimeForOptions(options.runtime);
	const document = runtime.parseHTML(html);
	const cssText = mergeCSSText(extractEmbeddedCSSText(html), options.cssText);
	return runtime.computeStyles(document, cssText, options.compute);
}
async function htmlToSceneGraph(html, options = {}) {
	return designDocumentToSceneGraph(await htmlToDesignDocument(html, options), options);
}
async function tailwindHTMLToDesignDocument(html, candidates, options = {}) {
	const cssText = await compileTailwindCSS(candidates, options);
	return htmlToDesignDocument(html, {
		...options,
		cssText
	});
}
async function tailwindHTMLToSceneGraph(html, candidates, options = {}) {
	return designDocumentToSceneGraph(await tailwindHTMLToDesignDocument(html, candidates, options), options);
}
//#endregion
export { compileTailwindCSS, createCSSRuntime, createHeadlessCSSRuntime, htmlToDesignDocument, htmlToSceneGraph, runtime_exports, tailwindHTMLToDesignDocument, tailwindHTMLToSceneGraph, tailwind_exports };

//# sourceMappingURL=convert.js.map
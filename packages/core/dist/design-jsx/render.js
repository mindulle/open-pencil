import { isTreeNode, resolveToTree } from "./tree.js";
import { renderTree } from "./renderer.js";
import { backgroundBlur, dropShadow, foregroundBlur, innerShadow, layerBlur } from "./effects.js";
import { angularGradient, diamondGradient, gradient, linearGradient, radialGradient, solid } from "./paints.js";
import { createElement, mini_react_exports } from "./mini-react.js";
import { transform } from "sucrase";
//#region src/design-jsx/render.ts
/**
* Build a component function from a JSX string using sucrase.
* Works in both Node/Bun and the browser (no native bindings).
*/
const SUPPORTED_PROPS = /* @__PURE__ */ new Set([
	"name",
	"key",
	"flex",
	"flow",
	"dir",
	"gap",
	"wrap",
	"rowGap",
	"columnGap",
	"justify",
	"justifyContent",
	"items",
	"align",
	"alignItems",
	"grow",
	"w",
	"h",
	"width",
	"height",
	"minW",
	"maxW",
	"minH",
	"maxH",
	"x",
	"y",
	"top",
	"left",
	"position",
	"p",
	"padding",
	"px",
	"py",
	"pt",
	"pr",
	"pb",
	"pl",
	"bg",
	"fill",
	"fills",
	"background",
	"backgroundColor",
	"stroke",
	"border",
	"borderColor",
	"strokeWidth",
	"borderWidth",
	"strokeAlign",
	"strokeDash",
	"rounded",
	"borderRadius",
	"roundedTL",
	"roundedTR",
	"roundedBL",
	"roundedBR",
	"cornerRadius",
	"cornerSmoothing",
	"opacity",
	"blendMode",
	"rotate",
	"rotation",
	"overflow",
	"shadow",
	"blur",
	"effects",
	"size",
	"fontSize",
	"font",
	"fontFamily",
	"weight",
	"fontWeight",
	"color",
	"text",
	"characters",
	"content",
	"value",
	"title",
	"textAlign",
	"textAlignHorizontal",
	"textHorizontalAlignment",
	"textAlignVertical",
	"textVerticalAlignment",
	"textAutoResize",
	"lineHeight",
	"letterSpacing",
	"textDecoration",
	"textCase",
	"maxLines",
	"truncate",
	"grid",
	"columns",
	"rows",
	"colStart",
	"rowStart",
	"col",
	"row",
	"colSpan",
	"rowSpan",
	"points",
	"pointCount",
	"innerRadius",
	"label",
	"style",
	"bind",
	"component",
	"componentId",
	"of"
]);
function stripHTMLComments(jsxString) {
	return jsxString.replace(/<!--[\s\S]*?-->/g, "");
}
function unsupportedPropWarnings(tree) {
	const warnings = [];
	collectUnsupportedPropWarnings(tree, warnings);
	return warnings;
}
const SVG_ROOT_PROPS = /* @__PURE__ */ new Set([
	...SUPPORTED_PROPS,
	"viewBox",
	"body"
]);
function collectUnsupportedPropWarnings(tree, warnings) {
	const supportedProps = tree.type === "svg" ? SVG_ROOT_PROPS : SUPPORTED_PROPS;
	for (const key of Object.keys(tree.props)) if (!supportedProps.has(key)) warnings.push(`Unsupported prop "${key}" on <${tree.type}> is ignored.`);
	if (tree.type === "svg") return;
	for (const child of tree.children) if (isTreeNode(child)) collectUnsupportedPropWarnings(child, warnings);
}
function buildComponent(jsxString) {
	const trimmed = stripHTMLComments(jsxString).trim();
	const aliases = `
    const __h = React.createElement
    const __frag = ''
    const Frame = 'frame', Text = 'text', Rectangle = 'rectangle', Ellipse = 'ellipse'
    const Line = 'line', Star = 'star', Polygon = 'polygon', Vector = 'vector'
    const Group = 'group', Section = 'section', View = 'frame', Rect = 'rectangle'
    const Component = 'component', ComponentSet = 'component-set', Instance = 'instance'
    const Icon = 'icon'
    const svg = 'svg'
    const dropShadow = __helpers.dropShadow
    const innerShadow = __helpers.innerShadow
    const layerBlur = __helpers.layerBlur
    const backgroundBlur = __helpers.backgroundBlur
    const foregroundBlur = __helpers.foregroundBlur
    const solid = __helpers.solid
    const gradient = __helpers.gradient
    const linearGradient = __helpers.linearGradient
    const radialGradient = __helpers.radialGradient
    const angularGradient = __helpers.angularGradient
    const diamondGradient = __helpers.diamondGradient
    const __varSymbol = Symbol.for('open-pencil.variable')
    const designVar = (def, value) => typeof def === 'string'
      ? ({ [__varSymbol]: true, id: def, name: def, value })
      : ({ [__varSymbol]: true, id: def.id, name: def.name ?? def.id ?? '', value: def.value })
    const defineVars = (vars) => Object.fromEntries(
      Object.entries(vars).map(([key, def]) => [key, designVar(def)])
    )
  `;
	const opts = {
		transforms: ["typescript", "jsx"],
		jsxPragma: "__h",
		jsxFragmentPragma: "__frag",
		production: true
	};
	let code;
	try {
		code = transform(`${aliases}\nreturn function __render() { return ${trimmed} }`, opts).code;
	} catch {
		code = transform(`${aliases}\nreturn function __render() { return <>${trimmed}</> }`, opts).code;
	}
	return new Function("React", "__helpers", code)(mini_react_exports, {
		backgroundBlur,
		dropShadow,
		foregroundBlur,
		innerShadow,
		layerBlur,
		angularGradient,
		diamondGradient,
		gradient,
		linearGradient,
		radialGradient,
		solid
	});
}
/**
* Render a JSX string into the scene graph.
* Works in both Node/Bun and the browser.
*/
async function renderJSX(graph, jsxString, options) {
	const tree = resolveToTree(createElement(buildComponent(jsxString), null));
	if (!tree) throw new Error("JSX must return a Figma element (Frame, Text, etc)");
	const warnings = unsupportedPropWarnings(tree);
	if (tree.type === "" && tree.children.length > 0) {
		const results = [];
		for (const child of tree.children) {
			if (typeof child === "string") continue;
			results.push(await renderTree(graph, child, options));
		}
		if (results.length === 0) throw new Error("JSX must return a Figma element (Frame, Text, etc)");
		if (warnings.length > 0) results[0].warnings = warnings;
		return results;
	}
	const result = await renderTree(graph, tree, options);
	if (warnings.length > 0) result.warnings = warnings;
	return [result];
}
//#endregion
export { buildComponent, renderJSX, renderTree as renderTreeNode };

//# sourceMappingURL=render.js.map
import { __exportAll } from "../_virtual/_rolldown/runtime.js";
//#region src/design-jsx/mini-react.ts
var mini_react_exports = /* @__PURE__ */ __exportAll({
	createElement: () => createElement,
	default: () => mini_react_default
});
function createElement(type, props, ...children) {
	const flatChildren = children.flat();
	return {
		type,
		props: {
			...props,
			children: flatChildren.length > 0 ? flatChildren : void 0
		}
	};
}
var mini_react_default = { createElement };
//#endregion
export { createElement, mini_react_default as default, mini_react_exports };

//# sourceMappingURL=mini-react.js.map
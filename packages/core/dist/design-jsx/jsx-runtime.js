import { node } from "./tree.js";
//#region src/design-jsx/jsx-runtime.ts
function jsx(type, props) {
	if (typeof type === "function") return type(props);
	return node(type, props);
}
const jsxs = jsx;
const jsxDEV = jsx;
function Fragment({ children }) {
	return node("fragment", { children });
}
//#endregion
export { Fragment, jsx, jsxDEV, jsxs };

//# sourceMappingURL=jsx-runtime.js.map
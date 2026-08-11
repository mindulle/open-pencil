import { DesignNode, Fragment, JSX, JSXChild, JSXElementProps, JSXStyleInput, JSXStyleObject, JSXStyleValue, JSXTag, jsx, jsxs } from "./to-scene-graph.js";
import { JSXToDesignDocumentOptions, JSXToSceneGraphOptions, TailwindJSXToDesignDocumentOptions, TailwindJSXToSceneGraphOptions, jsxToDesignDocument, jsxToSceneGraph, tailwindJSXToDesignDocument, tailwindJSXToSceneGraph } from "./jsx-runtime.js";

//#region src/jsx/dev-runtime.d.ts
declare function jsxDEV(tag: JSXTag, props?: JSXElementProps): DesignNode | DesignNode[];
//#endregion
export { Fragment, type JSX, type JSXChild, type JSXElementProps, type JSXStyleInput, type JSXStyleObject, type JSXStyleValue, type JSXTag, type JSXToDesignDocumentOptions, type JSXToSceneGraphOptions, type TailwindJSXToDesignDocumentOptions, type TailwindJSXToSceneGraphOptions, type jsx, jsxDEV, type jsxToDesignDocument, type jsxToSceneGraph, type jsxs, type tailwindJSXToDesignDocument, type tailwindJSXToSceneGraph };
//# sourceMappingURL=jsx-dev-runtime.d.ts.map
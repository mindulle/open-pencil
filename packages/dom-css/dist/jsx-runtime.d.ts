import { CSSComputeOptions, CSSRuntime, CompileTailwindCSSOptions, DesignDocument, DesignDocumentToSceneGraphOptions, Fragment, JSX, JSXChild, JSXElementProps, JSXStyleInput, JSXStyleObject, JSXStyleValue, JSXTag, jsx, jsxs } from "./to-scene-graph.js";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/jsx/runtime.d.ts
interface JSXToDesignDocumentOptions {
  cssText?: string;
  runtime?: CSSRuntime;
  compute?: CSSComputeOptions;
}
interface JSXToSceneGraphOptions extends JSXToDesignDocumentOptions, DesignDocumentToSceneGraphOptions {}
interface TailwindJSXToDesignDocumentOptions extends Omit<JSXToDesignDocumentOptions, 'cssText'>, CompileTailwindCSSOptions {}
interface TailwindJSXToSceneGraphOptions extends TailwindJSXToDesignDocumentOptions, DesignDocumentToSceneGraphOptions {}
declare function jsxToDesignDocument(input: JSXChild, options?: JSXToDesignDocumentOptions): Promise<DesignDocument>;
declare function jsxToSceneGraph(input: JSXChild, options?: JSXToSceneGraphOptions): Promise<SceneGraph>;
declare function tailwindJSXToDesignDocument(input: JSXChild, candidates: string | Iterable<string>, options?: TailwindJSXToDesignDocumentOptions): Promise<DesignDocument>;
declare function tailwindJSXToSceneGraph(input: JSXChild, candidates: string | Iterable<string>, options?: TailwindJSXToSceneGraphOptions): Promise<SceneGraph>;
//#endregion
export { Fragment, type JSX, type JSXChild, type JSXElementProps, type JSXStyleInput, type JSXStyleObject, type JSXStyleValue, type JSXTag, JSXToDesignDocumentOptions, JSXToSceneGraphOptions, TailwindJSXToDesignDocumentOptions, TailwindJSXToSceneGraphOptions, jsx, jsxToDesignDocument, jsxToSceneGraph, jsxs, tailwindJSXToDesignDocument, tailwindJSXToSceneGraph };
//# sourceMappingURL=jsx-runtime.d.ts.map
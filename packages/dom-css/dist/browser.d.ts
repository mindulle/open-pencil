import { CSSComputeOptions, CSSRuntime, CompileTailwindCSSOptions, DesignDocument, DesignDocumentToSceneGraphOptions, JSXChild } from "./to-scene-graph.js";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/runtime/browser.d.ts
interface BrowserCSSRuntimeOptions {
  document?: Document;
  sandbox?: 'shadow-root' | 'iframe';
}
declare function createBrowserCSSRuntime(options?: BrowserCSSRuntimeOptions): CSSRuntime;
//#endregion
//#region src/browser.d.ts
interface BrowserToDesignDocumentOptions extends BrowserCSSRuntimeOptions {
  cssText?: string;
  compute?: CSSComputeOptions;
}
type BrowserHTMLToDesignDocumentOptions = BrowserToDesignDocumentOptions;
interface BrowserHTMLToSceneGraphOptions extends BrowserToDesignDocumentOptions, DesignDocumentToSceneGraphOptions {}
interface BrowserTailwindHTMLToDesignDocumentOptions extends Omit<BrowserHTMLToDesignDocumentOptions, 'cssText'>, CompileTailwindCSSOptions {}
interface BrowserTailwindHTMLToSceneGraphOptions extends BrowserTailwindHTMLToDesignDocumentOptions, DesignDocumentToSceneGraphOptions {}
interface BrowserToSceneGraphOptions extends BrowserToDesignDocumentOptions, DesignDocumentToSceneGraphOptions {}
interface BrowserTailwindToDesignDocumentOptions extends Omit<BrowserToDesignDocumentOptions, 'cssText'>, CompileTailwindCSSOptions {}
interface BrowserTailwindToSceneGraphOptions extends BrowserTailwindToDesignDocumentOptions, DesignDocumentToSceneGraphOptions {}
declare function browserHTMLToDesignDocument(html: string, options?: BrowserHTMLToDesignDocumentOptions): Promise<DesignDocument>;
declare function browserHTMLToSceneGraph(html: string, options?: BrowserHTMLToSceneGraphOptions): Promise<SceneGraph>;
declare function browserTailwindHTMLToDesignDocument(html: string, candidates: string | Iterable<string>, options?: BrowserTailwindHTMLToDesignDocumentOptions): Promise<DesignDocument>;
declare function browserTailwindHTMLToSceneGraph(html: string, candidates: string | Iterable<string>, options?: BrowserTailwindHTMLToSceneGraphOptions): Promise<SceneGraph>;
declare function browserJSXToDesignDocument(input: JSXChild, options?: BrowserToDesignDocumentOptions): Promise<DesignDocument>;
declare function browserJSXToSceneGraph(input: JSXChild, options?: BrowserToSceneGraphOptions): Promise<SceneGraph>;
declare function browserTailwindJSXToDesignDocument(input: JSXChild, candidates: string | Iterable<string>, options?: BrowserTailwindToDesignDocumentOptions): Promise<DesignDocument>;
declare function browserTailwindJSXToSceneGraph(input: JSXChild, candidates: string | Iterable<string>, options?: BrowserTailwindToSceneGraphOptions): Promise<SceneGraph>;
//#endregion
export { BrowserCSSRuntimeOptions, BrowserHTMLToDesignDocumentOptions, BrowserHTMLToSceneGraphOptions, BrowserTailwindHTMLToDesignDocumentOptions, BrowserTailwindHTMLToSceneGraphOptions, BrowserTailwindToDesignDocumentOptions, BrowserTailwindToSceneGraphOptions, BrowserToDesignDocumentOptions, BrowserToSceneGraphOptions, browserHTMLToDesignDocument, browserHTMLToSceneGraph, browserJSXToDesignDocument, browserJSXToSceneGraph, browserTailwindHTMLToDesignDocument, browserTailwindHTMLToSceneGraph, browserTailwindJSXToDesignDocument, browserTailwindJSXToSceneGraph, createBrowserCSSRuntime };
//# sourceMappingURL=browser.d.ts.map
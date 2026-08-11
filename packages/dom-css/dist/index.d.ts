import { CSSComputeOptions as CSSComputeOptions$1, CSSRuntime as CSSRuntime$1, CompileTailwindCSSOptions, DesignDocument as DesignDocument$1, DesignDocumentToSceneGraphOptions, DesignElement as DesignElement$1, DesignNode as DesignNode$1, DesignStyleDeclaration as DesignStyleDeclaration$1, DesignStyleSheet as DesignStyleSheet$1, DesignText as DesignText$1, Fragment, JSXChild, JSXElementProps, JSXStyleInput, JSXStyleObject, JSXStyleValue, JSXTag, compileTailwindCSS, designDocumentToSceneGraph, jsx, jsxs } from "./to-scene-graph.js";
import { BrowserCSSRuntimeOptions, BrowserHTMLToDesignDocumentOptions, BrowserHTMLToSceneGraphOptions, BrowserTailwindHTMLToDesignDocumentOptions, BrowserTailwindHTMLToSceneGraphOptions, BrowserTailwindToDesignDocumentOptions, BrowserTailwindToSceneGraphOptions, BrowserToDesignDocumentOptions, BrowserToSceneGraphOptions, browserHTMLToDesignDocument, browserHTMLToSceneGraph, browserJSXToDesignDocument, browserJSXToSceneGraph, browserTailwindHTMLToDesignDocument, browserTailwindHTMLToSceneGraph, browserTailwindJSXToDesignDocument, browserTailwindJSXToSceneGraph, createBrowserCSSRuntime } from "./browser.js";
import { JSXToDesignDocumentOptions, JSXToSceneGraphOptions, TailwindJSXToDesignDocumentOptions, TailwindJSXToSceneGraphOptions, jsxToDesignDocument, jsxToSceneGraph, tailwindJSXToDesignDocument, tailwindJSXToSceneGraph } from "./jsx-runtime.js";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/html-export.d.ts
interface ExportHTMLBundleOptions {
  html?: 'fragment' | 'standalone';
  style?: 'inline' | 'tailwind';
  assets?: 'inline' | 'external';
  fonts?: 'assets' | 'none';
  assetBasePath?: string;
}
interface ExportHTMLFile {
  path: string;
  content: string | Uint8Array;
}
interface ExportHTMLBundle {
  entrypoint: string;
  files: ExportHTMLFile[];
}
declare function exportHTMLBundle(document: DesignDocument$1, options?: ExportHTMLBundleOptions): Promise<ExportHTMLBundle>;
//#endregion
//#region src/serialize.d.ts
interface SerializeHTMLOptions {
  style?: 'inline' | 'tailwind';
}
declare function serializeNode(node: DesignNode$1, options?: SerializeHTMLOptions): string;
declare function serializeHTML(document: DesignDocument$1, options?: SerializeHTMLOptions): string;
//#endregion
//#region src/runtime/headless.d.ts
declare function createHeadlessCSSRuntime(): CSSRuntime$1;
//#endregion
//#region src/runtime/index.d.ts
declare function createCSSRuntime(): CSSRuntime$1;
//#endregion
//#region src/convert.d.ts
interface HTMLToDesignDocumentOptions {
  cssText?: string;
  runtime?: CSSRuntime$1;
  compute?: CSSComputeOptions$1;
}
interface HTMLToSceneGraphOptions extends HTMLToDesignDocumentOptions, DesignDocumentToSceneGraphOptions {}
interface TailwindHTMLToDesignDocumentOptions extends Omit<HTMLToDesignDocumentOptions, 'cssText'>, CompileTailwindCSSOptions {}
interface TailwindHTMLToSceneGraphOptions extends TailwindHTMLToDesignDocumentOptions, DesignDocumentToSceneGraphOptions {}
declare function htmlToDesignDocument(html: string, options?: HTMLToDesignDocumentOptions): Promise<DesignDocument$1>;
declare function htmlToSceneGraph(html: string, options?: HTMLToSceneGraphOptions): Promise<SceneGraph>;
declare function tailwindHTMLToDesignDocument(html: string, candidates: string | Iterable<string>, options?: TailwindHTMLToDesignDocumentOptions): Promise<DesignDocument$1>;
declare function tailwindHTMLToSceneGraph(html: string, candidates: string | Iterable<string>, options?: TailwindHTMLToSceneGraphOptions): Promise<SceneGraph>;
//#endregion
//#region src/from-scene-graph.d.ts
interface SceneGraphToDesignOptions {
  rootId?: string;
  includeSourceIds?: boolean;
}
declare function sceneGraphToDesignDocument(graph: SceneGraph, options?: SceneGraphToDesignOptions): DesignDocument$1;
//#endregion
//#region src/index.d.ts
type CSSComputeOptions = CSSComputeOptions$1;
type CSSRuntime = CSSRuntime$1;
type DesignDocument = DesignDocument$1;
type DesignElement = DesignElement$1;
type DesignNode = DesignNode$1;
type DesignStyleDeclaration = DesignStyleDeclaration$1;
type DesignStyleSheet = DesignStyleSheet$1;
type DesignText = DesignText$1;
//#endregion
export { type BrowserCSSRuntimeOptions, type BrowserHTMLToDesignDocumentOptions, type BrowserHTMLToSceneGraphOptions, type BrowserTailwindHTMLToDesignDocumentOptions, type BrowserTailwindHTMLToSceneGraphOptions, type BrowserTailwindToDesignDocumentOptions, type BrowserTailwindToSceneGraphOptions, type BrowserToDesignDocumentOptions, type BrowserToSceneGraphOptions, CSSComputeOptions, CSSRuntime, type CompileTailwindCSSOptions, DesignDocument, DesignElement, DesignNode, DesignStyleDeclaration, DesignStyleSheet, DesignText, type ExportHTMLBundle, type ExportHTMLBundleOptions, type ExportHTMLFile, Fragment, type HTMLToDesignDocumentOptions, type HTMLToSceneGraphOptions, type JSXChild, type JSXElementProps, type JSXStyleInput, type JSXStyleObject, type JSXStyleValue, type JSXTag, type JSXToDesignDocumentOptions, type JSXToSceneGraphOptions, type SerializeHTMLOptions, type TailwindHTMLToDesignDocumentOptions, type TailwindHTMLToSceneGraphOptions, type TailwindJSXToDesignDocumentOptions, type TailwindJSXToSceneGraphOptions, type SceneGraphToDesignOptions as ToDesignDocumentOptions, type DesignDocumentToSceneGraphOptions as ToSceneGraphOptions, browserHTMLToDesignDocument, browserHTMLToSceneGraph, browserJSXToDesignDocument, browserJSXToSceneGraph, browserTailwindHTMLToDesignDocument, browserTailwindHTMLToSceneGraph, browserTailwindJSXToDesignDocument, browserTailwindJSXToSceneGraph, compileTailwindCSS, createBrowserCSSRuntime, createCSSRuntime, createHeadlessCSSRuntime, designDocumentToSceneGraph, exportHTMLBundle, htmlToDesignDocument, htmlToSceneGraph, jsx, jsxToDesignDocument, jsxToSceneGraph, jsxs, sceneGraphToDesignDocument, serializeHTML, serializeNode, tailwindHTMLToDesignDocument, tailwindHTMLToSceneGraph, tailwindJSXToDesignDocument, tailwindJSXToSceneGraph };
//# sourceMappingURL=index.d.ts.map
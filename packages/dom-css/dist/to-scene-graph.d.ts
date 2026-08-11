import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/types.d.ts
type DesignNode = DesignElement | DesignText;
interface DesignDocument {
  type: 'document';
  children: DesignNode[];
  stylesheets?: DesignStyleSheet[];
  sourceGraph?: SceneGraph;
}
interface DesignElement {
  type: 'element';
  tagName: string;
  attrs: Record<string, string>;
  children: DesignNode[];
  inlineStyle?: DesignStyleDeclaration;
  computedStyle?: DesignStyleDeclaration;
  sourceSceneNodeId?: string;
  sourceSceneNode?: SceneNode;
}
interface DesignText {
  type: 'text';
  text: string;
}
interface DesignStyleSheet {
  type: 'stylesheet';
  cssText: string;
  href?: string;
}
type DesignStyleDeclaration = Record<string, string>;
interface CSSComputeOptions {
  includeBrowserDefaults?: boolean;
}
interface CSSRuntime {
  readonly kind: 'browser' | 'headless';
  parseHTML(html: string): DesignDocument;
  serializeHTML(document: DesignDocument): string;
  computeStyles(document: DesignDocument, cssText?: string, options?: CSSComputeOptions): Promise<DesignDocument>;
}
//#endregion
//#region src/jsx/core.d.ts
declare const Fragment: unique symbol;
type JSXComponent = (props: JSXElementProps) => JSXChild;
type JSXTag = string | JSXComponent | typeof Fragment;
type JSXStyleValue = string | number | null | undefined;
type JSXStyleObject = Record<string, JSXStyleValue>;
type JSXStyleInput = string | JSXStyleObject;
type JSXChild = DesignNode | JSXChild[] | string | number | boolean | null | undefined;
interface JSXElementProps {
  children?: JSXChild;
  class?: string;
  className?: string;
  style?: JSXStyleInput;
  key?: string | number;
  [name: string]: unknown;
}
declare function jsx(tag: JSXTag, props?: JSXElementProps): DesignNode | DesignNode[];
declare const jsxs: typeof jsx;
declare namespace JSX {
  type Element = DesignNode | DesignNode[];
  interface ElementChildrenAttribute {
    children: unknown;
  }
  interface IntrinsicElements {
    [tagName: string]: JSXElementProps;
  }
}
//#endregion
//#region src/tailwind.d.ts
interface CompileTailwindCSSOptions {
  css?: string;
  base?: string;
  loadStylesheet?: (id: string, base: string) => Promise<string>;
}
declare function compileTailwindCSS(classes: string | Iterable<string>, options?: CompileTailwindCSSOptions): Promise<string>;
//#endregion
//#region src/to-scene-graph.d.ts
interface DesignDocumentToSceneGraphOptions {
  pageName?: string;
}
declare function designDocumentToSceneGraph(document: DesignDocument, options?: DesignDocumentToSceneGraphOptions): SceneGraph;
//#endregion
export { CSSComputeOptions, CSSRuntime, CompileTailwindCSSOptions, DesignDocument, DesignDocumentToSceneGraphOptions, DesignElement, DesignNode, DesignStyleDeclaration, DesignStyleSheet, DesignText, Fragment, JSX, JSXChild, JSXElementProps, JSXStyleInput, JSXStyleObject, JSXStyleValue, JSXTag, compileTailwindCSS, designDocumentToSceneGraph, jsx, jsxs };
//# sourceMappingURL=to-scene-graph.d.ts.map
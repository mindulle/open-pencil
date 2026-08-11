import { BaseProps, TextProps, TreeNode } from "./tree.js";

//#region src/design-jsx/jsx-runtime.d.ts
declare function jsx(type: string | ((props: BaseProps) => TreeNode), props: BaseProps): TreeNode;
declare const jsxs: typeof jsx;
declare const jsxDEV: typeof jsx;
declare function Fragment({
  children
}: {
  children?: unknown;
}): TreeNode;
declare namespace JSX {
  type Element = TreeNode;
  interface IntrinsicElements {
    frame: BaseProps;
    text: TextProps;
    rectangle: BaseProps;
    ellipse: BaseProps;
    line: BaseProps;
    star: BaseProps & {
      points?: number;
      innerRadius?: number;
    };
    polygon: BaseProps & {
      pointCount?: number;
    };
    vector: BaseProps;
    group: BaseProps;
    section: BaseProps;
    component: BaseProps;
    'component-set': BaseProps;
    instance: BaseProps & {
      component?: string;
      componentId?: string;
      of?: string;
    };
  }
  interface ElementChildrenAttribute {
    children: unknown;
  }
}
//#endregion
export { Fragment, JSX, jsx, jsxDEV, jsxs };
//# sourceMappingURL=jsx-runtime.d.ts.map
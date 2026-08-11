//#region src/design-jsx/mini-react.d.ts
type ComponentType = (props: Record<string, unknown>) => ReactNode;
type ReactElement = {
  type: string | ComponentType;
  props: Record<string, unknown> & {
    children?: ReactNode[];
  };
};
type ReactNode = ReactElement | string | number | null | undefined | ReactNode[];
type FC<P = Record<string, unknown>> = (props: P) => ReactElement;
declare function createElement(type: string | ComponentType, props: Record<string, unknown> | null, ...children: ReactNode[]): ReactElement;
declare const _default: {
  createElement: typeof createElement;
};
//#endregion
export { ComponentType, FC, ReactElement, ReactNode, createElement, _default as default };
//# sourceMappingURL=mini-react.d.ts.map
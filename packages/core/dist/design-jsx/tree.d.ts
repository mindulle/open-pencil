import { DesignVariable } from "./vars.js";
import { Effect, Fill } from "@open-pencil/scene-graph";
import { Color as Color$1 } from "@open-pencil/scene-graph/primitives";

//#region src/design-jsx/tree.d.ts
interface TreeNode {
  type: string;
  props: Record<string, unknown>;
  children: (TreeNode | string)[];
}
declare function isTreeNode(x: unknown): x is TreeNode;
/**
 * Resolve any element-like value (ReactElement, TreeNode, function component)
 * into a TreeNode. Handles recursive function components up to depth 100.
 */
declare function resolveToTree(element: unknown, depth?: number): TreeNode | null;
declare function node(type: string, props: {
  children?: unknown;
  [key: string]: unknown;
}): TreeNode;
type PaintProp = string | Color$1 | Fill | DesignVariable;
type StyleProps = {
  flex?: 'row' | 'col' | 'column';
  flow?: 'auto' | 'ltr' | 'rtl';
  dir?: 'auto' | 'ltr' | 'rtl';
  gap?: number;
  wrap?: boolean;
  rowGap?: number;
  justify?: 'start' | 'end' | 'center' | 'between';
  justifyContent?: 'start' | 'end' | 'center' | 'between';
  items?: 'start' | 'end' | 'center' | 'stretch';
  align?: 'start' | 'end' | 'center' | 'stretch';
  alignItems?: 'start' | 'end' | 'center' | 'stretch';
  grow?: number;
  w?: number | 'fill' | 'hug';
  h?: number | 'fill' | 'hug';
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  x?: number;
  y?: number;
  p?: number;
  px?: number;
  py?: number;
  pt?: number;
  pr?: number;
  pb?: number;
  pl?: number;
  bg?: PaintProp;
  fill?: PaintProp;
  fills?: PaintProp[];
  stroke?: PaintProp;
  strokeWidth?: number;
  strokeAlign?: 'inside' | 'outside' | 'center';
  strokeDash?: number[] | boolean;
  rounded?: number;
  roundedTL?: number;
  roundedTR?: number;
  roundedBL?: number;
  roundedBR?: number;
  cornerSmoothing?: number;
  opacity?: number;
  blendMode?: string;
  mask?: boolean | 'alpha' | 'luminance' | 'vector';
  rotate?: number;
  rotation?: number;
  overflow?: 'hidden' | 'visible';
  shadow?: string;
  blur?: number;
  effects?: Effect[];
  size?: number;
  fontSize?: number;
  font?: string;
  fontFamily?: string;
  weight?: number | 'bold' | 'medium' | 'normal';
  fontWeight?: number | 'bold' | 'medium' | 'normal';
  color?: PaintProp;
  text?: string;
  characters?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justified';
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textHorizontalAlignment?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
  textVerticalAlignment?: 'TOP' | 'CENTER' | 'BOTTOM';
  textAutoResize?: 'none' | 'width' | 'height';
};
type BaseProps = StyleProps & {
  name?: string;
  key?: string | number;
  children?: unknown;
  bind?: Record<string, unknown>;
  [key: string]: unknown;
};
type TextProps = BaseProps;
//#endregion
export { BaseProps, PaintProp, StyleProps, TextProps, TreeNode, isTreeNode, node, resolveToTree };
//# sourceMappingURL=tree.d.ts.map
import { Color, Effect, Fill, LayoutAlign, LayoutCounterAlign, LayoutMode, LayoutSizing, NodeType, SceneGraph, SceneNode, Stroke, TextAlignVertical, Variable } from "@open-pencil/scene-graph";
import { Vector } from "@open-pencil/scene-graph/primitives";

//#region src/read.d.ts
declare function parsePenFile(json: string): SceneGraph;
declare function readPenFile(file: File): Promise<SceneGraph>;
//#endregion
//#region src/convert.d.ts
interface PenDocument {
  version: string;
  children: PenNode[];
  themes?: Record<string, string[]>;
  variables?: Record<string, PenVariable>;
}
interface PenVariable {
  type: 'color' | 'string' | 'number';
  value: PenVariableValue[] | PenVariableValue | string | number;
}
interface PenVariableValue {
  value: string | number;
  theme?: Record<string, string>;
}
interface PenStroke {
  align: 'inside' | 'center' | 'outside';
  thickness: number | {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  fill?: string;
  join?: string;
  cap?: string;
}
interface PenEffect {
  type: string;
  shadowType?: string;
  color?: string;
  offset?: Vector;
  blur?: number;
  spread?: number;
}
interface PenFillObject {
  type: string;
  color: string;
  enabled?: boolean;
}
type PenFill = string | PenFillObject | PenFillObject[];
interface PenNode {
  type: string;
  id: string;
  name?: string;
  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;
  fill?: PenFill;
  opacity?: number;
  enabled?: boolean;
  clip?: boolean;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  reusable?: boolean;
  cornerRadius?: number | string | (number | string)[];
  stroke?: PenStroke;
  effect?: PenEffect | PenEffect[];
  layout?: string;
  gap?: number | string;
  padding?: number | string | (number | string)[];
  justifyContent?: string;
  alignItems?: string;
  children?: PenNode[];
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: string;
  textAlignVertical?: string;
  textGrowth?: string;
  ref?: string;
  descendants?: Record<string, Partial<PenNode>>;
  slot?: string[];
  geometry?: string;
  iconFontName?: string;
  iconFontFamily?: string;
  weight?: number;
  model?: string;
  theme?: Record<string, string>;
}
interface VarContext {
  byName: Map<string, {
    id: string;
    variable: Variable;
  }>;
  activeModeId: string;
  collectionId: string;
  modeByThemeName: Map<string, string>;
  resolveColor(ref: string): Color;
  resolveNumber(ref: string): number;
  resolveString(ref: string): string;
  setActiveTheme(themeName: string): void;
}
declare function isVarRef(val: unknown): val is string;
declare function bindIfVar(node: SceneNode, field: string, val: unknown, ctx: VarContext): void;
declare function buildVarContext(graph: SceneGraph, penVars: Record<string, PenVariable>, themes: Record<string, string[]>): VarContext;
declare function convertFill(fill: PenFill | undefined, ctx: VarContext, node?: SceneNode): Fill[];
declare function convertStroke(stroke: PenStroke | undefined, ctx: VarContext, node?: SceneNode): Stroke[];
declare function convertEffects(effect: PenEffect | PenEffect[] | undefined): Effect[];
declare function applyCornerRadius(node: SceneNode, radius: PenNode['cornerRadius'], ctx: VarContext): void;
declare function applyPadding(node: SceneNode, padding: PenNode['padding'], ctx?: VarContext): void;
declare function parseSize(value: number | string | undefined, fallback: number, ctx?: VarContext): {
  value: number;
  sizing: LayoutSizing;
};
declare function mapLayoutMode(pen: PenNode): LayoutMode;
declare function mapJustifyContent(value: string | undefined): LayoutAlign;
declare function mapAlignItems(value: string | undefined): LayoutCounterAlign;
declare function mapTextAlign(value: string | undefined): SceneNode['textAlignHorizontal'];
declare function mapTextAlignVertical(value: string | undefined): TextAlignVertical;
declare function mapFontWeight(value: string | number | undefined): number;
declare function mapNodeType(pen: PenNode): NodeType;
//#endregion
export { PenDocument, PenNode, PenVariable, VarContext, applyCornerRadius, applyPadding, bindIfVar, buildVarContext, convertEffects, convertFill, convertStroke, isVarRef, mapAlignItems, mapFontWeight, mapJustifyContent, mapLayoutMode, mapNodeType, mapTextAlign, mapTextAlignVertical, parsePenFile, parseSize, readPenFile };
//# sourceMappingURL=index.d.ts.map
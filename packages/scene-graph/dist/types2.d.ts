import { Color, Matrix, Rect, Vector } from "./primitives2.js";

//#region src/types.d.ts
interface SceneGraphEvents {
  'node:created': (node: SceneNode) => void;
  'node:updated': (id: string, changes: Partial<SceneNode>) => void;
  'node:previewUpdated': (id: string, changes: Partial<SceneNode>) => void;
  'node:deleted': (id: string) => void;
  'node:reparented': (nodeId: string, oldParentId: string | null, newParentId: string) => void;
  'node:reordered': (nodeId: string, parentId: string, index: number) => void;
}
type SceneGraphEventHandlers = Partial<{
  created: (node: SceneNode) => void;
  updated: (id: string, changes: Partial<SceneNode>) => void;
  previewUpdated: (id: string, changes: Partial<SceneNode>) => void;
  deleted: (id: string) => void;
  reparented: (nodeId: string, oldParentId: string | null, newParentId: string) => void;
  reordered: (nodeId: string, parentId: string, index: number) => void;
}>;
type DocumentColorSpace = 'srgb' | 'display-p3';
interface FigmaSourcePayload {
  rawSize: Vector | null;
  rawTransform: Matrix | null;
  rawNodeFields: Record<string, unknown>;
  layout: FigmaLayoutMetadata | null;
  symbolOverrides: unknown[];
  componentPropAssignments: unknown[];
  derivedSymbolData: unknown[];
  derivedSymbolDataLayoutVersion: number | null;
  uniformScaleFactor: number | null;
}
interface SourceMetadata {
  format: 'fig' | null;
  id: string | null;
  orderKey: string | null;
  editedFields: string[];
  fig: FigmaSourcePayload;
}
type HandleMirroring = 'NONE' | 'ANGLE' | 'ANGLE_AND_LENGTH';
type WindingRule = 'NONZERO' | 'EVENODD';
interface VectorVertex {
  x: number;
  y: number;
  strokeCap?: string;
  strokeJoin?: string;
  cornerRadius?: number;
  handleMirroring?: HandleMirroring;
}
interface VectorSegment {
  start: number;
  end: number;
  tangentStart: Vector;
  tangentEnd: Vector;
}
interface VectorRegion {
  windingRule: WindingRule;
  loops: number[][];
}
interface VectorNetwork {
  vertices: VectorVertex[];
  segments: VectorSegment[];
  regions: VectorRegion[];
}
interface GeometryPath {
  windingRule: WindingRule;
  commandsBlob: Uint8Array;
  /** Resolved paints for geometry using a format-specific style override. */
  fills?: Fill[];
  /** Shared fill style attached to this geometry region, when available. */
  fillStyleId?: string;
}
type NodeType = 'CANVAS' | 'FRAME' | 'RECTANGLE' | 'ROUNDED_RECTANGLE' | 'ELLIPSE' | 'TEXT' | 'LINE' | 'STAR' | 'POLYGON' | 'VECTOR' | 'BOOLEAN_OPERATION' | 'GROUP' | 'SECTION' | 'COMPONENT' | 'COMPONENT_SET' | 'INSTANCE' | 'CONNECTOR' | 'SHAPE_WITH_TEXT';
type FillType = 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE' | 'VIDEO' | 'PATTERN' | 'NOISE' | 'CUSTOM';
type BlendMode = 'NORMAL' | 'DARKEN' | 'MULTIPLY' | 'COLOR_BURN' | 'LIGHTEN' | 'SCREEN' | 'COLOR_DODGE' | 'OVERLAY' | 'SOFT_LIGHT' | 'HARD_LIGHT' | 'DIFFERENCE' | 'EXCLUSION' | 'HUE' | 'SATURATION' | 'COLOR' | 'LUMINOSITY' | 'PASS_THROUGH';
type ImageScaleMode = 'FILL' | 'FIT' | 'CROP' | 'TILE';
type NoiseType = 'MULTITONE' | 'MONOTONE' | 'DUOTONE';
type PatternTileType = 'RECTANGULAR' | 'HORIZONTAL_HEXAGONAL' | 'VERTICAL_HEXAGONAL';
type PatternAlignment = 'START' | 'CENTER' | 'END';
interface GradientStop {
  color: Color;
  position: number;
}
type GradientTransform = Matrix;
interface Fill {
  type: FillType;
  color: Color;
  opacity: number;
  visible: boolean;
  blendMode?: BlendMode;
  gradientStops?: GradientStop[];
  gradientTransform?: GradientTransform;
  imageHash?: string;
  imageScaleMode?: ImageScaleMode;
  imageTransform?: GradientTransform;
  sourceNodeId?: string;
  scale?: number;
  spacing?: number;
  patternSpacing?: Vector;
  patternTileType?: PatternTileType;
  verticalAlignment?: PatternAlignment;
  horizontalAlignment?: PatternAlignment;
  noiseType?: NoiseType;
  density?: number;
  noiseSize?: Vector;
  customEffectId?: string;
}
type StrokeCap = 'NONE' | 'ROUND' | 'SQUARE' | 'ARROW_LINES' | 'ARROW_EQUILATERAL';
type StrokeJoin = 'MITER' | 'BEVEL' | 'ROUND';
type SharedStyleType = 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
type SharedStyleKind = 'fill' | 'stroke' | 'text' | 'effect' | 'grid';
type MaskType = 'ALPHA' | 'VECTOR' | 'LUMINANCE';
interface LayoutGrid {
  visible?: boolean;
  color?: Color;
  pattern?: 'COLUMNS' | 'ROWS' | 'GRID';
  axis?: 'X' | 'Y';
  type?: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH';
  alignment?: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH';
  numSections?: number;
  count?: number;
  offset?: number;
  sectionSize?: number;
  gutterSize?: number;
}
interface SharedStyle {
  id: string;
  nodeId: string;
  name: string;
  type: SharedStyleType;
}
interface Stroke {
  color: Color;
  weight: number;
  opacity: number;
  visible: boolean;
  align: 'INSIDE' | 'CENTER' | 'OUTSIDE';
  cap?: StrokeCap;
  join?: StrokeJoin;
  dashPattern?: number[];
}
interface Effect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR' | 'FOREGROUND_BLUR';
  color: Color;
  offset: Vector;
  radius: number;
  spread: number;
  visible: boolean;
  blendMode?: BlendMode;
  showShadowBehindNode?: boolean;
}
type ConstraintType = 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
type TextAutoResize = 'NONE' | 'HEIGHT' | 'WIDTH_AND_HEIGHT' | 'TRUNCATE';
type TextAlignVertical = 'TOP' | 'CENTER' | 'BOTTOM';
type TextCase = 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
type TextDecoration = 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
type TextDecorationStyle = 'SOLID' | 'DOTTED' | 'WAVY';
type LeadingTrim = 'NONE' | 'CAP_HEIGHT';
type TextDirection = 'AUTO' | 'LTR' | 'RTL';
type LayoutDirection = 'AUTO' | 'LTR' | 'RTL';
interface FontVariation {
  axis: string;
  value: number;
}
interface FontFeature {
  tag: string;
  enabled: boolean;
}
interface CharacterStyleOverride {
  fontWeight?: number;
  italic?: boolean;
  textDecoration?: TextDecoration;
  textDecorationStyle?: TextDecorationStyle;
  textDecorationThickness?: number | null;
  textDecorationFills?: Fill[];
  textDecorationSkipInk?: boolean;
  textUnderlineOffset?: number | null;
  fontSize?: number;
  fontFamily?: string;
  letterSpacing?: number;
  lineHeight?: number | null;
  fills?: Fill[];
  fontVariations?: FontVariation[];
  fontFeatures?: FontFeature[];
  textLanguage?: string | null;
}
interface StyleRun {
  start: number;
  length: number;
  style: CharacterStyleOverride;
}
interface ArcData {
  startingAngle: number;
  endingAngle: number;
  innerRadius: number;
}
type LayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'GRID';
type LayoutSizing = 'FIXED' | 'HUG' | 'FILL';
type GridTrackSizing = 'FIXED' | 'FR' | 'AUTO';
interface GridTrack {
  sizing: GridTrackSizing;
  value: number;
}
interface GridPosition {
  column: number;
  row: number;
  columnSpan: number;
  rowSpan: number;
}
type LayoutAlign = 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
type LayoutCounterAlign = 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'BASELINE';
type LayoutAlignSelf = 'AUTO' | 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'BASELINE';
type LayoutWrap = 'NO_WRAP' | 'WRAP';
interface PluginDataEntry {
  pluginId: string;
  key: string;
  value: string;
}
type ExportFormatId = 'png' | 'jpg' | 'webp' | 'svg' | 'pdf';
interface ExportSetting {
  scale: number;
  format: ExportFormatId;
}
interface PluginRelaunchDataEntry {
  pluginId: string;
  command: string;
  message: string;
  isDeleted: boolean;
}
interface FigmaDerivedTextGlyph {
  commandsBlob: Uint8Array;
  x: number;
  y: number;
  fontSize: number;
}
interface SymbolLink {
  uri: string;
  displayName?: string;
  displayText?: string;
}
interface VariantPropSpec {
  propDefId: string;
  value: string;
}
type FigmaLayoutMetadata = Partial<Record<'stackMode' | 'stackCounterAlign' | 'stackJustify' | 'stackCounterAlignItems' | 'stackPrimaryAlignItems' | 'stackPrimarySizing' | 'stackCounterSizing' | 'stackWrap' | 'stackPositioning' | 'stackChildAlignSelf', string> & Record<'stackSpacing' | 'stackPadding' | 'stackPaddingRight' | 'stackPaddingBottom' | 'stackVerticalPadding' | 'stackHorizontalPadding' | 'stackChildPrimaryGrow' | 'stackCounterSpacing', number> & Record<'bordersTakeSpace' | 'stackReverseZIndex', boolean>>;
interface SceneNode {
  id: string;
  type: NodeType;
  name: string;
  parentId: string | null;
  childIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  source: SourceMetadata;
  figmaDerivedLayout: Partial<Rect> | null;
  fills: Fill[];
  strokes: Stroke[];
  effects: Effect[];
  layoutGrids: LayoutGrid[];
  fillStyleId: string | null;
  strokeStyleId: string | null;
  textStyleId: string | null;
  effectStyleId: string | null;
  gridStyleId: string | null;
  sharedStyleType: SharedStyleType | null;
  opacity: number;
  cornerRadius: number;
  topLeftRadius: number;
  topRightRadius: number;
  bottomRightRadius: number;
  bottomLeftRadius: number;
  independentCorners: boolean;
  cornerSmoothing: number;
  visible: boolean;
  locked: boolean;
  clipsContent: boolean;
  blendMode: BlendMode;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  italic: boolean;
  textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textDirection: TextDirection;
  textLanguage: string | null;
  textAlignVertical: TextAlignVertical;
  textAutoResize: TextAutoResize;
  textCase: TextCase;
  textDecoration: TextDecoration;
  textDecorationStyle: TextDecorationStyle;
  textDecorationThickness: number | null;
  textDecorationFills: Fill[];
  textDecorationSkipInk: boolean;
  textUnderlineOffset: number | null;
  leadingTrim: LeadingTrim;
  lineHeight: number | null;
  letterSpacing: number;
  maxLines: number | null;
  styleRuns: StyleRun[];
  fontVariations: FontVariation[];
  fontFeatures: FontFeature[];
  horizontalConstraint: ConstraintType;
  verticalConstraint: ConstraintType;
  layoutMode: LayoutMode;
  layoutDirection: LayoutDirection;
  layoutWrap: LayoutWrap;
  primaryAxisAlign: LayoutAlign;
  counterAxisAlign: LayoutCounterAlign;
  primaryAxisSizing: LayoutSizing;
  counterAxisSizing: LayoutSizing;
  itemSpacing: number;
  counterAxisSpacing: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  layoutPositioning: 'AUTO' | 'ABSOLUTE';
  layoutGrow: number;
  layoutAlignSelf: LayoutAlignSelf;
  vectorNetwork: VectorNetwork | null;
  handleMirroring: HandleMirroring;
  booleanOperation?: 'UNION' | 'SUBTRACT' | 'INTERSECT' | 'EXCLUDE';
  fillGeometry: GeometryPath[];
  strokeGeometry: GeometryPath[];
  arcData: ArcData | null;
  strokeCap: StrokeCap;
  strokeJoin: StrokeJoin;
  dashPattern: number[];
  borderTopWeight: number;
  borderRightWeight: number;
  borderBottomWeight: number;
  borderLeftWeight: number;
  independentStrokeWeights: boolean;
  strokeMiterLimit: number;
  minWidth: number | null;
  maxWidth: number | null;
  minHeight: number | null;
  maxHeight: number | null;
  isMask: boolean;
  maskType: MaskType;
  maskIsOutline: boolean;
  gridTemplateColumns: GridTrack[];
  gridTemplateRows: GridTrack[];
  gridColumnGap: number;
  gridRowGap: number;
  gridPosition: GridPosition | null;
  counterAxisAlignContent: 'AUTO' | 'SPACE_BETWEEN';
  itemReverseZIndex: boolean;
  strokesIncludedInLayout: boolean;
  expanded: boolean;
  textTruncation: 'DISABLED' | 'ENDING';
  autoRename: boolean;
  pointCount: number;
  starInnerRadius: number;
  componentId: string | null;
  overrides: Record<string, unknown>;
  componentPropertyDefinitions: ComponentPropertyDefinition[];
  componentPropertyReferences: ComponentPropertyReference[];
  componentPropertyAssignments: Record<string, string>;
  componentPropertyValues: Record<string, string>;
  componentKey: string | null;
  sourceLibraryKey: string | null;
  publishId: string | null;
  overrideKey: string | null;
  sharedSymbolVersion: string | null;
  publishedVersion: string | null;
  isPublishable: boolean;
  isSymbolPublishable: boolean;
  symbolDescription: string;
  symbolLinks: SymbolLink[];
  variantPropSpecs: VariantPropSpec[];
  boundVariables: Record<string, string>;
  variableModes: VariableModeMap;
  exportSettings: ExportSetting[];
  pluginData: PluginDataEntry[];
  pluginRelaunchData: PluginRelaunchDataEntry[];
  internalOnly: boolean;
  flipX: boolean;
  flipY: boolean;
  textPicture: Uint8Array | null;
  figmaDerivedTextGlyphs: FigmaDerivedTextGlyph[] | null;
}
type ComponentPropertyType = 'VARIANT' | 'TEXT' | 'BOOLEAN' | 'INSTANCE_SWAP';
type ComponentPropertyReferenceField = 'VISIBLE' | 'TEXT' | 'INSTANCE_SWAP';
interface ComponentPropertyReference {
  propertyId: string;
  field: ComponentPropertyReferenceField;
}
interface ComponentPropertyDefinition {
  id: string;
  name: string;
  type: ComponentPropertyType;
  defaultValue: string;
  variantOptions?: string[];
  preferredValues?: string[];
}
type VariableType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
type VariableValue = Color | number | string | boolean | {
  aliasId: string;
};
type VariableModeMap = Record<string, string>;
interface Variable {
  id: string;
  name: string;
  type: VariableType;
  collectionId: string;
  valuesByMode: Record<string, VariableValue>;
  description: string;
  hiddenFromPublishing: boolean;
  /** Published library key (from NodeChange.key). Used for assetRef resolution in colorVar. */
  key?: string;
  /** Published library version (from NodeChange.version). Used for assetRef resolution in colorVar. */
  version?: string;
}
interface VariableCollectionMode {
  modeId: string;
  name: string;
}
interface VariableCollection {
  id: string;
  name: string;
  modes: VariableCollectionMode[];
  defaultModeId: string;
  variableIds: string[];
}
//#endregion
export { ArcData, BlendMode, CharacterStyleOverride, ComponentPropertyDefinition, ComponentPropertyReference, ComponentPropertyReferenceField, ComponentPropertyType, ConstraintType, DocumentColorSpace, Effect, ExportFormatId, ExportSetting, FigmaDerivedTextGlyph, FigmaLayoutMetadata, FigmaSourcePayload, Fill, FillType, FontFeature, FontVariation, GeometryPath, GradientStop, GradientTransform, GridPosition, GridTrack, GridTrackSizing, HandleMirroring, ImageScaleMode, LayoutAlign, LayoutAlignSelf, LayoutCounterAlign, LayoutDirection, LayoutGrid, LayoutMode, LayoutSizing, LayoutWrap, LeadingTrim, MaskType, NodeType, NoiseType, PatternAlignment, PatternTileType, PluginDataEntry, PluginRelaunchDataEntry, SceneGraphEventHandlers, SceneGraphEvents, SceneNode, SharedStyle, SharedStyleKind, SharedStyleType, SourceMetadata, Stroke, StrokeCap, StrokeJoin, StyleRun, SymbolLink, TextAlignVertical, TextAutoResize, TextCase, TextDecoration, TextDecorationStyle, TextDirection, Variable, VariableCollection, VariableCollectionMode, VariableModeMap, VariableType, VariableValue, VariantPropSpec, VectorNetwork, VectorRegion, VectorSegment, VectorVertex, WindingRule };
//# sourceMappingURL=types2.d.ts.map
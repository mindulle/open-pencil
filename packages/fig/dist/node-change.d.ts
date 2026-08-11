import { FIG_KIWI_DEFAULT_VERSION, buildFigKiwi, decompressFigKiwiDataAsync, parseFigKiwiChunks } from "@open-pencil/kiwi/fig/container";
import { guidToString, stringToGuid } from "@open-pencil/kiwi/fig/guid";
import { ArcData, ComponentPropertyDefinition, Effect, ExportSetting, FigmaDerivedTextGlyph, Fill, FontFeature, FontVariation, GeometryPath, LayoutAlign, LayoutAlignSelf, LayoutCounterAlign, LayoutSizing, NodeType, PluginDataEntry, PluginRelaunchDataEntry, SceneGraph, SceneNode, Stroke, StrokeCap, StrokeJoin, StyleRun, TextDecoration, VectorNetwork } from "@open-pencil/scene-graph";
import { Effect as Effect$1, NodeChange, Paint, PluginData, PluginRelaunchData, VariableConsumptionEntry } from "@open-pencil/kiwi/fig/codec";
import { Color, GUID as GUID$1, Matrix } from "@open-pencil/scene-graph/primitives";

//#region src/node-change/basics.d.ts
declare function mapToFigmaType(type: SceneNode['type']): string;
/** Generate a printable, lexicographically ordered parent position. */
declare function fractionalPosition(index: number): string;
//#endregion
//#region src/node-change/paint.d.ts
declare function safeColor(color: Color | Omit<Color, 'a'>): Color;
declare function fillToKiwiPaint(fill: Fill): Paint;
type VariableAliasRef = NonNullable<NonNullable<NonNullable<Paint['colorVar']>['value']>['alias']>;
declare function setVariableColorResolver(resolver: ((alias: VariableAliasRef) => Color | null) | null): void;
declare function convertFills(paints?: Paint[]): Fill[];
declare function convertStrokes(paints?: Paint[], weight?: number, align?: string, cap?: StrokeCap, join?: StrokeJoin, dashPattern?: number[]): Stroke[];
declare function convertEffects(effects?: Effect$1[]): Effect[];
//#endregion
//#region src/node-change/style-runs.d.ts
declare function importStyleRuns(nc: NodeChange): StyleRun[];
//#endregion
//#region src/node-change/text-values.d.ts
declare function mapTextDecoration(d?: string): TextDecoration;
declare function convertLineHeight(lh?: {
  value: number;
  units: string;
}, fontSize?: number): number | null;
declare function convertLetterSpacing(ls?: {
  value: number;
  units: string;
}, fontSize?: number): number;
//#endregion
//#region src/node-change/vector-network.d.ts
interface StyleOverride {
  styleID: number;
  handleMirroring?: string;
  fillPaints?: Paint[];
}
declare function decodeVectorNetworkBlob(data: Uint8Array, styleOverrideTable?: StyleOverride[]): VectorNetwork;
declare function buildStyleOverrideTable(network: VectorNetwork): {
  table: StyleOverride[];
  mirroringToId: Map<string, number>;
};
declare function encodeVectorNetworkBlob(network: VectorNetwork, mirroringToId?: Map<string, number>): Uint8Array;
//#endregion
//#region src/node-change/vector-geometry.d.ts
declare function alignGeometryWindingRules(geometry: GeometryPath[], vectorNetwork: VectorNetwork | null): GeometryPath[];
declare function resolveVectorNetwork(nc: NodeChange, blobs: Uint8Array[]): VectorNetwork | null;
interface KiwiPath {
  windingRule?: string;
  commandsBlob?: number;
  styleID?: number;
}
declare function resolveStyleOverrideFills(styleOverrideTable: StyleOverride[] | undefined): ReadonlyMap<number, Fill[]>;
declare function resolveVectorStyleOverrideFills(source: Pick<NodeChange, 'vectorData'>): ReadonlyMap<number, Fill[]>;
declare function resolveGeometryPaths(paths: KiwiPath[] | undefined, blobs: Uint8Array[], fillsByStyleId?: ReadonlyMap<number, Fill[]>): GeometryPath[];
//#endregion
//#region src/node-change/variable-bindings.d.ts
declare const VARIABLE_BINDING_FIELDS: Record<string, string>;
declare const VARIABLE_BINDING_FIELDS_INVERSE: Record<string, string>;
interface ResolvedVariableConsumption {
  field: string;
  variableId: string;
}
declare function resolveVariableConsumptionEntry(entry: VariableConsumptionEntry): ResolvedVariableConsumption | undefined;
declare function resolvedNumericBindingUpdate(field: string, value: number): Partial<SceneNode> | undefined;
//#endregion
//#region src/node-change/convert.d.ts
declare function mapStackSizing(sizing?: string): LayoutSizing;
declare function mapStackJustify(justify?: string): LayoutAlign;
declare function mapStackCounterAlign(align?: string): LayoutCounterAlign;
declare function mapAlignSelf(align?: string): LayoutAlignSelf;
declare function mapArcData(data?: Partial<ArcData>): ArcData | null;
declare function convertFigmaTransformProps(nc: NodeChange): Pick<SceneNode, 'x' | 'y' | 'width' | 'height' | 'rotation' | 'flipX' | 'flipY'>;
declare function shouldImportTextAsAutoSize(nc: NodeChange, parentNc: NodeChange | undefined): boolean;
declare function nodeChangeToProps(nc: NodeChange, blobs: Uint8Array[]): Partial<SceneNode> & {
  nodeType: NodeType | 'DOCUMENT' | 'VARIABLE';
};
declare function sortChildren(children: string[], parentNc: NodeChange, nodeMap: Map<string, NodeChange>): void;
declare const FIGMA_RAW_NODE_FIELD_KEYS: readonly ["styleIdForFill", "styleIdForStrokeFill", "styleIdForText", "styleIdForEffect", "styleIdForGrid", "styleType", "componentPropAssignments", "backgroundPaints", "layoutGrids", "exportSettings", "componentPropDefs", "componentPropRefs", "variantPropSpecs", "stateGroupPropertyValueOrders", "isStateGroup", "version", "sourceLibraryKey", "userFacingVersion", "description", "key", "sortPosition", "detachedSymbolId", "documentColorProfile", "variableConsumptionMap", "variableModeBySetMap", "parameterConsumptionMap", "editInfo", "backgroundColor", "pageType", "isPageDivider", "guides", "handoffStatusMap", "annotationCategories", "miterLimit", "mask", "maskType", "maskIsOutline", "strokeWeight", "strokeJoin", "borderStrokeWeightsIndependent", "borderTopWeight", "borderRightWeight", "borderBottomWeight", "borderLeftWeight", "minSize", "maxSize", "targetAspectRatio", "gridRows", "gridColumns", "gridRowAnchor", "gridColumnAnchor", "gridColumnsSizing", "gridRowsSizing", "gridChildVerticalAlign", "gridChildHorizontalAlign", "textAutoResize", "textData", "lineHeight", "fontName", "fontSize", "letterSpacing", "textTracking", "fontVersion", "textUserLayoutVersion", "textExplicitLayoutVersion", "fontVariations", "fontVariantCommonLigatures", "fontVariantContextualLigatures", "toggledOnOTFeatures", "toggledOffOTFeatures", "leadingTrim", "textDecorationFillPaints", "textUnderlineOffset", "textDecorationThickness", "textDecorationStyle", "semanticWeight", "semanticItalic", "maxLines", "textPathStart", "derivedTextData", "fillPaints", "strokePaints", "effects", "sectionStatusInfo", "prototypeStartNodeID", "prototypeInteractions", "transitionInfo", "codeSyntax", "lockMode", "slideThemeMap", "isSoftDeleted", "brushType", "scatterStrokeSettings", "vectorOperationVersion", "vectorData", "fillGeometry", "strokeGeometry"];
//#endregion
//#region src/node-change/derived-text-data.d.ts
interface DerivedTextDataOptions {
  node: SceneNode;
  glyphs: NonNullable<NodeChange['derivedTextData']>['glyphs'];
  fontMetaData: NonNullable<NodeChange['derivedTextData']>['fontMetaData'];
  baseline: number;
  width: number;
  lineHeight: number;
  lineAscent: number;
  baselines?: NonNullable<NodeChange['derivedTextData']>['baselines'];
  logicalIndexToCharacterOffsetMap: number[];
}
declare function buildDerivedTextData(options: DerivedTextDataOptions): NodeChange['derivedTextData'];
//#endregion
//#region src/node-change/derived-text-glyphs.d.ts
declare function convertFigmaDerivedTextGlyphs(derivedTextData: NodeChange['derivedTextData'], blobs: Uint8Array[]): FigmaDerivedTextGlyph[];
//#endregion
//#region src/node-change/export-node.d.ts
type KiwiNodeChange = NodeChange & Record<string, unknown>;
/** Resolve effect variable asset refs when the Kiwi effect schema requires GUID aliases. */
declare function buildAssetRefToVarGuidMap(graph: SceneGraph, varIdToGuid: Map<string, GUID$1>): Map<string, GUID$1>;
interface SceneNodeToKiwiContext {
  graph: SceneGraph;
  blobs: Uint8Array[];
  blobIndexByHex?: Map<string, number>;
  nodeIdToGuid?: Map<string, GUID$1>;
  /** Reverse index of assigned GUID values ("sessionID:localID") for O(1)
   *  collision detection. Populated alongside every nodeIdToGuid.set() call. */
  assignedGuidValues?: Set<string>;
  fontDigestMap?: Map<string, Uint8Array>;
  glyphBlobMap?: Map<string, number>;
  varIdToGuid?: Map<string, GUID$1>;
  modeIdToGuid?: Map<string, GUID$1>;
  /** Variable GUIDs used only where raw effect aliases cannot retain asset refs. */
  assetRefToVarGuid?: Map<string, GUID$1>;
  componentPropertyDefinitionsById: ReadonlyMap<string, ComponentPropertyDefinition>;
  fractionalPosition: (index: number) => string;
  mapToFigmaType: (type: SceneNode['type']) => string;
  fillToKiwiPaint: (fill: SceneNode['fills'][number]) => Paint;
  safeColor: (color: Color) => Color;
  computeExportTransform: (node: SceneNode) => Matrix;
  serializeCornerRadii: (node: SceneNode, nc: KiwiNodeChange) => void;
  serializeTextProps: (node: SceneNode, nc: KiwiNodeChange, graph: SceneGraph, fontDigestMap: Map<string, Uint8Array> | undefined, blobs: Uint8Array[], glyphBlobMap: Map<string, number> | undefined) => void;
  serializeLayoutProps: (node: SceneNode, nc: KiwiNodeChange) => void;
  serializeGeometry: (node: SceneNode, nc: KiwiNodeChange, blobs: Uint8Array[]) => void;
  serializeVariableBindings: (node: SceneNode, nc: KiwiNodeChange, graph: SceneGraph, varIdToGuid?: Map<string, GUID$1>) => void;
  sceneNodeToKiwi: (node: SceneNode, parentGuid: GUID$1, childIndex: number, localIdCounter: {
    value: number;
  }, context: SceneNodeToKiwiContext) => KiwiNodeChange[];
}
declare function buildComponentPropIndex(graph: SceneGraph): ReadonlyMap<string, ComponentPropertyDefinition>;
declare function sceneNodeToKiwiWithContext(node: SceneNode, parentGuid: GUID$1, childIndex: number, localIdCounter: {
  value: number;
}, context: SceneNodeToKiwiContext): KiwiNodeChange[];
//#endregion
//#region src/node-change/path-commands.d.ts
interface OutlineCommand {
  type: string;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}
declare function encodePathCommandsBlob(commands: OutlineCommand[], scale?: number): Uint8Array;
//#endregion
//#region src/node-change/export-runtime.d.ts
interface FigGlyphOutlineMetric {
  commands: OutlineCommand[];
  x: number;
  advance: number;
}
interface FigNodeChangeExportRuntime {
  getGlyphOutlineMetrics(family: string, style: string, text: string, fontSize: number): FigGlyphOutlineMetric[] | null;
}
declare const EMPTY_EXPORT_RUNTIME: FigNodeChangeExportRuntime;
//#endregion
//#region src/node-change/font/features.d.ts
declare function convertFontFeatures(nc: NodeChange): FontFeature[];
declare function applyFontFeaturesToKiwi(nc: NodeChange, features: FontFeature[]): void;
//#endregion
//#region src/node-change/font/style.d.ts
declare function weightToFigmaStyle(weight: number, italic?: boolean): string;
//#endregion
//#region src/node-change/font/variations.d.ts
declare function figmaAxisTagToString(axisTag: number): string;
declare function stringToFigmaAxisTag(axis: string): number | undefined;
declare function convertFontVariations(nc: NodeChange): FontVariation[];
//#endregion
//#region src/node-change/plugin-data.d.ts
declare const OPEN_PENCIL_PLUGIN_ID = "open-pencil";
declare const TEXT_DIRECTION_PLUGIN_KEY = "textDirection";
declare const LAYOUT_DIRECTION_PLUGIN_KEY = "layoutDirection";
declare const NODE_TYPE_PLUGIN_KEY = "nodeType";
declare const BOUND_VARIABLES_PLUGIN_KEY = "boundVariables";
declare const EXPORT_SETTINGS_PLUGIN_KEY = "exportSettings";
declare function upsertPluginData(node: {
  pluginData: PluginDataEntry[];
}, key: string, value: string): void;
declare function applyExportSettingsPluginData(node: Pick<SceneNode, 'exportSettings' | 'pluginData' | 'source'>): void;
declare function extractBoundVariables(nc: NodeChange): Record<string, string>;
declare function extractExportSettings(nc: NodeChange): ExportSetting[];
declare function extractPluginData(nc: NodeChange): PluginDataEntry[];
declare function getOpenPencilPluginValue(nc: NodeChange, key: string): string | null;
declare function extractPluginRelaunchData(nc: NodeChange): PluginRelaunchDataEntry[];
declare function mergePluginData(pluginData: PluginDataEntry[]): PluginData[];
declare function serializePluginRelaunchData(entries: PluginRelaunchDataEntry[]): PluginRelaunchData[];
//#endregion
//#region src/node-change/serialize.d.ts
declare function sceneNodeToKiwi(node: SceneNode, parentGuid: GUID$1, childIndex: number, localIdCounter: {
  value: number;
}, graph: SceneGraph, blobs: Uint8Array[], nodeIdToGuid?: Map<string, GUID$1>, fontDigestMap?: Map<string, Uint8Array>, varIdToGuid?: Map<string, GUID$1>, glyphBlobMap?: Map<string, number>, blobIndexByHex?: Map<string, number>, assignedGuidValues?: Set<string>, runtime?: FigNodeChangeExportRuntime, componentPropertyDefinitionsById?: ReadonlyMap<string, import("@open-pencil/scene-graph").ComponentPropertyDefinition>, modeIdToGuid?: Map<string, GUID$1>): KiwiNodeChange[];
declare function makeDocumentNodeChange(guid: GUID$1, documentColorSpace?: 'srgb' | 'display-p3'): NodeChange & Record<string, unknown>;
declare function makeCanvasNodeChange(guid: GUID$1, parentGuid: GUID$1, position: string, name: string, extra?: Record<string, unknown>): NodeChange & Record<string, unknown>;
//#endregion
//#region src/node-change/style-refs.d.ts
type StyleRefFields = NodeChange;
type StyleSource = Pick<NodeChange, 'type' | 'styleType' | 'fillPaints' | 'effects' | 'layoutGrids' | 'fontSize' | 'fontName' | 'lineHeight' | 'letterSpacing' | 'textDecoration' | 'textCase'>;
declare function applyStyleRefsToFields(changeMap: ReadonlyMap<string, Partial<StyleSource>>, fields: StyleRefFields, assetRefs?: ReadonlyMap<string, string>): void;
//#endregion
//#region src/node-change/text-data-export.d.ts
declare function fontVariationToKiwi(variation: SceneNode['fontVariations'][number]): {
  axisName: string;
  value: number;
  axisTag?: undefined;
} | {
  axisTag: number;
  axisName: string;
  value: number;
};
declare function exportTextData(node: SceneNode, textLines: (text: string) => NonNullable<NodeChange['textData']>['lines'], fillToKiwiPaint: (fill: SceneNode['fills'][number]) => Paint): NodeChange['textData'];
//#endregion
export { BOUND_VARIABLES_PLUGIN_KEY, EMPTY_EXPORT_RUNTIME, EXPORT_SETTINGS_PLUGIN_KEY, FIGMA_RAW_NODE_FIELD_KEYS, FIG_KIWI_DEFAULT_VERSION, FigGlyphOutlineMetric, FigNodeChangeExportRuntime, KiwiNodeChange, LAYOUT_DIRECTION_PLUGIN_KEY, NODE_TYPE_PLUGIN_KEY, OPEN_PENCIL_PLUGIN_ID, OutlineCommand, ResolvedVariableConsumption, StyleOverride, TEXT_DIRECTION_PLUGIN_KEY, VARIABLE_BINDING_FIELDS, VARIABLE_BINDING_FIELDS_INVERSE, alignGeometryWindingRules, applyExportSettingsPluginData, applyFontFeaturesToKiwi, applyStyleRefsToFields, buildAssetRefToVarGuidMap, buildComponentPropIndex, buildDerivedTextData, buildFigKiwi, buildStyleOverrideTable, convertEffects, convertFigmaDerivedTextGlyphs, convertFigmaTransformProps, convertFills, convertFontFeatures, convertFontVariations, convertLetterSpacing, convertLineHeight, convertStrokes, decodeVectorNetworkBlob, decompressFigKiwiDataAsync, encodePathCommandsBlob, encodeVectorNetworkBlob, exportTextData, extractBoundVariables, extractExportSettings, extractPluginData, extractPluginRelaunchData, figmaAxisTagToString, fillToKiwiPaint, fontVariationToKiwi, fractionalPosition, getOpenPencilPluginValue, guidToString, importStyleRuns, makeCanvasNodeChange, makeDocumentNodeChange, mapAlignSelf, mapArcData, mapStackCounterAlign, mapStackJustify, mapStackSizing, mapTextDecoration, mapToFigmaType, mergePluginData, nodeChangeToProps, parseFigKiwiChunks, resolveGeometryPaths, resolveStyleOverrideFills, resolveVariableConsumptionEntry, resolveVectorNetwork, resolveVectorStyleOverrideFills, resolvedNumericBindingUpdate, safeColor, sceneNodeToKiwi, sceneNodeToKiwiWithContext, serializePluginRelaunchData, setVariableColorResolver, shouldImportTextAsAutoSize, sortChildren, stringToFigmaAxisTag, stringToGuid, upsertPluginData, weightToFigmaStyle };
//# sourceMappingURL=node-change.d.ts.map
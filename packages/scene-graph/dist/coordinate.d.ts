import { Color, Rect, Vector } from "./primitives2.js";
import { Mat3 } from "./matrix2.js";
import { DocumentColorSpace, Effect, Fill, GeometryPath, LayoutGrid, NodeType, SceneGraphEventHandlers, SceneGraphEvents, SceneNode, SharedStyle, SharedStyleKind, SharedStyleType, Stroke, StyleRun, Variable, VariableCollection, VariableType, VariableValue } from "./types2.js";
import { Emitter } from "nanoevents";

//#region src/copy.d.ts
declare function copyFill(f: Fill): Fill;
declare function copyStroke(s: Stroke): Stroke;
declare function copyEffect(e: Effect): Effect;
declare function copyStyleRun(r: StyleRun): StyleRun;
/** Record immutable lineage for an internal deep copy without sharing mutable values. */
declare function markCopySource<T extends object>(source: T, copy: T): T;
/** Compare internal deep copies in O(1) without traversing large paint or text payloads. */
declare function hasSameCopySource(left: object, right: object): boolean;
declare function copyFills(fills: Fill[]): Fill[];
declare function copyStrokes(strokes: Stroke[]): Stroke[];
declare function copyEffects(effects: Effect[]): Effect[];
declare function copyLayoutGrids(grids: LayoutGrid[]): LayoutGrid[];
declare function copyStyleRuns(runs: StyleRun[]): StyleRun[];
declare function copyGeometryPaths(paths: GeometryPath[]): GeometryPath[];
/** Scale geometry path coordinates while preserving independent path fills. */
declare function scaleGeometryPaths(paths: GeometryPath[], scaleX: number, scaleY: number): GeometryPath[];
/**
 * Build the init props for a deep-copy clone of `src`.
 * Shares logic between SceneGraph.cloneTree and instance child cloning.
 * Explicitly deep-copies all mutable object/array fields that `...rest`
 * would otherwise share by reference. When adding a mutable SceneNode field,
 * add its copy behavior here or document why sharing is intentional.
 */
type NodeCloneMode = 'deep' | 'fig-import';
declare function cloneNodeProps(src: SceneNode, componentId: string | null, mode?: NodeCloneMode): Partial<SceneNode>;
//#endregion
//#region src/instances.d.ts
declare function copyInstanceComponentProps(component: SceneNode): Partial<SceneNode>;
declare function createInstance(graph: SceneGraph, componentId: string, parentId: string, overrides?: Partial<SceneNode>): SceneNode | null;
declare function populateInstanceChildren(graph: SceneGraph, instanceId: string, componentId: string, mode?: NodeCloneMode): void;
declare function swapInstanceComponent(graph: SceneGraph, instanceId: string, componentId: string): void;
declare function syncInstances(graph: SceneGraph, componentId: string): void;
declare function detachInstance(graph: SceneGraph, instanceId: string): void;
declare function getMainComponent(graph: SceneGraph, instanceId: string): SceneNode | undefined;
declare function getInstances(graph: SceneGraph, componentId: string): SceneNode[];
//#endregion
//#region src/snap.d.ts
interface SnapGuide {
  axis: 'x' | 'y';
  position: number;
  from: number;
  to: number;
}
interface SnapResult {
  dx: number;
  dy: number;
  guides: SnapGuide[];
}
declare function computeSnap(movingIds: Set<string>, movingBounds: Rect, allNodes: SceneNode[]): SnapResult;
declare function computeSelectionBounds(nodes: SceneNode[]): Rect | null;
//#endregion
//#region src/export-scale.d.ts
/**
 * Bounds for export scale multipliers. A huge multiplier would allocate an
 * enormous canvas and crash the renderer, so clamp at every boundary the value
 * can enter from: the UI (edits) and the file format (imported/plugin .fig data).
 */
declare const MIN_EXPORT_SCALE = 0.01;
declare const MAX_EXPORT_SCALE = 1024;
declare function clampExportScale(scale: number): number;
/** Accept a scale only if it is finite and within bounds (no silent clamping). */
declare function isValidExportScale(scale: number): boolean;
//#endregion
//#region src/geometry.d.ts
declare function degToRad(degrees: number): number;
declare function radToDeg(radians: number): number;
declare function rotatePoint(px: number, py: number, cx: number, cy: number, rad: number): Vector;
declare function rotatedCorners(cx: number, cy: number, hw: number, hh: number, rotationDeg: number): [Vector, Vector, Vector, Vector];
declare function rotatedBBox(x: number, y: number, w: number, h: number, rotationDeg: number): {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
};
interface VisualBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
declare function computeBounds(items: Iterable<Rect>): Rect;
declare function polygonVertices(node: {
  width: number;
  height: number;
  pointCount: number;
  type: string;
  starInnerRadius: number;
}): Vector[];
declare function strokeOverflow(strokes?: Stroke[]): number;
declare function effectOverflow(effects?: Effect[]): {
  left: number;
  right: number;
  top: number;
  bottom: number;
};
declare function computeAbsoluteBounds(nodes: Iterable<{
  id: string;
  width: number;
  height: number;
}>, getAbsolutePosition: (id: string) => Vector): Rect;
declare function computeVisualBounds(nodes: Iterable<{
  id: string;
  width: number;
  height: number;
  rotation?: number;
  strokes?: Stroke[];
  effects?: Effect[];
}>, getAbsolutePosition: (id: string) => Vector): Rect;
interface VisualBoundsNode {
  id: string;
  width: number;
  height: number;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  strokes?: Stroke[];
  effects?: Effect[];
  fillGeometry?: Array<{
    commandsBlob: Uint8Array;
  }>;
  strokeGeometry?: Array<{
    commandsBlob: Uint8Array;
  }>;
  childIds?: string[];
  visible?: boolean;
  type?: string;
  clipsContent?: boolean;
  fontSize?: number;
  textDecoration?: string;
  textUnderlineOffset?: number | null;
  textDecorationThickness?: number | null;
}
declare function unionVisualBounds(a: VisualBounds | null, b: VisualBounds | null): VisualBounds | null;
declare function intersectVisualBounds(a: VisualBounds, b: VisualBounds): VisualBounds | null;
declare function geometryBlobBounds(paths: Array<{
  commandsBlob: Uint8Array;
}>): Rect | null;
declare function nodeVisualBounds(node: VisualBoundsNode, getAbsolutePosition: (id: string) => Vector): VisualBounds;
declare function computeDescendantVisualBounds(nodeIds: string[], getNode: (id: string) => VisualBoundsNode | undefined, getAbsolutePosition: (id: string) => Vector): VisualBounds | null;
/**
 * Clip a subject polygon against a convex polygon (e.g. the 4 canvas-space
 * corners of a rotated clipping ancestor).
 *
 * Uses Sutherland–Hodgman polygon clipping with centroid-based interior
 * detection, making it robust to either winding order of the clip polygon.
 * Returns the clipped polygon, or null if the subject is fully outside the
 * clip polygon. When `clipCorners` has fewer than 3 points the subject is
 * returned unchanged (no clipping).
 *
 * Preserving the polygon (rather than collapsing to an AABB) lets callers
 * chain multiple clips without reintroducing corners removed by an inner clip.
 */
declare function clipPolygon(subject: Vector[], clipCorners: Vector[]): Vector[] | null;
/**
 * Clip an axis-aligned VisualBounds rectangle against a convex polygon
 * (e.g. the 4 canvas-space corners of a rotated clipping ancestor).
 *
 * Returns the AABB of the intersection, or null if the bounds are fully
 * outside the clip polygon. Delegates to {@link clipPolygon}.
 *
 * For a non-rotated clip (axis-aligned corners) the result is identical
 * to `intersectVisualBounds`.
 */
declare function clipBoundsToPolygon(bounds: VisualBounds, clipCorners: Vector[]): VisualBounds | null;
//#endregion
//#region src/font-style.d.ts
interface FontFamilyStyle {
  family: string;
  style: string;
}
interface ParsedFontStyle {
  weight: number;
  italic: boolean;
}
declare const FONT_WEIGHT_NAMES: Record<number, string>;
declare function normalizeFontStyleName(style: string): string;
declare function parseFontStyle(style: string | undefined): ParsedFontStyle;
declare function styleToWeight(style: string | undefined): number;
declare function normalizeFontFamily(family: string): string;
declare function styleToVariant(style: string): string;
declare function weightToStyle(weight: number, italic?: boolean): string;
//#endregion
//#region src/shared-styles.d.ts
declare const STYLE_REF_KEYS: {
  readonly fill: "fillStyleId";
  readonly stroke: "strokeStyleId";
  readonly text: "textStyleId";
  readonly effect: "effectStyleId";
  readonly grid: "gridStyleId";
};
declare function sharedStyleRefKey(kind: SharedStyleKind): (typeof STYLE_REF_KEYS)[SharedStyleKind];
declare function sharedStyleTypeForKind(kind: SharedStyleKind): SharedStyleType;
declare function getSharedStyles(graph: SceneGraph, kind: SharedStyleKind): SharedStyle[];
declare function styleDetachmentChanges(node: SceneNode, changes: Partial<SceneNode>): Partial<SceneNode>;
//#endregion
//#region src/index.d.ts
declare function generateId(): string;
declare class SceneGraph {
  nodes: Map<string, SceneNode>;
  images: Map<string, Uint8Array<ArrayBufferLike>>;
  variables: Map<string, Variable>;
  variableCollections: Map<string, VariableCollection>;
  activeMode: Map<string, string>;
  rootId: string;
  figKiwiVersion: number | null;
  /** Deflated kiwi schema bytes from the original .fig file, preserved for roundtrip fidelity. */
  figSchemaDeflated: Uint8Array | null;
  documentColorSpace: DocumentColorSpace;
  readonly emitter: Emitter<SceneGraphEvents>;
  private absPosCache;
  private previewMutationDepth;
  private sourceMetadataPreservationDepth;
  private layoutMutationDepth;
  positionPreviewVersion: number;
  instanceIndex: Map<string, Set<string>>;
  constructor();
  addPage(name: string): SceneNode;
  getPages(includeInternal?: boolean): SceneNode[];
  getAllNodes(): Iterable<SceneNode>;
  getNode(id: string): SceneNode | undefined;
  onNodeEvents(handlers: SceneGraphEventHandlers): () => void;
  countDescendants(nodeId: string): number;
  addVariable(variable: Variable): void;
  removeVariable(id: string): void;
  addCollection(collection: VariableCollection): void;
  createVariable(name: string, type: VariableType, collectionId: string, value?: VariableValue): Variable;
  createCollection(name: string): VariableCollection;
  removeCollection(id: string): void;
  getActiveModeId(collectionId: string): string;
  getNodeVariableModeId(nodeId: string, collectionId: string): string;
  setActiveMode(collectionId: string, modeId: string): void;
  addMode(collectionId: string, modeId: string, name: string, sourceMode?: string): void;
  removeMode(collectionId: string, modeId: string): void;
  renameMode(collectionId: string, modeId: string, name: string): void;
  setDefaultMode(collectionId: string, modeId: string): void;
  resolveVariable(variableId: string, modeId?: string, visited?: Set<string>): VariableValue | undefined;
  resolveColorVariable(variableId: string): Color | undefined;
  resolveNumberVariable(variableId: string): number | undefined;
  resolveColorVariableForNode(nodeId: string, variableId: string): Color | undefined;
  resolveNumberVariableForNode(nodeId: string, variableId: string): number | undefined;
  getVariablesForCollection(collectionId: string): Variable[];
  getVariablesByType(type: VariableType): Variable[];
  bindVariable(nodeId: string, field: string, variableId: string): void;
  unbindVariable(nodeId: string, field: string): void;
  getChildren(id: string): SceneNode[];
  isContainer(id: string): boolean;
  isDescendant(childId: string, ancestorId: string): boolean;
  clearAbsPosCache(): void;
  getAbsolutePosition(id: string): Vector;
  getAbsoluteBounds(id: string): Rect;
  private generateNodeId;
  private registerNode;
  createNode(type: NodeType, parentId: string, overrides?: Partial<SceneNode>): SceneNode;
  createNodeWithId(id: string, type: NodeType, parentId: string | null, overrides?: Partial<SceneNode>): SceneNode;
  static TEXT_PICTURE_KEYS: ReadonlySet<string>;
  static GLYPH_AFFECTING_KEYS: ReadonlySet<string>;
  static LAYOUT_AFFECTING_KEYS: ReadonlySet<string>;
  runPreviewUpdates(fn: () => void): void;
  preserveSourceMetadataDuring(fn: () => void): void;
  withLayoutMutations(fn: () => void): void;
  get isApplyingLayout(): boolean;
  updateNodePositionPreview(id: string, x: number, y: number): void;
  updateNodePreview(id: string, changes: Partial<SceneNode>): void;
  updateNode(id: string, changes: Partial<SceneNode>): void;
  reparentNode(nodeId: string, newParentId: string): void;
  reorderChild(nodeId: string, parentId: string, insertIndex: number): void;
  insertChildAt(childId: string, parentId: string, index: number): void;
  deleteNode(id: string): void;
  hitTest(px: number, py: number, scopeId?: string): SceneNode | null;
  hitTestDeep(px: number, py: number, scopeId?: string): SceneNode | null;
  hitTestFrame(px: number, py: number, excludeIds: Set<string>, scopeId?: string): SceneNode | null;
  cloneTree(sourceId: string, parentId: string, overrides?: Partial<SceneNode>): SceneNode | null;
  createInstance(componentId: string, parentId: string, overrides?: Partial<SceneNode>): SceneNode | null;
  populateInstanceChildren(instanceId: string, componentId: string, mode?: NodeCloneMode): void;
  swapInstanceComponent(instanceId: string, componentId: string): void;
  syncInstances(componentId: string): void;
  detachInstance(instanceId: string): void;
  getMainComponent(instanceId: string): SceneNode | undefined;
  getInstances(componentId: string): SceneNode[];
  flattenTree(parentId?: string, depth?: number): Array<{
    node: SceneNode;
    depth: number;
  }>;
}
//#endregion
//#region src/coordinate.d.ts
declare function getWorldMatrix(node: SceneNode, graph: SceneGraph): Mat3;
declare function getAbsolutePosition(node: SceneNode, graph: SceneGraph): Vector;
declare function getAbsoluteRotation(node: SceneNode, graph: SceneGraph): number;
declare function getAbsolutePositionFull(node: SceneNode, graph: SceneGraph): {
  x: number;
  y: number;
  boundX: number;
  boundY: number;
  width: number;
  height: number;
  rotation: number;
  centerX: number;
  centerY: number;
};
declare function getNodeLocalMatrix(n: SceneNode): Mat3;
declare function getNodeWorldBounds(node: SceneNode): {
  x: number;
  y: number;
  width: number;
  height: number;
};
declare function getWorldHandles(node: SceneNode, graph: SceneGraph): {
  nw: {
    x: number;
    y: number;
  };
  n: {
    x: number;
    y: number;
  };
  ne: {
    x: number;
    y: number;
  };
  e: {
    x: number;
    y: number;
  };
  se: {
    x: number;
    y: number;
  };
  s: {
    x: number;
    y: number;
  };
  sw: {
    x: number;
    y: number;
  };
  w: {
    x: number;
    y: number;
  };
};
//#endregion
export { FONT_WEIGHT_NAMES, FontFamilyStyle, MAX_EXPORT_SCALE, MIN_EXPORT_SCALE, NodeCloneMode, ParsedFontStyle, SceneGraph, SnapGuide, SnapResult, VisualBounds, VisualBoundsNode, clampExportScale, clipBoundsToPolygon, clipPolygon, cloneNodeProps, computeAbsoluteBounds, computeBounds, computeDescendantVisualBounds, computeSelectionBounds, computeSnap, computeVisualBounds, copyEffect, copyEffects, copyFill, copyFills, copyGeometryPaths, copyInstanceComponentProps, copyLayoutGrids, copyStroke, copyStrokes, copyStyleRun, copyStyleRuns, createInstance, degToRad, detachInstance, effectOverflow, generateId, geometryBlobBounds, getAbsolutePosition, getAbsolutePositionFull, getAbsoluteRotation, getInstances, getMainComponent, getNodeLocalMatrix, getNodeWorldBounds, getSharedStyles, getWorldHandles, getWorldMatrix, hasSameCopySource, intersectVisualBounds, isValidExportScale, markCopySource, nodeVisualBounds, normalizeFontFamily, normalizeFontStyleName, parseFontStyle, polygonVertices, populateInstanceChildren, radToDeg, rotatePoint, rotatedBBox, rotatedCorners, scaleGeometryPaths, sharedStyleRefKey, sharedStyleTypeForKind, strokeOverflow, styleDetachmentChanges, styleToVariant, styleToWeight, swapInstanceComponent, syncInstances, unionVisualBounds, weightToStyle };
//# sourceMappingURL=coordinate.d.ts.map
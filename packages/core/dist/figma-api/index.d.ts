import { SkiaRenderer } from "../canvas/renderer.js";
import { FigmaFont, FigmaFontName } from "./fonts.js";
import { FigmaNodeProxy, NodeProxyHost } from "./proxy.js";
import { RasterExportFormat } from "../io/formats/raster/render.js";
import { FigmaBooleanOperationNode, FigmaComponentNode, FigmaEllipseNode, FigmaFrameNode, FigmaGroupNode, FigmaLineNode, FigmaPolygonNode, FigmaRectangleNode, FigmaSectionNode, FigmaStarNode, FigmaTextNode, FigmaVectorNode } from "./node-types.js";
import { SceneGraph, Variable, VariableCollection, VariableType, VariableValue } from "@open-pencil/scene-graph";
import { computeImageHash } from "@open-pencil/scene-graph/images";
import { Rect, Vector as Vector$1 } from "@open-pencil/scene-graph/primitives";

//#region src/figma-api/index.d.ts
declare class FigmaAPI implements NodeProxyHost {
  readonly graph: SceneGraph;
  private _currentPageId;
  private _selection;
  private _nodeCache;
  private _pageProxies;
  private _renderer;
  readonly mixed: symbol;
  constructor(graph: SceneGraph);
  setRenderer(renderer: SkiaRenderer | null): void;
  get currentPageId(): string;
  wrapNode(id: string): FigmaNodeProxy;
  private _ensurePageProxy;
  get root(): FigmaNodeProxy;
  get currentPage(): FigmaNodeProxy & {
    selection: FigmaNodeProxy[];
  };
  set currentPage(page: FigmaNodeProxy);
  getNodeById(id: string): FigmaNodeProxy | null;
  private _createNode;
  createFrame(): FigmaFrameNode;
  createRectangle(): FigmaRectangleNode;
  createEllipse(): FigmaEllipseNode;
  createText(): FigmaTextNode;
  createLine(): FigmaLineNode;
  createPolygon(): FigmaPolygonNode;
  createStar(): FigmaStarNode;
  createVector(): FigmaVectorNode;
  createComponent(): FigmaComponentNode;
  createSection(): FigmaSectionNode;
  createPage(): FigmaNodeProxy;
  private _nodeId;
  group(nodes: ReadonlyArray<FigmaNodeProxy>, parent: FigmaNodeProxy, index?: number): FigmaGroupNode;
  group(nodes: ReadonlyArray<BaseNode>, parent: BaseNode & ChildrenMixin, index?: number): GroupNode;
  ungroup(node: FigmaNodeProxy): FigmaNodeProxy[];
  ungroup(node: SceneNode & ChildrenMixin): Array<SceneNode>;
  createComponentFromNode(node: FigmaNodeProxy): FigmaNodeProxy;
  getVariableById(id: string): Variable | null;
  getLocalVariables(type?: string): Variable[];
  getLocalVariableCollections(): VariableCollection[];
  getVariableCollectionById(id: string): VariableCollection | null;
  createVariable(name: string, type: VariableType, collectionId: string, value?: VariableValue): Variable;
  setVariableValue(variableId: string, modeId: string, value: VariableValue): void;
  deleteVariable(id: string): void;
  createVariableCollection(name: string): VariableCollection;
  deleteVariableCollection(id: string): void;
  bindVariable(nodeId: string, field: string, variableId: string): void;
  unbindVariable(nodeId: string, field: string): void;
  private _booleanOperation;
  private _nodesById;
  booleanOperation(operation: 'UNION' | 'SUBTRACT' | 'INTERSECT' | 'EXCLUDE', nodeIds: string[]): FigmaBooleanOperationNode;
  union(nodes: ReadonlyArray<BaseNode>, parent: BaseNode & ChildrenMixin, index?: number): BooleanOperationNode;
  subtract(nodes: ReadonlyArray<BaseNode>, parent: BaseNode & ChildrenMixin, index?: number): BooleanOperationNode;
  intersect(nodes: ReadonlyArray<BaseNode>, parent: BaseNode & ChildrenMixin, index?: number): BooleanOperationNode;
  exclude(nodes: ReadonlyArray<BaseNode>, parent: BaseNode & ChildrenMixin, index?: number): BooleanOperationNode;
  flatten(nodes: ReadonlyArray<FigmaNodeProxy>, parent?: FigmaNodeProxy, index?: number): FigmaVectorNode;
  flatten(nodes: ReadonlyArray<BaseNode>, parent?: BaseNode & ChildrenMixin, index?: number): VectorNode;
  private _flattenPlaceholder;
  private _flattenWithRenderer;
  flattenNode(nodeIds: string[]): FigmaVectorNode;
  private _viewport;
  get viewport(): {
    center: Vector$1;
    zoom: number;
    scrollAndZoomIntoView: (nodes: readonly {
      absoluteBoundingBox: Rect;
    }[]) => void;
  };
  set viewport(v: {
    center: Vector$1;
    zoom: number;
  });
  createImage(data: Uint8Array): {
    hash: string;
  };
  loadFontAsync(_fontName: FigmaFontName): Promise<void>;
  listAvailableFontsAsync(): Promise<FigmaFont[]>;
  base64Encode(data: Uint8Array): string;
  base64Decode(data: string): Uint8Array;
  notify(message: string): {
    cancel: () => void;
  };
  commitUndo(): void;
  triggerUndo(): void;
  exportImage?: (nodeIds: string[], options: {
    scale?: number;
    format?: RasterExportFormat;
    quality?: number;
  }) => Promise<Uint8Array | null>;
}
//#endregion
export { FigmaAPI, type FigmaBooleanOperationNode, type FigmaComponentNode, type FigmaEllipseNode, type FigmaFont, type FigmaFontName, type FigmaFrameNode, type FigmaGroupNode, type FigmaLineNode, FigmaNodeProxy, type FigmaPolygonNode, type FigmaRectangleNode, type FigmaSectionNode, type FigmaStarNode, type FigmaTextNode, type FigmaVectorNode, computeImageHash };
//# sourceMappingURL=index.d.ts.map
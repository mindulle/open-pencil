import { Color, GUID, Matrix, Vector } from "../types.js";
import { parseVariableId } from "../variable-bindings.js";

//#region src/fig/codec.d.ts
interface CompiledSchema {
  encodeMessage(message: unknown): Uint8Array;
  decodeMessage(data: Uint8Array): unknown;
  encodePaint(paint: unknown): Uint8Array;
  encodeNodeChange(nodeChange: unknown): Uint8Array;
}
/**
 * Initialize the codec (compiles Kiwi schema)
 */
declare function initCodec(): Promise<void>;
declare function getCompiledSchema(): CompiledSchema;
declare function getSchemaBytes(): Uint8Array;
/**
 * Check if codec is initialized
 */
declare function isCodecReady(): boolean;
/**
 * Compress data using Zstd (Bun native)
 */
declare function compress(data: Uint8Array): Uint8Array;
/**
 * Decompress Zstd data (Bun native)
 */
declare function decompress(data: Uint8Array): Uint8Array;
/**
 * Encode a message for sending to Figma
 * Handles variable bindings in fillPaints which require custom encoding
 */
declare function encodeMessage(message: FigmaMessage): Uint8Array;
/**
 * Decode a message received from Figma
 */
declare function decodeMessage(data: Uint8Array): FigmaMessage;
/**
 * Quick peek at message type without full decoding
 */
declare function peekMessageType(data: Uint8Array): number | null;
interface ParentIndex {
  guid: GUID;
  position: string;
}
interface VariableBinding {
  variableID: GUID;
}
interface Paint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE' | 'VIDEO' | 'PATTERN' | 'NOISE' | 'CUSTOM';
  color?: Color;
  opacity?: number;
  visible?: boolean;
  blendMode?: string;
  stops?: {
    color: Color;
    position: number;
  }[];
  transform?: Matrix;
  image?: {
    hash: string | Uint8Array;
  };
  imageScaleMode?: string;
  sourceNodeId?: GUID;
  scale?: number;
  spacing?: number;
  patternSpacing?: Vector;
  patternTileType?: string;
  verticalAlignment?: string;
  horizontalAlignment?: string;
  id?: GUID;
  altText?: string;
  noiseType?: string;
  density?: number;
  noiseSize?: Vector;
  customEffectId?: {
    guid?: GUID;
  };
  colorVariableBinding?: VariableBinding;
  colorVar?: {
    value?: {
      alias?: {
        guid?: GUID;
        assetRef?: {
          key: string;
          version?: string;
        };
      };
    };
    dataType?: string;
    resolvedDataType?: string;
  };
}
interface Effect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR' | 'FOREGROUND_BLUR';
  color?: Color;
  offset?: Vector;
  radius?: number;
  visible?: boolean;
  spread?: number;
  blendMode?: string;
  showShadowBehindNode?: boolean;
}
interface VariableAnyValue {
  boolValue?: boolean;
  textValue?: string;
  floatValue?: number;
  colorValue?: Color;
  alias?: {
    guid?: GUID;
    assetRef?: {
      key: string;
      version?: string;
    };
  };
  symbolIdValue?: {
    guid?: GUID;
  };
}
interface VariableDataEntry {
  value?: VariableAnyValue;
  dataType?: string;
  resolvedDataType?: string;
}
interface VariableConsumptionEntry {
  nodeField?: number;
  variableData?: VariableDataEntry;
  variableField?: string;
}
interface VariableDataValuesEntry {
  modeID: GUID;
  variableData: VariableDataEntry;
}
interface PluginData {
  pluginID: string;
  value: string;
  key: string;
}
interface PluginRelaunchData {
  pluginID: string;
  message: string;
  command: string;
  isDeleted: boolean;
}
interface AssetRef {
  key: string;
  version?: string;
}
type StyleReference = {
  guid: GUID;
  assetRef?: never;
} | {
  guid?: never;
  assetRef: AssetRef;
};
interface NodeChange {
  [key: string]: unknown;
  guid?: GUID;
  phase?: 'CREATED' | 'REMOVED';
  parentIndex?: ParentIndex;
  type?: string;
  name?: string;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
  blendMode?: string;
  size?: Vector;
  transform?: Matrix;
  cornerRadius?: number;
  fillPaints?: Paint[];
  strokePaints?: Paint[];
  backgroundPaints?: Paint[];
  strokeWeight?: number;
  strokeAlign?: string;
  strokeCap?: string;
  strokeJoin?: string;
  dashPattern?: number[];
  effects?: Effect[];
  mask?: boolean;
  maskType?: string;
  maskIsOutline?: boolean;
  exportSettings?: unknown[];
  layoutGrids?: unknown[];
  stackMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  stackSpacing?: number;
  stackPadding?: number;
  stackPaddingRight?: number;
  stackPaddingBottom?: number;
  stackCounterAlign?: string;
  stackJustify?: string;
  stackCounterAlignItems?: string;
  stackPrimaryAlignItems?: string;
  stackPrimarySizing?: 'FIXED' | 'RESIZE_TO_FIT' | 'RESIZE_TO_FIT_WITH_IMPLICIT_SIZE';
  stackCounterSizing?: 'FIXED' | 'RESIZE_TO_FIT' | 'RESIZE_TO_FIT_WITH_IMPLICIT_SIZE';
  stackVerticalPadding?: number;
  stackHorizontalPadding?: number;
  stackWrap?: string;
  stackPositioning?: string;
  stackChildPrimaryGrow?: number;
  stackChildAlignSelf?: string;
  stackCounterSpacing?: number;
  minSize?: {
    value?: Vector;
  };
  maxSize?: {
    value?: Vector;
  };
  clipsContent?: boolean;
  frameMaskDisabled?: boolean;
  resizeToFit?: boolean;
  booleanOperation?: 'UNION' | 'SUBTRACT' | 'INTERSECT' | 'XOR';
  vectorData?: unknown;
  fillGeometry?: Array<{
    windingRule?: string;
    commandsBlob?: number;
    styleID?: number;
  }>;
  strokeGeometry?: Array<{
    windingRule?: string;
    commandsBlob?: number;
  }>;
  fontSize?: number;
  fontWeight?: number;
  fontName?: {
    family: string;
    style: string;
    postscript?: string;
  };
  textAlignHorizontal?: string;
  textAlignVertical?: string;
  textAutoResize?: string;
  textData?: {
    characters: string;
    lines?: Array<{
      lineType?: string;
      styleId?: number;
      indentationLevel?: number;
    }>;
    characterStyleIDs?: number[];
    styleOverrideTable?: NodeChange[];
  };
  derivedTextData?: {
    layoutSize?: Vector;
    baselines?: Array<{
      firstCharacter: number;
      endCharacter: number;
      position: Vector;
      width: number;
      lineY?: number;
      lineHeight: number;
      lineAscent: number;
    }>;
    glyphs?: Array<{
      commandsBlob?: number;
      position: Vector;
      fontSize: number;
      firstCharacter: number;
      advance: number;
      rotation: number;
    }>;
    fontMetaData?: Array<{
      key: {
        family: string;
        style: string;
        postscript?: string;
      };
      fontLineHeight: number;
      fontDigest?: Uint8Array | Record<string, number>;
      fontStyle?: string;
      fontWeight?: number;
    }>;
    logicalIndexToCharacterOffsetMap?: number[];
    derivedLines?: Array<{
      directionality: 'LTR' | 'RTL';
    }>;
    truncationStartIndex?: number;
    truncatedHeight?: number;
  };
  styleType?: string;
  styleIdForText?: StyleReference;
  styleIdForFill?: StyleReference;
  styleIdForStrokeFill?: StyleReference;
  styleIdForEffect?: StyleReference;
  styleIdForGrid?: StyleReference;
  textUserLayoutVersion?: number;
  textExplicitLayoutVersion?: number;
  textBidiVersion?: number;
  textDecoration?: string;
  textDecorationSkipInk?: boolean;
  textDecorationFillPaints?: Paint[];
  textUnderlineOffset?: {
    value?: number;
    units?: string;
  };
  textDecorationThickness?: {
    value?: number;
    units?: string;
  };
  textDecorationStyle?: string;
  toggledOnOTFeatures?: string[];
  toggledOffOTFeatures?: string[];
  fontVariations?: Array<{
    axisTag?: number;
    axisName?: string;
    value?: number;
  }>;
  fontVariantCommonLigatures?: boolean;
  fontVariantContextualLigatures?: boolean;
  fontVariantDiscretionaryLigatures?: boolean;
  fontVariantHistoricalLigatures?: boolean;
  fontVariantOrdinal?: boolean;
  fontVariantSlashedZero?: boolean;
  fontVariantNumericFigure?: string;
  fontVariantNumericSpacing?: string;
  fontVariantNumericFraction?: string;
  fontVariantCaps?: string;
  fontVersion?: string;
  emojiImageSet?: string;
  lineHeight?: {
    value: number;
    units: string;
  };
  letterSpacing?: {
    value: number;
    units: string;
  };
  symbolData?: {
    symbolID: GUID;
  };
  isStateGroup?: boolean;
  stateGroupPropertyValueOrders?: Array<{
    property: string;
    values: string[];
  }>;
  internalOnly?: boolean;
  rectangleTopLeftCornerRadius?: number;
  rectangleTopRightCornerRadius?: number;
  rectangleBottomLeftCornerRadius?: number;
  rectangleBottomRightCornerRadius?: number;
  rectangleCornerRadiiIndependent?: boolean;
  cornerSmoothing?: number;
  horizontalConstraint?: string;
  verticalConstraint?: string;
  prototypeStartNodeID?: GUID;
  prototypeInteractions?: unknown[];
  transitionInfo?: unknown;
  variableData?: VariableDataEntry;
  variableConsumptionMap?: {
    entries?: VariableConsumptionEntry[];
  };
  variableSetModes?: Array<{
    id: GUID;
    name: string;
    sortPosition?: string;
  }>;
  variableSetID?: {
    guid?: GUID;
    assetRef?: {
      key: string;
      version?: string;
    };
  };
  variableResolvedType?: string;
  variableDataValues?: {
    entries?: VariableDataValuesEntry[];
  };
  variableScopes?: string[];
  documentColorProfile?: 'SRGB' | 'DISPLAY_P3';
  pluginData?: PluginData[];
  pluginRelaunchData?: PluginRelaunchData[];
}
interface FigmaMessage {
  type: string;
  sessionID?: number;
  ackID?: number;
  reconnectSequenceNumber?: number;
  nodeChanges?: NodeChange[];
  blobs?: Array<{
    bytes: Uint8Array;
  }>;
}
/**
 * Create a NODE_CHANGES message
 */
declare function createNodeChangesMessage(sessionID: number, reconnectSequenceNumber: number, nodeChanges: NodeChange[], ackID?: number): FigmaMessage;
/**
 * Create a node change for a new shape
 */
declare function createNodeChange(opts: {
  sessionID: number;
  localID: number;
  parentSessionID: number;
  parentLocalID: number;
  position?: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: Color;
  stroke?: Color;
  strokeWeight?: number;
  cornerRadius?: number;
  opacity?: number;
}): NodeChange;
/**
 * Encode a varint (variable-length integer)
 */
declare function encodePaintWithVariableBinding(paint: Paint, variableSessionID: number, variableLocalID: number): Uint8Array;
declare function encodeNodeChangeWithVariables(nodeChange: NodeChange): Uint8Array;
//#endregion
export { AssetRef, type Color, Effect, FigmaMessage, type GUID, type Matrix, NodeChange, Paint, ParentIndex, PluginData, PluginRelaunchData, StyleReference, VariableAnyValue, VariableBinding, VariableConsumptionEntry, VariableDataEntry, VariableDataValuesEntry, type Vector, compress, createNodeChange, createNodeChangesMessage, decodeMessage, decompress, encodeMessage, encodeNodeChangeWithVariables, encodePaintWithVariableBinding, getCompiledSchema, getSchemaBytes, initCodec, isCodecReady, parseVariableId, peekMessageType };
//# sourceMappingURL=codec.d.ts.map
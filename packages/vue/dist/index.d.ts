import { EDITOR_TOOLS, Editor, Editor as Editor$1, EditorEventName, EditorEventName as EditorEventName$1, EditorEvents, EditorEvents as EditorEvents$1, EditorOptions, EditorState, EditorToolDef, EditorToolDef as EditorToolDef$1, TOOL_SHORTCUTS, Tool, Tool as Tool$1, createEditor } from "@open-pencil/core/editor";
import { Component, ComputedRef, Directive, InjectionKey, MaybeRefOrGetter, Ref, ShallowUnwrapRef, VNode } from "vue";
import { BlendMode, ComponentPropertyDefinition, ComponentPropertyType, ConstraintType, Effect, ExportFormatId, ExportFormatId as ExportFormatId$1, ExportSetting, Fill, GeometryPath, GradientStop, GridTrack, LayoutAlign, LayoutCounterAlign, MaskType, SceneGraph, SceneGraphEvents, SceneNode, SharedStyleKind, Stroke, Variable, VariableCollection, VariableType, VariableValue, VectorNetwork, VectorRegion, VectorSegment, VectorVertex, clampExportScale } from "@open-pencil/scene-graph";
import { ResizeSnapshot } from "@open-pencil/scene-graph/resize";
import { Store, StoreValue } from "nanostores";
import { FontFamilyOption, FontFamilyOption as FontFamilyOption$1 } from "@open-pencil/core/text";
import { AcceptableValue, Color, PrimitiveProps } from "reka-ui";
import { OkHCLColor, RenderColorSpace } from "@open-pencil/core/color";
import { Color as Color$1, Rect, Vector } from "@open-pencil/scene-graph/primitives";
import { Canvas, CanvasKit, Font, FontMgr, Image, ImageFilter, MaskFilter, Paint, Paragraph, Path, SkPicture, Surface, Typeface, TypefaceFontProvider } from "canvaskit-wasm";
import { SnapGuide } from "@open-pencil/scene-graph/snap";

//#region src/editor/context/index.d.ts
/**
 * Injection key for the current OpenPencil editor instance.
 *
 * Most SDK consumers should use {@link provideEditor} and {@link useEditor}
 * instead of interacting with this symbol directly.
 */
declare const EDITOR_KEY: InjectionKey<Editor$1>;
/**
 * Provides an OpenPencil editor instance to the current Vue subtree.
 *
 * Call this once near the top of your editor shell so descendant composables
 * and headless primitives can access the editor with {@link useEditor}.
 */
declare function provideEditor(editor: Editor$1): void;
/**
 * Returns the current injected OpenPencil editor.
 *
 * Throws if called outside a subtree where {@link provideEditor} has already
 * been called.
 */
declare function useEditor(): Editor$1;
//#endregion
//#region src/canvas/surface/types.d.ts
/**
 * Options for {@link useCanvas}.
 */
type CanvasRenderLayer = 'full' | 'scene' | 'overlays';
interface UseCanvasOptions {
  /**
   * Selects which render layer this canvas owns.
   */
  layer?: CanvasRenderLayer;
  /**
   * Forces ruler visibility on or off for this canvas.
   *
   * When omitted, the composable falls back to viewport and URL-param logic.
   */
  showRulers?: boolean;
  /**
   * Keeps the drawing buffer after presenting frames.
   *
   * Useful for screenshot or pixel-readback workflows, but may increase memory
   * usage depending on the browser and GPU backend.
   */
  preserveDrawingBuffer?: boolean;
  /**
   * Called once the rendering surface is ready.
   */
  onReady?: () => void;
}
//#endregion
//#region src/canvas/surface/use.d.ts
/**
 * Connects an OpenPencil editor to a real canvas element using CanvasKit.
 *
 * This composable owns renderer creation, surface recreation on resize,
 * render scheduling, and renderer-backed hit testing helpers used by higher-
 * level canvas interaction code.
 */
declare function useCanvas(canvasRef: Ref<HTMLCanvasElement | null>, editor: Editor$1, options?: UseCanvasOptions): {
  render: () => void;
  renderNow: () => void;
  hitTestSectionTitle: (canvasX: number, canvasY: number) => import("@open-pencil/scene-graph").SceneNode | null;
  hitTestComponentLabel: (canvasX: number, canvasY: number) => import("@open-pencil/scene-graph").SceneNode | null;
  hitTestFrameTitle: (canvasX: number, canvasY: number) => import("@open-pencil/scene-graph").SceneNode | null;
};
//#endregion
//#region src/shared/input/types.d.ts
type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
interface DragDraw {
  type: 'draw';
  startX: number;
  startY: number;
  nodeId: string;
}
interface DragMove {
  type: 'move';
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startScreenX: number;
  startScreenY: number;
  dragStarted: boolean;
  originals: Map<string, {
    x: number;
    y: number;
    parentId: string;
  }>;
  duplicated?: boolean;
  duplicatedPreviousSelection?: Set<string>;
  autoLayoutParentId?: string;
  brokeFromAutoLayout?: boolean;
}
interface DragPan {
  type: 'pan';
  startScreenX: number;
  startScreenY: number;
  startPanX: number;
  startPanY: number;
}
interface DragResize {
  type: 'resize';
  handle: HandlePosition;
  startX: number;
  startY: number;
  origRect: Rect;
  nodeId: string;
  origVectorNetwork: VectorNetwork | null;
  origFillGeometry: GeometryPath[];
  origStrokeGeometry: GeometryPath[];
  origChildren: Map<string, ResizeSnapshot> | null;
}
interface DragMarquee {
  type: 'marquee';
  startX: number;
  startY: number;
}
interface DragRotate {
  type: 'rotate';
  nodeId: string;
  centerX: number;
  centerY: number;
  startAngle: number;
  origRotation: number;
}
interface DragPen {
  type: 'pen-drag';
  startX: number;
  startY: number;
  modifierMode: 'default' | 'continuous' | 'independent';
  frozenOppositeTangent: Vector | null;
  spaceDown: boolean;
  spaceStartX: number;
  spaceStartY: number;
  knotStartX: number;
  knotStartY: number;
}
interface DragTextSelect {
  type: 'text-select';
  startX: number;
  startY: number;
}
interface DragEditNode {
  type: 'edit-node';
  startX: number;
  startY: number;
  origPositions: Map<number, Vector>;
}
interface DragEditHandle {
  type: 'edit-handle';
  segmentIndex: number;
  tangentField: 'tangentStart' | 'tangentEnd';
  vertexIndex: number;
  startX: number;
  startY: number;
  initialTangent: Vector | null;
}
interface DragBendHandle {
  type: 'bend-handle';
  vertexIndex: number;
  startX: number;
  startY: number;
  lockedMode: 'symmetric' | 'independent' | null;
  dragSamples: Vector[];
  targetSegmentIndex: number | null;
  targetTangentField: 'tangentStart' | 'tangentEnd' | null;
}
type DragState = DragDraw | DragMove | DragPan | DragResize | DragMarquee | DragRotate | DragPen | DragTextSelect | DragEditNode | DragEditHandle | DragBendHandle;
//#endregion
//#region src/canvas/useCanvasInput.d.ts
/**
 * Wires pointer and mouse interaction to an OpenPencil canvas.
 *
 * This composable coordinates selection, dragging, resizing, rotation,
 * panning, drawing tools, scoped hit testing, and text-edit interaction.
 * It is primarily intended for editor shell components that own the canvas.
 */
declare function useCanvasInput(canvasRef: Ref<HTMLCanvasElement | null>, editor: Editor$1, hitTestSectionTitle: (cx: number, cy: number) => SceneNode | null, hitTestComponentLabel: (cx: number, cy: number) => SceneNode | null, hitTestFrameTitle: (cx: number, cy: number) => SceneNode | null, onCursorMove?: (cx: number, cy: number) => void): {
  drag: Ref<{
    type: "draw";
    startX: number;
    startY: number;
    nodeId: string;
  } | {
    type: "move";
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    startScreenX: number;
    startScreenY: number;
    dragStarted: boolean;
    originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }> & Omit<Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>, keyof Map<any, any>>;
    duplicated?: boolean | undefined;
    duplicatedPreviousSelection?: (Set<string> & Omit<Set<string>, keyof Set<any>>) | undefined;
    autoLayoutParentId?: string | undefined;
    brokeFromAutoLayout?: boolean | undefined;
  } | {
    type: "pan";
    startScreenX: number;
    startScreenY: number;
    startPanX: number;
    startPanY: number;
  } | {
    type: "resize";
    handle: HandlePosition;
    startX: number;
    startY: number;
    origRect: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    nodeId: string;
    origVectorNetwork: {
      vertices: {
        x: number;
        y: number;
        strokeCap?: string | undefined;
        strokeJoin?: string | undefined;
        cornerRadius?: number | undefined;
        handleMirroring?: import("@open-pencil/scene-graph").HandleMirroring | undefined;
      }[];
      segments: {
        start: number;
        end: number;
        tangentStart: {
          x: number;
          y: number;
        };
        tangentEnd: {
          x: number;
          y: number;
        };
      }[];
      regions: {
        windingRule: import("@open-pencil/scene-graph").WindingRule;
        loops: number[][];
      }[];
    } | null;
    origFillGeometry: {
      windingRule: import("@open-pencil/scene-graph").WindingRule;
      commandsBlob: {
        [x: number]: number;
        readonly BYTES_PER_ELEMENT: number;
        readonly buffer: {
          readonly byteLength: number;
          slice: (begin?: number, end?: number) => ArrayBuffer;
          readonly maxByteLength: number;
          readonly resizable: boolean;
          resize: (newByteLength?: number) => void;
          readonly detached: boolean;
          transfer: (newByteLength?: number) => ArrayBuffer;
          transferToFixedLength: (newByteLength?: number) => ArrayBuffer;
          readonly [Symbol.toStringTag]: string;
        } | {
          readonly byteLength: number;
          slice: (begin?: number, end?: number) => SharedArrayBuffer;
          readonly growable: boolean;
          readonly maxByteLength: number;
          grow: (newByteLength?: number) => void;
          readonly [Symbol.species]: SharedArrayBuffer;
          readonly [Symbol.toStringTag]: "SharedArrayBuffer";
        };
        readonly byteLength: number;
        readonly byteOffset: number;
        copyWithin: (target: number, start: number, end?: number) => Uint8Array<ArrayBufferLike>;
        every: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
        fill: (value: number, start?: number, end?: number) => Uint8Array<ArrayBufferLike>;
        filter: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => any, thisArg?: any) => Uint8Array<ArrayBuffer>;
        find: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number | undefined;
        findIndex: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number;
        forEach: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => void, thisArg?: any) => void;
        indexOf: (searchElement: number, fromIndex?: number) => number;
        join: (separator?: string) => string;
        lastIndexOf: (searchElement: number, fromIndex?: number) => number;
        readonly length: number;
        map: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => number, thisArg?: any) => Uint8Array<ArrayBuffer>;
        reduce: {
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
          <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
        };
        reduceRight: {
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
          <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
        };
        reverse: () => Uint8Array<ArrayBufferLike>;
        set: (array: ArrayLike<number>, offset?: number) => void;
        slice: (start?: number, end?: number) => Uint8Array<ArrayBuffer>;
        some: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
        sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBufferLike>;
        subarray: (begin?: number, end?: number) => Uint8Array<ArrayBufferLike>;
        toLocaleString: {
          (): string;
          (locales: string | string[], options?: Intl.NumberFormatOptions): string;
        };
        toString: () => string;
        valueOf: () => Uint8Array<ArrayBufferLike>;
        entries: () => ArrayIterator<[number, number]>;
        keys: () => ArrayIterator<number>;
        values: () => ArrayIterator<number>;
        includes: (searchElement: number, fromIndex?: number) => boolean;
        at: (index: number) => number | undefined;
        findLast: {
          <S extends number>(predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => value is S, thisArg?: any): S | undefined;
          (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any): number | undefined;
        };
        findLastIndex: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => number;
        toReversed: () => Uint8Array<ArrayBuffer>;
        toSorted: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBuffer>;
        with: (index: number, value: number) => Uint8Array<ArrayBuffer>;
        [Symbol.iterator]: () => ArrayIterator<number>;
        readonly [Symbol.toStringTag]: "Uint8Array";
      };
      fills?: {
        type: import("@open-pencil/scene-graph").FillType;
        color: {
          r: number;
          g: number;
          b: number;
          a: number;
        };
        opacity: number;
        visible: boolean;
        blendMode?: import("@open-pencil/scene-graph").BlendMode | undefined;
        gradientStops?: {
          color: {
            r: number;
            g: number;
            b: number;
            a: number;
          };
          position: number;
        }[] | undefined;
        gradientTransform?: {
          m00: number;
          m01: number;
          m02: number;
          m10: number;
          m11: number;
          m12: number;
        } | undefined;
        imageHash?: string | undefined;
        imageScaleMode?: import("@open-pencil/scene-graph").ImageScaleMode | undefined;
        imageTransform?: {
          m00: number;
          m01: number;
          m02: number;
          m10: number;
          m11: number;
          m12: number;
        } | undefined;
        sourceNodeId?: string | undefined;
        scale?: number | undefined;
        spacing?: number | undefined;
        patternSpacing?: {
          x: number;
          y: number;
        } | undefined;
        patternTileType?: import("@open-pencil/scene-graph").PatternTileType | undefined;
        verticalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
        horizontalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
        noiseType?: import("@open-pencil/scene-graph").NoiseType | undefined;
        density?: number | undefined;
        noiseSize?: {
          x: number;
          y: number;
        } | undefined;
        customEffectId?: string | undefined;
      }[] | undefined;
      fillStyleId?: string | undefined;
    }[];
    origStrokeGeometry: {
      windingRule: import("@open-pencil/scene-graph").WindingRule;
      commandsBlob: {
        [x: number]: number;
        readonly BYTES_PER_ELEMENT: number;
        readonly buffer: {
          readonly byteLength: number;
          slice: (begin?: number, end?: number) => ArrayBuffer;
          readonly maxByteLength: number;
          readonly resizable: boolean;
          resize: (newByteLength?: number) => void;
          readonly detached: boolean;
          transfer: (newByteLength?: number) => ArrayBuffer;
          transferToFixedLength: (newByteLength?: number) => ArrayBuffer;
          readonly [Symbol.toStringTag]: string;
        } | {
          readonly byteLength: number;
          slice: (begin?: number, end?: number) => SharedArrayBuffer;
          readonly growable: boolean;
          readonly maxByteLength: number;
          grow: (newByteLength?: number) => void;
          readonly [Symbol.species]: SharedArrayBuffer;
          readonly [Symbol.toStringTag]: "SharedArrayBuffer";
        };
        readonly byteLength: number;
        readonly byteOffset: number;
        copyWithin: (target: number, start: number, end?: number) => Uint8Array<ArrayBufferLike>;
        every: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
        fill: (value: number, start?: number, end?: number) => Uint8Array<ArrayBufferLike>;
        filter: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => any, thisArg?: any) => Uint8Array<ArrayBuffer>;
        find: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number | undefined;
        findIndex: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number;
        forEach: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => void, thisArg?: any) => void;
        indexOf: (searchElement: number, fromIndex?: number) => number;
        join: (separator?: string) => string;
        lastIndexOf: (searchElement: number, fromIndex?: number) => number;
        readonly length: number;
        map: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => number, thisArg?: any) => Uint8Array<ArrayBuffer>;
        reduce: {
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
          <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
        };
        reduceRight: {
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
          <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
        };
        reverse: () => Uint8Array<ArrayBufferLike>;
        set: (array: ArrayLike<number>, offset?: number) => void;
        slice: (start?: number, end?: number) => Uint8Array<ArrayBuffer>;
        some: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
        sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBufferLike>;
        subarray: (begin?: number, end?: number) => Uint8Array<ArrayBufferLike>;
        toLocaleString: {
          (): string;
          (locales: string | string[], options?: Intl.NumberFormatOptions): string;
        };
        toString: () => string;
        valueOf: () => Uint8Array<ArrayBufferLike>;
        entries: () => ArrayIterator<[number, number]>;
        keys: () => ArrayIterator<number>;
        values: () => ArrayIterator<number>;
        includes: (searchElement: number, fromIndex?: number) => boolean;
        at: (index: number) => number | undefined;
        findLast: {
          <S extends number>(predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => value is S, thisArg?: any): S | undefined;
          (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any): number | undefined;
        };
        findLastIndex: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => number;
        toReversed: () => Uint8Array<ArrayBuffer>;
        toSorted: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBuffer>;
        with: (index: number, value: number) => Uint8Array<ArrayBuffer>;
        [Symbol.iterator]: () => ArrayIterator<number>;
        readonly [Symbol.toStringTag]: "Uint8Array";
      };
      fills?: {
        type: import("@open-pencil/scene-graph").FillType;
        color: {
          r: number;
          g: number;
          b: number;
          a: number;
        };
        opacity: number;
        visible: boolean;
        blendMode?: import("@open-pencil/scene-graph").BlendMode | undefined;
        gradientStops?: {
          color: {
            r: number;
            g: number;
            b: number;
            a: number;
          };
          position: number;
        }[] | undefined;
        gradientTransform?: {
          m00: number;
          m01: number;
          m02: number;
          m10: number;
          m11: number;
          m12: number;
        } | undefined;
        imageHash?: string | undefined;
        imageScaleMode?: import("@open-pencil/scene-graph").ImageScaleMode | undefined;
        imageTransform?: {
          m00: number;
          m01: number;
          m02: number;
          m10: number;
          m11: number;
          m12: number;
        } | undefined;
        sourceNodeId?: string | undefined;
        scale?: number | undefined;
        spacing?: number | undefined;
        patternSpacing?: {
          x: number;
          y: number;
        } | undefined;
        patternTileType?: import("@open-pencil/scene-graph").PatternTileType | undefined;
        verticalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
        horizontalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
        noiseType?: import("@open-pencil/scene-graph").NoiseType | undefined;
        density?: number | undefined;
        noiseSize?: {
          x: number;
          y: number;
        } | undefined;
        customEffectId?: string | undefined;
      }[] | undefined;
      fillStyleId?: string | undefined;
    }[];
    origChildren: (Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: {
        vertices: {
          x: number;
          y: number;
          strokeCap?: string | undefined;
          strokeJoin?: string | undefined;
          cornerRadius?: number | undefined;
          handleMirroring?: import("@open-pencil/scene-graph").HandleMirroring | undefined;
        }[];
        segments: {
          start: number;
          end: number;
          tangentStart: {
            x: number;
            y: number;
          };
          tangentEnd: {
            x: number;
            y: number;
          };
        }[];
        regions: {
          windingRule: import("@open-pencil/scene-graph").WindingRule;
          loops: number[][];
        }[];
      } | null;
      fillGeometry: {
        windingRule: import("@open-pencil/scene-graph").WindingRule;
        commandsBlob: {
          [x: number]: number;
          readonly BYTES_PER_ELEMENT: number;
          readonly buffer: {
            readonly byteLength: number;
            slice: (begin?: number, end?: number) => ArrayBuffer;
            readonly maxByteLength: number;
            readonly resizable: boolean;
            resize: (newByteLength?: number) => void;
            readonly detached: boolean;
            transfer: (newByteLength?: number) => ArrayBuffer;
            transferToFixedLength: (newByteLength?: number) => ArrayBuffer;
            readonly [Symbol.toStringTag]: string;
          } | {
            readonly byteLength: number;
            slice: (begin?: number, end?: number) => SharedArrayBuffer;
            readonly growable: boolean;
            readonly maxByteLength: number;
            grow: (newByteLength?: number) => void;
            readonly [Symbol.species]: SharedArrayBuffer;
            readonly [Symbol.toStringTag]: "SharedArrayBuffer";
          };
          readonly byteLength: number;
          readonly byteOffset: number;
          copyWithin: (target: number, start: number, end?: number) => Uint8Array<ArrayBufferLike>;
          every: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
          fill: (value: number, start?: number, end?: number) => Uint8Array<ArrayBufferLike>;
          filter: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => any, thisArg?: any) => Uint8Array<ArrayBuffer>;
          find: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number | undefined;
          findIndex: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number;
          forEach: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => void, thisArg?: any) => void;
          indexOf: (searchElement: number, fromIndex?: number) => number;
          join: (separator?: string) => string;
          lastIndexOf: (searchElement: number, fromIndex?: number) => number;
          readonly length: number;
          map: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => number, thisArg?: any) => Uint8Array<ArrayBuffer>;
          reduce: {
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
            <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
          };
          reduceRight: {
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
            <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
          };
          reverse: () => Uint8Array<ArrayBufferLike>;
          set: (array: ArrayLike<number>, offset?: number) => void;
          slice: (start?: number, end?: number) => Uint8Array<ArrayBuffer>;
          some: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
          sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBufferLike>;
          subarray: (begin?: number, end?: number) => Uint8Array<ArrayBufferLike>;
          toLocaleString: {
            (): string;
            (locales: string | string[], options?: Intl.NumberFormatOptions): string;
          };
          toString: () => string;
          valueOf: () => Uint8Array<ArrayBufferLike>;
          entries: () => ArrayIterator<[number, number]>;
          keys: () => ArrayIterator<number>;
          values: () => ArrayIterator<number>;
          includes: (searchElement: number, fromIndex?: number) => boolean;
          at: (index: number) => number | undefined;
          findLast: {
            <S extends number>(predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => value is S, thisArg?: any): S | undefined;
            (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any): number | undefined;
          };
          findLastIndex: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => number;
          toReversed: () => Uint8Array<ArrayBuffer>;
          toSorted: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBuffer>;
          with: (index: number, value: number) => Uint8Array<ArrayBuffer>;
          [Symbol.iterator]: () => ArrayIterator<number>;
          readonly [Symbol.toStringTag]: "Uint8Array";
        };
        fills?: {
          type: import("@open-pencil/scene-graph").FillType;
          color: {
            r: number;
            g: number;
            b: number;
            a: number;
          };
          opacity: number;
          visible: boolean;
          blendMode?: import("@open-pencil/scene-graph").BlendMode | undefined;
          gradientStops?: {
            color: {
              r: number;
              g: number;
              b: number;
              a: number;
            };
            position: number;
          }[] | undefined;
          gradientTransform?: {
            m00: number;
            m01: number;
            m02: number;
            m10: number;
            m11: number;
            m12: number;
          } | undefined;
          imageHash?: string | undefined;
          imageScaleMode?: import("@open-pencil/scene-graph").ImageScaleMode | undefined;
          imageTransform?: {
            m00: number;
            m01: number;
            m02: number;
            m10: number;
            m11: number;
            m12: number;
          } | undefined;
          sourceNodeId?: string | undefined;
          scale?: number | undefined;
          spacing?: number | undefined;
          patternSpacing?: {
            x: number;
            y: number;
          } | undefined;
          patternTileType?: import("@open-pencil/scene-graph").PatternTileType | undefined;
          verticalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
          horizontalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
          noiseType?: import("@open-pencil/scene-graph").NoiseType | undefined;
          density?: number | undefined;
          noiseSize?: {
            x: number;
            y: number;
          } | undefined;
          customEffectId?: string | undefined;
        }[] | undefined;
        fillStyleId?: string | undefined;
      }[];
      strokeGeometry: {
        windingRule: import("@open-pencil/scene-graph").WindingRule;
        commandsBlob: {
          [x: number]: number;
          readonly BYTES_PER_ELEMENT: number;
          readonly buffer: {
            readonly byteLength: number;
            slice: (begin?: number, end?: number) => ArrayBuffer;
            readonly maxByteLength: number;
            readonly resizable: boolean;
            resize: (newByteLength?: number) => void;
            readonly detached: boolean;
            transfer: (newByteLength?: number) => ArrayBuffer;
            transferToFixedLength: (newByteLength?: number) => ArrayBuffer;
            readonly [Symbol.toStringTag]: string;
          } | {
            readonly byteLength: number;
            slice: (begin?: number, end?: number) => SharedArrayBuffer;
            readonly growable: boolean;
            readonly maxByteLength: number;
            grow: (newByteLength?: number) => void;
            readonly [Symbol.species]: SharedArrayBuffer;
            readonly [Symbol.toStringTag]: "SharedArrayBuffer";
          };
          readonly byteLength: number;
          readonly byteOffset: number;
          copyWithin: (target: number, start: number, end?: number) => Uint8Array<ArrayBufferLike>;
          every: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
          fill: (value: number, start?: number, end?: number) => Uint8Array<ArrayBufferLike>;
          filter: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => any, thisArg?: any) => Uint8Array<ArrayBuffer>;
          find: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number | undefined;
          findIndex: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number;
          forEach: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => void, thisArg?: any) => void;
          indexOf: (searchElement: number, fromIndex?: number) => number;
          join: (separator?: string) => string;
          lastIndexOf: (searchElement: number, fromIndex?: number) => number;
          readonly length: number;
          map: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => number, thisArg?: any) => Uint8Array<ArrayBuffer>;
          reduce: {
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
            <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
          };
          reduceRight: {
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
            <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
          };
          reverse: () => Uint8Array<ArrayBufferLike>;
          set: (array: ArrayLike<number>, offset?: number) => void;
          slice: (start?: number, end?: number) => Uint8Array<ArrayBuffer>;
          some: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
          sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBufferLike>;
          subarray: (begin?: number, end?: number) => Uint8Array<ArrayBufferLike>;
          toLocaleString: {
            (): string;
            (locales: string | string[], options?: Intl.NumberFormatOptions): string;
          };
          toString: () => string;
          valueOf: () => Uint8Array<ArrayBufferLike>;
          entries: () => ArrayIterator<[number, number]>;
          keys: () => ArrayIterator<number>;
          values: () => ArrayIterator<number>;
          includes: (searchElement: number, fromIndex?: number) => boolean;
          at: (index: number) => number | undefined;
          findLast: {
            <S extends number>(predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => value is S, thisArg?: any): S | undefined;
            (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any): number | undefined;
          };
          findLastIndex: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => number;
          toReversed: () => Uint8Array<ArrayBuffer>;
          toSorted: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBuffer>;
          with: (index: number, value: number) => Uint8Array<ArrayBuffer>;
          [Symbol.iterator]: () => ArrayIterator<number>;
          readonly [Symbol.toStringTag]: "Uint8Array";
        };
        fills?: {
          type: import("@open-pencil/scene-graph").FillType;
          color: {
            r: number;
            g: number;
            b: number;
            a: number;
          };
          opacity: number;
          visible: boolean;
          blendMode?: import("@open-pencil/scene-graph").BlendMode | undefined;
          gradientStops?: {
            color: {
              r: number;
              g: number;
              b: number;
              a: number;
            };
            position: number;
          }[] | undefined;
          gradientTransform?: {
            m00: number;
            m01: number;
            m02: number;
            m10: number;
            m11: number;
            m12: number;
          } | undefined;
          imageHash?: string | undefined;
          imageScaleMode?: import("@open-pencil/scene-graph").ImageScaleMode | undefined;
          imageTransform?: {
            m00: number;
            m01: number;
            m02: number;
            m10: number;
            m11: number;
            m12: number;
          } | undefined;
          sourceNodeId?: string | undefined;
          scale?: number | undefined;
          spacing?: number | undefined;
          patternSpacing?: {
            x: number;
            y: number;
          } | undefined;
          patternTileType?: import("@open-pencil/scene-graph").PatternTileType | undefined;
          verticalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
          horizontalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
          noiseType?: import("@open-pencil/scene-graph").NoiseType | undefined;
          density?: number | undefined;
          noiseSize?: {
            x: number;
            y: number;
          } | undefined;
          customEffectId?: string | undefined;
        }[] | undefined;
        fillStyleId?: string | undefined;
      }[];
    }> & Omit<Map<string, import("@open-pencil/scene-graph/resize").ResizeSnapshot>, keyof Map<any, any>>) | null;
  } | {
    type: "marquee";
    startX: number;
    startY: number;
  } | {
    type: "rotate";
    nodeId: string;
    centerX: number;
    centerY: number;
    startAngle: number;
    origRotation: number;
  } | {
    type: "pen-drag";
    startX: number;
    startY: number;
    modifierMode: "default" | "continuous" | "independent";
    frozenOppositeTangent: {
      x: number;
      y: number;
    } | null;
    spaceDown: boolean;
    spaceStartX: number;
    spaceStartY: number;
    knotStartX: number;
    knotStartY: number;
  } | {
    type: "text-select";
    startX: number;
    startY: number;
  } | {
    type: "edit-node";
    startX: number;
    startY: number;
    origPositions: Map<number, {
      x: number;
      y: number;
    }> & Omit<Map<number, import("@open-pencil/scene-graph").Vector>, keyof Map<any, any>>;
  } | {
    type: "edit-handle";
    segmentIndex: number;
    tangentField: "tangentStart" | "tangentEnd";
    vertexIndex: number;
    startX: number;
    startY: number;
    initialTangent: {
      x: number;
      y: number;
    } | null;
  } | {
    type: "bend-handle";
    vertexIndex: number;
    startX: number;
    startY: number;
    lockedMode: "symmetric" | "independent" | null;
    dragSamples: {
      x: number;
      y: number;
    }[];
    targetSegmentIndex: number | null;
    targetTangentField: "tangentStart" | "tangentEnd" | null;
  } | null, DragState | {
    type: "draw";
    startX: number;
    startY: number;
    nodeId: string;
  } | {
    type: "move";
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    startScreenX: number;
    startScreenY: number;
    dragStarted: boolean;
    originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }> & Omit<Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>, keyof Map<any, any>>;
    duplicated?: boolean | undefined;
    duplicatedPreviousSelection?: (Set<string> & Omit<Set<string>, keyof Set<any>>) | undefined;
    autoLayoutParentId?: string | undefined;
    brokeFromAutoLayout?: boolean | undefined;
  } | {
    type: "pan";
    startScreenX: number;
    startScreenY: number;
    startPanX: number;
    startPanY: number;
  } | {
    type: "resize";
    handle: HandlePosition;
    startX: number;
    startY: number;
    origRect: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    nodeId: string;
    origVectorNetwork: {
      vertices: {
        x: number;
        y: number;
        strokeCap?: string | undefined;
        strokeJoin?: string | undefined;
        cornerRadius?: number | undefined;
        handleMirroring?: import("@open-pencil/scene-graph").HandleMirroring | undefined;
      }[];
      segments: {
        start: number;
        end: number;
        tangentStart: {
          x: number;
          y: number;
        };
        tangentEnd: {
          x: number;
          y: number;
        };
      }[];
      regions: {
        windingRule: import("@open-pencil/scene-graph").WindingRule;
        loops: number[][];
      }[];
    } | null;
    origFillGeometry: {
      windingRule: import("@open-pencil/scene-graph").WindingRule;
      commandsBlob: {
        [x: number]: number;
        readonly BYTES_PER_ELEMENT: number;
        readonly buffer: {
          readonly byteLength: number;
          slice: (begin?: number, end?: number) => ArrayBuffer;
          readonly maxByteLength: number;
          readonly resizable: boolean;
          resize: (newByteLength?: number) => void;
          readonly detached: boolean;
          transfer: (newByteLength?: number) => ArrayBuffer;
          transferToFixedLength: (newByteLength?: number) => ArrayBuffer;
          readonly [Symbol.toStringTag]: string;
        } | {
          readonly byteLength: number;
          slice: (begin?: number, end?: number) => SharedArrayBuffer;
          readonly growable: boolean;
          readonly maxByteLength: number;
          grow: (newByteLength?: number) => void;
          readonly [Symbol.species]: SharedArrayBuffer;
          readonly [Symbol.toStringTag]: "SharedArrayBuffer";
        };
        readonly byteLength: number;
        readonly byteOffset: number;
        copyWithin: (target: number, start: number, end?: number) => Uint8Array<ArrayBufferLike>;
        every: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
        fill: (value: number, start?: number, end?: number) => Uint8Array<ArrayBufferLike>;
        filter: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => any, thisArg?: any) => Uint8Array<ArrayBuffer>;
        find: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number | undefined;
        findIndex: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number;
        forEach: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => void, thisArg?: any) => void;
        indexOf: (searchElement: number, fromIndex?: number) => number;
        join: (separator?: string) => string;
        lastIndexOf: (searchElement: number, fromIndex?: number) => number;
        readonly length: number;
        map: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => number, thisArg?: any) => Uint8Array<ArrayBuffer>;
        reduce: {
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
          <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
        };
        reduceRight: {
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
          <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
        };
        reverse: () => Uint8Array<ArrayBufferLike>;
        set: (array: ArrayLike<number>, offset?: number) => void;
        slice: (start?: number, end?: number) => Uint8Array<ArrayBuffer>;
        some: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
        sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBufferLike>;
        subarray: (begin?: number, end?: number) => Uint8Array<ArrayBufferLike>;
        toLocaleString: {
          (): string;
          (locales: string | string[], options?: Intl.NumberFormatOptions): string;
        };
        toString: () => string;
        valueOf: () => Uint8Array<ArrayBufferLike>;
        entries: () => ArrayIterator<[number, number]>;
        keys: () => ArrayIterator<number>;
        values: () => ArrayIterator<number>;
        includes: (searchElement: number, fromIndex?: number) => boolean;
        at: (index: number) => number | undefined;
        findLast: {
          <S extends number>(predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => value is S, thisArg?: any): S | undefined;
          (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any): number | undefined;
        };
        findLastIndex: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => number;
        toReversed: () => Uint8Array<ArrayBuffer>;
        toSorted: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBuffer>;
        with: (index: number, value: number) => Uint8Array<ArrayBuffer>;
        [Symbol.iterator]: () => ArrayIterator<number>;
        readonly [Symbol.toStringTag]: "Uint8Array";
      };
      fills?: {
        type: import("@open-pencil/scene-graph").FillType;
        color: {
          r: number;
          g: number;
          b: number;
          a: number;
        };
        opacity: number;
        visible: boolean;
        blendMode?: import("@open-pencil/scene-graph").BlendMode | undefined;
        gradientStops?: {
          color: {
            r: number;
            g: number;
            b: number;
            a: number;
          };
          position: number;
        }[] | undefined;
        gradientTransform?: {
          m00: number;
          m01: number;
          m02: number;
          m10: number;
          m11: number;
          m12: number;
        } | undefined;
        imageHash?: string | undefined;
        imageScaleMode?: import("@open-pencil/scene-graph").ImageScaleMode | undefined;
        imageTransform?: {
          m00: number;
          m01: number;
          m02: number;
          m10: number;
          m11: number;
          m12: number;
        } | undefined;
        sourceNodeId?: string | undefined;
        scale?: number | undefined;
        spacing?: number | undefined;
        patternSpacing?: {
          x: number;
          y: number;
        } | undefined;
        patternTileType?: import("@open-pencil/scene-graph").PatternTileType | undefined;
        verticalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
        horizontalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
        noiseType?: import("@open-pencil/scene-graph").NoiseType | undefined;
        density?: number | undefined;
        noiseSize?: {
          x: number;
          y: number;
        } | undefined;
        customEffectId?: string | undefined;
      }[] | undefined;
      fillStyleId?: string | undefined;
    }[];
    origStrokeGeometry: {
      windingRule: import("@open-pencil/scene-graph").WindingRule;
      commandsBlob: {
        [x: number]: number;
        readonly BYTES_PER_ELEMENT: number;
        readonly buffer: {
          readonly byteLength: number;
          slice: (begin?: number, end?: number) => ArrayBuffer;
          readonly maxByteLength: number;
          readonly resizable: boolean;
          resize: (newByteLength?: number) => void;
          readonly detached: boolean;
          transfer: (newByteLength?: number) => ArrayBuffer;
          transferToFixedLength: (newByteLength?: number) => ArrayBuffer;
          readonly [Symbol.toStringTag]: string;
        } | {
          readonly byteLength: number;
          slice: (begin?: number, end?: number) => SharedArrayBuffer;
          readonly growable: boolean;
          readonly maxByteLength: number;
          grow: (newByteLength?: number) => void;
          readonly [Symbol.species]: SharedArrayBuffer;
          readonly [Symbol.toStringTag]: "SharedArrayBuffer";
        };
        readonly byteLength: number;
        readonly byteOffset: number;
        copyWithin: (target: number, start: number, end?: number) => Uint8Array<ArrayBufferLike>;
        every: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
        fill: (value: number, start?: number, end?: number) => Uint8Array<ArrayBufferLike>;
        filter: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => any, thisArg?: any) => Uint8Array<ArrayBuffer>;
        find: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number | undefined;
        findIndex: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number;
        forEach: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => void, thisArg?: any) => void;
        indexOf: (searchElement: number, fromIndex?: number) => number;
        join: (separator?: string) => string;
        lastIndexOf: (searchElement: number, fromIndex?: number) => number;
        readonly length: number;
        map: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => number, thisArg?: any) => Uint8Array<ArrayBuffer>;
        reduce: {
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
          <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
        };
        reduceRight: {
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
          (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
          <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
        };
        reverse: () => Uint8Array<ArrayBufferLike>;
        set: (array: ArrayLike<number>, offset?: number) => void;
        slice: (start?: number, end?: number) => Uint8Array<ArrayBuffer>;
        some: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
        sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBufferLike>;
        subarray: (begin?: number, end?: number) => Uint8Array<ArrayBufferLike>;
        toLocaleString: {
          (): string;
          (locales: string | string[], options?: Intl.NumberFormatOptions): string;
        };
        toString: () => string;
        valueOf: () => Uint8Array<ArrayBufferLike>;
        entries: () => ArrayIterator<[number, number]>;
        keys: () => ArrayIterator<number>;
        values: () => ArrayIterator<number>;
        includes: (searchElement: number, fromIndex?: number) => boolean;
        at: (index: number) => number | undefined;
        findLast: {
          <S extends number>(predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => value is S, thisArg?: any): S | undefined;
          (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any): number | undefined;
        };
        findLastIndex: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => number;
        toReversed: () => Uint8Array<ArrayBuffer>;
        toSorted: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBuffer>;
        with: (index: number, value: number) => Uint8Array<ArrayBuffer>;
        [Symbol.iterator]: () => ArrayIterator<number>;
        readonly [Symbol.toStringTag]: "Uint8Array";
      };
      fills?: {
        type: import("@open-pencil/scene-graph").FillType;
        color: {
          r: number;
          g: number;
          b: number;
          a: number;
        };
        opacity: number;
        visible: boolean;
        blendMode?: import("@open-pencil/scene-graph").BlendMode | undefined;
        gradientStops?: {
          color: {
            r: number;
            g: number;
            b: number;
            a: number;
          };
          position: number;
        }[] | undefined;
        gradientTransform?: {
          m00: number;
          m01: number;
          m02: number;
          m10: number;
          m11: number;
          m12: number;
        } | undefined;
        imageHash?: string | undefined;
        imageScaleMode?: import("@open-pencil/scene-graph").ImageScaleMode | undefined;
        imageTransform?: {
          m00: number;
          m01: number;
          m02: number;
          m10: number;
          m11: number;
          m12: number;
        } | undefined;
        sourceNodeId?: string | undefined;
        scale?: number | undefined;
        spacing?: number | undefined;
        patternSpacing?: {
          x: number;
          y: number;
        } | undefined;
        patternTileType?: import("@open-pencil/scene-graph").PatternTileType | undefined;
        verticalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
        horizontalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
        noiseType?: import("@open-pencil/scene-graph").NoiseType | undefined;
        density?: number | undefined;
        noiseSize?: {
          x: number;
          y: number;
        } | undefined;
        customEffectId?: string | undefined;
      }[] | undefined;
      fillStyleId?: string | undefined;
    }[];
    origChildren: (Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: {
        vertices: {
          x: number;
          y: number;
          strokeCap?: string | undefined;
          strokeJoin?: string | undefined;
          cornerRadius?: number | undefined;
          handleMirroring?: import("@open-pencil/scene-graph").HandleMirroring | undefined;
        }[];
        segments: {
          start: number;
          end: number;
          tangentStart: {
            x: number;
            y: number;
          };
          tangentEnd: {
            x: number;
            y: number;
          };
        }[];
        regions: {
          windingRule: import("@open-pencil/scene-graph").WindingRule;
          loops: number[][];
        }[];
      } | null;
      fillGeometry: {
        windingRule: import("@open-pencil/scene-graph").WindingRule;
        commandsBlob: {
          [x: number]: number;
          readonly BYTES_PER_ELEMENT: number;
          readonly buffer: {
            readonly byteLength: number;
            slice: (begin?: number, end?: number) => ArrayBuffer;
            readonly maxByteLength: number;
            readonly resizable: boolean;
            resize: (newByteLength?: number) => void;
            readonly detached: boolean;
            transfer: (newByteLength?: number) => ArrayBuffer;
            transferToFixedLength: (newByteLength?: number) => ArrayBuffer;
            readonly [Symbol.toStringTag]: string;
          } | {
            readonly byteLength: number;
            slice: (begin?: number, end?: number) => SharedArrayBuffer;
            readonly growable: boolean;
            readonly maxByteLength: number;
            grow: (newByteLength?: number) => void;
            readonly [Symbol.species]: SharedArrayBuffer;
            readonly [Symbol.toStringTag]: "SharedArrayBuffer";
          };
          readonly byteLength: number;
          readonly byteOffset: number;
          copyWithin: (target: number, start: number, end?: number) => Uint8Array<ArrayBufferLike>;
          every: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
          fill: (value: number, start?: number, end?: number) => Uint8Array<ArrayBufferLike>;
          filter: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => any, thisArg?: any) => Uint8Array<ArrayBuffer>;
          find: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number | undefined;
          findIndex: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number;
          forEach: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => void, thisArg?: any) => void;
          indexOf: (searchElement: number, fromIndex?: number) => number;
          join: (separator?: string) => string;
          lastIndexOf: (searchElement: number, fromIndex?: number) => number;
          readonly length: number;
          map: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => number, thisArg?: any) => Uint8Array<ArrayBuffer>;
          reduce: {
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
            <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
          };
          reduceRight: {
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
            <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
          };
          reverse: () => Uint8Array<ArrayBufferLike>;
          set: (array: ArrayLike<number>, offset?: number) => void;
          slice: (start?: number, end?: number) => Uint8Array<ArrayBuffer>;
          some: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
          sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBufferLike>;
          subarray: (begin?: number, end?: number) => Uint8Array<ArrayBufferLike>;
          toLocaleString: {
            (): string;
            (locales: string | string[], options?: Intl.NumberFormatOptions): string;
          };
          toString: () => string;
          valueOf: () => Uint8Array<ArrayBufferLike>;
          entries: () => ArrayIterator<[number, number]>;
          keys: () => ArrayIterator<number>;
          values: () => ArrayIterator<number>;
          includes: (searchElement: number, fromIndex?: number) => boolean;
          at: (index: number) => number | undefined;
          findLast: {
            <S extends number>(predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => value is S, thisArg?: any): S | undefined;
            (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any): number | undefined;
          };
          findLastIndex: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => number;
          toReversed: () => Uint8Array<ArrayBuffer>;
          toSorted: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBuffer>;
          with: (index: number, value: number) => Uint8Array<ArrayBuffer>;
          [Symbol.iterator]: () => ArrayIterator<number>;
          readonly [Symbol.toStringTag]: "Uint8Array";
        };
        fills?: {
          type: import("@open-pencil/scene-graph").FillType;
          color: {
            r: number;
            g: number;
            b: number;
            a: number;
          };
          opacity: number;
          visible: boolean;
          blendMode?: import("@open-pencil/scene-graph").BlendMode | undefined;
          gradientStops?: {
            color: {
              r: number;
              g: number;
              b: number;
              a: number;
            };
            position: number;
          }[] | undefined;
          gradientTransform?: {
            m00: number;
            m01: number;
            m02: number;
            m10: number;
            m11: number;
            m12: number;
          } | undefined;
          imageHash?: string | undefined;
          imageScaleMode?: import("@open-pencil/scene-graph").ImageScaleMode | undefined;
          imageTransform?: {
            m00: number;
            m01: number;
            m02: number;
            m10: number;
            m11: number;
            m12: number;
          } | undefined;
          sourceNodeId?: string | undefined;
          scale?: number | undefined;
          spacing?: number | undefined;
          patternSpacing?: {
            x: number;
            y: number;
          } | undefined;
          patternTileType?: import("@open-pencil/scene-graph").PatternTileType | undefined;
          verticalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
          horizontalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
          noiseType?: import("@open-pencil/scene-graph").NoiseType | undefined;
          density?: number | undefined;
          noiseSize?: {
            x: number;
            y: number;
          } | undefined;
          customEffectId?: string | undefined;
        }[] | undefined;
        fillStyleId?: string | undefined;
      }[];
      strokeGeometry: {
        windingRule: import("@open-pencil/scene-graph").WindingRule;
        commandsBlob: {
          [x: number]: number;
          readonly BYTES_PER_ELEMENT: number;
          readonly buffer: {
            readonly byteLength: number;
            slice: (begin?: number, end?: number) => ArrayBuffer;
            readonly maxByteLength: number;
            readonly resizable: boolean;
            resize: (newByteLength?: number) => void;
            readonly detached: boolean;
            transfer: (newByteLength?: number) => ArrayBuffer;
            transferToFixedLength: (newByteLength?: number) => ArrayBuffer;
            readonly [Symbol.toStringTag]: string;
          } | {
            readonly byteLength: number;
            slice: (begin?: number, end?: number) => SharedArrayBuffer;
            readonly growable: boolean;
            readonly maxByteLength: number;
            grow: (newByteLength?: number) => void;
            readonly [Symbol.species]: SharedArrayBuffer;
            readonly [Symbol.toStringTag]: "SharedArrayBuffer";
          };
          readonly byteLength: number;
          readonly byteOffset: number;
          copyWithin: (target: number, start: number, end?: number) => Uint8Array<ArrayBufferLike>;
          every: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
          fill: (value: number, start?: number, end?: number) => Uint8Array<ArrayBufferLike>;
          filter: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => any, thisArg?: any) => Uint8Array<ArrayBuffer>;
          find: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number | undefined;
          findIndex: (predicate: (value: number, index: number, obj: Uint8Array<ArrayBufferLike>) => boolean, thisArg?: any) => number;
          forEach: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => void, thisArg?: any) => void;
          indexOf: (searchElement: number, fromIndex?: number) => number;
          join: (separator?: string) => string;
          lastIndexOf: (searchElement: number, fromIndex?: number) => number;
          readonly length: number;
          map: (callbackfn: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => number, thisArg?: any) => Uint8Array<ArrayBuffer>;
          reduce: {
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
            <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
          };
          reduceRight: {
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number): number;
            (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => number, initialValue: number): number;
            <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array<ArrayBufferLike>) => U, initialValue: U): U;
          };
          reverse: () => Uint8Array<ArrayBufferLike>;
          set: (array: ArrayLike<number>, offset?: number) => void;
          slice: (start?: number, end?: number) => Uint8Array<ArrayBuffer>;
          some: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => boolean;
          sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBufferLike>;
          subarray: (begin?: number, end?: number) => Uint8Array<ArrayBufferLike>;
          toLocaleString: {
            (): string;
            (locales: string | string[], options?: Intl.NumberFormatOptions): string;
          };
          toString: () => string;
          valueOf: () => Uint8Array<ArrayBufferLike>;
          entries: () => ArrayIterator<[number, number]>;
          keys: () => ArrayIterator<number>;
          values: () => ArrayIterator<number>;
          includes: (searchElement: number, fromIndex?: number) => boolean;
          at: (index: number) => number | undefined;
          findLast: {
            <S extends number>(predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => value is S, thisArg?: any): S | undefined;
            (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any): number | undefined;
          };
          findLastIndex: (predicate: (value: number, index: number, array: Uint8Array<ArrayBufferLike>) => unknown, thisArg?: any) => number;
          toReversed: () => Uint8Array<ArrayBuffer>;
          toSorted: (compareFn?: ((a: number, b: number) => number) | undefined) => Uint8Array<ArrayBuffer>;
          with: (index: number, value: number) => Uint8Array<ArrayBuffer>;
          [Symbol.iterator]: () => ArrayIterator<number>;
          readonly [Symbol.toStringTag]: "Uint8Array";
        };
        fills?: {
          type: import("@open-pencil/scene-graph").FillType;
          color: {
            r: number;
            g: number;
            b: number;
            a: number;
          };
          opacity: number;
          visible: boolean;
          blendMode?: import("@open-pencil/scene-graph").BlendMode | undefined;
          gradientStops?: {
            color: {
              r: number;
              g: number;
              b: number;
              a: number;
            };
            position: number;
          }[] | undefined;
          gradientTransform?: {
            m00: number;
            m01: number;
            m02: number;
            m10: number;
            m11: number;
            m12: number;
          } | undefined;
          imageHash?: string | undefined;
          imageScaleMode?: import("@open-pencil/scene-graph").ImageScaleMode | undefined;
          imageTransform?: {
            m00: number;
            m01: number;
            m02: number;
            m10: number;
            m11: number;
            m12: number;
          } | undefined;
          sourceNodeId?: string | undefined;
          scale?: number | undefined;
          spacing?: number | undefined;
          patternSpacing?: {
            x: number;
            y: number;
          } | undefined;
          patternTileType?: import("@open-pencil/scene-graph").PatternTileType | undefined;
          verticalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
          horizontalAlignment?: import("@open-pencil/scene-graph").PatternAlignment | undefined;
          noiseType?: import("@open-pencil/scene-graph").NoiseType | undefined;
          density?: number | undefined;
          noiseSize?: {
            x: number;
            y: number;
          } | undefined;
          customEffectId?: string | undefined;
        }[] | undefined;
        fillStyleId?: string | undefined;
      }[];
    }> & Omit<Map<string, import("@open-pencil/scene-graph/resize").ResizeSnapshot>, keyof Map<any, any>>) | null;
  } | {
    type: "marquee";
    startX: number;
    startY: number;
  } | {
    type: "rotate";
    nodeId: string;
    centerX: number;
    centerY: number;
    startAngle: number;
    origRotation: number;
  } | {
    type: "pen-drag";
    startX: number;
    startY: number;
    modifierMode: "default" | "continuous" | "independent";
    frozenOppositeTangent: {
      x: number;
      y: number;
    } | null;
    spaceDown: boolean;
    spaceStartX: number;
    spaceStartY: number;
    knotStartX: number;
    knotStartY: number;
  } | {
    type: "text-select";
    startX: number;
    startY: number;
  } | {
    type: "edit-node";
    startX: number;
    startY: number;
    origPositions: Map<number, {
      x: number;
      y: number;
    }> & Omit<Map<number, import("@open-pencil/scene-graph").Vector>, keyof Map<any, any>>;
  } | {
    type: "edit-handle";
    segmentIndex: number;
    tangentField: "tangentStart" | "tangentEnd";
    vertexIndex: number;
    startX: number;
    startY: number;
    initialTangent: {
      x: number;
      y: number;
    } | null;
  } | {
    type: "bend-handle";
    vertexIndex: number;
    startX: number;
    startY: number;
    lockedMode: "symmetric" | "independent" | null;
    dragSamples: {
      x: number;
      y: number;
    }[];
    targetSegmentIndex: number | null;
    targetTangentField: "tangentStart" | "tangentEnd" | null;
  } | null>;
  cursorOverride: Ref<string | null, string | null>;
  autoLayoutPaddingEdit: Ref<{
    nodeId: string;
    side: "top" | "right" | "bottom" | "left";
    value: number;
    previous: number;
  } | null, {
    nodeId: string;
    side: "top" | "right" | "bottom" | "left";
    value: number;
    previous: number;
  } | {
    nodeId: string;
    side: "top" | "right" | "bottom" | "left";
    value: number;
    previous: number;
  } | null>;
  updateAutoLayoutPaddingEdit: (value: number) => void;
  commitAutoLayoutPaddingEdit: (value: number) => void;
  cancelAutoLayoutPaddingEdit: () => void;
};
//#endregion
//#region src/canvas/overlays/useCanvasVirtualReference.d.ts
type CanvasVirtualReference = {
  getBoundingClientRect: () => DOMRect;
};
declare function useCanvasVirtualReference(canvasRef: Ref<HTMLElement | null>, editor: Editor$1, anchor: ComputedRef<Vector | null>): ComputedRef<CanvasVirtualReference | null>;
//#endregion
//#region src/canvas/text-edit/use.d.ts
/**
 * Bridges DOM text input and the editor's canvas text-editing model.
 *
 * This composable manages textarea-backed input, IME composition, caret
 * blinking, keyboard editing behavior, text formatting shortcuts, and syncing
 * text/style-run updates back into the scene graph.
 */
declare function useTextEdit(canvasRef: Ref<HTMLCanvasElement | null>, store: Editor$1): void;
//#endregion
//#region src/canvas/drop/use.d.ts
declare function useCanvasDrop(canvasRef: Ref<HTMLCanvasElement | null>, editor: Editor$1): {
  isDraggingOver: Ref<boolean, boolean>;
};
declare function extractImageFilesFromClipboard(e: ClipboardEvent): File[];
//#endregion
//#region ../core/src/color/management.d.ts
type RenderColorSpace$1 = 'srgb' | 'display-p3';
type ColorIntentSpace = 'oklch' | 'srgb';
interface ResolvedRenderColor {
  color: Color$1;
  cssColor: string;
  sourceSpace: ColorIntentSpace;
  targetSpace: RenderColorSpace$1;
  clipped: boolean;
}
//#endregion
//#region ../core/src/profiler/draw-call-counter.d.ts
declare class DrawCallCounter {
  count: number;
  private originals;
  private gl;
  constructor(gl: WebGL2RenderingContext | null);
  enable(): void;
  disable(): void;
  reset(): number;
  destroy(): void;
}
//#endregion
//#region ../core/src/profiler/frame/capture.d.ts
interface NodeProfile {
  nodeId: string;
  name: string;
  type: string;
  depth: number;
  startTime: number;
  endTime: number;
  selfTime: number;
  drawCalls: number;
  culled: boolean;
  children: NodeProfile[];
}
interface FrameCapture {
  timestamp: number;
  totalTimeMs: number;
  cpuTimeMs: number;
  gpuTimeMs: number;
  totalNodes: number;
  culledNodes: number;
  drawCalls: number;
  scenePictureCacheHit: boolean;
  scenePictureMode: 'hit' | 'record' | 'volatile' | 'none';
  scenePictureMissReason: string;
  scenePictureDrawTimeMs: number;
  scenePictureRecordTimeMs: number;
  flushTimeMs: number;
  rootProfiles: NodeProfile[];
}
//#endregion
//#region ../core/src/profiler/frame/stats.d.ts
declare class FrameStats {
  frameTime: number;
  cpuTime: number;
  gpuTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  avgFrameTime: number;
  minCpuTime: number;
  maxCpuTime: number;
  avgCpuTime: number;
  minGpuTime: number;
  maxGpuTime: number;
  avgGpuTime: number;
  smoothedFps: number;
  totalNodes: number;
  culledNodes: number;
  drawCalls: number;
  scenePictureCacheHit: boolean;
  scenePictureMode: 'hit' | 'record' | 'volatile' | 'none';
  scenePictureMissReason: string;
  scenePictureDrawTime: number;
  scenePictureRecordTime: number;
  flushTime: number;
  private frameTimeBuffer;
  private cpuTimeBuffer;
  private gpuTimeBuffer;
  private bufferIndex;
  private bufferCount;
  private lastTimestamp;
  recordFrame(cpuTimeMs: number): void;
  getFrameTimeHistory(): Float64Array;
  getCpuTimeHistory(): Float64Array;
  getGpuTimeHistory(): Float64Array;
  getBufferIndex(): number;
  getBufferCount(): number;
  private computeStats;
}
//#endregion
//#region ../core/src/profiler/gpu-timer.d.ts
declare class GPUTimer {
  private gl;
  private ext;
  private pending;
  private activeQuery;
  private _lastGpuTimeMs;
  get available(): boolean;
  get lastGpuTimeMs(): number;
  constructor(gl: WebGL2RenderingContext | null);
  beginFrame(): void;
  endFrame(): void;
  pollResults(): number | null;
  destroy(): void;
}
//#endregion
//#region ../core/src/profiler/phase-timer.d.ts
declare class PhaseTimer {
  enabled: boolean;
  readonly averages: Map<string, number>;
  private starts;
  beginPhase(name: string): void;
  endPhase(name: string): void;
  clearPhases(): void;
}
//#endregion
//#region ../core/src/profiler/render-profiler.d.ts
declare class RenderProfiler {
  enabled: boolean;
  hudVisible: boolean;
  capturing: boolean;
  readonly stats: FrameStats;
  readonly phases: PhaseTimer;
  readonly gpuTimer: GPUTimer;
  readonly drawCallCounter: DrawCallCounter;
  private readonly hud;
  private captureSession;
  private lastCapture;
  private renderStartTime;
  constructor(ck: CanvasKit, gl: WebGL2RenderingContext | null);
  setVisible(visible: boolean): void;
  toggle(): void;
  beginFrame(): void;
  endFrame(): void;
  beginPhase(name: string): void;
  endPhase(name: string): void;
  setNodeCounts(total: number, culled: number): void;
  setCacheHit(hit: boolean): void;
  setScenePictureMode(mode: 'hit' | 'record' | 'volatile' | 'none', reason?: string): void;
  setScenePictureDrawTime(ms: number): void;
  setScenePictureRecordTime(ms: number): void;
  setFlushTime(ms: number): void;
  beginCapture(): void;
  endCapture(): FrameCapture | null;
  beginNode(nodeId: string, name: string, type: string, culled: boolean): void;
  endNode(drawCallsBefore: number): void;
  getLastCapture(): FrameCapture | null;
  exportSpeedscope(): string | null;
  downloadSpeedscope(): void;
  private syncInstrumentation;
  setTypeface(typeface: Typeface): void;
  drawHUD(canvas: Canvas, showRulers: boolean): void;
  destroy(): void;
}
//#endregion
//#region ../core/src/text/editor.d.ts
interface TextCaret {
  x: number;
  y0: number;
  y1: number;
}
interface TextEditorState {
  nodeId: string;
  text: string;
  cursor: number;
  selectionAnchor: number | null;
  paragraph: Paragraph | null;
  paragraphFontGeneration: number;
  textDirection: 'LTR' | 'RTL';
}
declare class TextEditor {
  private ck;
  private renderer;
  private _state;
  private paragraphNode;
  caretVisible: boolean;
  constructor(ck: CanvasKit);
  private prepareMove;
  private replaceRange;
  private currentLineMetrics;
  private collapseSelectionTo;
  get state(): TextEditorState | null;
  get isActive(): boolean;
  get nodeId(): string | null;
  setRenderer(renderer: SkiaRenderer | null): void;
  start(node: SceneNode): void;
  stop(): {
    nodeId: string;
    text: string;
  } | null;
  rebuildParagraph(node: SceneNode): void;
  hasSelection(): boolean;
  getSelectionRange(): [number, number] | null;
  getSelectedText(): string;
  selectAll(): void;
  selectWord(pos: number): void;
  setCursorAt(x: number, y: number, extend?: boolean): void;
  selectLine(pos: number): void;
  selectWordAt(x: number, y: number): void;
  selectLineAt(x: number, y: number): void;
  insert(text: string, node: SceneNode): void;
  backspace(node: SceneNode): void;
  delete(node: SceneNode): void;
  private moveHorizontal;
  moveLeft(extend?: boolean): void;
  moveRight(extend?: boolean): void;
  private moveVertical;
  moveUp(extend?: boolean): void;
  moveDown(extend?: boolean): void;
  private moveToLineEdge;
  moveToLineStart(extend?: boolean): void;
  moveToLineEnd(extend?: boolean): void;
  private moveWord;
  private skipWordBoundaryRun;
  private skipWordInteriorRun;
  private advanceWhile;
  moveWordLeft(extend?: boolean): void;
  moveWordRight(extend?: boolean): void;
  getCaretRect(): TextCaret | null;
  getSelectionRects(): Rect[];
}
//#endregion
//#region ../core/src/text/resolver/types.d.ts
type FontResolutionState = 'idle' | 'loading' | 'loaded' | 'failed' | 'exhausted';
type FontCandidateSource = 'registered' | 'local' | 'cache' | 'remote' | 'fallback';
interface FontResolutionCandidate {
  id: string;
  family: string;
  style: string;
  source: FontCandidateSource;
}
interface FontResolutionSnapshot {
  key: string;
  state: FontResolutionState;
  candidate?: FontResolutionCandidate;
  source?: FontCandidateSource;
  error?: unknown;
}
//#endregion
//#region ../core/src/canvas/labels/cache.d.ts
interface CachedSection {
  nodeId: string;
  absX: number;
  absY: number;
  nested: boolean;
}
interface CachedComponent {
  nodeId: string;
  absX: number;
  absY: number;
  parentType: string;
}
interface Viewport {
  x: number;
  y: number;
  w: number;
  h: number;
}
declare class LabelCache {
  private sections;
  private components;
  private cachedSceneVersion;
  private cachedPositionPreviewVersion;
  private cachedPageId;
  update(graph: SceneGraph, pageId: string | null, sceneVersion: number, positionPreviewVersion?: number): void;
  invalidate(): void;
  getSections(graph: SceneGraph, viewport: Viewport): Array<{
    node: SceneNode;
    absX: number;
    absY: number;
    nested: boolean;
  }>;
  getComponents(graph: SceneGraph, viewport: Viewport): Array<{
    node: SceneNode;
    absX: number;
    absY: number;
    inside: boolean;
  }>;
  getAllSections(): readonly CachedSection[];
  getAllComponents(): readonly CachedComponent[];
  private rebuild;
  private walkChildren;
}
//#endregion
//#region ../core/src/canvas/renderer/pipeline.d.ts
type RenderLayer = 'full' | 'scene' | 'overlays';
//#endregion
//#region ../core/src/canvas/text/index.d.ts
type NodeFontReadiness = 'ready' | 'pending' | 'exhausted';
//#endregion
//#region ../core/src/canvas/renderer/types.d.ts
interface RulerTheme {
  background: Color$1;
  tick: Color$1;
  text: Color$1;
  label: Color$1;
}
interface RenderOverlays {
  hoveredNodeId?: string | null;
  enteredContainerId?: string | null;
  editingTextId?: string | null;
  textEditor?: TextEditor | null;
  marquee?: Rect | null;
  snapGuides?: SnapGuide[];
  rotationPreview?: {
    nodeId: string;
    angle: number;
  } | null;
  dropTargetId?: string | null;
  layoutInsertIndicator?: {
    x: number;
    y: number;
    length: number;
    direction: 'HORIZONTAL' | 'VERTICAL';
  } | null;
  autoLayoutHover?: {
    nodeId: string;
    kind: 'frame' | 'children' | 'spacing' | 'spacing-value' | 'padding' | 'padding-value';
    index?: number;
    side?: 'top' | 'right' | 'bottom' | 'left';
  } | null;
  penState?: {
    vertices: Vector[];
    segments: Array<{
      start: number;
      end: number;
      tangentStart: Vector;
      tangentEnd: Vector;
    }>;
    dragTangent: Vector | null;
    oppositeDragTangent?: Vector | null;
    closingToFirst: boolean;
    pendingClose?: boolean;
    cursorX?: number;
    cursorY?: number;
  } | null;
  nodeEditState?: {
    nodeId: string;
    vertices: VectorVertex[];
    segments: Array<{
      start: number;
      end: number;
      tangentStart: Vector;
      tangentEnd: Vector;
    }>;
    regions: VectorRegion[];
    selectedVertexIndices: Set<number>; /** Set of selected handles as "segIdx:tangentField" strings */
    selectedHandles?: Set<string>;
    hoveredHandleInfo?: {
      segmentIndex: number;
      tangentField: 'tangentStart' | 'tangentEnd';
    } | null;
  } | null;
  remoteCursors?: Array<{
    name: string;
    color: Color$1;
    x: number;
    y: number;
    selection?: string[];
  }>;
}
//#endregion
//#region ../core/src/canvas/renderer.d.ts
interface SubtreePictureCacheEntry {
  picture: SkPicture;
  pageId: string | null;
  sceneVersion: number;
  positionPreviewVersion: number;
  fontGeneration: number;
}
interface PendingFontNode {
  node: SceneNode;
  keys: Set<string>;
}
declare class SkiaRenderer {
  ck: CanvasKit;
  surface: Surface;
  fillPaint: Paint;
  strokePaint: Paint;
  selectionPaint: Paint;
  parentOutlinePaint: Paint;
  snapPaint: Paint;
  auxFill: Paint;
  auxStroke: Paint;
  opacityPaint: Paint;
  effectLayerPaint: Paint;
  imageFilterCache: Map<string, ImageFilter | null>;
  maskFilterCache: Map<number, MaskFilter | null>;
  _tmpColor: Float32Array<ArrayBuffer>;
  _tmpRect: Float32Array<ArrayBuffer>;
  textFont: Font | null;
  labelFont: Font | null;
  sizeFont: Font | null;
  sectionTitleFont: Font | null;
  componentLabelFont: Font | null;
  fontMgr: FontMgr | null;
  fontProvider: TypefaceFontProvider | null;
  fontsLoaded: boolean;
  fontGeneration: number;
  onFontResolutionSettled: ((snapshot: FontResolutionSnapshot, nodeIds: readonly string[]) => void) | undefined;
  pendingFontNodes: Map<string, PendingFontNode>;
  textPictureGenerations: Map<string, {
    data: Uint8Array;
    generation: number;
  }>;
  imageCache: Map<string, Image>;
  vectorPathCache: Map<string, Path[]>;
  vectorStrokePathCache: Map<string, Path[]>;
  vectorStrokeOutlineCache: Map<string, Path[]>;
  fillGeometryCache: Map<string, Path[]>;
  strokeGeometryCache: Map<string, Path[]>;
  scenePicture: SkPicture | null;
  scenePictureVersion: number;
  scenePictureFontGeneration: number;
  scenePicturePositionPreviewVersion: number;
  scenePicturePageId: string | null;
  sceneBacking: {
    image: Image;
    pageId: string | null;
    sceneVersion: number;
    positionPreviewVersion: number;
    fontGeneration: number;
    panX: number;
    panY: number;
    zoom: number;
    width: number;
    height: number;
    dpr: number;
    worldX: number;
    worldY: number;
    worldWidth: number;
    worldHeight: number;
  } | null;
  sceneBackingPreviewUntil: number;
  sceneBackingNeedsCrispRender: boolean;
  sceneBackingAllocationFailed: boolean;
  sceneBackingBuild: {
    surface: Surface;
    graph: SceneGraph;
    childIds: string[];
    index: number;
    startedAt: number;
    pageId: string | null;
    sceneVersion: number;
    positionPreviewVersion: number;
    fontGeneration: number;
    panX: number;
    panY: number;
    zoom: number;
    width: number;
    height: number;
    dpr: number;
    worldX: number;
    worldY: number;
    worldWidth: number;
    worldHeight: number;
  } | null;
  sceneBackingAverageRecordMs: number;
  sceneBackingAverageViewportIntervalMs: number;
  sceneBackingLastViewportEventAt: number;
  lastSceneViewport: {
    panX: number;
    panY: number;
    zoom: number;
  } | null;
  nodePictureCache: Map<string, SkPicture | null>;
  nodePictureCacheGenerations: Map<string, number>;
  subtreePictureCache: Map<string, SubtreePictureCacheEntry>;
  subtreePictureCachePageId: string | null;
  subtreePictureCacheSceneVersion: number;
  subtreePictureCachePositionPreviewVersion: number;
  subtreePictureCacheFontGeneration: number;
  readonly labelCache: LabelCache;
  readonly profiler: RenderProfiler;
  rulerBgPaint: Paint;
  rulerTickPaint: Paint;
  rulerTextPaint: Paint;
  rulerHlPaint: Paint;
  rulerBadgePaint: Paint;
  rulerLabelPaint: Paint;
  penPathPaint: Paint;
  penLiveStrokePaint: Paint;
  penHandlePaint: Paint;
  penVertexFill: Paint;
  penVertexStroke: Paint;
  panX: number;
  panY: number;
  zoom: number;
  dpr: number;
  viewportWidth: number;
  viewportHeight: number;
  showRulers: boolean;
  pageColor: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  rulerTheme: RulerTheme | null;
  pageId: string | null;
  worldViewport: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  _nodeCount: number;
  _culledCount: number;
  _flashes: Array<{
    nodeId: string;
    startTime: number;
  }>;
  _flashPaint: Paint | null;
  _aiActiveNodes: Set<string>;
  _aiDoneFlashes: Array<{
    nodeId: string;
    startTime: number;
  }>;
  readonly DEFAULT_FONT_SIZE = 14;
  readonly COMPONENT_SET_BORDER_WIDTH = 1.5;
  readonly COMPONENT_SET_DASH = 6;
  readonly COMPONENT_SET_DASH_GAP = 4;
  drawHoverHighlight: (canvas: Canvas, graph: SceneGraph, hoveredNodeId?: string | null) => void;
  drawEnteredContainer: (canvas: Canvas, graph: SceneGraph, enteredContainerId?: string | null) => void;
  drawSelection: (canvas: Canvas, graph: SceneGraph, selectedIds: Set<string>, overlays: RenderOverlays) => void;
  drawNodeSelection: (canvas: Canvas, node: SceneNode, rotation: number, graph: SceneGraph) => void;
  drawSelectionLabels: (canvas: Canvas, graph: SceneGraph, selectedIds: Set<string>, overlays?: RenderOverlays) => void;
  drawParentFrameOutlines: (canvas: Canvas, graph: SceneGraph, selectedIds: Set<string>) => void;
  drawNodeOutline: (canvas: Canvas, node: SceneNode, rotation: number, graph: SceneGraph) => void;
  drawGroupBounds: (canvas: Canvas, nodes: SceneNode[], graph: SceneGraph) => void;
  getRotatedCorners: (node: SceneNode, abs: Vector) => Vector[];
  drawHandle: (canvas: Canvas, x: number, y: number) => void;
  drawSnapGuides: (canvas: Canvas, guides?: SnapGuide[]) => void;
  drawMarquee: (canvas: Canvas, marquee?: Rect | null) => void;
  drawFlashes: (canvas: Canvas, graph: SceneGraph) => void;
  drawLayoutInsertIndicator: (canvas: Canvas, indicator?: RenderOverlays['layoutInsertIndicator']) => void;
  drawAutoLayoutHover: (canvas: Canvas, graph: SceneGraph, hover?: RenderOverlays['autoLayoutHover']) => void;
  drawTextEditOverlay: (canvas: Canvas, node: SceneNode, editor: TextEditor) => void;
  drawNodeEditOverlay: (canvas: Canvas, graph: SceneGraph, editState?: RenderOverlays['nodeEditState']) => void;
  drawPenOverlay: (canvas: Canvas, penState: RenderOverlays['penState']) => void;
  drawRemoteCursors: (canvas: Canvas, graph: SceneGraph, cursors?: RenderOverlays['remoteCursors']) => void;
  drawRulers: (canvas: Canvas, graph: SceneGraph, selectedIds: Set<string>) => void;
  drawSectionTitles: (canvas: Canvas, graph: SceneGraph) => void;
  drawComponentLabels: (canvas: Canvas, graph: SceneGraph) => void;
  renderNode: (canvas: Canvas, graph: SceneGraph, nodeId: string, overlays: RenderOverlays, parentAbsX?: number, parentAbsY?: number, hasTransformedAncestor?: boolean) => void;
  renderSection: (canvas: Canvas, node: SceneNode, graph: SceneGraph) => void;
  renderComponentSet: (canvas: Canvas, node: SceneNode, graph: SceneGraph) => void;
  renderShape: (canvas: Canvas, node: SceneNode, graph: SceneGraph) => void;
  renderShapeUncached: (canvas: Canvas, node: SceneNode, graph: SceneGraph) => void;
  renderEffects: (canvas: Canvas, node: SceneNode, rect: Float32Array, hasRadius: boolean, pass: 'behind' | 'front', shadowShapeChild?: SceneNode | null) => void;
  renderText: (canvas: Canvas, node: SceneNode, fill?: Fill) => void;
  drawNodeFill: (canvas: Canvas, node: SceneNode, rect: Float32Array, hasRadius: boolean, fill?: Fill) => void;
  applyFill: (fill: Fill, node: SceneNode, graph: SceneGraph, fillIndex?: number) => boolean;
  applyGradientFill: (fill: Fill, node: SceneNode, graph: SceneGraph) => void;
  applyImageFill: (fill: Fill, node: SceneNode, graph: SceneGraph) => boolean;
  drawArc: (canvas: Canvas, node: SceneNode, paint: Paint) => void;
  drawNodeStroke: (canvas: Canvas, node: SceneNode, rect: Float32Array, hasRadius: boolean) => void;
  drawStrokeWithAlign: (canvas: Canvas, node: SceneNode, rect: Float32Array, hasRadius: boolean, align: 'INSIDE' | 'CENTER' | 'OUTSIDE') => void;
  drawRRectStrokeWithAlign: (canvas: Canvas, rrect: Float32Array, node: SceneNode, stroke: Stroke) => void;
  drawIndividualSideStrokes: (canvas: Canvas, node: SceneNode, align: 'INSIDE' | 'CENTER' | 'OUTSIDE') => void;
  strokeNodeShape: (canvas: Canvas, node: SceneNode, paint: Paint) => void;
  makeNodeShapePath: (node: SceneNode, rect: Float32Array, hasRadius: boolean) => Path;
  makePolygonPath: (node: SceneNode) => Path;
  makeRRect: (node: SceneNode) => Float32Array;
  makeRRectWithSpread: (node: SceneNode, spread: number) => Float32Array;
  makeRRectWithOffset: (node: SceneNode, ox: number, oy: number, spread: number) => Float32Array;
  clipNodeShape: (canvas: Canvas, node: SceneNode, rect: Float32Array, hasRadius: boolean) => void;
  getVectorPaths: (node: SceneNode) => Path[] | null;
  getFillGeometry: (node: SceneNode) => Path[] | null;
  getStrokeGeometry: (node: SceneNode) => Path[] | null;
  getCachedDropShadow: (dx: number, dy: number, sigma: number, color: Float32Array) => ImageFilter;
  getCachedBlur: (sigma: number) => ImageFilter;
  getCachedDecalBlur: (sigma: number) => ImageFilter;
  getCachedMaskBlur: (sigma: number) => MaskFilter;
  applyClippedBlur: (canvas: Canvas, node: SceneNode, rect: Float32Array, hasRadius: boolean, sigma: number) => void;
  color4f(r: number, g: number, b: number, a: number): Float32Array;
  ltrb(l: number, t: number, r: number, b: number): Float32Array;
  selColor(alpha?: number): import("canvaskit-wasm").Color;
  compColor(alpha?: number): import("canvaskit-wasm").Color;
  isComponentType(type: string): boolean;
  isRectangularType(type: string): boolean;
  effectOverflow(node: SceneNode): number;
  constructor(ck: CanvasKit, surface: Surface, gl?: WebGL2RenderingContext | null);
  getFontProvider(): TypefaceFontProvider | null;
  isDestroyed(): boolean;
  loadFonts(onFallbackFontsLoaded?: () => void): Promise<void>;
  syncFontGeneration(): void;
  trackFontDemand(node: SceneNode, key: string): void;
  isTextPictureCurrent(node: SceneNode): boolean;
  prepareForExport(graph: SceneGraph, pageId: string, nodeIds: string[]): Promise<() => void>;
  replaceSurface(surface: Surface): void;
  invalidateScenePicture(): void;
  invalidateAllPictures(): void;
  invalidateNodePicture(nodeId: string): void;
  flashNode(nodeId: string): void;
  aiMarkActive(nodeIds: string[]): void;
  aiMarkDone(nodeIds: string[]): void;
  aiFlashDone(nodeIds: string[]): void;
  aiClearActive(): void;
  aiClearAll(): void;
  get hasActiveFlashes(): boolean;
  hitTestSectionTitle(graph: SceneGraph, canvasX: number, canvasY: number): SceneNode | null;
  hitTestComponentLabel(graph: SceneGraph, canvasX: number, canvasY: number): SceneNode | null;
  hitTestFrameTitle(graph: SceneGraph, canvasX: number, canvasY: number, selectedIds: Set<string>): SceneNode | null;
  renderSceneToCanvas(canvas: Canvas, graph: SceneGraph, pageId: string): void;
  renderFromEditorState(state: EditorState$1, graph: SceneGraph, textEditor: unknown, viewportWidth: number, viewportHeight: number, showRulers?: boolean, layer?: RenderLayer): void;
  render(graph: SceneGraph, selectedIds: Set<string>, overlays?: RenderOverlays, sceneVersion?: number, layer?: RenderLayer): void;
  invalidateVectorPath(nodeId: string): void;
  measureTextNode(node: SceneNode, maxWidth?: number): {
    width: number;
    height: number;
  } | null;
  nodeFontReadiness(node: SceneNode): NodeFontReadiness;
  isNodeFontLoaded(node: SceneNode): boolean;
  buildTextPicture(node: SceneNode): Uint8Array | null;
  buildParagraph(node: SceneNode, color?: Float32Array, opts?: {
    halfLeading?: boolean;
  }): Paragraph;
  resolveFillColorInfo(fill: Fill, fillIndex: number, node: SceneNode, graph: SceneGraph): ResolvedRenderColor;
  resolveFillColor(fill: Fill, fillIndex: number, node: SceneNode, graph: SceneGraph): Color$1;
  resolveStrokeColorInfo(stroke: Stroke, strokeIndex: number, node: SceneNode, graph: SceneGraph): ResolvedRenderColor;
  resolveStrokeColor(stroke: Stroke, strokeIndex: number, node: SceneNode, graph: SceneGraph): Color$1;
  screenToCanvas(sx: number, sy: number): Vector;
  /**
   * Browser fallback for raster formats CanvasKit cannot encode itself
   * (this build returns null from `encodeToBytes` for JPEG/WEBP). Routes the
   * RGBA pixels through an HTMLCanvasElement so `toDataURL` does the encoding.
   * Returns null outside the browser or if encoding fails.
   */
  encodeRasterFallback(pixels: Uint8Array, width: number, height: number, format: 'JPG' | 'WEBP', quality: number): Uint8Array | null;
  destroyed: boolean;
  destroy(): void;
}
//#endregion
//#region ../core/src/editor/types.d.ts
type Tool$2 = 'SELECT' | 'FRAME' | 'SECTION' | 'RECTANGLE' | 'ELLIPSE' | 'LINE' | 'POLYGON' | 'STAR' | 'TEXT' | 'PEN' | 'HAND';
interface EditorState$1 {
  activeTool: Tool$2;
  currentPageId: string;
  selectedIds: Set<string>;
  marquee: Rect | null;
  snapGuides: SnapGuide[];
  rotationPreview: {
    nodeId: string;
    angle: number;
  } | null;
  dropTargetId: string | null;
  layoutInsertIndicator: {
    parentId: string;
    index: number;
    x: number;
    y: number;
    length: number;
    direction: 'HORIZONTAL' | 'VERTICAL';
  } | null;
  hoveredNodeId: string | null;
  editingTextId: string | null;
  penState: {
    vertices: VectorVertex[];
    segments: VectorSegment[];
    dragTangent: Vector | null;
    oppositeDragTangent: Vector | null;
    pendingClose?: boolean;
    closingToFirst: boolean;
    resumingNodeId?: string;
    resumedFills?: SceneNode['fills'];
    resumedStrokes?: SceneNode['strokes'];
  } | null;
  penCursorX: number | null;
  penCursorY: number | null;
  remoteCursors: Array<{
    name: string;
    color: Color$1;
    x: number;
    y: number;
    selection?: string[];
  }>;
  autoLayoutHover: {
    nodeId: string;
    kind: 'frame' | 'children' | 'spacing' | 'spacing-value' | 'padding' | 'padding-value';
    index?: number;
    side?: 'top' | 'right' | 'bottom' | 'left';
  } | null;
  documentName: string;
  panX: number;
  pageColor: Color$1;
  rulerTheme?: RulerTheme;
  panY: number;
  zoom: number;
  renderVersion: number;
  sceneVersion: number;
  loading: boolean;
  enteredContainerId: string | null;
  nodeEditState?: RenderOverlays['nodeEditState'] | null;
  cursorCanvasX?: number | null;
  cursorCanvasY?: number | null;
}
interface ClipboardImageResolution {
  total: number;
  missing: number;
  fetchAttempted: boolean;
}
interface EditorEvents$2 extends SceneGraphEvents {
  'render:requested': (versions: {
    renderVersion: number;
    sceneVersion: number;
  }) => void;
  'repaint:requested': (versions: {
    renderVersion: number;
    sceneVersion: number;
  }) => void;
  'graph:replaced': (graph: SceneGraph) => void;
  'selection:changed': (selectedIds: string[], previousIds: string[]) => void;
  'tool:changed': (tool: Tool$2, previousTool: Tool$2) => void;
  'page:changed': (pageId: string, previousPageId: string) => void;
  'clipboard:images-missing': (resolution: ClipboardImageResolution) => void;
  'viewport:changed': (viewport: {
    panX: number;
    panY: number;
    zoom: number;
  }, previous: {
    panX: number;
    panY: number;
    zoom: number;
  }) => void;
}
type EditorEventName$2 = keyof EditorEvents$2;
//#endregion
//#region ../core/src/editor/components/variants.d.ts
type VariantConflict = {
  values: Record<string, string>;
  componentIds: string[];
};
//#endregion
//#region ../core/src/editor/color-space.d.ts
type DocumentColorProfileMode = 'assign' | 'convert';
//#endregion
//#region ../core/src/editor/history/snapshot.d.ts
type PageSnapshot = Map<string, SceneNode>;
//#endregion
//#region ../core/src/vector/vectorize/svg/to-vectors.d.ts
interface VectorizedPath {
  vectorNetwork: VectorNetwork;
  fills: Fill[];
  strokes: Stroke[];
}
interface SVGVectorizeResult {
  paths: VectorizedPath[];
  /** Tight bounds of path geometry in the target coordinate space. */
  contentBounds: Rect;
}
//#endregion
//#region ../core/src/editor/shapes/frame-presets.d.ts
interface FramePresetDimensions {
  name: string;
  width: number;
  height: number;
}
//#endregion
//#region ../core/src/editor/shapes/pen.d.ts
interface PenDragOptions {
  keepOpposite?: boolean;
  constrainToOpposite?: boolean;
  oppositeTangent?: Vector | null;
}
//#endregion
//#region ../core/src/editor/structure/rename.d.ts
interface RenameSelectionOptions {
  match: string;
  replacement: string;
  startNumber: number;
}
interface RenameSelectionPreview {
  names: ReadonlyMap<string, string>;
  error: 'invalid-pattern' | null;
}
//#endregion
//#region ../core/src/text/web-fonts.d.ts
declare const WEB_FONT_PROVIDER_IDS: readonly ["google", "fontsource", "bunny", "fontshare"];
type WebFontProviderId = (typeof WEB_FONT_PROVIDER_IDS)[number];
//#endregion
//#region ../core/src/text/font-sources.d.ts
type FontFamilySource$1 = 'local' | 'bundled' | 'fallback' | WebFontProviderId;
//#endregion
//#region src/controls/node-props/helpers.d.ts
declare const MIXED: unique symbol;
type MixedValue<T> = T | typeof MIXED;
declare function isNodeArrayMixed(nodes: SceneNode[], key: keyof SceneNode): boolean;
//#endregion
//#region src/controls/node-props/use.d.ts
/**
 * Returns shared property-panel helpers for the current selection.
 *
 * This composable centralizes mixed-value detection, multi-selection updates,
 * array-item editing, and commit semantics used by higher-level controls.
 */
declare function useNodeProps(): {
  store: {
    wrapInAutoLayout: () => void;
    groupSelected: () => string | null;
    frameSelection: () => string | null;
    booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
    flattenSelected: () => string | null;
    outlineTextSelected: () => string | null;
    outlineStrokeSelected: () => string | null;
    ungroupSelected: () => void;
    createComponentFromSelection: () => void;
    createComponentSetFromComponents: () => void;
    createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
    detachInstance: () => void;
    focusComponent: (componentId: string) => Promise<void>;
    goToMainComponent: () => Promise<void>;
    getComponentSetPropertyDefs: (componentSetId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    addPropertyDefinition: (componentSetId: string, name: string, type?: import("@open-pencil/scene-graph").ComponentPropertyType, defaultValue?: string) => string | undefined;
    removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
    renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
    collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
    findVariantByValues: (componentSetId: string, values: Record<string, string>) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getDefaultVariantForComponentSet: (componentSetId: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
    switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
    getInstanceComponentPropertyDefinitions: (instanceId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    getInstanceComponentPropertyValue: (instanceId: string, definition: import("@open-pencil/scene-graph").ComponentPropertyDefinition) => string;
    setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
    duplicateSelected: () => void;
    writeCopyData: (data: DataTransfer) => Promise<void>;
    pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
      replaceSelection?: boolean;
    }) => Promise<void>;
    deleteSelected: () => void;
    storeImage: (bytes: Uint8Array) => string;
    placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
    copySelectionAsText: (ids: string[]) => string;
    copySelectionAsSVG: (ids: string[]) => string | null;
    copySelectionAsJSX: (ids: string[]) => string | null;
    setDocumentColorSpace: (colorSpace: import("@open-pencil/scene-graph").DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
    commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
    commitMoveWithReparent: (originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>) => void;
    commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
    commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<import("@open-pencil/scene-graph").SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
    commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    }>) => void;
    commitRotation: (nodeId: string, origRotation: number) => void;
    commitNodeUpdate: (nodeId: string, previous: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    undoAction: () => void;
    redoAction: () => void;
    snapshotPage: () => PageSnapshot;
    restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
    pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
    screenToCanvas: (sx: number, sy: number) => {
      x: number;
      y: number;
    };
    setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
    applyZoom: (delta: number, centerX: number, centerY: number) => void;
    pan: (dx: number, dy: number) => void;
    zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
    zoomToFit: () => void;
    zoomTo100: () => void;
    zoomToLevel: (level: number) => void;
    zoomToSelection: () => void;
    startTextEditing: (nodeId: string) => void;
    commitTextEdit: () => void;
    getVariablesByType: (type: import("@open-pencil/scene-graph").VariableType) => import("@open-pencil/scene-graph").Variable[];
    getVariable: (id: string) => import("@open-pencil/scene-graph").Variable | undefined;
    resolveColorVariable: (id: string) => import("@open-pencil/scene-graph").Color | undefined;
    resolveNumberVariable: (id: string) => number | undefined;
    getVariablesForCollection: (collectionId: string) => import("@open-pencil/scene-graph").Variable[];
    getCollection: (id: string) => import("@open-pencil/scene-graph").VariableCollection | undefined;
    getCollections: () => import("@open-pencil/scene-graph").VariableCollection[];
    getCollectionCount: () => number;
    getVariableCount: () => number;
    renameCollection: (id: string, newName: string) => void;
    addCollection: (collection: import("@open-pencil/scene-graph").VariableCollection) => void;
    removeCollection: (id: string) => void;
    addVariable: (variable: import("@open-pencil/scene-graph").Variable) => void;
    removeVariable: (id: string) => void;
    renameVariable: (id: string, newName: string) => void;
    updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
    addMode: (collectionId: string, name?: string) => string | undefined;
    removeMode: (collectionId: string, modeId: string) => void;
    renameMode: (collectionId: string, modeId: string, newName: string) => void;
    setDefaultMode: (collectionId: string, modeId: string) => void;
    duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
    setActiveMode: (collectionId: string, modeId: string) => void;
    replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
    alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
    canDistributeNodes: (nodeIds: string[]) => boolean;
    distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    rotateNodes: (nodeIds: string[], degrees: number) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    flushNudge: () => void;
    bindVariable: (nodeId: string, path: string, variableId: string) => void;
    unbindVariable: (nodeId: string, path: string) => void;
    setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
    updateNode: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>) => void;
    updateNodeWithUndo: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    setOpacity: (opacity: number, coalesceKey?: string) => void;
    moveToPage: (pageId: string) => void;
    previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
    renameSelected: (options: RenameSelectionOptions) => void;
    renameNode: (id: string, name: string) => void;
    toggleNodeVisibility: (id: string) => void;
    toggleNodeLock: (id: string) => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    reparentNodes: (nodeIds: string[], newParentId: string) => void;
    wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: import("@open-pencil/scene-graph").SceneNode[], extraProps?: Partial<import("@open-pencil/scene-graph").SceneNode>) => string | null;
    reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
    reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    isTopLevel: (parentId: string | null) => boolean;
    adoptNodesIntoSection: (sectionId: string) => void;
    setTool: (tool: Tool$2) => void;
    createFrameFromPreset: (preset: FramePresetDimensions) => string;
    resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
    penAddVertex: (x: number, y: number) => void;
    penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
    penSetClosingToFirst: (closing: boolean) => void;
    penSetPendingClose: (closing: boolean) => void;
    penSetKnotPosition: (x: number, y: number) => void;
    penCommit: (closed: boolean) => void;
    penCancel: () => void;
    createShape: (type: import("@open-pencil/scene-graph").NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
    switchPage: (pageId: string) => Promise<void>;
    addPage: (name?: string) => string;
    deletePage: (pageId: string) => void;
    movePage: (pageId: string, index: number) => void;
    renamePage: (pageId: string, name: string) => void;
    setPageColor: (color: import("@open-pencil/scene-graph").Color) => void;
    clearPageViewports: () => void;
    hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => import("@open-pencil/scene-graph").SceneNode | null;
    selectAtPoint: (cx: number, cy: number) => void;
    getSelectedNodes: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    }[];
    getSelectedNode: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    } | undefined;
    getLayerTree: () => {
      node: import("@open-pencil/scene-graph").SceneNode;
      depth: number;
    }[];
    validateEnteredContainer: () => void;
    enterContainer: (id: string) => void;
    exitContainer: () => void;
    setMarquee: (rect: import("@open-pencil/scene-graph/primitives").Rect | null) => void;
    setSnapGuides: (guides: import("@open-pencil/scene-graph").SnapGuide[]) => void;
    setRotationPreview: (preview: {
      nodeId: string;
      angle: number;
    } | null) => void;
    setHoveredNode: (id: string | null) => void;
    setDropTarget: (id: string | null) => void;
    setLayoutInsertIndicator: (indicator: {
      parentId: string;
      index: number;
      x: number;
      y: number;
      length: number;
      direction: "HORIZONTAL" | "VERTICAL";
    } | null) => void;
    setAutoLayoutHover: (hover: {
      nodeId: string;
      kind: "frame" | "children" | "spacing" | "spacing-value" | "padding" | "padding-value";
      index?: number;
      side?: "top" | "right" | "bottom" | "left";
    } | null) => void;
    select: (ids: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    selectInverse: () => void;
    requestRender: () => void;
    requestRepaint: () => void;
    onEditorEvent: <K extends EditorEventName$2>(event: K, handler: EditorEvents$2[K]) => import("nanoevents").Unsubscribe;
    setCanvasKit: (ck: import("canvaskit-wasm").CanvasKit, renderer: SkiaRenderer) => void;
    removeCanvasRenderer: (renderer: SkiaRenderer) => void;
    replaceGraph: (newGraph: import("@open-pencil/scene-graph").SceneGraph) => void;
    subscribeToGraph: () => void;
    getNode: (id: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
    getChildren: (id: string) => import("@open-pencil/scene-graph").SceneNode[];
    getPages: (includeInternal?: boolean) => import("@open-pencil/scene-graph").SceneNode[];
    graph: import("@open-pencil/scene-graph").SceneGraph;
    renderer: SkiaRenderer | null;
    canvasRenderers: SkiaRenderer[];
    textEditor: TextEditor | null;
    undo: import("@open-pencil/scene-graph").UndoManager;
    state: EditorState$1;
  };
  node: import("vue").ComputedRef<{
    id: string;
    type: import("@open-pencil/scene-graph").NodeType;
    name: string;
    parentId: string | null;
    childIds: string[];
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    source: import("@open-pencil/scene-graph").SourceMetadata;
    figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
    fills: import("@open-pencil/scene-graph").Fill[];
    strokes: import("@open-pencil/scene-graph").Stroke[];
    effects: import("@open-pencil/scene-graph").Effect[];
    layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
    fillStyleId: string | null;
    strokeStyleId: string | null;
    textStyleId: string | null;
    effectStyleId: string | null;
    gridStyleId: string | null;
    sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
    blendMode: import("@open-pencil/scene-graph").BlendMode;
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: number;
    italic: boolean;
    textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
    textDirection: import("@open-pencil/scene-graph").TextDirection;
    textLanguage: string | null;
    textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
    textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
    textCase: import("@open-pencil/scene-graph").TextCase;
    textDecoration: import("@open-pencil/scene-graph").TextDecoration;
    textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
    textDecorationThickness: number | null;
    textDecorationFills: import("@open-pencil/scene-graph").Fill[];
    textDecorationSkipInk: boolean;
    textUnderlineOffset: number | null;
    leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
    lineHeight: number | null;
    letterSpacing: number;
    maxLines: number | null;
    styleRuns: import("@open-pencil/scene-graph").StyleRun[];
    fontVariations: import("@open-pencil/scene-graph").FontVariation[];
    fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
    horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
    verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
    layoutMode: import("@open-pencil/scene-graph").LayoutMode;
    layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
    layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
    primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
    counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
    primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
    counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
    itemSpacing: number;
    counterAxisSpacing: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    layoutPositioning: "AUTO" | "ABSOLUTE";
    layoutGrow: number;
    layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
    vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
    handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
    booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
    fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    arcData: import("@open-pencil/scene-graph").ArcData | null;
    strokeCap: import("@open-pencil/scene-graph").StrokeCap;
    strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
    maskType: import("@open-pencil/scene-graph").MaskType;
    maskIsOutline: boolean;
    gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
    gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
    gridColumnGap: number;
    gridRowGap: number;
    gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
    counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
    itemReverseZIndex: boolean;
    strokesIncludedInLayout: boolean;
    expanded: boolean;
    textTruncation: "DISABLED" | "ENDING";
    autoRename: boolean;
    pointCount: number;
    starInnerRadius: number;
    componentId: string | null;
    overrides: Record<string, unknown>;
    componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
    symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
    variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
    boundVariables: Record<string, string>;
    variableModes: import("@open-pencil/scene-graph").VariableModeMap;
    exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
    pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
    pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
    internalOnly: boolean;
    flipX: boolean;
    flipY: boolean;
    textPicture: Uint8Array | null;
    figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
  } | null>;
  nodes: import("vue").ComputedRef<{
    id: string;
    type: import("@open-pencil/scene-graph").NodeType;
    name: string;
    parentId: string | null;
    childIds: string[];
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    source: import("@open-pencil/scene-graph").SourceMetadata;
    figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
    fills: import("@open-pencil/scene-graph").Fill[];
    strokes: import("@open-pencil/scene-graph").Stroke[];
    effects: import("@open-pencil/scene-graph").Effect[];
    layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
    fillStyleId: string | null;
    strokeStyleId: string | null;
    textStyleId: string | null;
    effectStyleId: string | null;
    gridStyleId: string | null;
    sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
    blendMode: import("@open-pencil/scene-graph").BlendMode;
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: number;
    italic: boolean;
    textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
    textDirection: import("@open-pencil/scene-graph").TextDirection;
    textLanguage: string | null;
    textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
    textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
    textCase: import("@open-pencil/scene-graph").TextCase;
    textDecoration: import("@open-pencil/scene-graph").TextDecoration;
    textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
    textDecorationThickness: number | null;
    textDecorationFills: import("@open-pencil/scene-graph").Fill[];
    textDecorationSkipInk: boolean;
    textUnderlineOffset: number | null;
    leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
    lineHeight: number | null;
    letterSpacing: number;
    maxLines: number | null;
    styleRuns: import("@open-pencil/scene-graph").StyleRun[];
    fontVariations: import("@open-pencil/scene-graph").FontVariation[];
    fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
    horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
    verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
    layoutMode: import("@open-pencil/scene-graph").LayoutMode;
    layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
    layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
    primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
    counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
    primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
    counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
    itemSpacing: number;
    counterAxisSpacing: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    layoutPositioning: "AUTO" | "ABSOLUTE";
    layoutGrow: number;
    layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
    vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
    handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
    booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
    fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    arcData: import("@open-pencil/scene-graph").ArcData | null;
    strokeCap: import("@open-pencil/scene-graph").StrokeCap;
    strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
    maskType: import("@open-pencil/scene-graph").MaskType;
    maskIsOutline: boolean;
    gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
    gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
    gridColumnGap: number;
    gridRowGap: number;
    gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
    counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
    itemReverseZIndex: boolean;
    strokesIncludedInLayout: boolean;
    expanded: boolean;
    textTruncation: "DISABLED" | "ENDING";
    autoRename: boolean;
    pointCount: number;
    starInnerRadius: number;
    componentId: string | null;
    overrides: Record<string, unknown>;
    componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
    symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
    variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
    boundVariables: Record<string, string>;
    variableModes: import("@open-pencil/scene-graph").VariableModeMap;
    exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
    pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
    pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
    internalOnly: boolean;
    flipX: boolean;
    flipY: boolean;
    textPicture: Uint8Array | null;
    figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
  }[]>;
  isMulti: import("vue").ComputedRef<boolean>;
  active: import("vue").ComputedRef<boolean>;
  activeNode: import("vue").ComputedRef<import("@open-pencil/scene-graph").SceneNode | null>;
  targetNodes: () => import("@open-pencil/scene-graph").SceneNode[];
  prop: <K extends keyof import("@open-pencil/scene-graph").SceneNode>(key: K) => import("vue").ComputedRef<MixedValue<import("@open-pencil/scene-graph").SceneNode[K]>>;
  merged: <K extends keyof import("@open-pencil/scene-graph").SceneNode>(key: K) => MixedValue<import("@open-pencil/scene-graph").SceneNode[K]>;
  updateAllWithUndo: (patch: Partial<import("@open-pencil/scene-graph").SceneNode>, label: string) => void;
  updateArrayItem: (key: "fills" | "strokes" | "effects", index: number, patch: Record<string, unknown> | import("@open-pencil/scene-graph").Fill | import("@open-pencil/scene-graph").Stroke, label: string) => void;
  removeArrayItem: (key: "fills" | "strokes" | "effects", index: number, label: string) => void;
  toggleArrayVisibility: (key: "fills" | "strokes" | "effects", index: number) => void;
  isArrayMixed: (key: Parameters<typeof isNodeArrayMixed>[1]) => boolean;
  updateProp: (key: string, value: number | string) => void;
  commitProp: (key: string, _value: number | string, previous: number | string) => void;
};
//#endregion
//#region src/internal/scene-computed/use.d.ts
/**
 * Convenience wrapper for scene-derived computed state.
 *
 * Use this for values that should clearly read as editor/scene-backed derived
 * state in higher-level composables.
 */
declare function useSceneComputed<T>(fn: () => T): ComputedRef<T>;
//#endregion
//#region src/editor/selection-state/use.d.ts
/**
 * Returns reactive selection-derived state for the current editor.
 *
 * Use this composable to drive UI from the current selection without manually
 * reading graph state in every component.
 */
declare function useSelectionState(): {
  editor: {
    wrapInAutoLayout: () => void;
    groupSelected: () => string | null;
    frameSelection: () => string | null;
    booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
    flattenSelected: () => string | null;
    outlineTextSelected: () => string | null;
    outlineStrokeSelected: () => string | null;
    ungroupSelected: () => void;
    createComponentFromSelection: () => void;
    createComponentSetFromComponents: () => void;
    createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
    detachInstance: () => void;
    focusComponent: (componentId: string) => Promise<void>;
    goToMainComponent: () => Promise<void>;
    getComponentSetPropertyDefs: (componentSetId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    addPropertyDefinition: (componentSetId: string, name: string, type?: import("@open-pencil/scene-graph").ComponentPropertyType, defaultValue?: string) => string | undefined;
    removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
    renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
    collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
    findVariantByValues: (componentSetId: string, values: Record<string, string>) => SceneNode | undefined;
    getDefaultVariantForComponentSet: (componentSetId: string) => SceneNode | undefined;
    getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
    switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
    getInstanceComponentPropertyDefinitions: (instanceId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    getInstanceComponentPropertyValue: (instanceId: string, definition: import("@open-pencil/scene-graph").ComponentPropertyDefinition) => string;
    setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
    duplicateSelected: () => void;
    writeCopyData: (data: DataTransfer) => Promise<void>;
    pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
      replaceSelection?: boolean;
    }) => Promise<void>;
    deleteSelected: () => void;
    storeImage: (bytes: Uint8Array) => string;
    placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
    copySelectionAsText: (ids: string[]) => string;
    copySelectionAsSVG: (ids: string[]) => string | null;
    copySelectionAsJSX: (ids: string[]) => string | null;
    setDocumentColorSpace: (colorSpace: import("@open-pencil/scene-graph").DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
    commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
    commitMoveWithReparent: (originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>) => void;
    commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
    commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
    commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    }>) => void;
    commitRotation: (nodeId: string, origRotation: number) => void;
    commitNodeUpdate: (nodeId: string, previous: Partial<SceneNode>, label?: string) => void;
    undoAction: () => void;
    redoAction: () => void;
    snapshotPage: () => PageSnapshot;
    restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
    pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
    screenToCanvas: (sx: number, sy: number) => {
      x: number;
      y: number;
    };
    setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
    applyZoom: (delta: number, centerX: number, centerY: number) => void;
    pan: (dx: number, dy: number) => void;
    zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
    zoomToFit: () => void;
    zoomTo100: () => void;
    zoomToLevel: (level: number) => void;
    zoomToSelection: () => void;
    startTextEditing: (nodeId: string) => void;
    commitTextEdit: () => void;
    getVariablesByType: (type: import("@open-pencil/scene-graph").VariableType) => import("@open-pencil/scene-graph").Variable[];
    getVariable: (id: string) => import("@open-pencil/scene-graph").Variable | undefined;
    resolveColorVariable: (id: string) => import("@open-pencil/scene-graph").Color | undefined;
    resolveNumberVariable: (id: string) => number | undefined;
    getVariablesForCollection: (collectionId: string) => import("@open-pencil/scene-graph").Variable[];
    getCollection: (id: string) => import("@open-pencil/scene-graph").VariableCollection | undefined;
    getCollections: () => import("@open-pencil/scene-graph").VariableCollection[];
    getCollectionCount: () => number;
    getVariableCount: () => number;
    renameCollection: (id: string, newName: string) => void;
    addCollection: (collection: import("@open-pencil/scene-graph").VariableCollection) => void;
    removeCollection: (id: string) => void;
    addVariable: (variable: import("@open-pencil/scene-graph").Variable) => void;
    removeVariable: (id: string) => void;
    renameVariable: (id: string, newName: string) => void;
    updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
    addMode: (collectionId: string, name?: string) => string | undefined;
    removeMode: (collectionId: string, modeId: string) => void;
    renameMode: (collectionId: string, modeId: string, newName: string) => void;
    setDefaultMode: (collectionId: string, modeId: string) => void;
    duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
    setActiveMode: (collectionId: string, modeId: string) => void;
    replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
    alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
    canDistributeNodes: (nodeIds: string[]) => boolean;
    distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    rotateNodes: (nodeIds: string[], degrees: number) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    flushNudge: () => void;
    bindVariable: (nodeId: string, path: string, variableId: string) => void;
    unbindVariable: (nodeId: string, path: string) => void;
    setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
    updateNode: (id: string, changes: Partial<SceneNode>) => void;
    updateNodeWithUndo: (id: string, changes: Partial<SceneNode>, label?: string) => void;
    setOpacity: (opacity: number, coalesceKey?: string) => void;
    moveToPage: (pageId: string) => void;
    previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
    renameSelected: (options: RenameSelectionOptions) => void;
    renameNode: (id: string, name: string) => void;
    toggleNodeVisibility: (id: string) => void;
    toggleNodeLock: (id: string) => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    reparentNodes: (nodeIds: string[], newParentId: string) => void;
    wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: SceneNode[], extraProps?: Partial<SceneNode>) => string | null;
    reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
    reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    isTopLevel: (parentId: string | null) => boolean;
    adoptNodesIntoSection: (sectionId: string) => void;
    setTool: (tool: Tool$2) => void;
    createFrameFromPreset: (preset: FramePresetDimensions) => string;
    resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
    penAddVertex: (x: number, y: number) => void;
    penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
    penSetClosingToFirst: (closing: boolean) => void;
    penSetPendingClose: (closing: boolean) => void;
    penSetKnotPosition: (x: number, y: number) => void;
    penCommit: (closed: boolean) => void;
    penCancel: () => void;
    createShape: (type: import("@open-pencil/scene-graph").NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
    switchPage: (pageId: string) => Promise<void>;
    addPage: (name?: string) => string;
    deletePage: (pageId: string) => void;
    movePage: (pageId: string, index: number) => void;
    renamePage: (pageId: string, name: string) => void;
    setPageColor: (color: import("@open-pencil/scene-graph").Color) => void;
    clearPageViewports: () => void;
    hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => SceneNode | null;
    selectAtPoint: (cx: number, cy: number) => void;
    getSelectedNodes: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    }[];
    getSelectedNode: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    } | undefined;
    getLayerTree: () => {
      node: SceneNode;
      depth: number;
    }[];
    validateEnteredContainer: () => void;
    enterContainer: (id: string) => void;
    exitContainer: () => void;
    setMarquee: (rect: import("@open-pencil/scene-graph/primitives").Rect | null) => void;
    setSnapGuides: (guides: import("@open-pencil/scene-graph").SnapGuide[]) => void;
    setRotationPreview: (preview: {
      nodeId: string;
      angle: number;
    } | null) => void;
    setHoveredNode: (id: string | null) => void;
    setDropTarget: (id: string | null) => void;
    setLayoutInsertIndicator: (indicator: {
      parentId: string;
      index: number;
      x: number;
      y: number;
      length: number;
      direction: "HORIZONTAL" | "VERTICAL";
    } | null) => void;
    setAutoLayoutHover: (hover: {
      nodeId: string;
      kind: "frame" | "children" | "spacing" | "spacing-value" | "padding" | "padding-value";
      index?: number;
      side?: "top" | "right" | "bottom" | "left";
    } | null) => void;
    select: (ids: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    selectInverse: () => void;
    requestRender: () => void;
    requestRepaint: () => void;
    onEditorEvent: <K extends EditorEventName$2>(event: K, handler: EditorEvents$2[K]) => import("nanoevents").Unsubscribe;
    setCanvasKit: (ck: import("canvaskit-wasm").CanvasKit, renderer: SkiaRenderer) => void;
    removeCanvasRenderer: (renderer: SkiaRenderer) => void;
    replaceGraph: (newGraph: import("@open-pencil/scene-graph").SceneGraph) => void;
    subscribeToGraph: () => void;
    getNode: (id: string) => SceneNode | undefined;
    getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
    getChildren: (id: string) => SceneNode[];
    getPages: (includeInternal?: boolean) => SceneNode[];
    graph: import("@open-pencil/scene-graph").SceneGraph;
    renderer: SkiaRenderer | null;
    canvasRenderers: SkiaRenderer[];
    textEditor: TextEditor | null;
    undo: import("@open-pencil/scene-graph").UndoManager;
    state: EditorState$1;
  };
  selectedIds: import("vue").ComputedRef<Set<string>>;
  hasSelection: import("vue").ComputedRef<boolean>;
  selectedNode: import("vue").ComputedRef<SceneNode | null>;
  selectedCount: import("vue").ComputedRef<number>;
  selectedNodeType: import("vue").ComputedRef<import("@open-pencil/scene-graph").NodeType | null>;
  isInstance: import("vue").ComputedRef<boolean>;
  isComponent: import("vue").ComputedRef<boolean>;
  isGroup: import("vue").ComputedRef<boolean>;
  canCreateComponentSet: import("vue").ComputedRef<boolean>;
};
//#endregion
//#region src/editor/events/use.d.ts
declare function useEditorEvent<K extends EditorEventName$1>(event: K, handler: EditorEvents$1[K]): import("nanoevents").Unsubscribe;
//#endregion
//#region src/editor/selection-capabilities/use.d.ts
/**
 * Returns reactive booleans describing which selection-dependent actions are
 * currently available.
 *
 * This is useful for menus, toolbars, shortcuts, and action buttons that need
 * command-friendly capability checks.
 */
declare function useSelectionCapabilities(): {
  selectedIds: import("vue").ComputedRef<Set<string>>;
  selectedNode: import("vue").ComputedRef<import("@open-pencil/scene-graph").SceneNode | null>;
  canCopy: import("vue").ComputedRef<boolean>;
  canCut: import("vue").ComputedRef<boolean>;
  canPaste: import("vue").ComputedRef<boolean>;
  canDelete: import("vue").ComputedRef<boolean>;
  canDuplicate: import("vue").ComputedRef<boolean>;
  canExportSelection: import("vue").ComputedRef<boolean>;
  canGroup: import("vue").ComputedRef<boolean>;
  canFrameSelection: import("vue").ComputedRef<boolean>;
  canUngroup: import("vue").ComputedRef<boolean>;
  canCreateComponent: import("vue").ComputedRef<boolean>;
  canCreateComponentSet: import("vue").ComputedRef<boolean>;
  canDetachInstance: import("vue").ComputedRef<boolean>;
  canWrapInAutoLayout: import("vue").ComputedRef<boolean>;
  canToggleMask: import("vue").ComputedRef<boolean>;
  canBringToFront: import("vue").ComputedRef<boolean>;
  canSendToBack: import("vue").ComputedRef<boolean>;
  canToggleVisibility: import("vue").ComputedRef<boolean>;
  canToggleLock: import("vue").ComputedRef<boolean>;
  canFlip: import("vue").ComputedRef<boolean>;
  canDistribute: import("vue").ComputedRef<boolean>;
  canBooleanOperation: import("vue").ComputedRef<boolean>;
  canFlatten: import("vue").ComputedRef<boolean>;
  canOutlineText: import("vue").ComputedRef<boolean>;
  canOutlineStroke: import("vue").ComputedRef<boolean>;
  canGoToMainComponent: import("vue").ComputedRef<boolean>;
  canCreateInstance: import("vue").ComputedRef<boolean>;
  canMoveToPage: import("vue").ComputedRef<boolean>;
  canSetOpacity: import("vue").ComputedRef<boolean>;
  canSelectAll: import("vue").ComputedRef<boolean>;
  canUndo: import("vue").ComputedRef<boolean>;
  canRedo: import("vue").ComputedRef<boolean>;
  canZoomToSelection: import("vue").ComputedRef<boolean>;
};
//#endregion
//#region src/editor/commands/types.d.ts
type EditorCommandId = 'edit.undo' | 'edit.redo' | 'selection.selectAll' | 'selection.selectInverse' | 'selection.duplicate' | 'selection.delete' | 'selection.group' | 'selection.frameSelection' | 'selection.ungroup' | 'selection.createComponent' | 'selection.createComponentSet' | 'selection.createInstance' | 'selection.detachInstance' | 'selection.goToMainComponent' | 'selection.wrapInAutoLayout' | 'selection.toggleMask' | 'selection.bringForward' | 'selection.bringToFront' | 'selection.sendBackward' | 'selection.sendToBack' | 'selection.toggleVisibility' | 'selection.toggleLock' | 'selection.flipHorizontal' | 'selection.flipVertical' | 'selection.distributeHorizontal' | 'selection.distributeVertical' | 'selection.booleanUnion' | 'selection.booleanSubtract' | 'selection.booleanIntersect' | 'selection.booleanExclude' | 'selection.flatten' | 'selection.outlineText' | 'selection.outlineStroke' | 'selection.moveToPage' | 'selection.setOpacity' | 'view.zoom100' | 'view.zoomFit' | 'view.zoomSelection';
interface EditorCommand {
  id: EditorCommandId;
  label: string;
  enabled: ComputedRef<boolean>;
  run: () => void;
}
interface EditorCommandMenuItem {
  id?: EditorCommandId;
  label: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  icon?: Component;
}
//#endregion
//#region src/editor/commands/use.d.ts
/**
 * Builds a command-oriented interface on top of the current editor.
 *
 * Use this composable when building menus, toolbars, keyboard handlers, or
 * any other UI that should talk in terms of commands instead of raw editor
 * method calls.
 */
declare function useEditorCommands(): {
  getCommand: (id: EditorCommandId) => EditorCommand;
  runCommand: (id: EditorCommandId) => void;
  menuItem: (id: EditorCommandId, shortcut?: string | undefined) => EditorCommandMenuItem;
  commands: Record<EditorCommandId, EditorCommand>;
  otherPages: import("vue").ComputedRef<import("@open-pencil/scene-graph").SceneNode[]>;
  moveSelectionToPage: (pageId: string) => void;
  setOpacityTarget: (value: number, coalesceKey?: string) => void;
};
//#endregion
//#region src/editor/commands/registry.d.ts
interface EditorCommandMetadata {
  shortcut?: string;
  keybinding?: string | string[];
  contextTestId?: string;
}
declare const EDITOR_COMMAND_METADATA: {
  'edit.undo': {
    shortcut: string;
    keybinding: string;
  };
  'edit.redo': {
    shortcut: string;
    keybinding: string[];
  };
  'selection.selectAll': {
    shortcut: string;
    keybinding: string;
  };
  'selection.selectInverse': {
    shortcut: string;
    keybinding: string;
  };
  'selection.duplicate': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.delete': {
    shortcut: string;
    contextTestId: string;
  };
  'selection.group': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.frameSelection': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.ungroup': {
    shortcut: string;
    keybinding: string;
  };
  'selection.createComponent': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.createComponentSet': {
    shortcut: string;
    keybinding: string;
  };
  'selection.detachInstance': {
    shortcut: string;
    keybinding: string;
  };
  'selection.goToMainComponent': {};
  'selection.createInstance': {};
  'selection.wrapInAutoLayout': {
    shortcut: string;
    keybinding: string;
  };
  'selection.toggleMask': {
    shortcut: string;
    keybinding: string[];
    contextTestId: string;
  };
  'selection.bringForward': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.bringToFront': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.sendBackward': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.sendToBack': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.toggleVisibility': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.toggleLock': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.flipHorizontal': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.flipVertical': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.distributeHorizontal': {};
  'selection.distributeVertical': {};
  'selection.booleanUnion': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.booleanSubtract': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.booleanIntersect': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.booleanExclude': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.flatten': {
    shortcut: string;
    keybinding: string;
    contextTestId: string;
  };
  'selection.outlineText': {
    contextTestId: string;
  };
  'selection.outlineStroke': {
    contextTestId: string;
  };
  'selection.moveToPage': {};
  'selection.setOpacity': {
    shortcut: string;
  };
  'view.zoom100': {
    keybinding: string;
  };
  'view.zoomFit': {
    keybinding: string[];
  };
  'view.zoomSelection': {
    keybinding: string[];
  };
};
declare function editorCommandMetadata(id: EditorCommandId): EditorCommandMetadata;
//#endregion
//#region src/editor/commands/shortcut.d.ts
type ShortcutPlatform = 'mac' | 'windows' | 'linux';
declare function shortcutPlatform(userAgent?: string): ShortcutPlatform;
declare function formatShortcut(shortcut: string | undefined, platform?: ShortcutPlatform): string | undefined;
//#endregion
//#region src/testing/test-id.d.ts
type TestId = string;
declare function testId(id?: TestId | null): {
  'data-test-id'?: TestId;
};
declare function testIdSelector(id: TestId): string;
declare function toolbarToolTestId(tool: string, mobile?: boolean): TestId;
declare function toolbarFlyoutTestId(tool: string, mobile?: boolean): TestId;
declare function toolbarFlyoutItemTestId(tool: string, mobile?: boolean): TestId;
declare function variablesAddTestId(type: string): TestId;
declare function acpPermissionOptionTestId(kind: string): TestId;
//#endregion
//#region src/editor/menu-model/types.d.ts
interface MenuActionNode {
  separator?: false;
  id?: EditorCommandId;
  label: string;
  icon?: Component;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  testId?: TestId;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  sub?: MenuEntry[];
}
interface MenuSeparatorNode {
  separator: true;
}
type MenuEntry = MenuActionNode | MenuSeparatorNode;
//#endregion
//#region src/editor/menu-model/use.d.ts
/**
 * Returns ready-to-render menu models derived from the current editor state.
 *
 * This is a higher-level API than {@link useEditorCommands}: it groups
 * commands into app and canvas menu structures and computes context-sensitive
 * labels like Hide/Show and Lock/Unlock.
 */
declare function useMenuModel(): {
  appMenu: import("vue").ComputedRef<({
    label: "Edit";
    items: MenuEntry[];
  } | {
    label: "View";
    items: MenuEntry[];
  } | {
    label: "Object";
    items: MenuEntry[];
  } | {
    label: "Arrange";
    items: MenuEntry[];
  })[]>;
  canvasMenu: import("vue").ComputedRef<MenuEntry[]>;
  selectionLabelMenu: import("vue").ComputedRef<{
    visibility: "Hide" | "Show";
    lock: "Lock" | "Unlock";
  }>;
};
//#endregion
//#region src/editor/viewport-kind/use.d.ts
/**
 * Returns coarse viewport kind flags used by responsive editor UI.
 */
declare function useViewportKind(): {
  isMobile: import("vue").ComputedRef<boolean>;
  isDesktop: import("vue").ComputedRef<boolean>;
};
//#endregion
//#region src/primitives/LayerTree/context.d.ts
interface LayerNode {
  id: string;
  name: string;
  type: string;
  layoutMode: string;
  visible: boolean;
  locked: boolean;
  children?: LayerNode[];
}
interface LayerRow {
  node: LayerNode;
  level: number;
  hasChildren: boolean;
}
interface LayerSelectionMode {
  additive: boolean;
  range: boolean;
}
interface LayerTreeVirtualizer {
  scrollToIndex: (index: number, options?: {
    align?: 'auto' | 'center' | 'end' | 'start';
  }) => void;
}
interface LayerDragInstruction {
  type: 'reorder-above' | 'reorder-below' | 'make-child';
}
interface LayerTreeContext {
  editor: Editor$1;
  items: Ref<LayerNode[]>;
  expanded: Ref<string[]>;
  visibleRows: ComputedRef<LayerRow[]>;
  treeVersion: Ref<number>;
  selectedIds: ComputedRef<Set<string>>;
  focused: Ref<boolean>;
  indentPerLevel: number;
  draggingId: Ref<string | null>;
  instruction: Ref<LayerDragInstruction | null>;
  instructionTargetId: Ref<string | null>;
  setupDrag: (el: Ref<HTMLElement | null>, item: () => {
    id: string;
    level: number;
    hasChildren: boolean;
    parentId: string | null;
  }) => void;
  select: (id: string, selection: boolean | LayerSelectionMode) => void;
  toggleExpand: (id: string) => void;
  setFocused: (focused: boolean) => void;
  setVirtualizer: (virtualizer: LayerTreeVirtualizer) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  rename: (id: string, name: string) => void;
  setRowRef: (id: string, el: HTMLElement | null) => void;
}
declare function useLayerTree(): LayerTreeContext;
//#endregion
//#region src/primitives/LayerTree/useLayerDrag.d.ts
interface DragItem {
  id: string;
  level: number;
  hasChildren: boolean;
  parentId: string | null;
}
declare function useLayerDrag(editor: Editor$1, indentPerLevel?: number, onMakeChildDrop?: (targetId: string) => void): {
  draggingId: Ref<string | null, string | null>;
  instruction: Ref<{
    type: "reorder-above" | "reorder-below" | "make-child";
  } | null, LayerDragInstruction | {
    type: "reorder-above" | "reorder-below" | "make-child";
  } | null>;
  instructionTargetId: Ref<string | null, string | null>;
  setupItem: (el: Ref<HTMLElement | null>, item: () => DragItem) => void;
};
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop-hitbox@1.1.0/node_modules/@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/list-item.d.ts
type Operation = 'reorder-before' | 'reorder-after' | 'combine';
type Axis = 'horizontal' | 'vertical';
type Instruction = { [TOperation in Operation]: {
  operation: TOperation;
  blocked: boolean;
  axis: Axis;
} }[Operation];
//#endregion
//#region src/shared/drag/useFlatReorderDrag.d.ts
type FlatReorderAxis = 'vertical' | 'horizontal';
type FlatReorderInstruction = Extract<Instruction, {
  operation: 'reorder-before' | 'reorder-after';
}>;
interface FlatReorderItem {
  id: string;
}
interface UseFlatReorderDragOptions<TItem extends FlatReorderItem> {
  items: () => readonly TItem[];
  onMove: (sourceId: string, targetIndex: number) => void;
  axis?: FlatReorderAxis;
  getId?: (item: TItem) => string;
}
declare function useFlatReorderDrag<TItem extends FlatReorderItem>({
  items,
  onMove,
  axis,
  getId
}: UseFlatReorderDragOptions<TItem>): {
  draggingId: import("vue").Ref<string | null, string | null>;
  instruction: import("vue").Ref<{
    operation: "reorder-before";
    blocked: boolean;
    axis: "horizontal" | "vertical";
  } | {
    operation: "reorder-after";
    blocked: boolean;
    axis: "horizontal" | "vertical";
  } | null, FlatReorderInstruction | {
    operation: "reorder-before";
    blocked: boolean;
    axis: "horizontal" | "vertical";
  } | {
    operation: "reorder-after";
    blocked: boolean;
    axis: "horizontal" | "vertical";
  } | null>;
  instructionTargetId: import("vue").Ref<string | null, string | null>;
  setupItem: (element: HTMLElement | null, item: () => FlatReorderItem) => void;
};
//#endregion
//#region src/editor/inline-rename/use.d.ts
interface InlineRenameState<T extends string> {
  editingId: Ref<T | null>;
  start: (id: T, currentName: string) => void;
  focusInput: (input: HTMLInputElement | null) => Promise<void>;
  commit: (id: T, eventOrInput: Event | HTMLInputElement) => void;
  cancel: () => void;
  onKeydown: (e: KeyboardEvent) => void;
}
declare function useInlineRename<T extends string>(onCommit: (id: T, newName: string) => void): InlineRenameState<T>;
//#endregion
//#region src/primitives/Toolbar/useToolbarState.d.ts
declare function isToolbarToolActive(tool: EditorToolDef$1, activeTool: Tool$1): boolean;
declare function getToolbarToolSelection(tool: EditorToolDef$1, activeTool: Tool$1, flyoutSelections?: ReadonlyMap<Tool$1, Tool$1>): Tool$1;
/**
 * Returns responsive toolbar UI state for mobile category paging.
 *
 * This composable is presentation-oriented and complements {@link useToolbar}
 * when building toolbar shells.
 */
declare function useToolbarState(): {
  mobileCategory: import("vue").Ref<number, number>;
  slideDirection: import("vue").Ref<number, number>;
  hasPrev: import("vue").ComputedRef<boolean>;
  hasNext: import("vue").ComputedRef<boolean>;
  isActive: typeof isToolbarToolActive;
  activeKeyForTool: typeof getToolbarToolSelection;
  goPrev: () => void;
  goNext: () => void;
};
//#endregion
//#region src/shared/font-status/use.d.ts
/**
 * Returns missing-font information for a text node getter.
 *
 * This is useful for typography panels and warnings that need to surface fonts
 * that are referenced by a node but not yet loaded in the current runtime.
 */
declare function useNodeFontStatus(node: () => SceneNode | null | undefined): {
  missingFonts: import("vue").ComputedRef<string[]>;
  hasMissingFonts: import("vue").ComputedRef<boolean>;
};
//#endregion
//#region src/controls/prop-scrub/use.d.ts
declare function usePropScrub(editor: Editor$1): {
  updateProp: (nodes: SceneNode[], key: string, value: number | string) => void;
  commitProp: (nodes: SceneNode[], key: string, _value: number | string, previous: number | string) => void;
};
//#endregion
//#region src/editor/tool-cursor/index.d.ts
declare function toolCursor(tool: Tool$1, override?: string | null): string;
//#endregion
//#region src/testing/v-test-id.d.ts
declare const vTestId: Directive<HTMLElement, TestId | null | undefined>;
//#endregion
//#region src/controls/position/use.d.ts
/**
 * Returns position-related state and actions for the current selection.
 *
 * This composable is designed for property panels that edit x/y, size,
 * rotation, alignment, flipping, and multi-node transforms.
 */
declare function usePosition(): {
  editor: {
    wrapInAutoLayout: () => void;
    groupSelected: () => string | null;
    frameSelection: () => string | null;
    booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
    flattenSelected: () => string | null;
    outlineTextSelected: () => string | null;
    outlineStrokeSelected: () => string | null;
    ungroupSelected: () => void;
    createComponentFromSelection: () => void;
    createComponentSetFromComponents: () => void;
    createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
    detachInstance: () => void;
    focusComponent: (componentId: string) => Promise<void>;
    goToMainComponent: () => Promise<void>;
    getComponentSetPropertyDefs: (componentSetId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    addPropertyDefinition: (componentSetId: string, name: string, type?: import("@open-pencil/scene-graph").ComponentPropertyType, defaultValue?: string) => string | undefined;
    removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
    renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
    collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
    findVariantByValues: (componentSetId: string, values: Record<string, string>) => SceneNode | undefined;
    getDefaultVariantForComponentSet: (componentSetId: string) => SceneNode | undefined;
    getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
    switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
    getInstanceComponentPropertyDefinitions: (instanceId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    getInstanceComponentPropertyValue: (instanceId: string, definition: import("@open-pencil/scene-graph").ComponentPropertyDefinition) => string;
    setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
    duplicateSelected: () => void;
    writeCopyData: (data: DataTransfer) => Promise<void>;
    pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
      replaceSelection?: boolean;
    }) => Promise<void>;
    deleteSelected: () => void;
    storeImage: (bytes: Uint8Array) => string;
    placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
    copySelectionAsText: (ids: string[]) => string;
    copySelectionAsSVG: (ids: string[]) => string | null;
    copySelectionAsJSX: (ids: string[]) => string | null;
    setDocumentColorSpace: (colorSpace: import("@open-pencil/scene-graph").DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
    commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
    commitMoveWithReparent: (originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>) => void;
    commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
    commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
    commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    }>) => void;
    commitRotation: (nodeId: string, origRotation: number) => void;
    commitNodeUpdate: (nodeId: string, previous: Partial<SceneNode>, label?: string) => void;
    undoAction: () => void;
    redoAction: () => void;
    snapshotPage: () => PageSnapshot;
    restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
    pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
    screenToCanvas: (sx: number, sy: number) => {
      x: number;
      y: number;
    };
    setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
    applyZoom: (delta: number, centerX: number, centerY: number) => void;
    pan: (dx: number, dy: number) => void;
    zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
    zoomToFit: () => void;
    zoomTo100: () => void;
    zoomToLevel: (level: number) => void;
    zoomToSelection: () => void;
    startTextEditing: (nodeId: string) => void;
    commitTextEdit: () => void;
    getVariablesByType: (type: import("@open-pencil/scene-graph").VariableType) => import("@open-pencil/scene-graph").Variable[];
    getVariable: (id: string) => import("@open-pencil/scene-graph").Variable | undefined;
    resolveColorVariable: (id: string) => import("@open-pencil/scene-graph").Color | undefined;
    resolveNumberVariable: (id: string) => number | undefined;
    getVariablesForCollection: (collectionId: string) => import("@open-pencil/scene-graph").Variable[];
    getCollection: (id: string) => import("@open-pencil/scene-graph").VariableCollection | undefined;
    getCollections: () => import("@open-pencil/scene-graph").VariableCollection[];
    getCollectionCount: () => number;
    getVariableCount: () => number;
    renameCollection: (id: string, newName: string) => void;
    addCollection: (collection: import("@open-pencil/scene-graph").VariableCollection) => void;
    removeCollection: (id: string) => void;
    addVariable: (variable: import("@open-pencil/scene-graph").Variable) => void;
    removeVariable: (id: string) => void;
    renameVariable: (id: string, newName: string) => void;
    updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
    addMode: (collectionId: string, name?: string) => string | undefined;
    removeMode: (collectionId: string, modeId: string) => void;
    renameMode: (collectionId: string, modeId: string, newName: string) => void;
    setDefaultMode: (collectionId: string, modeId: string) => void;
    duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
    setActiveMode: (collectionId: string, modeId: string) => void;
    replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
    alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
    canDistributeNodes: (nodeIds: string[]) => boolean;
    distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    rotateNodes: (nodeIds: string[], degrees: number) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    flushNudge: () => void;
    bindVariable: (nodeId: string, path: string, variableId: string) => void;
    unbindVariable: (nodeId: string, path: string) => void;
    setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
    updateNode: (id: string, changes: Partial<SceneNode>) => void;
    updateNodeWithUndo: (id: string, changes: Partial<SceneNode>, label?: string) => void;
    setOpacity: (opacity: number, coalesceKey?: string) => void;
    moveToPage: (pageId: string) => void;
    previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
    renameSelected: (options: RenameSelectionOptions) => void;
    renameNode: (id: string, name: string) => void;
    toggleNodeVisibility: (id: string) => void;
    toggleNodeLock: (id: string) => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    reparentNodes: (nodeIds: string[], newParentId: string) => void;
    wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: SceneNode[], extraProps?: Partial<SceneNode>) => string | null;
    reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
    reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    isTopLevel: (parentId: string | null) => boolean;
    adoptNodesIntoSection: (sectionId: string) => void;
    setTool: (tool: Tool$2) => void;
    createFrameFromPreset: (preset: FramePresetDimensions) => string;
    resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
    penAddVertex: (x: number, y: number) => void;
    penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
    penSetClosingToFirst: (closing: boolean) => void;
    penSetPendingClose: (closing: boolean) => void;
    penSetKnotPosition: (x: number, y: number) => void;
    penCommit: (closed: boolean) => void;
    penCancel: () => void;
    createShape: (type: import("@open-pencil/scene-graph").NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
    switchPage: (pageId: string) => Promise<void>;
    addPage: (name?: string) => string;
    deletePage: (pageId: string) => void;
    movePage: (pageId: string, index: number) => void;
    renamePage: (pageId: string, name: string) => void;
    setPageColor: (color: import("@open-pencil/scene-graph").Color) => void;
    clearPageViewports: () => void;
    hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => SceneNode | null;
    selectAtPoint: (cx: number, cy: number) => void;
    getSelectedNodes: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    }[];
    getSelectedNode: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    } | undefined;
    getLayerTree: () => {
      node: SceneNode;
      depth: number;
    }[];
    validateEnteredContainer: () => void;
    enterContainer: (id: string) => void;
    exitContainer: () => void;
    setMarquee: (rect: import("@open-pencil/scene-graph/primitives").Rect | null) => void;
    setSnapGuides: (guides: import("@open-pencil/scene-graph").SnapGuide[]) => void;
    setRotationPreview: (preview: {
      nodeId: string;
      angle: number;
    } | null) => void;
    setHoveredNode: (id: string | null) => void;
    setDropTarget: (id: string | null) => void;
    setLayoutInsertIndicator: (indicator: {
      parentId: string;
      index: number;
      x: number;
      y: number;
      length: number;
      direction: "HORIZONTAL" | "VERTICAL";
    } | null) => void;
    setAutoLayoutHover: (hover: {
      nodeId: string;
      kind: "frame" | "children" | "spacing" | "spacing-value" | "padding" | "padding-value";
      index?: number;
      side?: "top" | "right" | "bottom" | "left";
    } | null) => void;
    select: (ids: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    selectInverse: () => void;
    requestRender: () => void;
    requestRepaint: () => void;
    onEditorEvent: <K extends EditorEventName$2>(event: K, handler: EditorEvents$2[K]) => import("nanoevents").Unsubscribe;
    setCanvasKit: (ck: import("canvaskit-wasm").CanvasKit, renderer: SkiaRenderer) => void;
    removeCanvasRenderer: (renderer: SkiaRenderer) => void;
    replaceGraph: (newGraph: import("@open-pencil/scene-graph").SceneGraph) => void;
    subscribeToGraph: () => void;
    getNode: (id: string) => SceneNode | undefined;
    getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
    getChildren: (id: string) => SceneNode[];
    getPages: (includeInternal?: boolean) => SceneNode[];
    graph: import("@open-pencil/scene-graph").SceneGraph;
    renderer: SkiaRenderer | null;
    canvasRenderers: SkiaRenderer[];
    textEditor: TextEditor | null;
    undo: import("@open-pencil/scene-graph").UndoManager;
    state: EditorState$1;
  };
  nodes: import("vue").ComputedRef<{
    id: string;
    type: import("@open-pencil/scene-graph").NodeType;
    name: string;
    parentId: string | null;
    childIds: string[];
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    source: import("@open-pencil/scene-graph").SourceMetadata;
    figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
    fills: import("@open-pencil/scene-graph").Fill[];
    strokes: import("@open-pencil/scene-graph").Stroke[];
    effects: import("@open-pencil/scene-graph").Effect[];
    layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
    fillStyleId: string | null;
    strokeStyleId: string | null;
    textStyleId: string | null;
    effectStyleId: string | null;
    gridStyleId: string | null;
    sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
    blendMode: import("@open-pencil/scene-graph").BlendMode;
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: number;
    italic: boolean;
    textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
    textDirection: import("@open-pencil/scene-graph").TextDirection;
    textLanguage: string | null;
    textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
    textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
    textCase: import("@open-pencil/scene-graph").TextCase;
    textDecoration: import("@open-pencil/scene-graph").TextDecoration;
    textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
    textDecorationThickness: number | null;
    textDecorationFills: import("@open-pencil/scene-graph").Fill[];
    textDecorationSkipInk: boolean;
    textUnderlineOffset: number | null;
    leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
    lineHeight: number | null;
    letterSpacing: number;
    maxLines: number | null;
    styleRuns: import("@open-pencil/scene-graph").StyleRun[];
    fontVariations: import("@open-pencil/scene-graph").FontVariation[];
    fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
    horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
    verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
    layoutMode: import("@open-pencil/scene-graph").LayoutMode;
    layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
    layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
    primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
    counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
    primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
    counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
    itemSpacing: number;
    counterAxisSpacing: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    layoutPositioning: "AUTO" | "ABSOLUTE";
    layoutGrow: number;
    layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
    vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
    handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
    booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
    fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    arcData: import("@open-pencil/scene-graph").ArcData | null;
    strokeCap: import("@open-pencil/scene-graph").StrokeCap;
    strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
    maskType: import("@open-pencil/scene-graph").MaskType;
    maskIsOutline: boolean;
    gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
    gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
    gridColumnGap: number;
    gridRowGap: number;
    gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
    counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
    itemReverseZIndex: boolean;
    strokesIncludedInLayout: boolean;
    expanded: boolean;
    textTruncation: "DISABLED" | "ENDING";
    autoRename: boolean;
    pointCount: number;
    starInnerRadius: number;
    componentId: string | null;
    overrides: Record<string, unknown>;
    componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
    symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
    variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
    boundVariables: Record<string, string>;
    variableModes: import("@open-pencil/scene-graph").VariableModeMap;
    exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
    pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
    pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
    internalOnly: boolean;
    flipX: boolean;
    flipY: boolean;
    textPicture: Uint8Array | null;
    figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
  }[]>;
  node: import("vue").ComputedRef<SceneNode | null>;
  active: import("vue").ComputedRef<boolean>;
  isMulti: import("vue").ComputedRef<boolean>;
  ids: import("vue").ComputedRef<string[]>;
  x: import("vue").ComputedRef<number>;
  y: import("vue").ComputedRef<number>;
  width: import("vue").ComputedRef<number>;
  height: import("vue").ComputedRef<number>;
  rotation: import("vue").ComputedRef<number>;
  updateProp: (key: string, value: number) => void;
  commitProp: (key: string, value: number, previous: number) => void;
  align: (axis: "horizontal" | "vertical", pos: "min" | "center" | "max") => void;
  flip: (axis: "horizontal" | "vertical") => void;
  rotate: (degrees: number) => void;
};
//#endregion
//#region src/i18n/locale.d.ts
declare const AVAILABLE_LOCALES: readonly ["en", "de", "es", "fr", "it", "ja", "pl", "ru", "zh-CN"];
type Locale = (typeof AVAILABLE_LOCALES)[number];
type TranslatedLocale = Exclude<Locale, 'en'>;
declare const TRANSLATED_LOCALES: readonly ["de", "es", "fr", "it", "ja", "pl", "ru", "zh-CN"];
declare const LOCALE_DIR_NAMES: {
  readonly de: "de";
  readonly es: "es";
  readonly fr: "fr";
  readonly it: "it";
  readonly ja: "ja";
  readonly pl: "pl";
  readonly ru: "ru";
  readonly 'zh-CN': "zh-cn";
};
declare const LOCALE_LABELS: Record<Locale, string>;
declare const localeSetting: import("nanostores").PreinitializedWritableAtom<"en" | "de" | "es" | "fr" | "it" | "ja" | "pl" | "ru" | "zh-CN" | undefined> & object;
declare const locale: import("@nanostores/i18n").LocaleStore<"en" | "de" | "es" | "fr" | "it" | "ja" | "pl" | "ru" | "zh-CN">;
declare function setLocale(code: Locale): void;
//#endregion
//#region src/i18n/useI18n.d.ts
/**
 * Reactive i18n composable for OpenPencil Vue components.
 *
 * Returns reactive translation objects grouped by domain, plus locale
 * controls. All values update automatically when the locale changes.
 *
 * @example
 * ```vue
 * <script setup>
 * const { menu, commands, locale, setLocale } = useI18n()
 * </script>
 *
 * <template>
 *   <button>{{ menu.save }}</button>
 *   <span>{{ commands.undo }}</span>
 * </template>
 * ```
 */
declare function useI18nNamespace<MessagesStore extends Store>(messages: MessagesStore): Ref<StoreValue<MessagesStore>>;
declare function useMenuMessages(): Ref<{
  readonly file: "File";
  readonly edit: "Edit";
  readonly view: "View";
  readonly object: "Object";
  readonly arrange: "Arrange";
  readonly text: "Text";
  readonly new: "New";
  readonly open: "Open…";
  readonly openStorageWorkspace: "Open storage workspace…";
  readonly save: "Save";
  readonly saveAs: "Save as…";
  readonly exportSelection: "Export selection…";
  readonly autosave: "Auto-save to local file";
  readonly closeTab: "Close tab";
  readonly copy: "Copy";
  readonly paste: "Paste";
  readonly theme: "Theme";
  readonly themeLight: "Light";
  readonly themeDark: "Dark";
  readonly themeAuto: "Auto";
  readonly profiler: "Performance profiler";
  readonly language: "Language";
  readonly settings: "Settings…";
  readonly rulers: "Rulers";
  readonly multiplayerCursors: "Multiplayer cursors";
  readonly checkUpdates: "Check for updates…";
  readonly moveToPage: "Move to page";
  readonly createInstance: "Create instance";
  readonly hide: "Hide";
  readonly show: "Show";
  readonly lock: "Lock";
  readonly unlock: "Unlock";
  readonly cut: "Cut";
  readonly front: "Front";
  readonly back: "Back";
  readonly toggleUI: "Toggle UI";
  readonly bold: "Bold";
  readonly italic: "Italic";
  readonly underline: "Underline";
  readonly strikethrough: "Strikethrough";
  readonly pasteHere: "Paste here";
  readonly pasteToReplace: "Paste to replace";
  readonly renameSelection: "Rename selection…";
  readonly copyPasteAs: "Copy/Paste as";
  readonly copyAsText: "Copy as text";
  readonly copyAsSVG: "Copy as SVG";
  readonly copyAsPNG: "Copy as PNG";
  readonly copyAsJSX: "Copy as JSX";
  readonly copyNodeId: "Copy node ID";
  readonly copyXPath: "Copy XPath";
  readonly convertToVector: "Convert to vector";
  readonly booleanOperations: "Boolean operations";
  readonly arrangeAlignLeft: "Align left";
  readonly arrangeAlignCenter: "Align center";
  readonly arrangeAlignRight: "Align right";
  readonly arrangeAlignTop: "Align top";
  readonly arrangeAlignMiddle: "Align middle";
  readonly arrangeAlignBottom: "Align bottom";
  readonly zoomIn: "Zoom in";
  readonly zoomOut: "Zoom out";
}, {
  readonly file: "File";
  readonly edit: "Edit";
  readonly view: "View";
  readonly object: "Object";
  readonly arrange: "Arrange";
  readonly text: "Text";
  readonly new: "New";
  readonly open: "Open…";
  readonly openStorageWorkspace: "Open storage workspace…";
  readonly save: "Save";
  readonly saveAs: "Save as…";
  readonly exportSelection: "Export selection…";
  readonly autosave: "Auto-save to local file";
  readonly closeTab: "Close tab";
  readonly copy: "Copy";
  readonly paste: "Paste";
  readonly theme: "Theme";
  readonly themeLight: "Light";
  readonly themeDark: "Dark";
  readonly themeAuto: "Auto";
  readonly profiler: "Performance profiler";
  readonly language: "Language";
  readonly settings: "Settings…";
  readonly rulers: "Rulers";
  readonly multiplayerCursors: "Multiplayer cursors";
  readonly checkUpdates: "Check for updates…";
  readonly moveToPage: "Move to page";
  readonly createInstance: "Create instance";
  readonly hide: "Hide";
  readonly show: "Show";
  readonly lock: "Lock";
  readonly unlock: "Unlock";
  readonly cut: "Cut";
  readonly front: "Front";
  readonly back: "Back";
  readonly toggleUI: "Toggle UI";
  readonly bold: "Bold";
  readonly italic: "Italic";
  readonly underline: "Underline";
  readonly strikethrough: "Strikethrough";
  readonly pasteHere: "Paste here";
  readonly pasteToReplace: "Paste to replace";
  readonly renameSelection: "Rename selection…";
  readonly copyPasteAs: "Copy/Paste as";
  readonly copyAsText: "Copy as text";
  readonly copyAsSVG: "Copy as SVG";
  readonly copyAsPNG: "Copy as PNG";
  readonly copyAsJSX: "Copy as JSX";
  readonly copyNodeId: "Copy node ID";
  readonly copyXPath: "Copy XPath";
  readonly convertToVector: "Convert to vector";
  readonly booleanOperations: "Boolean operations";
  readonly arrangeAlignLeft: "Align left";
  readonly arrangeAlignCenter: "Align center";
  readonly arrangeAlignRight: "Align right";
  readonly arrangeAlignTop: "Align top";
  readonly arrangeAlignMiddle: "Align middle";
  readonly arrangeAlignBottom: "Align bottom";
  readonly zoomIn: "Zoom in";
  readonly zoomOut: "Zoom out";
}>;
declare function useCommandMessages(): Ref<{
  readonly undo: "Undo";
  readonly redo: "Redo";
  readonly selectAll: "Select all";
  readonly selectInverse: "Select inverse";
  readonly duplicate: "Duplicate";
  readonly delete: "Delete";
  readonly group: "Group";
  readonly groupSelection: "Group selection";
  readonly frameSelection: "Frame selection";
  readonly ungroup: "Ungroup";
  readonly createComponent: "Create component";
  readonly createComponentSet: "Create component set";
  readonly createInstance: "Create instance";
  readonly detachInstance: "Detach instance";
  readonly goToMainComponent: "Go to main component";
  readonly addAutoLayout: "Add auto layout";
  readonly useAsMask: "Use as mask";
  readonly removeMask: "Remove mask";
  readonly bringForward: "Bring forward";
  readonly bringToFront: "Bring to front";
  readonly sendBackward: "Send backward";
  readonly sendToBack: "Send to back";
  readonly showHide: "Show/Hide";
  readonly lockUnlock: "Lock/Unlock";
  readonly unionSelection: "Union selection";
  readonly subtractSelection: "Subtract selection";
  readonly intersectSelection: "Intersect selection";
  readonly excludeSelection: "Exclude selection";
  readonly flattenSelection: "Flatten";
  readonly outlineText: "Outline text";
  readonly outlineStroke: "Outline stroke";
  readonly booleanOperations: "Boolean operations";
  readonly flipHorizontal: "Flip horizontal";
  readonly flipVertical: "Flip vertical";
  readonly distributeHorizontal: "Distribute horizontal spacing";
  readonly distributeVertical: "Distribute vertical spacing";
  readonly moveToPage: "Move to page";
  readonly setOpacity: "Set opacity";
  readonly zoomTo100: "Zoom to 100%";
  readonly zoomToFit: "Zoom to fit";
  readonly zoomToSelection: "Zoom to selection";
}, {
  readonly undo: "Undo";
  readonly redo: "Redo";
  readonly selectAll: "Select all";
  readonly selectInverse: "Select inverse";
  readonly duplicate: "Duplicate";
  readonly delete: "Delete";
  readonly group: "Group";
  readonly groupSelection: "Group selection";
  readonly frameSelection: "Frame selection";
  readonly ungroup: "Ungroup";
  readonly createComponent: "Create component";
  readonly createComponentSet: "Create component set";
  readonly createInstance: "Create instance";
  readonly detachInstance: "Detach instance";
  readonly goToMainComponent: "Go to main component";
  readonly addAutoLayout: "Add auto layout";
  readonly useAsMask: "Use as mask";
  readonly removeMask: "Remove mask";
  readonly bringForward: "Bring forward";
  readonly bringToFront: "Bring to front";
  readonly sendBackward: "Send backward";
  readonly sendToBack: "Send to back";
  readonly showHide: "Show/Hide";
  readonly lockUnlock: "Lock/Unlock";
  readonly unionSelection: "Union selection";
  readonly subtractSelection: "Subtract selection";
  readonly intersectSelection: "Intersect selection";
  readonly excludeSelection: "Exclude selection";
  readonly flattenSelection: "Flatten";
  readonly outlineText: "Outline text";
  readonly outlineStroke: "Outline stroke";
  readonly booleanOperations: "Boolean operations";
  readonly flipHorizontal: "Flip horizontal";
  readonly flipVertical: "Flip vertical";
  readonly distributeHorizontal: "Distribute horizontal spacing";
  readonly distributeVertical: "Distribute vertical spacing";
  readonly moveToPage: "Move to page";
  readonly setOpacity: "Set opacity";
  readonly zoomTo100: "Zoom to 100%";
  readonly zoomToFit: "Zoom to fit";
  readonly zoomToSelection: "Zoom to selection";
}>;
declare function useToolMessages(): Ref<{
  readonly move: "Move";
  readonly frame: "Frame";
  readonly section: "Section";
  readonly rectangle: "Rectangle";
  readonly ellipse: "Ellipse";
  readonly line: "Line";
  readonly polygon: "Polygon";
  readonly star: "Star";
  readonly pen: "Pen";
  readonly text: "Text";
  readonly hand: "Hand";
}, {
  readonly move: "Move";
  readonly frame: "Frame";
  readonly section: "Section";
  readonly rectangle: "Rectangle";
  readonly ellipse: "Ellipse";
  readonly line: "Line";
  readonly polygon: "Polygon";
  readonly star: "Star";
  readonly pen: "Pen";
  readonly text: "Text";
  readonly hand: "Hand";
}>;
declare function usePanelMessages(): Ref<{
  readonly untitled: "Untitled";
  readonly nodeCopyString: " copy";
  readonly layers: "Layers";
  readonly pages: "Pages";
  readonly design: "Design";
  readonly code: "Code";
  readonly ai: "AI";
  readonly assets: "Assets";
  readonly searchLocalComponents: "Search local components";
  readonly assetView: "Asset view";
  readonly gridView: "Grid view";
  readonly listView: "List view";
  readonly viewDetails: "View details";
  readonly assetLibraryBadge: "Library";
  readonly assetVariantSummary: import("@nanostores/i18n").TranslationFunction<[{
    count: string | number;
  } & {
    names: string | number;
  } & object], string>;
  readonly duplicateVariantValues: "Duplicate variant values";
  readonly openDocumentation: "Open documentation";
  readonly noLocalComponents: "No local components";
  readonly componentSet: "Component set";
  readonly component: "Component";
  readonly insertInstance: "Insert instance";
  readonly description: "Description";
  readonly documentation: "Documentation";
  readonly openDocs: "Open docs";
  readonly properties: "Properties";
  readonly xAxis: "X Axis";
  readonly yAxis: "Y Axis";
  readonly rotation: "Rotation";
  readonly width: "Width";
  readonly height: "Height";
  readonly opacity: "Opacity";
  readonly blendMode: "Blend mode";
  readonly radius: "Radius";
  readonly cornerSmoothing: "Corner smoothing";
  readonly spread: "Spread";
  readonly page: "Page";
  readonly frame: "Frame";
  readonly framePreset: "Frame preset";
  readonly framePresetCustom: "Custom";
  readonly framePresetCategoryPhone: "Phone";
  readonly framePresetCategoryTablet: "Tablet";
  readonly framePresetCategoryDesktop: "Desktop";
  readonly framePresetCategoryPresentation: "Presentation";
  readonly framePresetCategoryWatch: "Watch";
  readonly framePresetCategoryPaper: "Paper";
  readonly framePresetCategorySocialMedia: "Social media";
  readonly framePresetCategoryFigmaCommunity: "Figma Community";
  readonly framePresetCategoryArchive: "Archive";
  readonly position: "Position";
  readonly layout: "Layout";
  readonly autoLayout: "Auto layout";
  readonly alignment: "Alignment";
  readonly appearance: "Appearance";
  readonly fill: "Fill";
  readonly stroke: "Stroke";
  readonly effects: "Effects";
  readonly mask: "Mask";
  readonly export: "Export";
  readonly typography: "Typography";
  readonly fontFamily: "Font family";
  readonly fontWeight: "Font weight";
  readonly fontSize: "Font size";
  readonly lineHeight: "Line height";
  readonly letterSpacing: "Letter spacing";
  readonly textAlignment: "Text alignment";
  readonly verticalTextAlignment: "Vertical text alignment";
  readonly textCase: "Text case";
  readonly textCaseOriginal: "Original";
  readonly textCaseUpper: "Uppercase";
  readonly textCaseLower: "Lowercase";
  readonly textCaseTitle: "Title case";
  readonly truncation: "Truncation";
  readonly truncationDisabled: "Disabled";
  readonly truncationEnding: "Ending ellipsis";
  readonly maxLines: "Maximum lines";
  readonly openTypeFeatures: "Font features";
  readonly standardLigatures: "Standard ligatures";
  readonly contextualAlternates: "Contextual alternates";
  readonly kerning: "Kerning";
  readonly textFormatting: "Text formatting";
  readonly pageBackground: "Page background";
  readonly variables: "Variables";
  readonly variants: "Variants";
  readonly componentProperties: "Component properties";
  readonly constraints: "Constraints";
  readonly horizontalConstraint: "Horizontal constraint";
  readonly verticalConstraint: "Vertical constraint";
  readonly constraintLeft: "Left";
  readonly constraintRight: "Right";
  readonly constraintTop: "Top";
  readonly constraintBottom: "Bottom";
  readonly constraintCenter: "Center";
  readonly constraintLeftAndRight: "Left and right";
  readonly constraintTopAndBottom: "Top and bottom";
  readonly constraintScale: "Scale";
  readonly constraintHorizontalCenter: "Horizontal center";
  readonly constraintVerticalCenter: "Vertical center";
  readonly addFill: "Add fill";
  readonly addStroke: "Add stroke";
  readonly addEffect: "Add effect";
  readonly addExport: "Add export";
  readonly removeFill: "Remove fill";
  readonly removeStroke: "Remove stroke";
  readonly removeEffect: "Remove effect";
  readonly removeExport: "Remove export";
  readonly effectSettings: "Effect settings";
  readonly expandEffectSettings: "Expand effect settings";
  readonly collapseEffectSettings: "Collapse effect settings";
  readonly toggleExportPreview: "Toggle export preview";
  readonly dropShadow: "Drop shadow";
  readonly innerShadow: "Inner shadow";
  readonly layerBlur: "Layer blur";
  readonly backgroundBlur: "Background blur";
  readonly foregroundBlur: "Foreground blur";
  readonly maskType: "Mask type";
  readonly maskTypeAlpha: "Alpha";
  readonly maskTypeVector: "Vector";
  readonly maskTypeLuminance: "Luminance";
  readonly blendModePassThrough: "Pass through";
  readonly blendModeNormal: "Normal";
  readonly blendModeDarken: "Darken";
  readonly blendModeMultiply: "Multiply";
  readonly blendModeColorBurn: "Color burn";
  readonly blendModeLighten: "Lighten";
  readonly blendModeScreen: "Screen";
  readonly blendModeColorDodge: "Color dodge";
  readonly blendModeOverlay: "Overlay";
  readonly blendModeSoftLight: "Soft light";
  readonly blendModeHardLight: "Hard light";
  readonly blendModeDifference: "Difference";
  readonly blendModeExclusion: "Exclusion";
  readonly blendModeHue: "Hue";
  readonly blendModeSaturation: "Saturation";
  readonly blendModeColor: "Color";
  readonly blendModeLuminosity: "Luminosity";
  readonly strokeType: "Stroke type";
  readonly strokeWeight: "Stroke weight";
  readonly noSelection: "No selection";
  readonly noLocalVariables: "No local variables";
  readonly openVariables: "Open variables";
  readonly addPage: "Add page";
  readonly toggleVisibility: "Toggle visibility";
  readonly independentCornerRadii: "Independent corner radii";
  readonly detachVariable: "Detach variable";
  readonly applyVariable: "Apply variable";
  readonly noVariablesFound: "No variables found";
  readonly addAutoLayout: "Add auto layout";
  readonly removeAutoLayout: "Remove auto layout";
  readonly alignLeft: "Align left";
  readonly alignCenterHorizontally: "Align center horizontally";
  readonly alignRight: "Align right";
  readonly alignTop: "Align top";
  readonly alignCenterVertically: "Align center vertically";
  readonly alignBottom: "Align bottom";
  readonly flipHorizontal: "Flip horizontal";
  readonly flipVertical: "Flip vertical";
  readonly rotate90: "Rotate 90°";
  readonly mixedFillsHelp: "Click + to replace mixed fills";
  readonly mixedStrokesHelp: "Click + to replace mixed strokes";
  readonly mixedEffectsHelp: "Click + to replace mixed effects";
  readonly strokeSides: "Stroke sides";
  readonly strokeDash: "Dashed stroke";
  readonly strokeCap: "Stroke cap";
  readonly strokeCapButt: "Butt cap";
  readonly strokeCapRound: "Round cap";
  readonly strokeCapSquare: "Square cap";
  readonly strokeJoin: "Stroke join";
  readonly strokeJoinMiter: "Miter join";
  readonly strokeJoinBevel: "Bevel join";
  readonly strokeJoinRound: "Round join";
  readonly strokeMiterLimit: "Miter limit";
  readonly strokeAlignInside: "Inside";
  readonly strokeAlignCenter: "Center";
  readonly strokeAlignOutside: "Outside";
  readonly exportScale: "Export scale";
  readonly exportFormat: "Export format";
  readonly exportPreview: "Preview";
  readonly exportRenderingPreview: "Rendering preview…";
  readonly create: "Create";
  readonly add: "Add";
  readonly createVariable: "Create variable";
  readonly createColorVariable: import("@nanostores/i18n").TranslationFunction<[{
    value: string | number;
  } & object], string>;
  readonly createNumberVariable: import("@nanostores/i18n").TranslationFunction<[{
    value: string | number;
  } & object], string>;
  readonly variableName: "Variable name";
  readonly mixed: "Mixed";
  readonly none: "None";
  readonly fillStyle: "Fill style";
  readonly strokeStyle: "Stroke style";
  readonly textStyle: "Text style";
  readonly effectStyle: "Effect style";
  readonly gridStyle: "Grid style";
  readonly missingStyle: import("@nanostores/i18n").TranslationFunction<[{
    id: string | number;
  } & object], string>;
  readonly layersCount: import("@nanostores/i18n").TranslationFunction<[{
    count: string | number;
  } & object], string>;
  readonly goToMainComponent: "Go to Main Component";
  readonly detachInstance: "Detach Instance";
  readonly gap: "Gap";
  readonly solid: "Solid";
  readonly linearGradient: "Linear";
  readonly radialGradient: "Radial";
  readonly image: "Image";
  readonly stops: "Stops";
  readonly addStop: "Add stop";
  readonly alignCenter: "Align center";
  readonly alignMiddle: "Align middle";
  readonly clipContent: "Clip content";
  readonly colorFormatRgb: "RGB";
  readonly colorFormatHsl: "HSL";
  readonly colorFormatHsb: "HSB";
  readonly colorFormatOkhcl: "OkHCL";
  readonly colorHintHsl: "H hue · S saturation · L lightness";
  readonly colorHintHsb: "H hue · S saturation · B brightness";
  readonly colorHintOkhcl: "H hue · C chroma · L lightness · A alpha";
  readonly colorPreviewClipped: import("@nanostores/i18n").TranslationFunction<[{
    space: string | number;
  } & object], string>;
  readonly rulers: "Rulers";
  readonly multiplayerCursors: "Multiplayer cursors";
  readonly direction: "Direction";
  readonly flow: "Flow";
  readonly freeform: "Freeform";
  readonly dimensions: "Dimensions";
  readonly layoutHorizontal: "Horizontal layout";
  readonly layoutVertical: "Vertical layout";
  readonly layoutGrid: "Grid layout";
  readonly layoutWrap: "Wrap layout";
  readonly gapAuto: "Auto gap";
  readonly horizontalGap: "Horizontal gap";
  readonly verticalGap: "Vertical gap";
  readonly auto: "Auto";
  readonly columns: "Columns";
  readonly rows: "Rows";
  readonly sizingFixed: "Fixed";
  readonly sizingHug: "Hug";
  readonly sizingFill: "Fill";
  readonly sizingHugShort: "Hug";
  readonly sizingFillShort: "Fill";
  readonly addMinWidth: "Add min width";
  readonly removeMinWidth: "Remove min width";
  readonly addMaxWidth: "Add max width";
  readonly removeMaxWidth: "Remove max width";
  readonly addMinHeight: "Add min height";
  readonly removeMinHeight: "Remove min height";
  readonly addMaxHeight: "Add max height";
  readonly removeMaxHeight: "Remove max height";
  readonly minWidthShort: "Min W";
  readonly maxWidthShort: "Max W";
  readonly minHeightShort: "Min H";
  readonly maxHeightShort: "Max H";
  readonly setToCurrentWidth: "Set to current width";
  readonly setToCurrentHeight: "Set to current height";
  readonly sizingFillFr: "Fill (fr)";
  readonly sizingFixedPx: "Fixed (px)";
  readonly resizing: "Resizing";
  readonly resizeAutoWidth: "Auto width";
  readonly resizeAutoHeight: "Auto height";
  readonly resizeFixed: "Fixed size";
  readonly layoutGrids: "Layout guide";
  readonly addLayoutGrid: "Add layout guide";
  readonly removeLayoutGrid: "Remove layout guide";
  readonly gridColumns: "Columns";
  readonly gridRows: "Rows";
  readonly gridGrid: "Grid";
  readonly gridCount: "Count";
  readonly gridGutter: "Gutter";
  readonly gridMargin: "Margin";
  readonly gridSectionSize: "Section size";
  readonly searchFonts: "Search fonts...";
}, {
  readonly untitled: "Untitled";
  readonly nodeCopyString: " copy";
  readonly layers: "Layers";
  readonly pages: "Pages";
  readonly design: "Design";
  readonly code: "Code";
  readonly ai: "AI";
  readonly assets: "Assets";
  readonly searchLocalComponents: "Search local components";
  readonly assetView: "Asset view";
  readonly gridView: "Grid view";
  readonly listView: "List view";
  readonly viewDetails: "View details";
  readonly assetLibraryBadge: "Library";
  readonly assetVariantSummary: import("@nanostores/i18n").TranslationFunction<[{
    count: string | number;
  } & {
    names: string | number;
  } & object], string>;
  readonly duplicateVariantValues: "Duplicate variant values";
  readonly openDocumentation: "Open documentation";
  readonly noLocalComponents: "No local components";
  readonly componentSet: "Component set";
  readonly component: "Component";
  readonly insertInstance: "Insert instance";
  readonly description: "Description";
  readonly documentation: "Documentation";
  readonly openDocs: "Open docs";
  readonly properties: "Properties";
  readonly xAxis: "X Axis";
  readonly yAxis: "Y Axis";
  readonly rotation: "Rotation";
  readonly width: "Width";
  readonly height: "Height";
  readonly opacity: "Opacity";
  readonly blendMode: "Blend mode";
  readonly radius: "Radius";
  readonly cornerSmoothing: "Corner smoothing";
  readonly spread: "Spread";
  readonly page: "Page";
  readonly frame: "Frame";
  readonly framePreset: "Frame preset";
  readonly framePresetCustom: "Custom";
  readonly framePresetCategoryPhone: "Phone";
  readonly framePresetCategoryTablet: "Tablet";
  readonly framePresetCategoryDesktop: "Desktop";
  readonly framePresetCategoryPresentation: "Presentation";
  readonly framePresetCategoryWatch: "Watch";
  readonly framePresetCategoryPaper: "Paper";
  readonly framePresetCategorySocialMedia: "Social media";
  readonly framePresetCategoryFigmaCommunity: "Figma Community";
  readonly framePresetCategoryArchive: "Archive";
  readonly position: "Position";
  readonly layout: "Layout";
  readonly autoLayout: "Auto layout";
  readonly alignment: "Alignment";
  readonly appearance: "Appearance";
  readonly fill: "Fill";
  readonly stroke: "Stroke";
  readonly effects: "Effects";
  readonly mask: "Mask";
  readonly export: "Export";
  readonly typography: "Typography";
  readonly fontFamily: "Font family";
  readonly fontWeight: "Font weight";
  readonly fontSize: "Font size";
  readonly lineHeight: "Line height";
  readonly letterSpacing: "Letter spacing";
  readonly textAlignment: "Text alignment";
  readonly verticalTextAlignment: "Vertical text alignment";
  readonly textCase: "Text case";
  readonly textCaseOriginal: "Original";
  readonly textCaseUpper: "Uppercase";
  readonly textCaseLower: "Lowercase";
  readonly textCaseTitle: "Title case";
  readonly truncation: "Truncation";
  readonly truncationDisabled: "Disabled";
  readonly truncationEnding: "Ending ellipsis";
  readonly maxLines: "Maximum lines";
  readonly openTypeFeatures: "Font features";
  readonly standardLigatures: "Standard ligatures";
  readonly contextualAlternates: "Contextual alternates";
  readonly kerning: "Kerning";
  readonly textFormatting: "Text formatting";
  readonly pageBackground: "Page background";
  readonly variables: "Variables";
  readonly variants: "Variants";
  readonly componentProperties: "Component properties";
  readonly constraints: "Constraints";
  readonly horizontalConstraint: "Horizontal constraint";
  readonly verticalConstraint: "Vertical constraint";
  readonly constraintLeft: "Left";
  readonly constraintRight: "Right";
  readonly constraintTop: "Top";
  readonly constraintBottom: "Bottom";
  readonly constraintCenter: "Center";
  readonly constraintLeftAndRight: "Left and right";
  readonly constraintTopAndBottom: "Top and bottom";
  readonly constraintScale: "Scale";
  readonly constraintHorizontalCenter: "Horizontal center";
  readonly constraintVerticalCenter: "Vertical center";
  readonly addFill: "Add fill";
  readonly addStroke: "Add stroke";
  readonly addEffect: "Add effect";
  readonly addExport: "Add export";
  readonly removeFill: "Remove fill";
  readonly removeStroke: "Remove stroke";
  readonly removeEffect: "Remove effect";
  readonly removeExport: "Remove export";
  readonly effectSettings: "Effect settings";
  readonly expandEffectSettings: "Expand effect settings";
  readonly collapseEffectSettings: "Collapse effect settings";
  readonly toggleExportPreview: "Toggle export preview";
  readonly dropShadow: "Drop shadow";
  readonly innerShadow: "Inner shadow";
  readonly layerBlur: "Layer blur";
  readonly backgroundBlur: "Background blur";
  readonly foregroundBlur: "Foreground blur";
  readonly maskType: "Mask type";
  readonly maskTypeAlpha: "Alpha";
  readonly maskTypeVector: "Vector";
  readonly maskTypeLuminance: "Luminance";
  readonly blendModePassThrough: "Pass through";
  readonly blendModeNormal: "Normal";
  readonly blendModeDarken: "Darken";
  readonly blendModeMultiply: "Multiply";
  readonly blendModeColorBurn: "Color burn";
  readonly blendModeLighten: "Lighten";
  readonly blendModeScreen: "Screen";
  readonly blendModeColorDodge: "Color dodge";
  readonly blendModeOverlay: "Overlay";
  readonly blendModeSoftLight: "Soft light";
  readonly blendModeHardLight: "Hard light";
  readonly blendModeDifference: "Difference";
  readonly blendModeExclusion: "Exclusion";
  readonly blendModeHue: "Hue";
  readonly blendModeSaturation: "Saturation";
  readonly blendModeColor: "Color";
  readonly blendModeLuminosity: "Luminosity";
  readonly strokeType: "Stroke type";
  readonly strokeWeight: "Stroke weight";
  readonly noSelection: "No selection";
  readonly noLocalVariables: "No local variables";
  readonly openVariables: "Open variables";
  readonly addPage: "Add page";
  readonly toggleVisibility: "Toggle visibility";
  readonly independentCornerRadii: "Independent corner radii";
  readonly detachVariable: "Detach variable";
  readonly applyVariable: "Apply variable";
  readonly noVariablesFound: "No variables found";
  readonly addAutoLayout: "Add auto layout";
  readonly removeAutoLayout: "Remove auto layout";
  readonly alignLeft: "Align left";
  readonly alignCenterHorizontally: "Align center horizontally";
  readonly alignRight: "Align right";
  readonly alignTop: "Align top";
  readonly alignCenterVertically: "Align center vertically";
  readonly alignBottom: "Align bottom";
  readonly flipHorizontal: "Flip horizontal";
  readonly flipVertical: "Flip vertical";
  readonly rotate90: "Rotate 90°";
  readonly mixedFillsHelp: "Click + to replace mixed fills";
  readonly mixedStrokesHelp: "Click + to replace mixed strokes";
  readonly mixedEffectsHelp: "Click + to replace mixed effects";
  readonly strokeSides: "Stroke sides";
  readonly strokeDash: "Dashed stroke";
  readonly strokeCap: "Stroke cap";
  readonly strokeCapButt: "Butt cap";
  readonly strokeCapRound: "Round cap";
  readonly strokeCapSquare: "Square cap";
  readonly strokeJoin: "Stroke join";
  readonly strokeJoinMiter: "Miter join";
  readonly strokeJoinBevel: "Bevel join";
  readonly strokeJoinRound: "Round join";
  readonly strokeMiterLimit: "Miter limit";
  readonly strokeAlignInside: "Inside";
  readonly strokeAlignCenter: "Center";
  readonly strokeAlignOutside: "Outside";
  readonly exportScale: "Export scale";
  readonly exportFormat: "Export format";
  readonly exportPreview: "Preview";
  readonly exportRenderingPreview: "Rendering preview…";
  readonly create: "Create";
  readonly add: "Add";
  readonly createVariable: "Create variable";
  readonly createColorVariable: import("@nanostores/i18n").TranslationFunction<[{
    value: string | number;
  } & object], string>;
  readonly createNumberVariable: import("@nanostores/i18n").TranslationFunction<[{
    value: string | number;
  } & object], string>;
  readonly variableName: "Variable name";
  readonly mixed: "Mixed";
  readonly none: "None";
  readonly fillStyle: "Fill style";
  readonly strokeStyle: "Stroke style";
  readonly textStyle: "Text style";
  readonly effectStyle: "Effect style";
  readonly gridStyle: "Grid style";
  readonly missingStyle: import("@nanostores/i18n").TranslationFunction<[{
    id: string | number;
  } & object], string>;
  readonly layersCount: import("@nanostores/i18n").TranslationFunction<[{
    count: string | number;
  } & object], string>;
  readonly goToMainComponent: "Go to Main Component";
  readonly detachInstance: "Detach Instance";
  readonly gap: "Gap";
  readonly solid: "Solid";
  readonly linearGradient: "Linear";
  readonly radialGradient: "Radial";
  readonly image: "Image";
  readonly stops: "Stops";
  readonly addStop: "Add stop";
  readonly alignCenter: "Align center";
  readonly alignMiddle: "Align middle";
  readonly clipContent: "Clip content";
  readonly colorFormatRgb: "RGB";
  readonly colorFormatHsl: "HSL";
  readonly colorFormatHsb: "HSB";
  readonly colorFormatOkhcl: "OkHCL";
  readonly colorHintHsl: "H hue · S saturation · L lightness";
  readonly colorHintHsb: "H hue · S saturation · B brightness";
  readonly colorHintOkhcl: "H hue · C chroma · L lightness · A alpha";
  readonly colorPreviewClipped: import("@nanostores/i18n").TranslationFunction<[{
    space: string | number;
  } & object], string>;
  readonly rulers: "Rulers";
  readonly multiplayerCursors: "Multiplayer cursors";
  readonly direction: "Direction";
  readonly flow: "Flow";
  readonly freeform: "Freeform";
  readonly dimensions: "Dimensions";
  readonly layoutHorizontal: "Horizontal layout";
  readonly layoutVertical: "Vertical layout";
  readonly layoutGrid: "Grid layout";
  readonly layoutWrap: "Wrap layout";
  readonly gapAuto: "Auto gap";
  readonly horizontalGap: "Horizontal gap";
  readonly verticalGap: "Vertical gap";
  readonly auto: "Auto";
  readonly columns: "Columns";
  readonly rows: "Rows";
  readonly sizingFixed: "Fixed";
  readonly sizingHug: "Hug";
  readonly sizingFill: "Fill";
  readonly sizingHugShort: "Hug";
  readonly sizingFillShort: "Fill";
  readonly addMinWidth: "Add min width";
  readonly removeMinWidth: "Remove min width";
  readonly addMaxWidth: "Add max width";
  readonly removeMaxWidth: "Remove max width";
  readonly addMinHeight: "Add min height";
  readonly removeMinHeight: "Remove min height";
  readonly addMaxHeight: "Add max height";
  readonly removeMaxHeight: "Remove max height";
  readonly minWidthShort: "Min W";
  readonly maxWidthShort: "Max W";
  readonly minHeightShort: "Min H";
  readonly maxHeightShort: "Max H";
  readonly setToCurrentWidth: "Set to current width";
  readonly setToCurrentHeight: "Set to current height";
  readonly sizingFillFr: "Fill (fr)";
  readonly sizingFixedPx: "Fixed (px)";
  readonly resizing: "Resizing";
  readonly resizeAutoWidth: "Auto width";
  readonly resizeAutoHeight: "Auto height";
  readonly resizeFixed: "Fixed size";
  readonly layoutGrids: "Layout guide";
  readonly addLayoutGrid: "Add layout guide";
  readonly removeLayoutGrid: "Remove layout guide";
  readonly gridColumns: "Columns";
  readonly gridRows: "Rows";
  readonly gridGrid: "Grid";
  readonly gridCount: "Count";
  readonly gridGutter: "Gutter";
  readonly gridMargin: "Margin";
  readonly gridSectionSize: "Section size";
  readonly searchFonts: "Search fonts...";
}>;
declare function useVariableTypeMessages(): Ref<{
  readonly color: "Color";
  readonly colorHint: "Paint values";
  readonly number: "Number";
  readonly numberHint: "Sizes, spacing, opacity";
  readonly text: "Text";
  readonly textHint: "Copy and labels";
  readonly boolean: "Boolean";
  readonly booleanHint: "True or false";
}, {
  readonly color: "Color";
  readonly colorHint: "Paint values";
  readonly number: "Number";
  readonly numberHint: "Sizes, spacing, opacity";
  readonly text: "Text";
  readonly textHint: "Copy and labels";
  readonly boolean: "Boolean";
  readonly booleanHint: "True or false";
}>;
declare function usePageMessages(): Ref<{
  readonly newPage: "New page";
  readonly rename: "Rename";
  readonly delete: "Delete";
  readonly pageName: import("@nanostores/i18n").TranslationFunction<[{
    number: string | number;
  } & object], string>;
}, {
  readonly newPage: "New page";
  readonly rename: "Rename";
  readonly delete: "Delete";
  readonly pageName: import("@nanostores/i18n").TranslationFunction<[{
    number: string | number;
  } & object], string>;
}>;
declare function useDialogMessages(): Ref<{
  readonly cancel: "Cancel";
  readonly apply: "Apply";
  readonly close: "Close";
  readonly rename: "Rename";
  readonly renameLayers: import("@nanostores/i18n").TranslationFunction<[{
    count: string | number;
  } & object], string>;
  readonly renamePreview: "Preview";
  readonly renameMatch: "Match";
  readonly renameTo: "Rename to";
  readonly renameCurrentName: "Current name";
  readonly renameNumberAscending: "Number ↑";
  readonly renameNumberDescending: "Number ↓";
  readonly renameStartAscendingFrom: "Start ascending from";
  readonly renameStopDescendingAt: "Stop descending at";
  readonly renameInvalidPattern: "Invalid regular expression";
  readonly ok: "OK";
  readonly copy: "Copy";
  readonly copied: "Copied";
  readonly copiedExclamation: "Copied!";
  readonly copyMessage: "Copy message";
  readonly createCollection: "Create collection";
  readonly renameCollection: "Rename collection";
  readonly deleteCollection: "Delete collection";
  readonly localVariables: "Local variables";
  readonly noVariableCollections: "No variable collections";
  readonly modes: "Modes";
  readonly addMode: "Add mode";
  readonly renameMode: "Rename mode";
  readonly duplicateMode: "Duplicate mode";
  readonly deleteMode: "Delete mode";
  readonly setDefaultMode: "Set as default";
  readonly selectLayerForJSX: "Select a layer to see its JSX code";
  readonly copyJSXReference: "Copy JSX prop reference to clipboard";
  readonly newTab: "New tab";
  readonly closeTab: import("@nanostores/i18n").TranslationFunction<[{
    name: string | number;
  } & object], string>;
  readonly showUI: import("@nanostores/i18n").TranslationFunction<[{
    shortcut: string | number;
  } & object], string>;
  readonly fontSettings: "Font settings";
  readonly fontSettingsDesktopDescription: "Access system fonts, online providers, fallback packs, and cached downloads.";
  readonly fontSettingsBrowserDescription: "Allow browser access to local fonts and manage online font providers.";
  readonly localFonts: "Local fonts";
  readonly onlineFonts: "Online fonts";
  readonly downloadedCache: "Downloaded cache";
  readonly lastUpdated: "Last updated";
  readonly enabled: "Enabled";
  readonly disabled: "Disabled";
  readonly denied: "Denied";
  readonly unavailable: "Unavailable";
  readonly notRequested: "Not requested";
  readonly never: "Never";
  readonly systemFontAccess: "System font access";
  readonly systemFontsAvailable: "System fonts are available.";
  readonly allowBrowserFontAccess: "Allow browser font access when system fonts are missing.";
  readonly allow: "Allow";
  readonly requesting: "Requesting…";
  readonly onlineFontProviders: "Online font providers";
  readonly downloadMissingWebFonts: "Download missing web fonts through enabled providers.";
  readonly webFontProvidersRequireDesktopApp: "Online font provider catalogs are unavailable in the web app. Download the desktop app to browse and load provider fonts.";
  readonly clipboardImageUnavailableWeb: "Pasted design includes 1 image that cannot be loaded in the web app. Use the desktop app to include it.";
  readonly clipboardImagesUnavailableWeb: import("@nanostores/i18n").TranslationFunction<[{
    count: string | number;
  } & object], string>;
  readonly clipboardImageFetchFailed: "Failed to fetch 1 image from Figma. Check that the source file is accessible and try again.";
  readonly clipboardImagesFetchFailed: import("@nanostores/i18n").TranslationFunction<[{
    count: string | number;
  } & object], string>;
  readonly enable: "Enable";
  readonly disable: "Disable";
  readonly fallbackPacks: "Fallback packs";
  readonly downloadFallbackPacksDescription: "Download CJK and Arabic fallbacks before opening files that need them.";
  readonly download: "Download";
  readonly downloading: "Downloading…";
  readonly refresh: "Refresh";
  readonly clearCache: "Clear cache";
  readonly localFontAccessEnabled: "Local font access enabled.";
  readonly localFontAccessNotGranted: "Local font access was not granted.";
  readonly onlineFontProvidersEnabled: "Online font providers enabled.";
  readonly onlineFontProvidersDisabled: "Online font providers disabled.";
  readonly fontProviderEnabled: import("@nanostores/i18n").TranslationFunction<[{
    provider: string | number;
  } & object], string>;
  readonly fontProviderDisabled: import("@nanostores/i18n").TranslationFunction<[{
    provider: string | number;
  } & object], string>;
  readonly fallbackFontsDownloaded: "Fallback fonts downloaded.";
  readonly fallbackFontsDownloadFailed: "Could not download fallback fonts.";
  readonly downloadedFontCacheCleared: "Downloaded font cache cleared.";
  readonly downloadedFontCacheClearFailed: "Could not clear downloaded font cache.";
  readonly you: "You";
  readonly youSuffix: "you";
  readonly followingPeerStop: import("@nanostores/i18n").TranslationFunction<[{
    name: string | number;
  } & object], string>;
  readonly clickToFollowPeer: import("@nanostores/i18n").TranslationFunction<[{
    name: string | number;
  } & object], string>;
  readonly connectAIProvider: "Connect an AI provider to start chatting.";
  readonly connect: "Connect";
  readonly testConnection: "Test connection";
  readonly testingConnection: "Testing…";
  readonly connectionTestSuccess: "Connected successfully. Model is reachable.";
  readonly connectionTestMissingAPIKey: "Enter an API key before testing.";
  readonly connectionTestMissingBaseURL: "Enter a base URL before testing.";
  readonly connectionTestMissingModel: "Enter a model ID before testing.";
  readonly connectionTestInvalidBaseURL: "Base URL is invalid. Use a full URL like https://api.example.com/v1.";
  readonly connectionTestAuthFailed: "Authentication failed. Check your API key.";
  readonly connectionTestModelNotFound: "Model not found. Check the model ID.";
  readonly connectionTestAPITypeMismatch: "This endpoint does not appear to support the selected API type. Try Completions or Responses.";
  readonly connectionTestBrowserNetworkFailed: "Could not reach this endpoint from the browser. Try the desktop app or use an endpoint with CORS enabled.";
  readonly connectionTestNetworkFailed: "Could not reach the endpoint. Check the URL and your network connection.";
  readonly connectionTestUnknownFailed: "Connection test failed. Check the provider settings and try again.";
  readonly getAPIKey: import("@nanostores/i18n").TranslationFunction<[{
    provider: string | number;
  } & object], string>;
  readonly oneKeyManyModels: "One key for 100+ models from all providers.";
  readonly describeChange: "Describe a change…";
  readonly describeCreateOrChange: "Describe what you want to create or change.";
  readonly stopGenerating: "Stop generating";
  readonly sendMessage: "Send message";
  readonly baseURLPlaceholder: "Base URL (e.g. http://localhost:11434/v1)";
  readonly modelIDPlaceholder: "Model ID (e.g. llama-3.3-70b)";
  readonly aiProvider: "AI Provider";
  readonly providerSettings: "Provider settings";
  readonly openProviderSettings: "Open provider settings";
  readonly settings: "Settings";
  readonly settingsDescription: "Manage integrations and app preferences.";
  readonly settingsAIAndAgents: "AI & agents";
  readonly models: "Models";
  readonly modelsDescription: "Configure reusable models and their provider connections.";
  readonly addModel: "Add model";
  readonly editModel: "Edit model";
  readonly modelEditorDescription: "Provider, model, credentials, and capabilities.";
  readonly modelName: "Name";
  readonly modelConfiguration: "Model";
  readonly connectionSettings: "Connection";
  readonly modelCapabilities: "Capabilities";
  readonly modelCapabilitiesDetected: "Detected from the selected model.";
  readonly modelCapabilitiesManual: "Declare compatibility for this custom model.";
  readonly modelCapabilityTools: "Tool calling";
  readonly modelCapabilityVision: "Image input";
  readonly modelCapabilityToolsShort: "Tools";
  readonly modelCapabilityVisionShort: "Vision";
  readonly selectDesignModel: "Select design model";
  readonly modelNeedsCredential: "Needs key";
  readonly modelAgentConnection: "Agent";
  readonly saveModel: "Save model";
  readonly deleteModel: "Delete model";
  readonly deleteModelDescription: "Delete this model and remove its role assignments?";
  readonly modelAssignments: "Assignments";
  readonly modelAssignmentsDescription: "Choose which configured model handles each type of work.";
  readonly modelRoleDesign: "Design agent";
  readonly modelRoleReview: "Review";
  readonly modelRoleFast: "Fast tasks";
  readonly modelRoleVision: "Vision";
  readonly modelRoleDesignDescription: "AI chat and canvas edits";
  readonly modelRoleReviewDescription: "Explicit plan and design reviews";
  readonly modelRoleFastDescription: "Low-cost background work";
  readonly modelRoleVisionDescription: "Screenshots and image references";
  readonly modelRoleUseDesign: "Same as Design";
  readonly noModel: "None";
  readonly back: "Back";
  readonly settingsMedia: "Media";
  readonly vectorization: "Image vectorization";
  readonly vectorizationDescription: "Send image layers to Recraft or fal.ai and return editable vectors. Provider charges may apply.";
  readonly vectorizeProvider: "Vectorization service";
  readonly settingsStorage: "Cloud storage";
  readonly storageWorkspace: "Storage workspace";
  readonly openStorageWorkspace: "Open workspace";
  readonly newStoredDocument: "New document";
  readonly emptyStorageWorkspace: "No stored documents yet.";
  readonly loadingDocuments: "Loading documents…";
  readonly storageNotConfigured: "Configure storage before using this workspace.";
  readonly copyStorageCors: "Copy CORS JSON";
  readonly storageEndpoint: "Endpoint";
  readonly storageBucket: "Bucket";
  readonly storageRegion: "Region";
  readonly storageAccessKeyID: "Access key ID";
  readonly storageSecretAccessKey: "Secret access key";
  readonly save: "Save";
  readonly credentialStorage: import("@nanostores/i18n").TranslationFunction<[{
    backend: string | number;
  } & object], string>;
  readonly credentialBackendNative: "system credential store";
  readonly credentialBackendBrowser: "encrypted browser storage";
  readonly credentialBackendMemory: "this session only";
  readonly rememberCredentials: "Remember credentials on this browser";
  readonly done: "Done";
  readonly apiKey: "API Key";
  readonly apiType: "API Type";
  readonly baseURL: "Base URL";
  readonly modelID: "Model ID";
  readonly customModelID: "Custom model ID";
  readonly customModel: "Custom model…";
  readonly advancedModelSettings: "Advanced settings";
  readonly outputLimit: "Output limit";
  readonly outputLimitAutomatic: "Automatic recommendation";
  readonly supported: "Supported";
  readonly unsupported: "Not supported";
  readonly tokens: "tokens";
  readonly maxOutputTokens: "Max output tokens";
  readonly clear: "Clear";
  readonly keySavedReplace: "Key saved — enter new to replace";
  readonly getAPIKeyGeneric: "Get API key →";
  readonly pexelsAPIKey: "Pexels API Key (stock photos)";
  readonly unsplashAccessKey: "Unsplash Access Key";
  readonly stockPhotoToolOptional: "Optional — for stock_photo tool";
  readonly pexelsAlternativeOptional: "Optional — alternative to Pexels";
  readonly getPexelsAPIKey: "Get free Pexels API key →";
  readonly getUnsplashAccessKey: "Get free Unsplash access key →";
  readonly completions: "Completions";
  readonly responses: "Responses";
  readonly yourName: "Your name";
  readonly enterYourName: "Enter your name";
  readonly shareThisFile: "Share this file";
  readonly joinRoom: "Join room";
  readonly join: "Join";
  readonly roomLink: "Room link";
  readonly joinCollaboration: "Join collaboration";
  readonly orJoinRoom: "or join a room";
  readonly pasteRoomLinkOrId: "Paste room link or ID";
  readonly connected: "Connected";
  readonly search: "Search…";
  readonly noResults: "No results";
  readonly share: "Share";
  readonly appUpToDate: "OpenPencil is up to date";
  readonly updateAvailableTitle: "Update OpenPencil";
  readonly updateAvailable: import("@nanostores/i18n").TranslationFunction<[{
    version: string | number;
  } & object], string>;
  readonly updateInstallPrompt: "Download and install it now? The app will restart after the update is installed.";
  readonly downloadingUpdate: import("@nanostores/i18n").TranslationFunction<[{
    version: string | number;
  } & object], string>;
  readonly updateInstalledTitle: "Update installed";
  readonly updateInstalled: import("@nanostores/i18n").TranslationFunction<[{
    version: string | number;
  } & {
    size: string | number;
  } & object], string>;
  readonly updateUnavailable: "Updates are not available yet. Publish a signed release with latest.json first.";
  readonly updateCheckFailed: import("@nanostores/i18n").TranslationFunction<[{
    error: string | number;
  } & object], string>;
}, {
  readonly cancel: "Cancel";
  readonly apply: "Apply";
  readonly close: "Close";
  readonly rename: "Rename";
  readonly renameLayers: import("@nanostores/i18n").TranslationFunction<[{
    count: string | number;
  } & object], string>;
  readonly renamePreview: "Preview";
  readonly renameMatch: "Match";
  readonly renameTo: "Rename to";
  readonly renameCurrentName: "Current name";
  readonly renameNumberAscending: "Number ↑";
  readonly renameNumberDescending: "Number ↓";
  readonly renameStartAscendingFrom: "Start ascending from";
  readonly renameStopDescendingAt: "Stop descending at";
  readonly renameInvalidPattern: "Invalid regular expression";
  readonly ok: "OK";
  readonly copy: "Copy";
  readonly copied: "Copied";
  readonly copiedExclamation: "Copied!";
  readonly copyMessage: "Copy message";
  readonly createCollection: "Create collection";
  readonly renameCollection: "Rename collection";
  readonly deleteCollection: "Delete collection";
  readonly localVariables: "Local variables";
  readonly noVariableCollections: "No variable collections";
  readonly modes: "Modes";
  readonly addMode: "Add mode";
  readonly renameMode: "Rename mode";
  readonly duplicateMode: "Duplicate mode";
  readonly deleteMode: "Delete mode";
  readonly setDefaultMode: "Set as default";
  readonly selectLayerForJSX: "Select a layer to see its JSX code";
  readonly copyJSXReference: "Copy JSX prop reference to clipboard";
  readonly newTab: "New tab";
  readonly closeTab: import("@nanostores/i18n").TranslationFunction<[{
    name: string | number;
  } & object], string>;
  readonly showUI: import("@nanostores/i18n").TranslationFunction<[{
    shortcut: string | number;
  } & object], string>;
  readonly fontSettings: "Font settings";
  readonly fontSettingsDesktopDescription: "Access system fonts, online providers, fallback packs, and cached downloads.";
  readonly fontSettingsBrowserDescription: "Allow browser access to local fonts and manage online font providers.";
  readonly localFonts: "Local fonts";
  readonly onlineFonts: "Online fonts";
  readonly downloadedCache: "Downloaded cache";
  readonly lastUpdated: "Last updated";
  readonly enabled: "Enabled";
  readonly disabled: "Disabled";
  readonly denied: "Denied";
  readonly unavailable: "Unavailable";
  readonly notRequested: "Not requested";
  readonly never: "Never";
  readonly systemFontAccess: "System font access";
  readonly systemFontsAvailable: "System fonts are available.";
  readonly allowBrowserFontAccess: "Allow browser font access when system fonts are missing.";
  readonly allow: "Allow";
  readonly requesting: "Requesting…";
  readonly onlineFontProviders: "Online font providers";
  readonly downloadMissingWebFonts: "Download missing web fonts through enabled providers.";
  readonly webFontProvidersRequireDesktopApp: "Online font provider catalogs are unavailable in the web app. Download the desktop app to browse and load provider fonts.";
  readonly clipboardImageUnavailableWeb: "Pasted design includes 1 image that cannot be loaded in the web app. Use the desktop app to include it.";
  readonly clipboardImagesUnavailableWeb: import("@nanostores/i18n").TranslationFunction<[{
    count: string | number;
  } & object], string>;
  readonly clipboardImageFetchFailed: "Failed to fetch 1 image from Figma. Check that the source file is accessible and try again.";
  readonly clipboardImagesFetchFailed: import("@nanostores/i18n").TranslationFunction<[{
    count: string | number;
  } & object], string>;
  readonly enable: "Enable";
  readonly disable: "Disable";
  readonly fallbackPacks: "Fallback packs";
  readonly downloadFallbackPacksDescription: "Download CJK and Arabic fallbacks before opening files that need them.";
  readonly download: "Download";
  readonly downloading: "Downloading…";
  readonly refresh: "Refresh";
  readonly clearCache: "Clear cache";
  readonly localFontAccessEnabled: "Local font access enabled.";
  readonly localFontAccessNotGranted: "Local font access was not granted.";
  readonly onlineFontProvidersEnabled: "Online font providers enabled.";
  readonly onlineFontProvidersDisabled: "Online font providers disabled.";
  readonly fontProviderEnabled: import("@nanostores/i18n").TranslationFunction<[{
    provider: string | number;
  } & object], string>;
  readonly fontProviderDisabled: import("@nanostores/i18n").TranslationFunction<[{
    provider: string | number;
  } & object], string>;
  readonly fallbackFontsDownloaded: "Fallback fonts downloaded.";
  readonly fallbackFontsDownloadFailed: "Could not download fallback fonts.";
  readonly downloadedFontCacheCleared: "Downloaded font cache cleared.";
  readonly downloadedFontCacheClearFailed: "Could not clear downloaded font cache.";
  readonly you: "You";
  readonly youSuffix: "you";
  readonly followingPeerStop: import("@nanostores/i18n").TranslationFunction<[{
    name: string | number;
  } & object], string>;
  readonly clickToFollowPeer: import("@nanostores/i18n").TranslationFunction<[{
    name: string | number;
  } & object], string>;
  readonly connectAIProvider: "Connect an AI provider to start chatting.";
  readonly connect: "Connect";
  readonly testConnection: "Test connection";
  readonly testingConnection: "Testing…";
  readonly connectionTestSuccess: "Connected successfully. Model is reachable.";
  readonly connectionTestMissingAPIKey: "Enter an API key before testing.";
  readonly connectionTestMissingBaseURL: "Enter a base URL before testing.";
  readonly connectionTestMissingModel: "Enter a model ID before testing.";
  readonly connectionTestInvalidBaseURL: "Base URL is invalid. Use a full URL like https://api.example.com/v1.";
  readonly connectionTestAuthFailed: "Authentication failed. Check your API key.";
  readonly connectionTestModelNotFound: "Model not found. Check the model ID.";
  readonly connectionTestAPITypeMismatch: "This endpoint does not appear to support the selected API type. Try Completions or Responses.";
  readonly connectionTestBrowserNetworkFailed: "Could not reach this endpoint from the browser. Try the desktop app or use an endpoint with CORS enabled.";
  readonly connectionTestNetworkFailed: "Could not reach the endpoint. Check the URL and your network connection.";
  readonly connectionTestUnknownFailed: "Connection test failed. Check the provider settings and try again.";
  readonly getAPIKey: import("@nanostores/i18n").TranslationFunction<[{
    provider: string | number;
  } & object], string>;
  readonly oneKeyManyModels: "One key for 100+ models from all providers.";
  readonly describeChange: "Describe a change…";
  readonly describeCreateOrChange: "Describe what you want to create or change.";
  readonly stopGenerating: "Stop generating";
  readonly sendMessage: "Send message";
  readonly baseURLPlaceholder: "Base URL (e.g. http://localhost:11434/v1)";
  readonly modelIDPlaceholder: "Model ID (e.g. llama-3.3-70b)";
  readonly aiProvider: "AI Provider";
  readonly providerSettings: "Provider settings";
  readonly openProviderSettings: "Open provider settings";
  readonly settings: "Settings";
  readonly settingsDescription: "Manage integrations and app preferences.";
  readonly settingsAIAndAgents: "AI & agents";
  readonly models: "Models";
  readonly modelsDescription: "Configure reusable models and their provider connections.";
  readonly addModel: "Add model";
  readonly editModel: "Edit model";
  readonly modelEditorDescription: "Provider, model, credentials, and capabilities.";
  readonly modelName: "Name";
  readonly modelConfiguration: "Model";
  readonly connectionSettings: "Connection";
  readonly modelCapabilities: "Capabilities";
  readonly modelCapabilitiesDetected: "Detected from the selected model.";
  readonly modelCapabilitiesManual: "Declare compatibility for this custom model.";
  readonly modelCapabilityTools: "Tool calling";
  readonly modelCapabilityVision: "Image input";
  readonly modelCapabilityToolsShort: "Tools";
  readonly modelCapabilityVisionShort: "Vision";
  readonly selectDesignModel: "Select design model";
  readonly modelNeedsCredential: "Needs key";
  readonly modelAgentConnection: "Agent";
  readonly saveModel: "Save model";
  readonly deleteModel: "Delete model";
  readonly deleteModelDescription: "Delete this model and remove its role assignments?";
  readonly modelAssignments: "Assignments";
  readonly modelAssignmentsDescription: "Choose which configured model handles each type of work.";
  readonly modelRoleDesign: "Design agent";
  readonly modelRoleReview: "Review";
  readonly modelRoleFast: "Fast tasks";
  readonly modelRoleVision: "Vision";
  readonly modelRoleDesignDescription: "AI chat and canvas edits";
  readonly modelRoleReviewDescription: "Explicit plan and design reviews";
  readonly modelRoleFastDescription: "Low-cost background work";
  readonly modelRoleVisionDescription: "Screenshots and image references";
  readonly modelRoleUseDesign: "Same as Design";
  readonly noModel: "None";
  readonly back: "Back";
  readonly settingsMedia: "Media";
  readonly vectorization: "Image vectorization";
  readonly vectorizationDescription: "Send image layers to Recraft or fal.ai and return editable vectors. Provider charges may apply.";
  readonly vectorizeProvider: "Vectorization service";
  readonly settingsStorage: "Cloud storage";
  readonly storageWorkspace: "Storage workspace";
  readonly openStorageWorkspace: "Open workspace";
  readonly newStoredDocument: "New document";
  readonly emptyStorageWorkspace: "No stored documents yet.";
  readonly loadingDocuments: "Loading documents…";
  readonly storageNotConfigured: "Configure storage before using this workspace.";
  readonly copyStorageCors: "Copy CORS JSON";
  readonly storageEndpoint: "Endpoint";
  readonly storageBucket: "Bucket";
  readonly storageRegion: "Region";
  readonly storageAccessKeyID: "Access key ID";
  readonly storageSecretAccessKey: "Secret access key";
  readonly save: "Save";
  readonly credentialStorage: import("@nanostores/i18n").TranslationFunction<[{
    backend: string | number;
  } & object], string>;
  readonly credentialBackendNative: "system credential store";
  readonly credentialBackendBrowser: "encrypted browser storage";
  readonly credentialBackendMemory: "this session only";
  readonly rememberCredentials: "Remember credentials on this browser";
  readonly done: "Done";
  readonly apiKey: "API Key";
  readonly apiType: "API Type";
  readonly baseURL: "Base URL";
  readonly modelID: "Model ID";
  readonly customModelID: "Custom model ID";
  readonly customModel: "Custom model…";
  readonly advancedModelSettings: "Advanced settings";
  readonly outputLimit: "Output limit";
  readonly outputLimitAutomatic: "Automatic recommendation";
  readonly supported: "Supported";
  readonly unsupported: "Not supported";
  readonly tokens: "tokens";
  readonly maxOutputTokens: "Max output tokens";
  readonly clear: "Clear";
  readonly keySavedReplace: "Key saved — enter new to replace";
  readonly getAPIKeyGeneric: "Get API key →";
  readonly pexelsAPIKey: "Pexels API Key (stock photos)";
  readonly unsplashAccessKey: "Unsplash Access Key";
  readonly stockPhotoToolOptional: "Optional — for stock_photo tool";
  readonly pexelsAlternativeOptional: "Optional — alternative to Pexels";
  readonly getPexelsAPIKey: "Get free Pexels API key →";
  readonly getUnsplashAccessKey: "Get free Unsplash access key →";
  readonly completions: "Completions";
  readonly responses: "Responses";
  readonly yourName: "Your name";
  readonly enterYourName: "Enter your name";
  readonly shareThisFile: "Share this file";
  readonly joinRoom: "Join room";
  readonly join: "Join";
  readonly roomLink: "Room link";
  readonly joinCollaboration: "Join collaboration";
  readonly orJoinRoom: "or join a room";
  readonly pasteRoomLinkOrId: "Paste room link or ID";
  readonly connected: "Connected";
  readonly search: "Search…";
  readonly noResults: "No results";
  readonly share: "Share";
  readonly appUpToDate: "OpenPencil is up to date";
  readonly updateAvailableTitle: "Update OpenPencil";
  readonly updateAvailable: import("@nanostores/i18n").TranslationFunction<[{
    version: string | number;
  } & object], string>;
  readonly updateInstallPrompt: "Download and install it now? The app will restart after the update is installed.";
  readonly downloadingUpdate: import("@nanostores/i18n").TranslationFunction<[{
    version: string | number;
  } & object], string>;
  readonly updateInstalledTitle: "Update installed";
  readonly updateInstalled: import("@nanostores/i18n").TranslationFunction<[{
    version: string | number;
  } & {
    size: string | number;
  } & object], string>;
  readonly updateUnavailable: "Updates are not available yet. Publish a signed release with latest.json first.";
  readonly updateCheckFailed: import("@nanostores/i18n").TranslationFunction<[{
    error: string | number;
  } & object], string>;
}>;
declare function useI18n(): {
  menu: Ref<{
    readonly file: "File";
    readonly edit: "Edit";
    readonly view: "View";
    readonly object: "Object";
    readonly arrange: "Arrange";
    readonly text: "Text";
    readonly new: "New";
    readonly open: "Open…";
    readonly openStorageWorkspace: "Open storage workspace…";
    readonly save: "Save";
    readonly saveAs: "Save as…";
    readonly exportSelection: "Export selection…";
    readonly autosave: "Auto-save to local file";
    readonly closeTab: "Close tab";
    readonly copy: "Copy";
    readonly paste: "Paste";
    readonly theme: "Theme";
    readonly themeLight: "Light";
    readonly themeDark: "Dark";
    readonly themeAuto: "Auto";
    readonly profiler: "Performance profiler";
    readonly language: "Language";
    readonly settings: "Settings…";
    readonly rulers: "Rulers";
    readonly multiplayerCursors: "Multiplayer cursors";
    readonly checkUpdates: "Check for updates…";
    readonly moveToPage: "Move to page";
    readonly createInstance: "Create instance";
    readonly hide: "Hide";
    readonly show: "Show";
    readonly lock: "Lock";
    readonly unlock: "Unlock";
    readonly cut: "Cut";
    readonly front: "Front";
    readonly back: "Back";
    readonly toggleUI: "Toggle UI";
    readonly bold: "Bold";
    readonly italic: "Italic";
    readonly underline: "Underline";
    readonly strikethrough: "Strikethrough";
    readonly pasteHere: "Paste here";
    readonly pasteToReplace: "Paste to replace";
    readonly renameSelection: "Rename selection…";
    readonly copyPasteAs: "Copy/Paste as";
    readonly copyAsText: "Copy as text";
    readonly copyAsSVG: "Copy as SVG";
    readonly copyAsPNG: "Copy as PNG";
    readonly copyAsJSX: "Copy as JSX";
    readonly copyNodeId: "Copy node ID";
    readonly copyXPath: "Copy XPath";
    readonly convertToVector: "Convert to vector";
    readonly booleanOperations: "Boolean operations";
    readonly arrangeAlignLeft: "Align left";
    readonly arrangeAlignCenter: "Align center";
    readonly arrangeAlignRight: "Align right";
    readonly arrangeAlignTop: "Align top";
    readonly arrangeAlignMiddle: "Align middle";
    readonly arrangeAlignBottom: "Align bottom";
    readonly zoomIn: "Zoom in";
    readonly zoomOut: "Zoom out";
  }, {
    readonly file: "File";
    readonly edit: "Edit";
    readonly view: "View";
    readonly object: "Object";
    readonly arrange: "Arrange";
    readonly text: "Text";
    readonly new: "New";
    readonly open: "Open…";
    readonly openStorageWorkspace: "Open storage workspace…";
    readonly save: "Save";
    readonly saveAs: "Save as…";
    readonly exportSelection: "Export selection…";
    readonly autosave: "Auto-save to local file";
    readonly closeTab: "Close tab";
    readonly copy: "Copy";
    readonly paste: "Paste";
    readonly theme: "Theme";
    readonly themeLight: "Light";
    readonly themeDark: "Dark";
    readonly themeAuto: "Auto";
    readonly profiler: "Performance profiler";
    readonly language: "Language";
    readonly settings: "Settings…";
    readonly rulers: "Rulers";
    readonly multiplayerCursors: "Multiplayer cursors";
    readonly checkUpdates: "Check for updates…";
    readonly moveToPage: "Move to page";
    readonly createInstance: "Create instance";
    readonly hide: "Hide";
    readonly show: "Show";
    readonly lock: "Lock";
    readonly unlock: "Unlock";
    readonly cut: "Cut";
    readonly front: "Front";
    readonly back: "Back";
    readonly toggleUI: "Toggle UI";
    readonly bold: "Bold";
    readonly italic: "Italic";
    readonly underline: "Underline";
    readonly strikethrough: "Strikethrough";
    readonly pasteHere: "Paste here";
    readonly pasteToReplace: "Paste to replace";
    readonly renameSelection: "Rename selection…";
    readonly copyPasteAs: "Copy/Paste as";
    readonly copyAsText: "Copy as text";
    readonly copyAsSVG: "Copy as SVG";
    readonly copyAsPNG: "Copy as PNG";
    readonly copyAsJSX: "Copy as JSX";
    readonly copyNodeId: "Copy node ID";
    readonly copyXPath: "Copy XPath";
    readonly convertToVector: "Convert to vector";
    readonly booleanOperations: "Boolean operations";
    readonly arrangeAlignLeft: "Align left";
    readonly arrangeAlignCenter: "Align center";
    readonly arrangeAlignRight: "Align right";
    readonly arrangeAlignTop: "Align top";
    readonly arrangeAlignMiddle: "Align middle";
    readonly arrangeAlignBottom: "Align bottom";
    readonly zoomIn: "Zoom in";
    readonly zoomOut: "Zoom out";
  }>;
  commands: Ref<{
    readonly undo: "Undo";
    readonly redo: "Redo";
    readonly selectAll: "Select all";
    readonly selectInverse: "Select inverse";
    readonly duplicate: "Duplicate";
    readonly delete: "Delete";
    readonly group: "Group";
    readonly groupSelection: "Group selection";
    readonly frameSelection: "Frame selection";
    readonly ungroup: "Ungroup";
    readonly createComponent: "Create component";
    readonly createComponentSet: "Create component set";
    readonly createInstance: "Create instance";
    readonly detachInstance: "Detach instance";
    readonly goToMainComponent: "Go to main component";
    readonly addAutoLayout: "Add auto layout";
    readonly useAsMask: "Use as mask";
    readonly removeMask: "Remove mask";
    readonly bringForward: "Bring forward";
    readonly bringToFront: "Bring to front";
    readonly sendBackward: "Send backward";
    readonly sendToBack: "Send to back";
    readonly showHide: "Show/Hide";
    readonly lockUnlock: "Lock/Unlock";
    readonly unionSelection: "Union selection";
    readonly subtractSelection: "Subtract selection";
    readonly intersectSelection: "Intersect selection";
    readonly excludeSelection: "Exclude selection";
    readonly flattenSelection: "Flatten";
    readonly outlineText: "Outline text";
    readonly outlineStroke: "Outline stroke";
    readonly booleanOperations: "Boolean operations";
    readonly flipHorizontal: "Flip horizontal";
    readonly flipVertical: "Flip vertical";
    readonly distributeHorizontal: "Distribute horizontal spacing";
    readonly distributeVertical: "Distribute vertical spacing";
    readonly moveToPage: "Move to page";
    readonly setOpacity: "Set opacity";
    readonly zoomTo100: "Zoom to 100%";
    readonly zoomToFit: "Zoom to fit";
    readonly zoomToSelection: "Zoom to selection";
  }, {
    readonly undo: "Undo";
    readonly redo: "Redo";
    readonly selectAll: "Select all";
    readonly selectInverse: "Select inverse";
    readonly duplicate: "Duplicate";
    readonly delete: "Delete";
    readonly group: "Group";
    readonly groupSelection: "Group selection";
    readonly frameSelection: "Frame selection";
    readonly ungroup: "Ungroup";
    readonly createComponent: "Create component";
    readonly createComponentSet: "Create component set";
    readonly createInstance: "Create instance";
    readonly detachInstance: "Detach instance";
    readonly goToMainComponent: "Go to main component";
    readonly addAutoLayout: "Add auto layout";
    readonly useAsMask: "Use as mask";
    readonly removeMask: "Remove mask";
    readonly bringForward: "Bring forward";
    readonly bringToFront: "Bring to front";
    readonly sendBackward: "Send backward";
    readonly sendToBack: "Send to back";
    readonly showHide: "Show/Hide";
    readonly lockUnlock: "Lock/Unlock";
    readonly unionSelection: "Union selection";
    readonly subtractSelection: "Subtract selection";
    readonly intersectSelection: "Intersect selection";
    readonly excludeSelection: "Exclude selection";
    readonly flattenSelection: "Flatten";
    readonly outlineText: "Outline text";
    readonly outlineStroke: "Outline stroke";
    readonly booleanOperations: "Boolean operations";
    readonly flipHorizontal: "Flip horizontal";
    readonly flipVertical: "Flip vertical";
    readonly distributeHorizontal: "Distribute horizontal spacing";
    readonly distributeVertical: "Distribute vertical spacing";
    readonly moveToPage: "Move to page";
    readonly setOpacity: "Set opacity";
    readonly zoomTo100: "Zoom to 100%";
    readonly zoomToFit: "Zoom to fit";
    readonly zoomToSelection: "Zoom to selection";
  }>;
  tools: Ref<{
    readonly move: "Move";
    readonly frame: "Frame";
    readonly section: "Section";
    readonly rectangle: "Rectangle";
    readonly ellipse: "Ellipse";
    readonly line: "Line";
    readonly polygon: "Polygon";
    readonly star: "Star";
    readonly pen: "Pen";
    readonly text: "Text";
    readonly hand: "Hand";
  }, {
    readonly move: "Move";
    readonly frame: "Frame";
    readonly section: "Section";
    readonly rectangle: "Rectangle";
    readonly ellipse: "Ellipse";
    readonly line: "Line";
    readonly polygon: "Polygon";
    readonly star: "Star";
    readonly pen: "Pen";
    readonly text: "Text";
    readonly hand: "Hand";
  }>;
  panels: Ref<{
    readonly untitled: "Untitled";
    readonly nodeCopyString: " copy";
    readonly layers: "Layers";
    readonly pages: "Pages";
    readonly design: "Design";
    readonly code: "Code";
    readonly ai: "AI";
    readonly assets: "Assets";
    readonly searchLocalComponents: "Search local components";
    readonly assetView: "Asset view";
    readonly gridView: "Grid view";
    readonly listView: "List view";
    readonly viewDetails: "View details";
    readonly assetLibraryBadge: "Library";
    readonly assetVariantSummary: import("@nanostores/i18n").TranslationFunction<[{
      count: string | number;
    } & {
      names: string | number;
    } & object], string>;
    readonly duplicateVariantValues: "Duplicate variant values";
    readonly openDocumentation: "Open documentation";
    readonly noLocalComponents: "No local components";
    readonly componentSet: "Component set";
    readonly component: "Component";
    readonly insertInstance: "Insert instance";
    readonly description: "Description";
    readonly documentation: "Documentation";
    readonly openDocs: "Open docs";
    readonly properties: "Properties";
    readonly xAxis: "X Axis";
    readonly yAxis: "Y Axis";
    readonly rotation: "Rotation";
    readonly width: "Width";
    readonly height: "Height";
    readonly opacity: "Opacity";
    readonly blendMode: "Blend mode";
    readonly radius: "Radius";
    readonly cornerSmoothing: "Corner smoothing";
    readonly spread: "Spread";
    readonly page: "Page";
    readonly frame: "Frame";
    readonly framePreset: "Frame preset";
    readonly framePresetCustom: "Custom";
    readonly framePresetCategoryPhone: "Phone";
    readonly framePresetCategoryTablet: "Tablet";
    readonly framePresetCategoryDesktop: "Desktop";
    readonly framePresetCategoryPresentation: "Presentation";
    readonly framePresetCategoryWatch: "Watch";
    readonly framePresetCategoryPaper: "Paper";
    readonly framePresetCategorySocialMedia: "Social media";
    readonly framePresetCategoryFigmaCommunity: "Figma Community";
    readonly framePresetCategoryArchive: "Archive";
    readonly position: "Position";
    readonly layout: "Layout";
    readonly autoLayout: "Auto layout";
    readonly alignment: "Alignment";
    readonly appearance: "Appearance";
    readonly fill: "Fill";
    readonly stroke: "Stroke";
    readonly effects: "Effects";
    readonly mask: "Mask";
    readonly export: "Export";
    readonly typography: "Typography";
    readonly fontFamily: "Font family";
    readonly fontWeight: "Font weight";
    readonly fontSize: "Font size";
    readonly lineHeight: "Line height";
    readonly letterSpacing: "Letter spacing";
    readonly textAlignment: "Text alignment";
    readonly verticalTextAlignment: "Vertical text alignment";
    readonly textCase: "Text case";
    readonly textCaseOriginal: "Original";
    readonly textCaseUpper: "Uppercase";
    readonly textCaseLower: "Lowercase";
    readonly textCaseTitle: "Title case";
    readonly truncation: "Truncation";
    readonly truncationDisabled: "Disabled";
    readonly truncationEnding: "Ending ellipsis";
    readonly maxLines: "Maximum lines";
    readonly openTypeFeatures: "Font features";
    readonly standardLigatures: "Standard ligatures";
    readonly contextualAlternates: "Contextual alternates";
    readonly kerning: "Kerning";
    readonly textFormatting: "Text formatting";
    readonly pageBackground: "Page background";
    readonly variables: "Variables";
    readonly variants: "Variants";
    readonly componentProperties: "Component properties";
    readonly constraints: "Constraints";
    readonly horizontalConstraint: "Horizontal constraint";
    readonly verticalConstraint: "Vertical constraint";
    readonly constraintLeft: "Left";
    readonly constraintRight: "Right";
    readonly constraintTop: "Top";
    readonly constraintBottom: "Bottom";
    readonly constraintCenter: "Center";
    readonly constraintLeftAndRight: "Left and right";
    readonly constraintTopAndBottom: "Top and bottom";
    readonly constraintScale: "Scale";
    readonly constraintHorizontalCenter: "Horizontal center";
    readonly constraintVerticalCenter: "Vertical center";
    readonly addFill: "Add fill";
    readonly addStroke: "Add stroke";
    readonly addEffect: "Add effect";
    readonly addExport: "Add export";
    readonly removeFill: "Remove fill";
    readonly removeStroke: "Remove stroke";
    readonly removeEffect: "Remove effect";
    readonly removeExport: "Remove export";
    readonly effectSettings: "Effect settings";
    readonly expandEffectSettings: "Expand effect settings";
    readonly collapseEffectSettings: "Collapse effect settings";
    readonly toggleExportPreview: "Toggle export preview";
    readonly dropShadow: "Drop shadow";
    readonly innerShadow: "Inner shadow";
    readonly layerBlur: "Layer blur";
    readonly backgroundBlur: "Background blur";
    readonly foregroundBlur: "Foreground blur";
    readonly maskType: "Mask type";
    readonly maskTypeAlpha: "Alpha";
    readonly maskTypeVector: "Vector";
    readonly maskTypeLuminance: "Luminance";
    readonly blendModePassThrough: "Pass through";
    readonly blendModeNormal: "Normal";
    readonly blendModeDarken: "Darken";
    readonly blendModeMultiply: "Multiply";
    readonly blendModeColorBurn: "Color burn";
    readonly blendModeLighten: "Lighten";
    readonly blendModeScreen: "Screen";
    readonly blendModeColorDodge: "Color dodge";
    readonly blendModeOverlay: "Overlay";
    readonly blendModeSoftLight: "Soft light";
    readonly blendModeHardLight: "Hard light";
    readonly blendModeDifference: "Difference";
    readonly blendModeExclusion: "Exclusion";
    readonly blendModeHue: "Hue";
    readonly blendModeSaturation: "Saturation";
    readonly blendModeColor: "Color";
    readonly blendModeLuminosity: "Luminosity";
    readonly strokeType: "Stroke type";
    readonly strokeWeight: "Stroke weight";
    readonly noSelection: "No selection";
    readonly noLocalVariables: "No local variables";
    readonly openVariables: "Open variables";
    readonly addPage: "Add page";
    readonly toggleVisibility: "Toggle visibility";
    readonly independentCornerRadii: "Independent corner radii";
    readonly detachVariable: "Detach variable";
    readonly applyVariable: "Apply variable";
    readonly noVariablesFound: "No variables found";
    readonly addAutoLayout: "Add auto layout";
    readonly removeAutoLayout: "Remove auto layout";
    readonly alignLeft: "Align left";
    readonly alignCenterHorizontally: "Align center horizontally";
    readonly alignRight: "Align right";
    readonly alignTop: "Align top";
    readonly alignCenterVertically: "Align center vertically";
    readonly alignBottom: "Align bottom";
    readonly flipHorizontal: "Flip horizontal";
    readonly flipVertical: "Flip vertical";
    readonly rotate90: "Rotate 90°";
    readonly mixedFillsHelp: "Click + to replace mixed fills";
    readonly mixedStrokesHelp: "Click + to replace mixed strokes";
    readonly mixedEffectsHelp: "Click + to replace mixed effects";
    readonly strokeSides: "Stroke sides";
    readonly strokeDash: "Dashed stroke";
    readonly strokeCap: "Stroke cap";
    readonly strokeCapButt: "Butt cap";
    readonly strokeCapRound: "Round cap";
    readonly strokeCapSquare: "Square cap";
    readonly strokeJoin: "Stroke join";
    readonly strokeJoinMiter: "Miter join";
    readonly strokeJoinBevel: "Bevel join";
    readonly strokeJoinRound: "Round join";
    readonly strokeMiterLimit: "Miter limit";
    readonly strokeAlignInside: "Inside";
    readonly strokeAlignCenter: "Center";
    readonly strokeAlignOutside: "Outside";
    readonly exportScale: "Export scale";
    readonly exportFormat: "Export format";
    readonly exportPreview: "Preview";
    readonly exportRenderingPreview: "Rendering preview…";
    readonly create: "Create";
    readonly add: "Add";
    readonly createVariable: "Create variable";
    readonly createColorVariable: import("@nanostores/i18n").TranslationFunction<[{
      value: string | number;
    } & object], string>;
    readonly createNumberVariable: import("@nanostores/i18n").TranslationFunction<[{
      value: string | number;
    } & object], string>;
    readonly variableName: "Variable name";
    readonly mixed: "Mixed";
    readonly none: "None";
    readonly fillStyle: "Fill style";
    readonly strokeStyle: "Stroke style";
    readonly textStyle: "Text style";
    readonly effectStyle: "Effect style";
    readonly gridStyle: "Grid style";
    readonly missingStyle: import("@nanostores/i18n").TranslationFunction<[{
      id: string | number;
    } & object], string>;
    readonly layersCount: import("@nanostores/i18n").TranslationFunction<[{
      count: string | number;
    } & object], string>;
    readonly goToMainComponent: "Go to Main Component";
    readonly detachInstance: "Detach Instance";
    readonly gap: "Gap";
    readonly solid: "Solid";
    readonly linearGradient: "Linear";
    readonly radialGradient: "Radial";
    readonly image: "Image";
    readonly stops: "Stops";
    readonly addStop: "Add stop";
    readonly alignCenter: "Align center";
    readonly alignMiddle: "Align middle";
    readonly clipContent: "Clip content";
    readonly colorFormatRgb: "RGB";
    readonly colorFormatHsl: "HSL";
    readonly colorFormatHsb: "HSB";
    readonly colorFormatOkhcl: "OkHCL";
    readonly colorHintHsl: "H hue · S saturation · L lightness";
    readonly colorHintHsb: "H hue · S saturation · B brightness";
    readonly colorHintOkhcl: "H hue · C chroma · L lightness · A alpha";
    readonly colorPreviewClipped: import("@nanostores/i18n").TranslationFunction<[{
      space: string | number;
    } & object], string>;
    readonly rulers: "Rulers";
    readonly multiplayerCursors: "Multiplayer cursors";
    readonly direction: "Direction";
    readonly flow: "Flow";
    readonly freeform: "Freeform";
    readonly dimensions: "Dimensions";
    readonly layoutHorizontal: "Horizontal layout";
    readonly layoutVertical: "Vertical layout";
    readonly layoutGrid: "Grid layout";
    readonly layoutWrap: "Wrap layout";
    readonly gapAuto: "Auto gap";
    readonly horizontalGap: "Horizontal gap";
    readonly verticalGap: "Vertical gap";
    readonly auto: "Auto";
    readonly columns: "Columns";
    readonly rows: "Rows";
    readonly sizingFixed: "Fixed";
    readonly sizingHug: "Hug";
    readonly sizingFill: "Fill";
    readonly sizingHugShort: "Hug";
    readonly sizingFillShort: "Fill";
    readonly addMinWidth: "Add min width";
    readonly removeMinWidth: "Remove min width";
    readonly addMaxWidth: "Add max width";
    readonly removeMaxWidth: "Remove max width";
    readonly addMinHeight: "Add min height";
    readonly removeMinHeight: "Remove min height";
    readonly addMaxHeight: "Add max height";
    readonly removeMaxHeight: "Remove max height";
    readonly minWidthShort: "Min W";
    readonly maxWidthShort: "Max W";
    readonly minHeightShort: "Min H";
    readonly maxHeightShort: "Max H";
    readonly setToCurrentWidth: "Set to current width";
    readonly setToCurrentHeight: "Set to current height";
    readonly sizingFillFr: "Fill (fr)";
    readonly sizingFixedPx: "Fixed (px)";
    readonly resizing: "Resizing";
    readonly resizeAutoWidth: "Auto width";
    readonly resizeAutoHeight: "Auto height";
    readonly resizeFixed: "Fixed size";
    readonly layoutGrids: "Layout guide";
    readonly addLayoutGrid: "Add layout guide";
    readonly removeLayoutGrid: "Remove layout guide";
    readonly gridColumns: "Columns";
    readonly gridRows: "Rows";
    readonly gridGrid: "Grid";
    readonly gridCount: "Count";
    readonly gridGutter: "Gutter";
    readonly gridMargin: "Margin";
    readonly gridSectionSize: "Section size";
    readonly searchFonts: "Search fonts...";
  }, {
    readonly untitled: "Untitled";
    readonly nodeCopyString: " copy";
    readonly layers: "Layers";
    readonly pages: "Pages";
    readonly design: "Design";
    readonly code: "Code";
    readonly ai: "AI";
    readonly assets: "Assets";
    readonly searchLocalComponents: "Search local components";
    readonly assetView: "Asset view";
    readonly gridView: "Grid view";
    readonly listView: "List view";
    readonly viewDetails: "View details";
    readonly assetLibraryBadge: "Library";
    readonly assetVariantSummary: import("@nanostores/i18n").TranslationFunction<[{
      count: string | number;
    } & {
      names: string | number;
    } & object], string>;
    readonly duplicateVariantValues: "Duplicate variant values";
    readonly openDocumentation: "Open documentation";
    readonly noLocalComponents: "No local components";
    readonly componentSet: "Component set";
    readonly component: "Component";
    readonly insertInstance: "Insert instance";
    readonly description: "Description";
    readonly documentation: "Documentation";
    readonly openDocs: "Open docs";
    readonly properties: "Properties";
    readonly xAxis: "X Axis";
    readonly yAxis: "Y Axis";
    readonly rotation: "Rotation";
    readonly width: "Width";
    readonly height: "Height";
    readonly opacity: "Opacity";
    readonly blendMode: "Blend mode";
    readonly radius: "Radius";
    readonly cornerSmoothing: "Corner smoothing";
    readonly spread: "Spread";
    readonly page: "Page";
    readonly frame: "Frame";
    readonly framePreset: "Frame preset";
    readonly framePresetCustom: "Custom";
    readonly framePresetCategoryPhone: "Phone";
    readonly framePresetCategoryTablet: "Tablet";
    readonly framePresetCategoryDesktop: "Desktop";
    readonly framePresetCategoryPresentation: "Presentation";
    readonly framePresetCategoryWatch: "Watch";
    readonly framePresetCategoryPaper: "Paper";
    readonly framePresetCategorySocialMedia: "Social media";
    readonly framePresetCategoryFigmaCommunity: "Figma Community";
    readonly framePresetCategoryArchive: "Archive";
    readonly position: "Position";
    readonly layout: "Layout";
    readonly autoLayout: "Auto layout";
    readonly alignment: "Alignment";
    readonly appearance: "Appearance";
    readonly fill: "Fill";
    readonly stroke: "Stroke";
    readonly effects: "Effects";
    readonly mask: "Mask";
    readonly export: "Export";
    readonly typography: "Typography";
    readonly fontFamily: "Font family";
    readonly fontWeight: "Font weight";
    readonly fontSize: "Font size";
    readonly lineHeight: "Line height";
    readonly letterSpacing: "Letter spacing";
    readonly textAlignment: "Text alignment";
    readonly verticalTextAlignment: "Vertical text alignment";
    readonly textCase: "Text case";
    readonly textCaseOriginal: "Original";
    readonly textCaseUpper: "Uppercase";
    readonly textCaseLower: "Lowercase";
    readonly textCaseTitle: "Title case";
    readonly truncation: "Truncation";
    readonly truncationDisabled: "Disabled";
    readonly truncationEnding: "Ending ellipsis";
    readonly maxLines: "Maximum lines";
    readonly openTypeFeatures: "Font features";
    readonly standardLigatures: "Standard ligatures";
    readonly contextualAlternates: "Contextual alternates";
    readonly kerning: "Kerning";
    readonly textFormatting: "Text formatting";
    readonly pageBackground: "Page background";
    readonly variables: "Variables";
    readonly variants: "Variants";
    readonly componentProperties: "Component properties";
    readonly constraints: "Constraints";
    readonly horizontalConstraint: "Horizontal constraint";
    readonly verticalConstraint: "Vertical constraint";
    readonly constraintLeft: "Left";
    readonly constraintRight: "Right";
    readonly constraintTop: "Top";
    readonly constraintBottom: "Bottom";
    readonly constraintCenter: "Center";
    readonly constraintLeftAndRight: "Left and right";
    readonly constraintTopAndBottom: "Top and bottom";
    readonly constraintScale: "Scale";
    readonly constraintHorizontalCenter: "Horizontal center";
    readonly constraintVerticalCenter: "Vertical center";
    readonly addFill: "Add fill";
    readonly addStroke: "Add stroke";
    readonly addEffect: "Add effect";
    readonly addExport: "Add export";
    readonly removeFill: "Remove fill";
    readonly removeStroke: "Remove stroke";
    readonly removeEffect: "Remove effect";
    readonly removeExport: "Remove export";
    readonly effectSettings: "Effect settings";
    readonly expandEffectSettings: "Expand effect settings";
    readonly collapseEffectSettings: "Collapse effect settings";
    readonly toggleExportPreview: "Toggle export preview";
    readonly dropShadow: "Drop shadow";
    readonly innerShadow: "Inner shadow";
    readonly layerBlur: "Layer blur";
    readonly backgroundBlur: "Background blur";
    readonly foregroundBlur: "Foreground blur";
    readonly maskType: "Mask type";
    readonly maskTypeAlpha: "Alpha";
    readonly maskTypeVector: "Vector";
    readonly maskTypeLuminance: "Luminance";
    readonly blendModePassThrough: "Pass through";
    readonly blendModeNormal: "Normal";
    readonly blendModeDarken: "Darken";
    readonly blendModeMultiply: "Multiply";
    readonly blendModeColorBurn: "Color burn";
    readonly blendModeLighten: "Lighten";
    readonly blendModeScreen: "Screen";
    readonly blendModeColorDodge: "Color dodge";
    readonly blendModeOverlay: "Overlay";
    readonly blendModeSoftLight: "Soft light";
    readonly blendModeHardLight: "Hard light";
    readonly blendModeDifference: "Difference";
    readonly blendModeExclusion: "Exclusion";
    readonly blendModeHue: "Hue";
    readonly blendModeSaturation: "Saturation";
    readonly blendModeColor: "Color";
    readonly blendModeLuminosity: "Luminosity";
    readonly strokeType: "Stroke type";
    readonly strokeWeight: "Stroke weight";
    readonly noSelection: "No selection";
    readonly noLocalVariables: "No local variables";
    readonly openVariables: "Open variables";
    readonly addPage: "Add page";
    readonly toggleVisibility: "Toggle visibility";
    readonly independentCornerRadii: "Independent corner radii";
    readonly detachVariable: "Detach variable";
    readonly applyVariable: "Apply variable";
    readonly noVariablesFound: "No variables found";
    readonly addAutoLayout: "Add auto layout";
    readonly removeAutoLayout: "Remove auto layout";
    readonly alignLeft: "Align left";
    readonly alignCenterHorizontally: "Align center horizontally";
    readonly alignRight: "Align right";
    readonly alignTop: "Align top";
    readonly alignCenterVertically: "Align center vertically";
    readonly alignBottom: "Align bottom";
    readonly flipHorizontal: "Flip horizontal";
    readonly flipVertical: "Flip vertical";
    readonly rotate90: "Rotate 90°";
    readonly mixedFillsHelp: "Click + to replace mixed fills";
    readonly mixedStrokesHelp: "Click + to replace mixed strokes";
    readonly mixedEffectsHelp: "Click + to replace mixed effects";
    readonly strokeSides: "Stroke sides";
    readonly strokeDash: "Dashed stroke";
    readonly strokeCap: "Stroke cap";
    readonly strokeCapButt: "Butt cap";
    readonly strokeCapRound: "Round cap";
    readonly strokeCapSquare: "Square cap";
    readonly strokeJoin: "Stroke join";
    readonly strokeJoinMiter: "Miter join";
    readonly strokeJoinBevel: "Bevel join";
    readonly strokeJoinRound: "Round join";
    readonly strokeMiterLimit: "Miter limit";
    readonly strokeAlignInside: "Inside";
    readonly strokeAlignCenter: "Center";
    readonly strokeAlignOutside: "Outside";
    readonly exportScale: "Export scale";
    readonly exportFormat: "Export format";
    readonly exportPreview: "Preview";
    readonly exportRenderingPreview: "Rendering preview…";
    readonly create: "Create";
    readonly add: "Add";
    readonly createVariable: "Create variable";
    readonly createColorVariable: import("@nanostores/i18n").TranslationFunction<[{
      value: string | number;
    } & object], string>;
    readonly createNumberVariable: import("@nanostores/i18n").TranslationFunction<[{
      value: string | number;
    } & object], string>;
    readonly variableName: "Variable name";
    readonly mixed: "Mixed";
    readonly none: "None";
    readonly fillStyle: "Fill style";
    readonly strokeStyle: "Stroke style";
    readonly textStyle: "Text style";
    readonly effectStyle: "Effect style";
    readonly gridStyle: "Grid style";
    readonly missingStyle: import("@nanostores/i18n").TranslationFunction<[{
      id: string | number;
    } & object], string>;
    readonly layersCount: import("@nanostores/i18n").TranslationFunction<[{
      count: string | number;
    } & object], string>;
    readonly goToMainComponent: "Go to Main Component";
    readonly detachInstance: "Detach Instance";
    readonly gap: "Gap";
    readonly solid: "Solid";
    readonly linearGradient: "Linear";
    readonly radialGradient: "Radial";
    readonly image: "Image";
    readonly stops: "Stops";
    readonly addStop: "Add stop";
    readonly alignCenter: "Align center";
    readonly alignMiddle: "Align middle";
    readonly clipContent: "Clip content";
    readonly colorFormatRgb: "RGB";
    readonly colorFormatHsl: "HSL";
    readonly colorFormatHsb: "HSB";
    readonly colorFormatOkhcl: "OkHCL";
    readonly colorHintHsl: "H hue · S saturation · L lightness";
    readonly colorHintHsb: "H hue · S saturation · B brightness";
    readonly colorHintOkhcl: "H hue · C chroma · L lightness · A alpha";
    readonly colorPreviewClipped: import("@nanostores/i18n").TranslationFunction<[{
      space: string | number;
    } & object], string>;
    readonly rulers: "Rulers";
    readonly multiplayerCursors: "Multiplayer cursors";
    readonly direction: "Direction";
    readonly flow: "Flow";
    readonly freeform: "Freeform";
    readonly dimensions: "Dimensions";
    readonly layoutHorizontal: "Horizontal layout";
    readonly layoutVertical: "Vertical layout";
    readonly layoutGrid: "Grid layout";
    readonly layoutWrap: "Wrap layout";
    readonly gapAuto: "Auto gap";
    readonly horizontalGap: "Horizontal gap";
    readonly verticalGap: "Vertical gap";
    readonly auto: "Auto";
    readonly columns: "Columns";
    readonly rows: "Rows";
    readonly sizingFixed: "Fixed";
    readonly sizingHug: "Hug";
    readonly sizingFill: "Fill";
    readonly sizingHugShort: "Hug";
    readonly sizingFillShort: "Fill";
    readonly addMinWidth: "Add min width";
    readonly removeMinWidth: "Remove min width";
    readonly addMaxWidth: "Add max width";
    readonly removeMaxWidth: "Remove max width";
    readonly addMinHeight: "Add min height";
    readonly removeMinHeight: "Remove min height";
    readonly addMaxHeight: "Add max height";
    readonly removeMaxHeight: "Remove max height";
    readonly minWidthShort: "Min W";
    readonly maxWidthShort: "Max W";
    readonly minHeightShort: "Min H";
    readonly maxHeightShort: "Max H";
    readonly setToCurrentWidth: "Set to current width";
    readonly setToCurrentHeight: "Set to current height";
    readonly sizingFillFr: "Fill (fr)";
    readonly sizingFixedPx: "Fixed (px)";
    readonly resizing: "Resizing";
    readonly resizeAutoWidth: "Auto width";
    readonly resizeAutoHeight: "Auto height";
    readonly resizeFixed: "Fixed size";
    readonly layoutGrids: "Layout guide";
    readonly addLayoutGrid: "Add layout guide";
    readonly removeLayoutGrid: "Remove layout guide";
    readonly gridColumns: "Columns";
    readonly gridRows: "Rows";
    readonly gridGrid: "Grid";
    readonly gridCount: "Count";
    readonly gridGutter: "Gutter";
    readonly gridMargin: "Margin";
    readonly gridSectionSize: "Section size";
    readonly searchFonts: "Search fonts...";
  }>;
  variableTypes: Ref<{
    readonly color: "Color";
    readonly colorHint: "Paint values";
    readonly number: "Number";
    readonly numberHint: "Sizes, spacing, opacity";
    readonly text: "Text";
    readonly textHint: "Copy and labels";
    readonly boolean: "Boolean";
    readonly booleanHint: "True or false";
  }, {
    readonly color: "Color";
    readonly colorHint: "Paint values";
    readonly number: "Number";
    readonly numberHint: "Sizes, spacing, opacity";
    readonly text: "Text";
    readonly textHint: "Copy and labels";
    readonly boolean: "Boolean";
    readonly booleanHint: "True or false";
  }>;
  pages: Ref<{
    readonly newPage: "New page";
    readonly rename: "Rename";
    readonly delete: "Delete";
    readonly pageName: import("@nanostores/i18n").TranslationFunction<[{
      number: string | number;
    } & object], string>;
  }, {
    readonly newPage: "New page";
    readonly rename: "Rename";
    readonly delete: "Delete";
    readonly pageName: import("@nanostores/i18n").TranslationFunction<[{
      number: string | number;
    } & object], string>;
  }>;
  dialogs: Ref<{
    readonly cancel: "Cancel";
    readonly apply: "Apply";
    readonly close: "Close";
    readonly rename: "Rename";
    readonly renameLayers: import("@nanostores/i18n").TranslationFunction<[{
      count: string | number;
    } & object], string>;
    readonly renamePreview: "Preview";
    readonly renameMatch: "Match";
    readonly renameTo: "Rename to";
    readonly renameCurrentName: "Current name";
    readonly renameNumberAscending: "Number ↑";
    readonly renameNumberDescending: "Number ↓";
    readonly renameStartAscendingFrom: "Start ascending from";
    readonly renameStopDescendingAt: "Stop descending at";
    readonly renameInvalidPattern: "Invalid regular expression";
    readonly ok: "OK";
    readonly copy: "Copy";
    readonly copied: "Copied";
    readonly copiedExclamation: "Copied!";
    readonly copyMessage: "Copy message";
    readonly createCollection: "Create collection";
    readonly renameCollection: "Rename collection";
    readonly deleteCollection: "Delete collection";
    readonly localVariables: "Local variables";
    readonly noVariableCollections: "No variable collections";
    readonly modes: "Modes";
    readonly addMode: "Add mode";
    readonly renameMode: "Rename mode";
    readonly duplicateMode: "Duplicate mode";
    readonly deleteMode: "Delete mode";
    readonly setDefaultMode: "Set as default";
    readonly selectLayerForJSX: "Select a layer to see its JSX code";
    readonly copyJSXReference: "Copy JSX prop reference to clipboard";
    readonly newTab: "New tab";
    readonly closeTab: import("@nanostores/i18n").TranslationFunction<[{
      name: string | number;
    } & object], string>;
    readonly showUI: import("@nanostores/i18n").TranslationFunction<[{
      shortcut: string | number;
    } & object], string>;
    readonly fontSettings: "Font settings";
    readonly fontSettingsDesktopDescription: "Access system fonts, online providers, fallback packs, and cached downloads.";
    readonly fontSettingsBrowserDescription: "Allow browser access to local fonts and manage online font providers.";
    readonly localFonts: "Local fonts";
    readonly onlineFonts: "Online fonts";
    readonly downloadedCache: "Downloaded cache";
    readonly lastUpdated: "Last updated";
    readonly enabled: "Enabled";
    readonly disabled: "Disabled";
    readonly denied: "Denied";
    readonly unavailable: "Unavailable";
    readonly notRequested: "Not requested";
    readonly never: "Never";
    readonly systemFontAccess: "System font access";
    readonly systemFontsAvailable: "System fonts are available.";
    readonly allowBrowserFontAccess: "Allow browser font access when system fonts are missing.";
    readonly allow: "Allow";
    readonly requesting: "Requesting…";
    readonly onlineFontProviders: "Online font providers";
    readonly downloadMissingWebFonts: "Download missing web fonts through enabled providers.";
    readonly webFontProvidersRequireDesktopApp: "Online font provider catalogs are unavailable in the web app. Download the desktop app to browse and load provider fonts.";
    readonly clipboardImageUnavailableWeb: "Pasted design includes 1 image that cannot be loaded in the web app. Use the desktop app to include it.";
    readonly clipboardImagesUnavailableWeb: import("@nanostores/i18n").TranslationFunction<[{
      count: string | number;
    } & object], string>;
    readonly clipboardImageFetchFailed: "Failed to fetch 1 image from Figma. Check that the source file is accessible and try again.";
    readonly clipboardImagesFetchFailed: import("@nanostores/i18n").TranslationFunction<[{
      count: string | number;
    } & object], string>;
    readonly enable: "Enable";
    readonly disable: "Disable";
    readonly fallbackPacks: "Fallback packs";
    readonly downloadFallbackPacksDescription: "Download CJK and Arabic fallbacks before opening files that need them.";
    readonly download: "Download";
    readonly downloading: "Downloading…";
    readonly refresh: "Refresh";
    readonly clearCache: "Clear cache";
    readonly localFontAccessEnabled: "Local font access enabled.";
    readonly localFontAccessNotGranted: "Local font access was not granted.";
    readonly onlineFontProvidersEnabled: "Online font providers enabled.";
    readonly onlineFontProvidersDisabled: "Online font providers disabled.";
    readonly fontProviderEnabled: import("@nanostores/i18n").TranslationFunction<[{
      provider: string | number;
    } & object], string>;
    readonly fontProviderDisabled: import("@nanostores/i18n").TranslationFunction<[{
      provider: string | number;
    } & object], string>;
    readonly fallbackFontsDownloaded: "Fallback fonts downloaded.";
    readonly fallbackFontsDownloadFailed: "Could not download fallback fonts.";
    readonly downloadedFontCacheCleared: "Downloaded font cache cleared.";
    readonly downloadedFontCacheClearFailed: "Could not clear downloaded font cache.";
    readonly you: "You";
    readonly youSuffix: "you";
    readonly followingPeerStop: import("@nanostores/i18n").TranslationFunction<[{
      name: string | number;
    } & object], string>;
    readonly clickToFollowPeer: import("@nanostores/i18n").TranslationFunction<[{
      name: string | number;
    } & object], string>;
    readonly connectAIProvider: "Connect an AI provider to start chatting.";
    readonly connect: "Connect";
    readonly testConnection: "Test connection";
    readonly testingConnection: "Testing…";
    readonly connectionTestSuccess: "Connected successfully. Model is reachable.";
    readonly connectionTestMissingAPIKey: "Enter an API key before testing.";
    readonly connectionTestMissingBaseURL: "Enter a base URL before testing.";
    readonly connectionTestMissingModel: "Enter a model ID before testing.";
    readonly connectionTestInvalidBaseURL: "Base URL is invalid. Use a full URL like https://api.example.com/v1.";
    readonly connectionTestAuthFailed: "Authentication failed. Check your API key.";
    readonly connectionTestModelNotFound: "Model not found. Check the model ID.";
    readonly connectionTestAPITypeMismatch: "This endpoint does not appear to support the selected API type. Try Completions or Responses.";
    readonly connectionTestBrowserNetworkFailed: "Could not reach this endpoint from the browser. Try the desktop app or use an endpoint with CORS enabled.";
    readonly connectionTestNetworkFailed: "Could not reach the endpoint. Check the URL and your network connection.";
    readonly connectionTestUnknownFailed: "Connection test failed. Check the provider settings and try again.";
    readonly getAPIKey: import("@nanostores/i18n").TranslationFunction<[{
      provider: string | number;
    } & object], string>;
    readonly oneKeyManyModels: "One key for 100+ models from all providers.";
    readonly describeChange: "Describe a change…";
    readonly describeCreateOrChange: "Describe what you want to create or change.";
    readonly stopGenerating: "Stop generating";
    readonly sendMessage: "Send message";
    readonly baseURLPlaceholder: "Base URL (e.g. http://localhost:11434/v1)";
    readonly modelIDPlaceholder: "Model ID (e.g. llama-3.3-70b)";
    readonly aiProvider: "AI Provider";
    readonly providerSettings: "Provider settings";
    readonly openProviderSettings: "Open provider settings";
    readonly settings: "Settings";
    readonly settingsDescription: "Manage integrations and app preferences.";
    readonly settingsAIAndAgents: "AI & agents";
    readonly models: "Models";
    readonly modelsDescription: "Configure reusable models and their provider connections.";
    readonly addModel: "Add model";
    readonly editModel: "Edit model";
    readonly modelEditorDescription: "Provider, model, credentials, and capabilities.";
    readonly modelName: "Name";
    readonly modelConfiguration: "Model";
    readonly connectionSettings: "Connection";
    readonly modelCapabilities: "Capabilities";
    readonly modelCapabilitiesDetected: "Detected from the selected model.";
    readonly modelCapabilitiesManual: "Declare compatibility for this custom model.";
    readonly modelCapabilityTools: "Tool calling";
    readonly modelCapabilityVision: "Image input";
    readonly modelCapabilityToolsShort: "Tools";
    readonly modelCapabilityVisionShort: "Vision";
    readonly selectDesignModel: "Select design model";
    readonly modelNeedsCredential: "Needs key";
    readonly modelAgentConnection: "Agent";
    readonly saveModel: "Save model";
    readonly deleteModel: "Delete model";
    readonly deleteModelDescription: "Delete this model and remove its role assignments?";
    readonly modelAssignments: "Assignments";
    readonly modelAssignmentsDescription: "Choose which configured model handles each type of work.";
    readonly modelRoleDesign: "Design agent";
    readonly modelRoleReview: "Review";
    readonly modelRoleFast: "Fast tasks";
    readonly modelRoleVision: "Vision";
    readonly modelRoleDesignDescription: "AI chat and canvas edits";
    readonly modelRoleReviewDescription: "Explicit plan and design reviews";
    readonly modelRoleFastDescription: "Low-cost background work";
    readonly modelRoleVisionDescription: "Screenshots and image references";
    readonly modelRoleUseDesign: "Same as Design";
    readonly noModel: "None";
    readonly back: "Back";
    readonly settingsMedia: "Media";
    readonly vectorization: "Image vectorization";
    readonly vectorizationDescription: "Send image layers to Recraft or fal.ai and return editable vectors. Provider charges may apply.";
    readonly vectorizeProvider: "Vectorization service";
    readonly settingsStorage: "Cloud storage";
    readonly storageWorkspace: "Storage workspace";
    readonly openStorageWorkspace: "Open workspace";
    readonly newStoredDocument: "New document";
    readonly emptyStorageWorkspace: "No stored documents yet.";
    readonly loadingDocuments: "Loading documents…";
    readonly storageNotConfigured: "Configure storage before using this workspace.";
    readonly copyStorageCors: "Copy CORS JSON";
    readonly storageEndpoint: "Endpoint";
    readonly storageBucket: "Bucket";
    readonly storageRegion: "Region";
    readonly storageAccessKeyID: "Access key ID";
    readonly storageSecretAccessKey: "Secret access key";
    readonly save: "Save";
    readonly credentialStorage: import("@nanostores/i18n").TranslationFunction<[{
      backend: string | number;
    } & object], string>;
    readonly credentialBackendNative: "system credential store";
    readonly credentialBackendBrowser: "encrypted browser storage";
    readonly credentialBackendMemory: "this session only";
    readonly rememberCredentials: "Remember credentials on this browser";
    readonly done: "Done";
    readonly apiKey: "API Key";
    readonly apiType: "API Type";
    readonly baseURL: "Base URL";
    readonly modelID: "Model ID";
    readonly customModelID: "Custom model ID";
    readonly customModel: "Custom model…";
    readonly advancedModelSettings: "Advanced settings";
    readonly outputLimit: "Output limit";
    readonly outputLimitAutomatic: "Automatic recommendation";
    readonly supported: "Supported";
    readonly unsupported: "Not supported";
    readonly tokens: "tokens";
    readonly maxOutputTokens: "Max output tokens";
    readonly clear: "Clear";
    readonly keySavedReplace: "Key saved — enter new to replace";
    readonly getAPIKeyGeneric: "Get API key →";
    readonly pexelsAPIKey: "Pexels API Key (stock photos)";
    readonly unsplashAccessKey: "Unsplash Access Key";
    readonly stockPhotoToolOptional: "Optional — for stock_photo tool";
    readonly pexelsAlternativeOptional: "Optional — alternative to Pexels";
    readonly getPexelsAPIKey: "Get free Pexels API key →";
    readonly getUnsplashAccessKey: "Get free Unsplash access key →";
    readonly completions: "Completions";
    readonly responses: "Responses";
    readonly yourName: "Your name";
    readonly enterYourName: "Enter your name";
    readonly shareThisFile: "Share this file";
    readonly joinRoom: "Join room";
    readonly join: "Join";
    readonly roomLink: "Room link";
    readonly joinCollaboration: "Join collaboration";
    readonly orJoinRoom: "or join a room";
    readonly pasteRoomLinkOrId: "Paste room link or ID";
    readonly connected: "Connected";
    readonly search: "Search…";
    readonly noResults: "No results";
    readonly share: "Share";
    readonly appUpToDate: "OpenPencil is up to date";
    readonly updateAvailableTitle: "Update OpenPencil";
    readonly updateAvailable: import("@nanostores/i18n").TranslationFunction<[{
      version: string | number;
    } & object], string>;
    readonly updateInstallPrompt: "Download and install it now? The app will restart after the update is installed.";
    readonly downloadingUpdate: import("@nanostores/i18n").TranslationFunction<[{
      version: string | number;
    } & object], string>;
    readonly updateInstalledTitle: "Update installed";
    readonly updateInstalled: import("@nanostores/i18n").TranslationFunction<[{
      version: string | number;
    } & {
      size: string | number;
    } & object], string>;
    readonly updateUnavailable: "Updates are not available yet. Publish a signed release with latest.json first.";
    readonly updateCheckFailed: import("@nanostores/i18n").TranslationFunction<[{
      error: string | number;
    } & object], string>;
  }, {
    readonly cancel: "Cancel";
    readonly apply: "Apply";
    readonly close: "Close";
    readonly rename: "Rename";
    readonly renameLayers: import("@nanostores/i18n").TranslationFunction<[{
      count: string | number;
    } & object], string>;
    readonly renamePreview: "Preview";
    readonly renameMatch: "Match";
    readonly renameTo: "Rename to";
    readonly renameCurrentName: "Current name";
    readonly renameNumberAscending: "Number ↑";
    readonly renameNumberDescending: "Number ↓";
    readonly renameStartAscendingFrom: "Start ascending from";
    readonly renameStopDescendingAt: "Stop descending at";
    readonly renameInvalidPattern: "Invalid regular expression";
    readonly ok: "OK";
    readonly copy: "Copy";
    readonly copied: "Copied";
    readonly copiedExclamation: "Copied!";
    readonly copyMessage: "Copy message";
    readonly createCollection: "Create collection";
    readonly renameCollection: "Rename collection";
    readonly deleteCollection: "Delete collection";
    readonly localVariables: "Local variables";
    readonly noVariableCollections: "No variable collections";
    readonly modes: "Modes";
    readonly addMode: "Add mode";
    readonly renameMode: "Rename mode";
    readonly duplicateMode: "Duplicate mode";
    readonly deleteMode: "Delete mode";
    readonly setDefaultMode: "Set as default";
    readonly selectLayerForJSX: "Select a layer to see its JSX code";
    readonly copyJSXReference: "Copy JSX prop reference to clipboard";
    readonly newTab: "New tab";
    readonly closeTab: import("@nanostores/i18n").TranslationFunction<[{
      name: string | number;
    } & object], string>;
    readonly showUI: import("@nanostores/i18n").TranslationFunction<[{
      shortcut: string | number;
    } & object], string>;
    readonly fontSettings: "Font settings";
    readonly fontSettingsDesktopDescription: "Access system fonts, online providers, fallback packs, and cached downloads.";
    readonly fontSettingsBrowserDescription: "Allow browser access to local fonts and manage online font providers.";
    readonly localFonts: "Local fonts";
    readonly onlineFonts: "Online fonts";
    readonly downloadedCache: "Downloaded cache";
    readonly lastUpdated: "Last updated";
    readonly enabled: "Enabled";
    readonly disabled: "Disabled";
    readonly denied: "Denied";
    readonly unavailable: "Unavailable";
    readonly notRequested: "Not requested";
    readonly never: "Never";
    readonly systemFontAccess: "System font access";
    readonly systemFontsAvailable: "System fonts are available.";
    readonly allowBrowserFontAccess: "Allow browser font access when system fonts are missing.";
    readonly allow: "Allow";
    readonly requesting: "Requesting…";
    readonly onlineFontProviders: "Online font providers";
    readonly downloadMissingWebFonts: "Download missing web fonts through enabled providers.";
    readonly webFontProvidersRequireDesktopApp: "Online font provider catalogs are unavailable in the web app. Download the desktop app to browse and load provider fonts.";
    readonly clipboardImageUnavailableWeb: "Pasted design includes 1 image that cannot be loaded in the web app. Use the desktop app to include it.";
    readonly clipboardImagesUnavailableWeb: import("@nanostores/i18n").TranslationFunction<[{
      count: string | number;
    } & object], string>;
    readonly clipboardImageFetchFailed: "Failed to fetch 1 image from Figma. Check that the source file is accessible and try again.";
    readonly clipboardImagesFetchFailed: import("@nanostores/i18n").TranslationFunction<[{
      count: string | number;
    } & object], string>;
    readonly enable: "Enable";
    readonly disable: "Disable";
    readonly fallbackPacks: "Fallback packs";
    readonly downloadFallbackPacksDescription: "Download CJK and Arabic fallbacks before opening files that need them.";
    readonly download: "Download";
    readonly downloading: "Downloading…";
    readonly refresh: "Refresh";
    readonly clearCache: "Clear cache";
    readonly localFontAccessEnabled: "Local font access enabled.";
    readonly localFontAccessNotGranted: "Local font access was not granted.";
    readonly onlineFontProvidersEnabled: "Online font providers enabled.";
    readonly onlineFontProvidersDisabled: "Online font providers disabled.";
    readonly fontProviderEnabled: import("@nanostores/i18n").TranslationFunction<[{
      provider: string | number;
    } & object], string>;
    readonly fontProviderDisabled: import("@nanostores/i18n").TranslationFunction<[{
      provider: string | number;
    } & object], string>;
    readonly fallbackFontsDownloaded: "Fallback fonts downloaded.";
    readonly fallbackFontsDownloadFailed: "Could not download fallback fonts.";
    readonly downloadedFontCacheCleared: "Downloaded font cache cleared.";
    readonly downloadedFontCacheClearFailed: "Could not clear downloaded font cache.";
    readonly you: "You";
    readonly youSuffix: "you";
    readonly followingPeerStop: import("@nanostores/i18n").TranslationFunction<[{
      name: string | number;
    } & object], string>;
    readonly clickToFollowPeer: import("@nanostores/i18n").TranslationFunction<[{
      name: string | number;
    } & object], string>;
    readonly connectAIProvider: "Connect an AI provider to start chatting.";
    readonly connect: "Connect";
    readonly testConnection: "Test connection";
    readonly testingConnection: "Testing…";
    readonly connectionTestSuccess: "Connected successfully. Model is reachable.";
    readonly connectionTestMissingAPIKey: "Enter an API key before testing.";
    readonly connectionTestMissingBaseURL: "Enter a base URL before testing.";
    readonly connectionTestMissingModel: "Enter a model ID before testing.";
    readonly connectionTestInvalidBaseURL: "Base URL is invalid. Use a full URL like https://api.example.com/v1.";
    readonly connectionTestAuthFailed: "Authentication failed. Check your API key.";
    readonly connectionTestModelNotFound: "Model not found. Check the model ID.";
    readonly connectionTestAPITypeMismatch: "This endpoint does not appear to support the selected API type. Try Completions or Responses.";
    readonly connectionTestBrowserNetworkFailed: "Could not reach this endpoint from the browser. Try the desktop app or use an endpoint with CORS enabled.";
    readonly connectionTestNetworkFailed: "Could not reach the endpoint. Check the URL and your network connection.";
    readonly connectionTestUnknownFailed: "Connection test failed. Check the provider settings and try again.";
    readonly getAPIKey: import("@nanostores/i18n").TranslationFunction<[{
      provider: string | number;
    } & object], string>;
    readonly oneKeyManyModels: "One key for 100+ models from all providers.";
    readonly describeChange: "Describe a change…";
    readonly describeCreateOrChange: "Describe what you want to create or change.";
    readonly stopGenerating: "Stop generating";
    readonly sendMessage: "Send message";
    readonly baseURLPlaceholder: "Base URL (e.g. http://localhost:11434/v1)";
    readonly modelIDPlaceholder: "Model ID (e.g. llama-3.3-70b)";
    readonly aiProvider: "AI Provider";
    readonly providerSettings: "Provider settings";
    readonly openProviderSettings: "Open provider settings";
    readonly settings: "Settings";
    readonly settingsDescription: "Manage integrations and app preferences.";
    readonly settingsAIAndAgents: "AI & agents";
    readonly models: "Models";
    readonly modelsDescription: "Configure reusable models and their provider connections.";
    readonly addModel: "Add model";
    readonly editModel: "Edit model";
    readonly modelEditorDescription: "Provider, model, credentials, and capabilities.";
    readonly modelName: "Name";
    readonly modelConfiguration: "Model";
    readonly connectionSettings: "Connection";
    readonly modelCapabilities: "Capabilities";
    readonly modelCapabilitiesDetected: "Detected from the selected model.";
    readonly modelCapabilitiesManual: "Declare compatibility for this custom model.";
    readonly modelCapabilityTools: "Tool calling";
    readonly modelCapabilityVision: "Image input";
    readonly modelCapabilityToolsShort: "Tools";
    readonly modelCapabilityVisionShort: "Vision";
    readonly selectDesignModel: "Select design model";
    readonly modelNeedsCredential: "Needs key";
    readonly modelAgentConnection: "Agent";
    readonly saveModel: "Save model";
    readonly deleteModel: "Delete model";
    readonly deleteModelDescription: "Delete this model and remove its role assignments?";
    readonly modelAssignments: "Assignments";
    readonly modelAssignmentsDescription: "Choose which configured model handles each type of work.";
    readonly modelRoleDesign: "Design agent";
    readonly modelRoleReview: "Review";
    readonly modelRoleFast: "Fast tasks";
    readonly modelRoleVision: "Vision";
    readonly modelRoleDesignDescription: "AI chat and canvas edits";
    readonly modelRoleReviewDescription: "Explicit plan and design reviews";
    readonly modelRoleFastDescription: "Low-cost background work";
    readonly modelRoleVisionDescription: "Screenshots and image references";
    readonly modelRoleUseDesign: "Same as Design";
    readonly noModel: "None";
    readonly back: "Back";
    readonly settingsMedia: "Media";
    readonly vectorization: "Image vectorization";
    readonly vectorizationDescription: "Send image layers to Recraft or fal.ai and return editable vectors. Provider charges may apply.";
    readonly vectorizeProvider: "Vectorization service";
    readonly settingsStorage: "Cloud storage";
    readonly storageWorkspace: "Storage workspace";
    readonly openStorageWorkspace: "Open workspace";
    readonly newStoredDocument: "New document";
    readonly emptyStorageWorkspace: "No stored documents yet.";
    readonly loadingDocuments: "Loading documents…";
    readonly storageNotConfigured: "Configure storage before using this workspace.";
    readonly copyStorageCors: "Copy CORS JSON";
    readonly storageEndpoint: "Endpoint";
    readonly storageBucket: "Bucket";
    readonly storageRegion: "Region";
    readonly storageAccessKeyID: "Access key ID";
    readonly storageSecretAccessKey: "Secret access key";
    readonly save: "Save";
    readonly credentialStorage: import("@nanostores/i18n").TranslationFunction<[{
      backend: string | number;
    } & object], string>;
    readonly credentialBackendNative: "system credential store";
    readonly credentialBackendBrowser: "encrypted browser storage";
    readonly credentialBackendMemory: "this session only";
    readonly rememberCredentials: "Remember credentials on this browser";
    readonly done: "Done";
    readonly apiKey: "API Key";
    readonly apiType: "API Type";
    readonly baseURL: "Base URL";
    readonly modelID: "Model ID";
    readonly customModelID: "Custom model ID";
    readonly customModel: "Custom model…";
    readonly advancedModelSettings: "Advanced settings";
    readonly outputLimit: "Output limit";
    readonly outputLimitAutomatic: "Automatic recommendation";
    readonly supported: "Supported";
    readonly unsupported: "Not supported";
    readonly tokens: "tokens";
    readonly maxOutputTokens: "Max output tokens";
    readonly clear: "Clear";
    readonly keySavedReplace: "Key saved — enter new to replace";
    readonly getAPIKeyGeneric: "Get API key →";
    readonly pexelsAPIKey: "Pexels API Key (stock photos)";
    readonly unsplashAccessKey: "Unsplash Access Key";
    readonly stockPhotoToolOptional: "Optional — for stock_photo tool";
    readonly pexelsAlternativeOptional: "Optional — alternative to Pexels";
    readonly getPexelsAPIKey: "Get free Pexels API key →";
    readonly getUnsplashAccessKey: "Get free Unsplash access key →";
    readonly completions: "Completions";
    readonly responses: "Responses";
    readonly yourName: "Your name";
    readonly enterYourName: "Enter your name";
    readonly shareThisFile: "Share this file";
    readonly joinRoom: "Join room";
    readonly join: "Join";
    readonly roomLink: "Room link";
    readonly joinCollaboration: "Join collaboration";
    readonly orJoinRoom: "or join a room";
    readonly pasteRoomLinkOrId: "Paste room link or ID";
    readonly connected: "Connected";
    readonly search: "Search…";
    readonly noResults: "No results";
    readonly share: "Share";
    readonly appUpToDate: "OpenPencil is up to date";
    readonly updateAvailableTitle: "Update OpenPencil";
    readonly updateAvailable: import("@nanostores/i18n").TranslationFunction<[{
      version: string | number;
    } & object], string>;
    readonly updateInstallPrompt: "Download and install it now? The app will restart after the update is installed.";
    readonly downloadingUpdate: import("@nanostores/i18n").TranslationFunction<[{
      version: string | number;
    } & object], string>;
    readonly updateInstalledTitle: "Update installed";
    readonly updateInstalled: import("@nanostores/i18n").TranslationFunction<[{
      version: string | number;
    } & {
      size: string | number;
    } & object], string>;
    readonly updateUnavailable: "Updates are not available yet. Publish a signed release with latest.json first.";
    readonly updateCheckFailed: import("@nanostores/i18n").TranslationFunction<[{
      error: string | number;
    } & object], string>;
  }>;
  locale: Ref<Locale>;
  availableLocales: readonly ["en", "de", "es", "fr", "it", "ja", "pl", "ru", "zh-CN"];
  localeLabels: Record<"en" | "de" | "es" | "fr" | "it" | "ja" | "pl" | "ru" | "zh-CN", string>;
  setLocale: typeof setLocale;
};
//#endregion
//#region src/i18n/create.d.ts
declare const i18n: import("@nanostores/i18n").I18n<"en" | "de" | "es" | "fr" | "it" | "ja" | "pl" | "ru" | "zh-CN">;
//#endregion
//#region src/i18n/messages/menu.d.ts
declare const menuMessages: import("@nanostores/i18n").Messages<{
  readonly file: "File";
  readonly edit: "Edit";
  readonly view: "View";
  readonly object: "Object";
  readonly arrange: "Arrange";
  readonly text: "Text";
  readonly new: "New";
  readonly open: "Open…";
  readonly openStorageWorkspace: "Open storage workspace…";
  readonly save: "Save";
  readonly saveAs: "Save as…";
  readonly exportSelection: "Export selection…";
  readonly autosave: "Auto-save to local file";
  readonly closeTab: "Close tab";
  readonly copy: "Copy";
  readonly paste: "Paste";
  readonly theme: "Theme";
  readonly themeLight: "Light";
  readonly themeDark: "Dark";
  readonly themeAuto: "Auto";
  readonly profiler: "Performance profiler";
  readonly language: "Language";
  readonly settings: "Settings…";
  readonly rulers: "Rulers";
  readonly multiplayerCursors: "Multiplayer cursors";
  readonly checkUpdates: "Check for updates…";
  readonly moveToPage: "Move to page";
  readonly createInstance: "Create instance";
  readonly hide: "Hide";
  readonly show: "Show";
  readonly lock: "Lock";
  readonly unlock: "Unlock";
  readonly cut: "Cut";
  readonly front: "Front";
  readonly back: "Back";
  readonly toggleUI: "Toggle UI";
  readonly bold: "Bold";
  readonly italic: "Italic";
  readonly underline: "Underline";
  readonly strikethrough: "Strikethrough";
  readonly pasteHere: "Paste here";
  readonly pasteToReplace: "Paste to replace";
  readonly renameSelection: "Rename selection…";
  readonly copyPasteAs: "Copy/Paste as";
  readonly copyAsText: "Copy as text";
  readonly copyAsSVG: "Copy as SVG";
  readonly copyAsPNG: "Copy as PNG";
  readonly copyAsJSX: "Copy as JSX";
  readonly copyNodeId: "Copy node ID";
  readonly copyXPath: "Copy XPath";
  readonly convertToVector: "Convert to vector";
  readonly booleanOperations: "Boolean operations";
  readonly arrangeAlignLeft: "Align left";
  readonly arrangeAlignCenter: "Align center";
  readonly arrangeAlignRight: "Align right";
  readonly arrangeAlignTop: "Align top";
  readonly arrangeAlignMiddle: "Align middle";
  readonly arrangeAlignBottom: "Align bottom";
  readonly zoomIn: "Zoom in";
  readonly zoomOut: "Zoom out";
}>;
//#endregion
//#region src/i18n/messages/commands.d.ts
declare const commandMessages: import("@nanostores/i18n").Messages<{
  readonly undo: "Undo";
  readonly redo: "Redo";
  readonly selectAll: "Select all";
  readonly selectInverse: "Select inverse";
  readonly duplicate: "Duplicate";
  readonly delete: "Delete";
  readonly group: "Group";
  readonly groupSelection: "Group selection";
  readonly frameSelection: "Frame selection";
  readonly ungroup: "Ungroup";
  readonly createComponent: "Create component";
  readonly createComponentSet: "Create component set";
  readonly createInstance: "Create instance";
  readonly detachInstance: "Detach instance";
  readonly goToMainComponent: "Go to main component";
  readonly addAutoLayout: "Add auto layout";
  readonly useAsMask: "Use as mask";
  readonly removeMask: "Remove mask";
  readonly bringForward: "Bring forward";
  readonly bringToFront: "Bring to front";
  readonly sendBackward: "Send backward";
  readonly sendToBack: "Send to back";
  readonly showHide: "Show/Hide";
  readonly lockUnlock: "Lock/Unlock";
  readonly unionSelection: "Union selection";
  readonly subtractSelection: "Subtract selection";
  readonly intersectSelection: "Intersect selection";
  readonly excludeSelection: "Exclude selection";
  readonly flattenSelection: "Flatten";
  readonly outlineText: "Outline text";
  readonly outlineStroke: "Outline stroke";
  readonly booleanOperations: "Boolean operations";
  readonly flipHorizontal: "Flip horizontal";
  readonly flipVertical: "Flip vertical";
  readonly distributeHorizontal: "Distribute horizontal spacing";
  readonly distributeVertical: "Distribute vertical spacing";
  readonly moveToPage: "Move to page";
  readonly setOpacity: "Set opacity";
  readonly zoomTo100: "Zoom to 100%";
  readonly zoomToFit: "Zoom to fit";
  readonly zoomToSelection: "Zoom to selection";
}>;
//#endregion
//#region src/i18n/messages/tools.d.ts
declare const toolMessages: import("@nanostores/i18n").Messages<{
  readonly move: "Move";
  readonly frame: "Frame";
  readonly section: "Section";
  readonly rectangle: "Rectangle";
  readonly ellipse: "Ellipse";
  readonly line: "Line";
  readonly polygon: "Polygon";
  readonly star: "Star";
  readonly pen: "Pen";
  readonly text: "Text";
  readonly hand: "Hand";
}>;
//#endregion
//#region src/i18n/messages/panels.d.ts
declare const panelMessages: import("@nanostores/i18n").Messages<{
  readonly untitled: "Untitled";
  readonly nodeCopyString: " copy";
  readonly layers: "Layers";
  readonly pages: "Pages";
  readonly design: "Design";
  readonly code: "Code";
  readonly ai: "AI";
  readonly assets: "Assets";
  readonly searchLocalComponents: "Search local components";
  readonly assetView: "Asset view";
  readonly gridView: "Grid view";
  readonly listView: "List view";
  readonly viewDetails: "View details";
  readonly assetLibraryBadge: "Library";
  readonly assetVariantSummary: import("@nanostores/i18n").TranslationFunction<[{
    count: string | number;
  } & {
    names: string | number;
  } & object], string>;
  readonly duplicateVariantValues: "Duplicate variant values";
  readonly openDocumentation: "Open documentation";
  readonly noLocalComponents: "No local components";
  readonly componentSet: "Component set";
  readonly component: "Component";
  readonly insertInstance: "Insert instance";
  readonly description: "Description";
  readonly documentation: "Documentation";
  readonly openDocs: "Open docs";
  readonly properties: "Properties";
  readonly xAxis: "X Axis";
  readonly yAxis: "Y Axis";
  readonly rotation: "Rotation";
  readonly width: "Width";
  readonly height: "Height";
  readonly opacity: "Opacity";
  readonly blendMode: "Blend mode";
  readonly radius: "Radius";
  readonly cornerSmoothing: "Corner smoothing";
  readonly spread: "Spread";
  readonly page: "Page";
  readonly frame: "Frame";
  readonly framePreset: "Frame preset";
  readonly framePresetCustom: "Custom";
  readonly framePresetCategoryPhone: "Phone";
  readonly framePresetCategoryTablet: "Tablet";
  readonly framePresetCategoryDesktop: "Desktop";
  readonly framePresetCategoryPresentation: "Presentation";
  readonly framePresetCategoryWatch: "Watch";
  readonly framePresetCategoryPaper: "Paper";
  readonly framePresetCategorySocialMedia: "Social media";
  readonly framePresetCategoryFigmaCommunity: "Figma Community";
  readonly framePresetCategoryArchive: "Archive";
  readonly position: "Position";
  readonly layout: "Layout";
  readonly autoLayout: "Auto layout";
  readonly alignment: "Alignment";
  readonly appearance: "Appearance";
  readonly fill: "Fill";
  readonly stroke: "Stroke";
  readonly effects: "Effects";
  readonly mask: "Mask";
  readonly export: "Export";
  readonly typography: "Typography";
  readonly fontFamily: "Font family";
  readonly fontWeight: "Font weight";
  readonly fontSize: "Font size";
  readonly lineHeight: "Line height";
  readonly letterSpacing: "Letter spacing";
  readonly textAlignment: "Text alignment";
  readonly verticalTextAlignment: "Vertical text alignment";
  readonly textCase: "Text case";
  readonly textCaseOriginal: "Original";
  readonly textCaseUpper: "Uppercase";
  readonly textCaseLower: "Lowercase";
  readonly textCaseTitle: "Title case";
  readonly truncation: "Truncation";
  readonly truncationDisabled: "Disabled";
  readonly truncationEnding: "Ending ellipsis";
  readonly maxLines: "Maximum lines";
  readonly openTypeFeatures: "Font features";
  readonly standardLigatures: "Standard ligatures";
  readonly contextualAlternates: "Contextual alternates";
  readonly kerning: "Kerning";
  readonly textFormatting: "Text formatting";
  readonly pageBackground: "Page background";
  readonly variables: "Variables";
  readonly variants: "Variants";
  readonly componentProperties: "Component properties";
  readonly constraints: "Constraints";
  readonly horizontalConstraint: "Horizontal constraint";
  readonly verticalConstraint: "Vertical constraint";
  readonly constraintLeft: "Left";
  readonly constraintRight: "Right";
  readonly constraintTop: "Top";
  readonly constraintBottom: "Bottom";
  readonly constraintCenter: "Center";
  readonly constraintLeftAndRight: "Left and right";
  readonly constraintTopAndBottom: "Top and bottom";
  readonly constraintScale: "Scale";
  readonly constraintHorizontalCenter: "Horizontal center";
  readonly constraintVerticalCenter: "Vertical center";
  readonly addFill: "Add fill";
  readonly addStroke: "Add stroke";
  readonly addEffect: "Add effect";
  readonly addExport: "Add export";
  readonly removeFill: "Remove fill";
  readonly removeStroke: "Remove stroke";
  readonly removeEffect: "Remove effect";
  readonly removeExport: "Remove export";
  readonly effectSettings: "Effect settings";
  readonly expandEffectSettings: "Expand effect settings";
  readonly collapseEffectSettings: "Collapse effect settings";
  readonly toggleExportPreview: "Toggle export preview";
  readonly dropShadow: "Drop shadow";
  readonly innerShadow: "Inner shadow";
  readonly layerBlur: "Layer blur";
  readonly backgroundBlur: "Background blur";
  readonly foregroundBlur: "Foreground blur";
  readonly maskType: "Mask type";
  readonly maskTypeAlpha: "Alpha";
  readonly maskTypeVector: "Vector";
  readonly maskTypeLuminance: "Luminance";
  readonly blendModePassThrough: "Pass through";
  readonly blendModeNormal: "Normal";
  readonly blendModeDarken: "Darken";
  readonly blendModeMultiply: "Multiply";
  readonly blendModeColorBurn: "Color burn";
  readonly blendModeLighten: "Lighten";
  readonly blendModeScreen: "Screen";
  readonly blendModeColorDodge: "Color dodge";
  readonly blendModeOverlay: "Overlay";
  readonly blendModeSoftLight: "Soft light";
  readonly blendModeHardLight: "Hard light";
  readonly blendModeDifference: "Difference";
  readonly blendModeExclusion: "Exclusion";
  readonly blendModeHue: "Hue";
  readonly blendModeSaturation: "Saturation";
  readonly blendModeColor: "Color";
  readonly blendModeLuminosity: "Luminosity";
  readonly strokeType: "Stroke type";
  readonly strokeWeight: "Stroke weight";
  readonly noSelection: "No selection";
  readonly noLocalVariables: "No local variables";
  readonly openVariables: "Open variables";
  readonly addPage: "Add page";
  readonly toggleVisibility: "Toggle visibility";
  readonly independentCornerRadii: "Independent corner radii";
  readonly detachVariable: "Detach variable";
  readonly applyVariable: "Apply variable";
  readonly noVariablesFound: "No variables found";
  readonly addAutoLayout: "Add auto layout";
  readonly removeAutoLayout: "Remove auto layout";
  readonly alignLeft: "Align left";
  readonly alignCenterHorizontally: "Align center horizontally";
  readonly alignRight: "Align right";
  readonly alignTop: "Align top";
  readonly alignCenterVertically: "Align center vertically";
  readonly alignBottom: "Align bottom";
  readonly flipHorizontal: "Flip horizontal";
  readonly flipVertical: "Flip vertical";
  readonly rotate90: "Rotate 90°";
  readonly mixedFillsHelp: "Click + to replace mixed fills";
  readonly mixedStrokesHelp: "Click + to replace mixed strokes";
  readonly mixedEffectsHelp: "Click + to replace mixed effects";
  readonly strokeSides: "Stroke sides";
  readonly strokeDash: "Dashed stroke";
  readonly strokeCap: "Stroke cap";
  readonly strokeCapButt: "Butt cap";
  readonly strokeCapRound: "Round cap";
  readonly strokeCapSquare: "Square cap";
  readonly strokeJoin: "Stroke join";
  readonly strokeJoinMiter: "Miter join";
  readonly strokeJoinBevel: "Bevel join";
  readonly strokeJoinRound: "Round join";
  readonly strokeMiterLimit: "Miter limit";
  readonly strokeAlignInside: "Inside";
  readonly strokeAlignCenter: "Center";
  readonly strokeAlignOutside: "Outside";
  readonly exportScale: "Export scale";
  readonly exportFormat: "Export format";
  readonly exportPreview: "Preview";
  readonly exportRenderingPreview: "Rendering preview…";
  readonly create: "Create";
  readonly add: "Add";
  readonly createVariable: "Create variable";
  readonly createColorVariable: import("@nanostores/i18n").TranslationFunction<[{
    value: string | number;
  } & object], string>;
  readonly createNumberVariable: import("@nanostores/i18n").TranslationFunction<[{
    value: string | number;
  } & object], string>;
  readonly variableName: "Variable name";
  readonly mixed: "Mixed";
  readonly none: "None";
  readonly fillStyle: "Fill style";
  readonly strokeStyle: "Stroke style";
  readonly textStyle: "Text style";
  readonly effectStyle: "Effect style";
  readonly gridStyle: "Grid style";
  readonly missingStyle: import("@nanostores/i18n").TranslationFunction<[{
    id: string | number;
  } & object], string>;
  readonly layersCount: import("@nanostores/i18n").TranslationFunction<[{
    count: string | number;
  } & object], string>;
  readonly goToMainComponent: "Go to Main Component";
  readonly detachInstance: "Detach Instance";
  readonly gap: "Gap";
  readonly solid: "Solid";
  readonly linearGradient: "Linear";
  readonly radialGradient: "Radial";
  readonly image: "Image";
  readonly stops: "Stops";
  readonly addStop: "Add stop";
  readonly alignCenter: "Align center";
  readonly alignMiddle: "Align middle";
  readonly clipContent: "Clip content";
  readonly colorFormatRgb: "RGB";
  readonly colorFormatHsl: "HSL";
  readonly colorFormatHsb: "HSB";
  readonly colorFormatOkhcl: "OkHCL";
  readonly colorHintHsl: "H hue · S saturation · L lightness";
  readonly colorHintHsb: "H hue · S saturation · B brightness";
  readonly colorHintOkhcl: "H hue · C chroma · L lightness · A alpha";
  readonly colorPreviewClipped: import("@nanostores/i18n").TranslationFunction<[{
    space: string | number;
  } & object], string>;
  readonly rulers: "Rulers";
  readonly multiplayerCursors: "Multiplayer cursors";
  readonly direction: "Direction";
  readonly flow: "Flow";
  readonly freeform: "Freeform";
  readonly dimensions: "Dimensions";
  readonly layoutHorizontal: "Horizontal layout";
  readonly layoutVertical: "Vertical layout";
  readonly layoutGrid: "Grid layout";
  readonly layoutWrap: "Wrap layout";
  readonly gapAuto: "Auto gap";
  readonly horizontalGap: "Horizontal gap";
  readonly verticalGap: "Vertical gap";
  readonly auto: "Auto";
  readonly columns: "Columns";
  readonly rows: "Rows";
  readonly sizingFixed: "Fixed";
  readonly sizingHug: "Hug";
  readonly sizingFill: "Fill";
  readonly sizingHugShort: "Hug";
  readonly sizingFillShort: "Fill";
  readonly addMinWidth: "Add min width";
  readonly removeMinWidth: "Remove min width";
  readonly addMaxWidth: "Add max width";
  readonly removeMaxWidth: "Remove max width";
  readonly addMinHeight: "Add min height";
  readonly removeMinHeight: "Remove min height";
  readonly addMaxHeight: "Add max height";
  readonly removeMaxHeight: "Remove max height";
  readonly minWidthShort: "Min W";
  readonly maxWidthShort: "Max W";
  readonly minHeightShort: "Min H";
  readonly maxHeightShort: "Max H";
  readonly setToCurrentWidth: "Set to current width";
  readonly setToCurrentHeight: "Set to current height";
  readonly sizingFillFr: "Fill (fr)";
  readonly sizingFixedPx: "Fixed (px)";
  readonly resizing: "Resizing";
  readonly resizeAutoWidth: "Auto width";
  readonly resizeAutoHeight: "Auto height";
  readonly resizeFixed: "Fixed size";
  readonly layoutGrids: "Layout guide";
  readonly addLayoutGrid: "Add layout guide";
  readonly removeLayoutGrid: "Remove layout guide";
  readonly gridColumns: "Columns";
  readonly gridRows: "Rows";
  readonly gridGrid: "Grid";
  readonly gridCount: "Count";
  readonly gridGutter: "Gutter";
  readonly gridMargin: "Margin";
  readonly gridSectionSize: "Section size";
  readonly searchFonts: "Search fonts...";
}>;
//#endregion
//#region src/i18n/messages/variable-types.d.ts
declare const variableTypeMessages: import("@nanostores/i18n").Messages<{
  readonly color: "Color";
  readonly colorHint: "Paint values";
  readonly number: "Number";
  readonly numberHint: "Sizes, spacing, opacity";
  readonly text: "Text";
  readonly textHint: "Copy and labels";
  readonly boolean: "Boolean";
  readonly booleanHint: "True or false";
}>;
//#endregion
//#region src/i18n/messages/pages.d.ts
declare const pageMessages: import("@nanostores/i18n").Messages<{
  readonly newPage: "New page";
  readonly rename: "Rename";
  readonly delete: "Delete";
  readonly pageName: import("@nanostores/i18n").TranslationFunction<[{
    number: string | number;
  } & object], string>;
}>;
//#endregion
//#region src/i18n/messages/dialogs.d.ts
declare const dialogMessages: import("@nanostores/i18n").Messages<{
  readonly cancel: "Cancel";
  readonly apply: "Apply";
  readonly close: "Close";
  readonly rename: "Rename";
  readonly renameLayers: import("@nanostores/i18n").TranslationFunction<[{
    count: string | number;
  } & object], string>;
  readonly renamePreview: "Preview";
  readonly renameMatch: "Match";
  readonly renameTo: "Rename to";
  readonly renameCurrentName: "Current name";
  readonly renameNumberAscending: "Number ↑";
  readonly renameNumberDescending: "Number ↓";
  readonly renameStartAscendingFrom: "Start ascending from";
  readonly renameStopDescendingAt: "Stop descending at";
  readonly renameInvalidPattern: "Invalid regular expression";
  readonly ok: "OK";
  readonly copy: "Copy";
  readonly copied: "Copied";
  readonly copiedExclamation: "Copied!";
  readonly copyMessage: "Copy message";
  readonly createCollection: "Create collection";
  readonly renameCollection: "Rename collection";
  readonly deleteCollection: "Delete collection";
  readonly localVariables: "Local variables";
  readonly noVariableCollections: "No variable collections";
  readonly modes: "Modes";
  readonly addMode: "Add mode";
  readonly renameMode: "Rename mode";
  readonly duplicateMode: "Duplicate mode";
  readonly deleteMode: "Delete mode";
  readonly setDefaultMode: "Set as default";
  readonly selectLayerForJSX: "Select a layer to see its JSX code";
  readonly copyJSXReference: "Copy JSX prop reference to clipboard";
  readonly newTab: "New tab";
  readonly closeTab: import("@nanostores/i18n").TranslationFunction<[{
    name: string | number;
  } & object], string>;
  readonly showUI: import("@nanostores/i18n").TranslationFunction<[{
    shortcut: string | number;
  } & object], string>;
  readonly fontSettings: "Font settings";
  readonly fontSettingsDesktopDescription: "Access system fonts, online providers, fallback packs, and cached downloads.";
  readonly fontSettingsBrowserDescription: "Allow browser access to local fonts and manage online font providers.";
  readonly localFonts: "Local fonts";
  readonly onlineFonts: "Online fonts";
  readonly downloadedCache: "Downloaded cache";
  readonly lastUpdated: "Last updated";
  readonly enabled: "Enabled";
  readonly disabled: "Disabled";
  readonly denied: "Denied";
  readonly unavailable: "Unavailable";
  readonly notRequested: "Not requested";
  readonly never: "Never";
  readonly systemFontAccess: "System font access";
  readonly systemFontsAvailable: "System fonts are available.";
  readonly allowBrowserFontAccess: "Allow browser font access when system fonts are missing.";
  readonly allow: "Allow";
  readonly requesting: "Requesting…";
  readonly onlineFontProviders: "Online font providers";
  readonly downloadMissingWebFonts: "Download missing web fonts through enabled providers.";
  readonly webFontProvidersRequireDesktopApp: "Online font provider catalogs are unavailable in the web app. Download the desktop app to browse and load provider fonts.";
  readonly clipboardImageUnavailableWeb: "Pasted design includes 1 image that cannot be loaded in the web app. Use the desktop app to include it.";
  readonly clipboardImagesUnavailableWeb: import("@nanostores/i18n").TranslationFunction<[{
    count: string | number;
  } & object], string>;
  readonly clipboardImageFetchFailed: "Failed to fetch 1 image from Figma. Check that the source file is accessible and try again.";
  readonly clipboardImagesFetchFailed: import("@nanostores/i18n").TranslationFunction<[{
    count: string | number;
  } & object], string>;
  readonly enable: "Enable";
  readonly disable: "Disable";
  readonly fallbackPacks: "Fallback packs";
  readonly downloadFallbackPacksDescription: "Download CJK and Arabic fallbacks before opening files that need them.";
  readonly download: "Download";
  readonly downloading: "Downloading…";
  readonly refresh: "Refresh";
  readonly clearCache: "Clear cache";
  readonly localFontAccessEnabled: "Local font access enabled.";
  readonly localFontAccessNotGranted: "Local font access was not granted.";
  readonly onlineFontProvidersEnabled: "Online font providers enabled.";
  readonly onlineFontProvidersDisabled: "Online font providers disabled.";
  readonly fontProviderEnabled: import("@nanostores/i18n").TranslationFunction<[{
    provider: string | number;
  } & object], string>;
  readonly fontProviderDisabled: import("@nanostores/i18n").TranslationFunction<[{
    provider: string | number;
  } & object], string>;
  readonly fallbackFontsDownloaded: "Fallback fonts downloaded.";
  readonly fallbackFontsDownloadFailed: "Could not download fallback fonts.";
  readonly downloadedFontCacheCleared: "Downloaded font cache cleared.";
  readonly downloadedFontCacheClearFailed: "Could not clear downloaded font cache.";
  readonly you: "You";
  readonly youSuffix: "you";
  readonly followingPeerStop: import("@nanostores/i18n").TranslationFunction<[{
    name: string | number;
  } & object], string>;
  readonly clickToFollowPeer: import("@nanostores/i18n").TranslationFunction<[{
    name: string | number;
  } & object], string>;
  readonly connectAIProvider: "Connect an AI provider to start chatting.";
  readonly connect: "Connect";
  readonly testConnection: "Test connection";
  readonly testingConnection: "Testing…";
  readonly connectionTestSuccess: "Connected successfully. Model is reachable.";
  readonly connectionTestMissingAPIKey: "Enter an API key before testing.";
  readonly connectionTestMissingBaseURL: "Enter a base URL before testing.";
  readonly connectionTestMissingModel: "Enter a model ID before testing.";
  readonly connectionTestInvalidBaseURL: "Base URL is invalid. Use a full URL like https://api.example.com/v1.";
  readonly connectionTestAuthFailed: "Authentication failed. Check your API key.";
  readonly connectionTestModelNotFound: "Model not found. Check the model ID.";
  readonly connectionTestAPITypeMismatch: "This endpoint does not appear to support the selected API type. Try Completions or Responses.";
  readonly connectionTestBrowserNetworkFailed: "Could not reach this endpoint from the browser. Try the desktop app or use an endpoint with CORS enabled.";
  readonly connectionTestNetworkFailed: "Could not reach the endpoint. Check the URL and your network connection.";
  readonly connectionTestUnknownFailed: "Connection test failed. Check the provider settings and try again.";
  readonly getAPIKey: import("@nanostores/i18n").TranslationFunction<[{
    provider: string | number;
  } & object], string>;
  readonly oneKeyManyModels: "One key for 100+ models from all providers.";
  readonly describeChange: "Describe a change…";
  readonly describeCreateOrChange: "Describe what you want to create or change.";
  readonly stopGenerating: "Stop generating";
  readonly sendMessage: "Send message";
  readonly baseURLPlaceholder: "Base URL (e.g. http://localhost:11434/v1)";
  readonly modelIDPlaceholder: "Model ID (e.g. llama-3.3-70b)";
  readonly aiProvider: "AI Provider";
  readonly providerSettings: "Provider settings";
  readonly openProviderSettings: "Open provider settings";
  readonly settings: "Settings";
  readonly settingsDescription: "Manage integrations and app preferences.";
  readonly settingsAIAndAgents: "AI & agents";
  readonly models: "Models";
  readonly modelsDescription: "Configure reusable models and their provider connections.";
  readonly addModel: "Add model";
  readonly editModel: "Edit model";
  readonly modelEditorDescription: "Provider, model, credentials, and capabilities.";
  readonly modelName: "Name";
  readonly modelConfiguration: "Model";
  readonly connectionSettings: "Connection";
  readonly modelCapabilities: "Capabilities";
  readonly modelCapabilitiesDetected: "Detected from the selected model.";
  readonly modelCapabilitiesManual: "Declare compatibility for this custom model.";
  readonly modelCapabilityTools: "Tool calling";
  readonly modelCapabilityVision: "Image input";
  readonly modelCapabilityToolsShort: "Tools";
  readonly modelCapabilityVisionShort: "Vision";
  readonly selectDesignModel: "Select design model";
  readonly modelNeedsCredential: "Needs key";
  readonly modelAgentConnection: "Agent";
  readonly saveModel: "Save model";
  readonly deleteModel: "Delete model";
  readonly deleteModelDescription: "Delete this model and remove its role assignments?";
  readonly modelAssignments: "Assignments";
  readonly modelAssignmentsDescription: "Choose which configured model handles each type of work.";
  readonly modelRoleDesign: "Design agent";
  readonly modelRoleReview: "Review";
  readonly modelRoleFast: "Fast tasks";
  readonly modelRoleVision: "Vision";
  readonly modelRoleDesignDescription: "AI chat and canvas edits";
  readonly modelRoleReviewDescription: "Explicit plan and design reviews";
  readonly modelRoleFastDescription: "Low-cost background work";
  readonly modelRoleVisionDescription: "Screenshots and image references";
  readonly modelRoleUseDesign: "Same as Design";
  readonly noModel: "None";
  readonly back: "Back";
  readonly settingsMedia: "Media";
  readonly vectorization: "Image vectorization";
  readonly vectorizationDescription: "Send image layers to Recraft or fal.ai and return editable vectors. Provider charges may apply.";
  readonly vectorizeProvider: "Vectorization service";
  readonly settingsStorage: "Cloud storage";
  readonly storageWorkspace: "Storage workspace";
  readonly openStorageWorkspace: "Open workspace";
  readonly newStoredDocument: "New document";
  readonly emptyStorageWorkspace: "No stored documents yet.";
  readonly loadingDocuments: "Loading documents…";
  readonly storageNotConfigured: "Configure storage before using this workspace.";
  readonly copyStorageCors: "Copy CORS JSON";
  readonly storageEndpoint: "Endpoint";
  readonly storageBucket: "Bucket";
  readonly storageRegion: "Region";
  readonly storageAccessKeyID: "Access key ID";
  readonly storageSecretAccessKey: "Secret access key";
  readonly save: "Save";
  readonly credentialStorage: import("@nanostores/i18n").TranslationFunction<[{
    backend: string | number;
  } & object], string>;
  readonly credentialBackendNative: "system credential store";
  readonly credentialBackendBrowser: "encrypted browser storage";
  readonly credentialBackendMemory: "this session only";
  readonly rememberCredentials: "Remember credentials on this browser";
  readonly done: "Done";
  readonly apiKey: "API Key";
  readonly apiType: "API Type";
  readonly baseURL: "Base URL";
  readonly modelID: "Model ID";
  readonly customModelID: "Custom model ID";
  readonly customModel: "Custom model…";
  readonly advancedModelSettings: "Advanced settings";
  readonly outputLimit: "Output limit";
  readonly outputLimitAutomatic: "Automatic recommendation";
  readonly supported: "Supported";
  readonly unsupported: "Not supported";
  readonly tokens: "tokens";
  readonly maxOutputTokens: "Max output tokens";
  readonly clear: "Clear";
  readonly keySavedReplace: "Key saved — enter new to replace";
  readonly getAPIKeyGeneric: "Get API key →";
  readonly pexelsAPIKey: "Pexels API Key (stock photos)";
  readonly unsplashAccessKey: "Unsplash Access Key";
  readonly stockPhotoToolOptional: "Optional — for stock_photo tool";
  readonly pexelsAlternativeOptional: "Optional — alternative to Pexels";
  readonly getPexelsAPIKey: "Get free Pexels API key →";
  readonly getUnsplashAccessKey: "Get free Unsplash access key →";
  readonly completions: "Completions";
  readonly responses: "Responses";
  readonly yourName: "Your name";
  readonly enterYourName: "Enter your name";
  readonly shareThisFile: "Share this file";
  readonly joinRoom: "Join room";
  readonly join: "Join";
  readonly roomLink: "Room link";
  readonly joinCollaboration: "Join collaboration";
  readonly orJoinRoom: "or join a room";
  readonly pasteRoomLinkOrId: "Paste room link or ID";
  readonly connected: "Connected";
  readonly search: "Search…";
  readonly noResults: "No results";
  readonly share: "Share";
  readonly appUpToDate: "OpenPencil is up to date";
  readonly updateAvailableTitle: "Update OpenPencil";
  readonly updateAvailable: import("@nanostores/i18n").TranslationFunction<[{
    version: string | number;
  } & object], string>;
  readonly updateInstallPrompt: "Download and install it now? The app will restart after the update is installed.";
  readonly downloadingUpdate: import("@nanostores/i18n").TranslationFunction<[{
    version: string | number;
  } & object], string>;
  readonly updateInstalledTitle: "Update installed";
  readonly updateInstalled: import("@nanostores/i18n").TranslationFunction<[{
    version: string | number;
  } & {
    size: string | number;
  } & object], string>;
  readonly updateUnavailable: "Updates are not available yet. Publish a signed release with latest.json first.";
  readonly updateCheckFailed: import("@nanostores/i18n").TranslationFunction<[{
    error: string | number;
  } & object], string>;
}>;
//#endregion
//#region src/i18n/messages.d.ts
declare const messageDefaults: {
  readonly menu: {
    readonly file: "File";
    readonly edit: "Edit";
    readonly view: "View";
    readonly object: "Object";
    readonly arrange: "Arrange";
    readonly text: "Text";
    readonly new: "New";
    readonly open: "Open…";
    readonly openStorageWorkspace: "Open storage workspace…";
    readonly save: "Save";
    readonly saveAs: "Save as…";
    readonly exportSelection: "Export selection…";
    readonly autosave: "Auto-save to local file";
    readonly closeTab: "Close tab";
    readonly copy: "Copy";
    readonly paste: "Paste";
    readonly theme: "Theme";
    readonly themeLight: "Light";
    readonly themeDark: "Dark";
    readonly themeAuto: "Auto";
    readonly profiler: "Performance profiler";
    readonly language: "Language";
    readonly settings: "Settings…";
    readonly rulers: "Rulers";
    readonly multiplayerCursors: "Multiplayer cursors";
    readonly checkUpdates: "Check for updates…";
    readonly moveToPage: "Move to page";
    readonly createInstance: "Create instance";
    readonly hide: "Hide";
    readonly show: "Show";
    readonly lock: "Lock";
    readonly unlock: "Unlock";
    readonly cut: "Cut";
    readonly front: "Front";
    readonly back: "Back";
    readonly toggleUI: "Toggle UI";
    readonly bold: "Bold";
    readonly italic: "Italic";
    readonly underline: "Underline";
    readonly strikethrough: "Strikethrough";
    readonly pasteHere: "Paste here";
    readonly pasteToReplace: "Paste to replace";
    readonly renameSelection: "Rename selection…";
    readonly copyPasteAs: "Copy/Paste as";
    readonly copyAsText: "Copy as text";
    readonly copyAsSVG: "Copy as SVG";
    readonly copyAsPNG: "Copy as PNG";
    readonly copyAsJSX: "Copy as JSX";
    readonly copyNodeId: "Copy node ID";
    readonly copyXPath: "Copy XPath";
    readonly convertToVector: "Convert to vector";
    readonly booleanOperations: "Boolean operations";
    readonly arrangeAlignLeft: "Align left";
    readonly arrangeAlignCenter: "Align center";
    readonly arrangeAlignRight: "Align right";
    readonly arrangeAlignTop: "Align top";
    readonly arrangeAlignMiddle: "Align middle";
    readonly arrangeAlignBottom: "Align bottom";
    readonly zoomIn: "Zoom in";
    readonly zoomOut: "Zoom out";
  };
  readonly commands: {
    readonly undo: "Undo";
    readonly redo: "Redo";
    readonly selectAll: "Select all";
    readonly selectInverse: "Select inverse";
    readonly duplicate: "Duplicate";
    readonly delete: "Delete";
    readonly group: "Group";
    readonly groupSelection: "Group selection";
    readonly frameSelection: "Frame selection";
    readonly ungroup: "Ungroup";
    readonly createComponent: "Create component";
    readonly createComponentSet: "Create component set";
    readonly createInstance: "Create instance";
    readonly detachInstance: "Detach instance";
    readonly goToMainComponent: "Go to main component";
    readonly addAutoLayout: "Add auto layout";
    readonly useAsMask: "Use as mask";
    readonly removeMask: "Remove mask";
    readonly bringForward: "Bring forward";
    readonly bringToFront: "Bring to front";
    readonly sendBackward: "Send backward";
    readonly sendToBack: "Send to back";
    readonly showHide: "Show/Hide";
    readonly lockUnlock: "Lock/Unlock";
    readonly unionSelection: "Union selection";
    readonly subtractSelection: "Subtract selection";
    readonly intersectSelection: "Intersect selection";
    readonly excludeSelection: "Exclude selection";
    readonly flattenSelection: "Flatten";
    readonly outlineText: "Outline text";
    readonly outlineStroke: "Outline stroke";
    readonly booleanOperations: "Boolean operations";
    readonly flipHorizontal: "Flip horizontal";
    readonly flipVertical: "Flip vertical";
    readonly distributeHorizontal: "Distribute horizontal spacing";
    readonly distributeVertical: "Distribute vertical spacing";
    readonly moveToPage: "Move to page";
    readonly setOpacity: "Set opacity";
    readonly zoomTo100: "Zoom to 100%";
    readonly zoomToFit: "Zoom to fit";
    readonly zoomToSelection: "Zoom to selection";
  };
  readonly tools: {
    readonly move: "Move";
    readonly frame: "Frame";
    readonly section: "Section";
    readonly rectangle: "Rectangle";
    readonly ellipse: "Ellipse";
    readonly line: "Line";
    readonly polygon: "Polygon";
    readonly star: "Star";
    readonly pen: "Pen";
    readonly text: "Text";
    readonly hand: "Hand";
  };
  readonly panels: {
    readonly untitled: "Untitled";
    readonly nodeCopyString: " copy";
    readonly layers: "Layers";
    readonly pages: "Pages";
    readonly design: "Design";
    readonly code: "Code";
    readonly ai: "AI";
    readonly assets: "Assets";
    readonly searchLocalComponents: "Search local components";
    readonly assetView: "Asset view";
    readonly gridView: "Grid view";
    readonly listView: "List view";
    readonly viewDetails: "View details";
    readonly assetLibraryBadge: "Library";
    readonly assetVariantSummary: import("@nanostores/i18n").TranslationFunction<[{
      count: string | number;
    } & {
      names: string | number;
    } & object], string>;
    readonly duplicateVariantValues: "Duplicate variant values";
    readonly openDocumentation: "Open documentation";
    readonly noLocalComponents: "No local components";
    readonly componentSet: "Component set";
    readonly component: "Component";
    readonly insertInstance: "Insert instance";
    readonly description: "Description";
    readonly documentation: "Documentation";
    readonly openDocs: "Open docs";
    readonly properties: "Properties";
    readonly xAxis: "X Axis";
    readonly yAxis: "Y Axis";
    readonly rotation: "Rotation";
    readonly width: "Width";
    readonly height: "Height";
    readonly opacity: "Opacity";
    readonly blendMode: "Blend mode";
    readonly radius: "Radius";
    readonly cornerSmoothing: "Corner smoothing";
    readonly spread: "Spread";
    readonly page: "Page";
    readonly frame: "Frame";
    readonly framePreset: "Frame preset";
    readonly framePresetCustom: "Custom";
    readonly framePresetCategoryPhone: "Phone";
    readonly framePresetCategoryTablet: "Tablet";
    readonly framePresetCategoryDesktop: "Desktop";
    readonly framePresetCategoryPresentation: "Presentation";
    readonly framePresetCategoryWatch: "Watch";
    readonly framePresetCategoryPaper: "Paper";
    readonly framePresetCategorySocialMedia: "Social media";
    readonly framePresetCategoryFigmaCommunity: "Figma Community";
    readonly framePresetCategoryArchive: "Archive";
    readonly position: "Position";
    readonly layout: "Layout";
    readonly autoLayout: "Auto layout";
    readonly alignment: "Alignment";
    readonly appearance: "Appearance";
    readonly fill: "Fill";
    readonly stroke: "Stroke";
    readonly effects: "Effects";
    readonly mask: "Mask";
    readonly export: "Export";
    readonly typography: "Typography";
    readonly fontFamily: "Font family";
    readonly fontWeight: "Font weight";
    readonly fontSize: "Font size";
    readonly lineHeight: "Line height";
    readonly letterSpacing: "Letter spacing";
    readonly textAlignment: "Text alignment";
    readonly verticalTextAlignment: "Vertical text alignment";
    readonly textCase: "Text case";
    readonly textCaseOriginal: "Original";
    readonly textCaseUpper: "Uppercase";
    readonly textCaseLower: "Lowercase";
    readonly textCaseTitle: "Title case";
    readonly truncation: "Truncation";
    readonly truncationDisabled: "Disabled";
    readonly truncationEnding: "Ending ellipsis";
    readonly maxLines: "Maximum lines";
    readonly openTypeFeatures: "Font features";
    readonly standardLigatures: "Standard ligatures";
    readonly contextualAlternates: "Contextual alternates";
    readonly kerning: "Kerning";
    readonly textFormatting: "Text formatting";
    readonly pageBackground: "Page background";
    readonly variables: "Variables";
    readonly variants: "Variants";
    readonly componentProperties: "Component properties";
    readonly constraints: "Constraints";
    readonly horizontalConstraint: "Horizontal constraint";
    readonly verticalConstraint: "Vertical constraint";
    readonly constraintLeft: "Left";
    readonly constraintRight: "Right";
    readonly constraintTop: "Top";
    readonly constraintBottom: "Bottom";
    readonly constraintCenter: "Center";
    readonly constraintLeftAndRight: "Left and right";
    readonly constraintTopAndBottom: "Top and bottom";
    readonly constraintScale: "Scale";
    readonly constraintHorizontalCenter: "Horizontal center";
    readonly constraintVerticalCenter: "Vertical center";
    readonly addFill: "Add fill";
    readonly addStroke: "Add stroke";
    readonly addEffect: "Add effect";
    readonly addExport: "Add export";
    readonly removeFill: "Remove fill";
    readonly removeStroke: "Remove stroke";
    readonly removeEffect: "Remove effect";
    readonly removeExport: "Remove export";
    readonly effectSettings: "Effect settings";
    readonly expandEffectSettings: "Expand effect settings";
    readonly collapseEffectSettings: "Collapse effect settings";
    readonly toggleExportPreview: "Toggle export preview";
    readonly dropShadow: "Drop shadow";
    readonly innerShadow: "Inner shadow";
    readonly layerBlur: "Layer blur";
    readonly backgroundBlur: "Background blur";
    readonly foregroundBlur: "Foreground blur";
    readonly maskType: "Mask type";
    readonly maskTypeAlpha: "Alpha";
    readonly maskTypeVector: "Vector";
    readonly maskTypeLuminance: "Luminance";
    readonly blendModePassThrough: "Pass through";
    readonly blendModeNormal: "Normal";
    readonly blendModeDarken: "Darken";
    readonly blendModeMultiply: "Multiply";
    readonly blendModeColorBurn: "Color burn";
    readonly blendModeLighten: "Lighten";
    readonly blendModeScreen: "Screen";
    readonly blendModeColorDodge: "Color dodge";
    readonly blendModeOverlay: "Overlay";
    readonly blendModeSoftLight: "Soft light";
    readonly blendModeHardLight: "Hard light";
    readonly blendModeDifference: "Difference";
    readonly blendModeExclusion: "Exclusion";
    readonly blendModeHue: "Hue";
    readonly blendModeSaturation: "Saturation";
    readonly blendModeColor: "Color";
    readonly blendModeLuminosity: "Luminosity";
    readonly strokeType: "Stroke type";
    readonly strokeWeight: "Stroke weight";
    readonly noSelection: "No selection";
    readonly noLocalVariables: "No local variables";
    readonly openVariables: "Open variables";
    readonly addPage: "Add page";
    readonly toggleVisibility: "Toggle visibility";
    readonly independentCornerRadii: "Independent corner radii";
    readonly detachVariable: "Detach variable";
    readonly applyVariable: "Apply variable";
    readonly noVariablesFound: "No variables found";
    readonly addAutoLayout: "Add auto layout";
    readonly removeAutoLayout: "Remove auto layout";
    readonly alignLeft: "Align left";
    readonly alignCenterHorizontally: "Align center horizontally";
    readonly alignRight: "Align right";
    readonly alignTop: "Align top";
    readonly alignCenterVertically: "Align center vertically";
    readonly alignBottom: "Align bottom";
    readonly flipHorizontal: "Flip horizontal";
    readonly flipVertical: "Flip vertical";
    readonly rotate90: "Rotate 90°";
    readonly mixedFillsHelp: "Click + to replace mixed fills";
    readonly mixedStrokesHelp: "Click + to replace mixed strokes";
    readonly mixedEffectsHelp: "Click + to replace mixed effects";
    readonly strokeSides: "Stroke sides";
    readonly strokeDash: "Dashed stroke";
    readonly strokeCap: "Stroke cap";
    readonly strokeCapButt: "Butt cap";
    readonly strokeCapRound: "Round cap";
    readonly strokeCapSquare: "Square cap";
    readonly strokeJoin: "Stroke join";
    readonly strokeJoinMiter: "Miter join";
    readonly strokeJoinBevel: "Bevel join";
    readonly strokeJoinRound: "Round join";
    readonly strokeMiterLimit: "Miter limit";
    readonly strokeAlignInside: "Inside";
    readonly strokeAlignCenter: "Center";
    readonly strokeAlignOutside: "Outside";
    readonly exportScale: "Export scale";
    readonly exportFormat: "Export format";
    readonly exportPreview: "Preview";
    readonly exportRenderingPreview: "Rendering preview…";
    readonly create: "Create";
    readonly add: "Add";
    readonly createVariable: "Create variable";
    readonly createColorVariable: import("@nanostores/i18n").TranslationFunction<[{
      value: string | number;
    } & object], string>;
    readonly createNumberVariable: import("@nanostores/i18n").TranslationFunction<[{
      value: string | number;
    } & object], string>;
    readonly variableName: "Variable name";
    readonly mixed: "Mixed";
    readonly none: "None";
    readonly fillStyle: "Fill style";
    readonly strokeStyle: "Stroke style";
    readonly textStyle: "Text style";
    readonly effectStyle: "Effect style";
    readonly gridStyle: "Grid style";
    readonly missingStyle: import("@nanostores/i18n").TranslationFunction<[{
      id: string | number;
    } & object], string>;
    readonly layersCount: import("@nanostores/i18n").TranslationFunction<[{
      count: string | number;
    } & object], string>;
    readonly goToMainComponent: "Go to Main Component";
    readonly detachInstance: "Detach Instance";
    readonly gap: "Gap";
    readonly solid: "Solid";
    readonly linearGradient: "Linear";
    readonly radialGradient: "Radial";
    readonly image: "Image";
    readonly stops: "Stops";
    readonly addStop: "Add stop";
    readonly alignCenter: "Align center";
    readonly alignMiddle: "Align middle";
    readonly clipContent: "Clip content";
    readonly colorFormatRgb: "RGB";
    readonly colorFormatHsl: "HSL";
    readonly colorFormatHsb: "HSB";
    readonly colorFormatOkhcl: "OkHCL";
    readonly colorHintHsl: "H hue · S saturation · L lightness";
    readonly colorHintHsb: "H hue · S saturation · B brightness";
    readonly colorHintOkhcl: "H hue · C chroma · L lightness · A alpha";
    readonly colorPreviewClipped: import("@nanostores/i18n").TranslationFunction<[{
      space: string | number;
    } & object], string>;
    readonly rulers: "Rulers";
    readonly multiplayerCursors: "Multiplayer cursors";
    readonly direction: "Direction";
    readonly flow: "Flow";
    readonly freeform: "Freeform";
    readonly dimensions: "Dimensions";
    readonly layoutHorizontal: "Horizontal layout";
    readonly layoutVertical: "Vertical layout";
    readonly layoutGrid: "Grid layout";
    readonly layoutWrap: "Wrap layout";
    readonly gapAuto: "Auto gap";
    readonly horizontalGap: "Horizontal gap";
    readonly verticalGap: "Vertical gap";
    readonly auto: "Auto";
    readonly columns: "Columns";
    readonly rows: "Rows";
    readonly sizingFixed: "Fixed";
    readonly sizingHug: "Hug";
    readonly sizingFill: "Fill";
    readonly sizingHugShort: "Hug";
    readonly sizingFillShort: "Fill";
    readonly addMinWidth: "Add min width";
    readonly removeMinWidth: "Remove min width";
    readonly addMaxWidth: "Add max width";
    readonly removeMaxWidth: "Remove max width";
    readonly addMinHeight: "Add min height";
    readonly removeMinHeight: "Remove min height";
    readonly addMaxHeight: "Add max height";
    readonly removeMaxHeight: "Remove max height";
    readonly minWidthShort: "Min W";
    readonly maxWidthShort: "Max W";
    readonly minHeightShort: "Min H";
    readonly maxHeightShort: "Max H";
    readonly setToCurrentWidth: "Set to current width";
    readonly setToCurrentHeight: "Set to current height";
    readonly sizingFillFr: "Fill (fr)";
    readonly sizingFixedPx: "Fixed (px)";
    readonly resizing: "Resizing";
    readonly resizeAutoWidth: "Auto width";
    readonly resizeAutoHeight: "Auto height";
    readonly resizeFixed: "Fixed size";
    readonly layoutGrids: "Layout guide";
    readonly addLayoutGrid: "Add layout guide";
    readonly removeLayoutGrid: "Remove layout guide";
    readonly gridColumns: "Columns";
    readonly gridRows: "Rows";
    readonly gridGrid: "Grid";
    readonly gridCount: "Count";
    readonly gridGutter: "Gutter";
    readonly gridMargin: "Margin";
    readonly gridSectionSize: "Section size";
    readonly searchFonts: "Search fonts...";
  };
  readonly variableTypes: {
    readonly color: "Color";
    readonly colorHint: "Paint values";
    readonly number: "Number";
    readonly numberHint: "Sizes, spacing, opacity";
    readonly text: "Text";
    readonly textHint: "Copy and labels";
    readonly boolean: "Boolean";
    readonly booleanHint: "True or false";
  };
  readonly pages: {
    readonly newPage: "New page";
    readonly rename: "Rename";
    readonly delete: "Delete";
    readonly pageName: import("@nanostores/i18n").TranslationFunction<[{
      number: string | number;
    } & object], string>;
  };
  readonly dialogs: {
    readonly cancel: "Cancel";
    readonly apply: "Apply";
    readonly close: "Close";
    readonly rename: "Rename";
    readonly renameLayers: import("@nanostores/i18n").TranslationFunction<[{
      count: string | number;
    } & object], string>;
    readonly renamePreview: "Preview";
    readonly renameMatch: "Match";
    readonly renameTo: "Rename to";
    readonly renameCurrentName: "Current name";
    readonly renameNumberAscending: "Number ↑";
    readonly renameNumberDescending: "Number ↓";
    readonly renameStartAscendingFrom: "Start ascending from";
    readonly renameStopDescendingAt: "Stop descending at";
    readonly renameInvalidPattern: "Invalid regular expression";
    readonly ok: "OK";
    readonly copy: "Copy";
    readonly copied: "Copied";
    readonly copiedExclamation: "Copied!";
    readonly copyMessage: "Copy message";
    readonly createCollection: "Create collection";
    readonly renameCollection: "Rename collection";
    readonly deleteCollection: "Delete collection";
    readonly localVariables: "Local variables";
    readonly noVariableCollections: "No variable collections";
    readonly modes: "Modes";
    readonly addMode: "Add mode";
    readonly renameMode: "Rename mode";
    readonly duplicateMode: "Duplicate mode";
    readonly deleteMode: "Delete mode";
    readonly setDefaultMode: "Set as default";
    readonly selectLayerForJSX: "Select a layer to see its JSX code";
    readonly copyJSXReference: "Copy JSX prop reference to clipboard";
    readonly newTab: "New tab";
    readonly closeTab: import("@nanostores/i18n").TranslationFunction<[{
      name: string | number;
    } & object], string>;
    readonly showUI: import("@nanostores/i18n").TranslationFunction<[{
      shortcut: string | number;
    } & object], string>;
    readonly fontSettings: "Font settings";
    readonly fontSettingsDesktopDescription: "Access system fonts, online providers, fallback packs, and cached downloads.";
    readonly fontSettingsBrowserDescription: "Allow browser access to local fonts and manage online font providers.";
    readonly localFonts: "Local fonts";
    readonly onlineFonts: "Online fonts";
    readonly downloadedCache: "Downloaded cache";
    readonly lastUpdated: "Last updated";
    readonly enabled: "Enabled";
    readonly disabled: "Disabled";
    readonly denied: "Denied";
    readonly unavailable: "Unavailable";
    readonly notRequested: "Not requested";
    readonly never: "Never";
    readonly systemFontAccess: "System font access";
    readonly systemFontsAvailable: "System fonts are available.";
    readonly allowBrowserFontAccess: "Allow browser font access when system fonts are missing.";
    readonly allow: "Allow";
    readonly requesting: "Requesting…";
    readonly onlineFontProviders: "Online font providers";
    readonly downloadMissingWebFonts: "Download missing web fonts through enabled providers.";
    readonly webFontProvidersRequireDesktopApp: "Online font provider catalogs are unavailable in the web app. Download the desktop app to browse and load provider fonts.";
    readonly clipboardImageUnavailableWeb: "Pasted design includes 1 image that cannot be loaded in the web app. Use the desktop app to include it.";
    readonly clipboardImagesUnavailableWeb: import("@nanostores/i18n").TranslationFunction<[{
      count: string | number;
    } & object], string>;
    readonly clipboardImageFetchFailed: "Failed to fetch 1 image from Figma. Check that the source file is accessible and try again.";
    readonly clipboardImagesFetchFailed: import("@nanostores/i18n").TranslationFunction<[{
      count: string | number;
    } & object], string>;
    readonly enable: "Enable";
    readonly disable: "Disable";
    readonly fallbackPacks: "Fallback packs";
    readonly downloadFallbackPacksDescription: "Download CJK and Arabic fallbacks before opening files that need them.";
    readonly download: "Download";
    readonly downloading: "Downloading…";
    readonly refresh: "Refresh";
    readonly clearCache: "Clear cache";
    readonly localFontAccessEnabled: "Local font access enabled.";
    readonly localFontAccessNotGranted: "Local font access was not granted.";
    readonly onlineFontProvidersEnabled: "Online font providers enabled.";
    readonly onlineFontProvidersDisabled: "Online font providers disabled.";
    readonly fontProviderEnabled: import("@nanostores/i18n").TranslationFunction<[{
      provider: string | number;
    } & object], string>;
    readonly fontProviderDisabled: import("@nanostores/i18n").TranslationFunction<[{
      provider: string | number;
    } & object], string>;
    readonly fallbackFontsDownloaded: "Fallback fonts downloaded.";
    readonly fallbackFontsDownloadFailed: "Could not download fallback fonts.";
    readonly downloadedFontCacheCleared: "Downloaded font cache cleared.";
    readonly downloadedFontCacheClearFailed: "Could not clear downloaded font cache.";
    readonly you: "You";
    readonly youSuffix: "you";
    readonly followingPeerStop: import("@nanostores/i18n").TranslationFunction<[{
      name: string | number;
    } & object], string>;
    readonly clickToFollowPeer: import("@nanostores/i18n").TranslationFunction<[{
      name: string | number;
    } & object], string>;
    readonly connectAIProvider: "Connect an AI provider to start chatting.";
    readonly connect: "Connect";
    readonly testConnection: "Test connection";
    readonly testingConnection: "Testing…";
    readonly connectionTestSuccess: "Connected successfully. Model is reachable.";
    readonly connectionTestMissingAPIKey: "Enter an API key before testing.";
    readonly connectionTestMissingBaseURL: "Enter a base URL before testing.";
    readonly connectionTestMissingModel: "Enter a model ID before testing.";
    readonly connectionTestInvalidBaseURL: "Base URL is invalid. Use a full URL like https://api.example.com/v1.";
    readonly connectionTestAuthFailed: "Authentication failed. Check your API key.";
    readonly connectionTestModelNotFound: "Model not found. Check the model ID.";
    readonly connectionTestAPITypeMismatch: "This endpoint does not appear to support the selected API type. Try Completions or Responses.";
    readonly connectionTestBrowserNetworkFailed: "Could not reach this endpoint from the browser. Try the desktop app or use an endpoint with CORS enabled.";
    readonly connectionTestNetworkFailed: "Could not reach the endpoint. Check the URL and your network connection.";
    readonly connectionTestUnknownFailed: "Connection test failed. Check the provider settings and try again.";
    readonly getAPIKey: import("@nanostores/i18n").TranslationFunction<[{
      provider: string | number;
    } & object], string>;
    readonly oneKeyManyModels: "One key for 100+ models from all providers.";
    readonly describeChange: "Describe a change…";
    readonly describeCreateOrChange: "Describe what you want to create or change.";
    readonly stopGenerating: "Stop generating";
    readonly sendMessage: "Send message";
    readonly baseURLPlaceholder: "Base URL (e.g. http://localhost:11434/v1)";
    readonly modelIDPlaceholder: "Model ID (e.g. llama-3.3-70b)";
    readonly aiProvider: "AI Provider";
    readonly providerSettings: "Provider settings";
    readonly openProviderSettings: "Open provider settings";
    readonly settings: "Settings";
    readonly settingsDescription: "Manage integrations and app preferences.";
    readonly settingsAIAndAgents: "AI & agents";
    readonly models: "Models";
    readonly modelsDescription: "Configure reusable models and their provider connections.";
    readonly addModel: "Add model";
    readonly editModel: "Edit model";
    readonly modelEditorDescription: "Provider, model, credentials, and capabilities.";
    readonly modelName: "Name";
    readonly modelConfiguration: "Model";
    readonly connectionSettings: "Connection";
    readonly modelCapabilities: "Capabilities";
    readonly modelCapabilitiesDetected: "Detected from the selected model.";
    readonly modelCapabilitiesManual: "Declare compatibility for this custom model.";
    readonly modelCapabilityTools: "Tool calling";
    readonly modelCapabilityVision: "Image input";
    readonly modelCapabilityToolsShort: "Tools";
    readonly modelCapabilityVisionShort: "Vision";
    readonly selectDesignModel: "Select design model";
    readonly modelNeedsCredential: "Needs key";
    readonly modelAgentConnection: "Agent";
    readonly saveModel: "Save model";
    readonly deleteModel: "Delete model";
    readonly deleteModelDescription: "Delete this model and remove its role assignments?";
    readonly modelAssignments: "Assignments";
    readonly modelAssignmentsDescription: "Choose which configured model handles each type of work.";
    readonly modelRoleDesign: "Design agent";
    readonly modelRoleReview: "Review";
    readonly modelRoleFast: "Fast tasks";
    readonly modelRoleVision: "Vision";
    readonly modelRoleDesignDescription: "AI chat and canvas edits";
    readonly modelRoleReviewDescription: "Explicit plan and design reviews";
    readonly modelRoleFastDescription: "Low-cost background work";
    readonly modelRoleVisionDescription: "Screenshots and image references";
    readonly modelRoleUseDesign: "Same as Design";
    readonly noModel: "None";
    readonly back: "Back";
    readonly settingsMedia: "Media";
    readonly vectorization: "Image vectorization";
    readonly vectorizationDescription: "Send image layers to Recraft or fal.ai and return editable vectors. Provider charges may apply.";
    readonly vectorizeProvider: "Vectorization service";
    readonly settingsStorage: "Cloud storage";
    readonly storageWorkspace: "Storage workspace";
    readonly openStorageWorkspace: "Open workspace";
    readonly newStoredDocument: "New document";
    readonly emptyStorageWorkspace: "No stored documents yet.";
    readonly loadingDocuments: "Loading documents…";
    readonly storageNotConfigured: "Configure storage before using this workspace.";
    readonly copyStorageCors: "Copy CORS JSON";
    readonly storageEndpoint: "Endpoint";
    readonly storageBucket: "Bucket";
    readonly storageRegion: "Region";
    readonly storageAccessKeyID: "Access key ID";
    readonly storageSecretAccessKey: "Secret access key";
    readonly save: "Save";
    readonly credentialStorage: import("@nanostores/i18n").TranslationFunction<[{
      backend: string | number;
    } & object], string>;
    readonly credentialBackendNative: "system credential store";
    readonly credentialBackendBrowser: "encrypted browser storage";
    readonly credentialBackendMemory: "this session only";
    readonly rememberCredentials: "Remember credentials on this browser";
    readonly done: "Done";
    readonly apiKey: "API Key";
    readonly apiType: "API Type";
    readonly baseURL: "Base URL";
    readonly modelID: "Model ID";
    readonly customModelID: "Custom model ID";
    readonly customModel: "Custom model…";
    readonly advancedModelSettings: "Advanced settings";
    readonly outputLimit: "Output limit";
    readonly outputLimitAutomatic: "Automatic recommendation";
    readonly supported: "Supported";
    readonly unsupported: "Not supported";
    readonly tokens: "tokens";
    readonly maxOutputTokens: "Max output tokens";
    readonly clear: "Clear";
    readonly keySavedReplace: "Key saved — enter new to replace";
    readonly getAPIKeyGeneric: "Get API key →";
    readonly pexelsAPIKey: "Pexels API Key (stock photos)";
    readonly unsplashAccessKey: "Unsplash Access Key";
    readonly stockPhotoToolOptional: "Optional — for stock_photo tool";
    readonly pexelsAlternativeOptional: "Optional — alternative to Pexels";
    readonly getPexelsAPIKey: "Get free Pexels API key →";
    readonly getUnsplashAccessKey: "Get free Unsplash access key →";
    readonly completions: "Completions";
    readonly responses: "Responses";
    readonly yourName: "Your name";
    readonly enterYourName: "Enter your name";
    readonly shareThisFile: "Share this file";
    readonly joinRoom: "Join room";
    readonly join: "Join";
    readonly roomLink: "Room link";
    readonly joinCollaboration: "Join collaboration";
    readonly orJoinRoom: "or join a room";
    readonly pasteRoomLinkOrId: "Paste room link or ID";
    readonly connected: "Connected";
    readonly search: "Search…";
    readonly noResults: "No results";
    readonly share: "Share";
    readonly appUpToDate: "OpenPencil is up to date";
    readonly updateAvailableTitle: "Update OpenPencil";
    readonly updateAvailable: import("@nanostores/i18n").TranslationFunction<[{
      version: string | number;
    } & object], string>;
    readonly updateInstallPrompt: "Download and install it now? The app will restart after the update is installed.";
    readonly downloadingUpdate: import("@nanostores/i18n").TranslationFunction<[{
      version: string | number;
    } & object], string>;
    readonly updateInstalledTitle: "Update installed";
    readonly updateInstalled: import("@nanostores/i18n").TranslationFunction<[{
      version: string | number;
    } & {
      size: string | number;
    } & object], string>;
    readonly updateUnavailable: "Updates are not available yet. Publish a signed release with latest.json first.";
    readonly updateCheckFailed: import("@nanostores/i18n").TranslationFunction<[{
      error: string | number;
    } & object], string>;
  };
};
//#endregion
//#region src/controls/layout/helpers.d.ts
type AlignCell = {
  primary: LayoutAlign;
  counter: LayoutCounterAlign;
};
type LayoutAxis = 'width' | 'height';
type SizeLimitProp = 'minWidth' | 'maxWidth' | 'minHeight' | 'maxHeight';
declare function trackLabel(track: GridTrack): string;
//#endregion
//#region src/controls/layout/use.d.ts
/**
 * Returns layout-related state and actions for the current selection.
 *
 * Use this composable to build auto-layout and grid panels that need sizing,
 * padding, alignment, and track editing behavior.
 */
declare function useLayout(): {
  editor: {
    wrapInAutoLayout: () => void;
    groupSelected: () => string | null;
    frameSelection: () => string | null;
    booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
    flattenSelected: () => string | null;
    outlineTextSelected: () => string | null;
    outlineStrokeSelected: () => string | null;
    ungroupSelected: () => void;
    createComponentFromSelection: () => void;
    createComponentSetFromComponents: () => void;
    createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
    detachInstance: () => void;
    focusComponent: (componentId: string) => Promise<void>;
    goToMainComponent: () => Promise<void>;
    getComponentSetPropertyDefs: (componentSetId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    addPropertyDefinition: (componentSetId: string, name: string, type?: import("@open-pencil/scene-graph").ComponentPropertyType, defaultValue?: string) => string | undefined;
    removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
    renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
    collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
    findVariantByValues: (componentSetId: string, values: Record<string, string>) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getDefaultVariantForComponentSet: (componentSetId: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
    switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
    getInstanceComponentPropertyDefinitions: (instanceId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    getInstanceComponentPropertyValue: (instanceId: string, definition: import("@open-pencil/scene-graph").ComponentPropertyDefinition) => string;
    setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
    duplicateSelected: () => void;
    writeCopyData: (data: DataTransfer) => Promise<void>;
    pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
      replaceSelection?: boolean;
    }) => Promise<void>;
    deleteSelected: () => void;
    storeImage: (bytes: Uint8Array) => string;
    placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
    copySelectionAsText: (ids: string[]) => string;
    copySelectionAsSVG: (ids: string[]) => string | null;
    copySelectionAsJSX: (ids: string[]) => string | null;
    setDocumentColorSpace: (colorSpace: import("@open-pencil/scene-graph").DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
    commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
    commitMoveWithReparent: (originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>) => void;
    commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
    commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<import("@open-pencil/scene-graph").SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
    commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    }>) => void;
    commitRotation: (nodeId: string, origRotation: number) => void;
    commitNodeUpdate: (nodeId: string, previous: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    undoAction: () => void;
    redoAction: () => void;
    snapshotPage: () => PageSnapshot;
    restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
    pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
    screenToCanvas: (sx: number, sy: number) => {
      x: number;
      y: number;
    };
    setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
    applyZoom: (delta: number, centerX: number, centerY: number) => void;
    pan: (dx: number, dy: number) => void;
    zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
    zoomToFit: () => void;
    zoomTo100: () => void;
    zoomToLevel: (level: number) => void;
    zoomToSelection: () => void;
    startTextEditing: (nodeId: string) => void;
    commitTextEdit: () => void;
    getVariablesByType: (type: import("@open-pencil/scene-graph").VariableType) => import("@open-pencil/scene-graph").Variable[];
    getVariable: (id: string) => import("@open-pencil/scene-graph").Variable | undefined;
    resolveColorVariable: (id: string) => import("@open-pencil/scene-graph").Color | undefined;
    resolveNumberVariable: (id: string) => number | undefined;
    getVariablesForCollection: (collectionId: string) => import("@open-pencil/scene-graph").Variable[];
    getCollection: (id: string) => import("@open-pencil/scene-graph").VariableCollection | undefined;
    getCollections: () => import("@open-pencil/scene-graph").VariableCollection[];
    getCollectionCount: () => number;
    getVariableCount: () => number;
    renameCollection: (id: string, newName: string) => void;
    addCollection: (collection: import("@open-pencil/scene-graph").VariableCollection) => void;
    removeCollection: (id: string) => void;
    addVariable: (variable: import("@open-pencil/scene-graph").Variable) => void;
    removeVariable: (id: string) => void;
    renameVariable: (id: string, newName: string) => void;
    updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
    addMode: (collectionId: string, name?: string) => string | undefined;
    removeMode: (collectionId: string, modeId: string) => void;
    renameMode: (collectionId: string, modeId: string, newName: string) => void;
    setDefaultMode: (collectionId: string, modeId: string) => void;
    duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
    setActiveMode: (collectionId: string, modeId: string) => void;
    replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
    alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
    canDistributeNodes: (nodeIds: string[]) => boolean;
    distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    rotateNodes: (nodeIds: string[], degrees: number) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    flushNudge: () => void;
    bindVariable: (nodeId: string, path: string, variableId: string) => void;
    unbindVariable: (nodeId: string, path: string) => void;
    setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
    updateNode: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>) => void;
    updateNodeWithUndo: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    setOpacity: (opacity: number, coalesceKey?: string) => void;
    moveToPage: (pageId: string) => void;
    previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
    renameSelected: (options: RenameSelectionOptions) => void;
    renameNode: (id: string, name: string) => void;
    toggleNodeVisibility: (id: string) => void;
    toggleNodeLock: (id: string) => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    reparentNodes: (nodeIds: string[], newParentId: string) => void;
    wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: import("@open-pencil/scene-graph").SceneNode[], extraProps?: Partial<import("@open-pencil/scene-graph").SceneNode>) => string | null;
    reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
    reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    isTopLevel: (parentId: string | null) => boolean;
    adoptNodesIntoSection: (sectionId: string) => void;
    setTool: (tool: Tool$2) => void;
    createFrameFromPreset: (preset: FramePresetDimensions) => string;
    resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
    penAddVertex: (x: number, y: number) => void;
    penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
    penSetClosingToFirst: (closing: boolean) => void;
    penSetPendingClose: (closing: boolean) => void;
    penSetKnotPosition: (x: number, y: number) => void;
    penCommit: (closed: boolean) => void;
    penCancel: () => void;
    createShape: (type: import("@open-pencil/scene-graph").NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
    switchPage: (pageId: string) => Promise<void>;
    addPage: (name?: string) => string;
    deletePage: (pageId: string) => void;
    movePage: (pageId: string, index: number) => void;
    renamePage: (pageId: string, name: string) => void;
    setPageColor: (color: import("@open-pencil/scene-graph").Color) => void;
    clearPageViewports: () => void;
    hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => import("@open-pencil/scene-graph").SceneNode | null;
    selectAtPoint: (cx: number, cy: number) => void;
    getSelectedNodes: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    }[];
    getSelectedNode: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    } | undefined;
    getLayerTree: () => {
      node: import("@open-pencil/scene-graph").SceneNode;
      depth: number;
    }[];
    validateEnteredContainer: () => void;
    enterContainer: (id: string) => void;
    exitContainer: () => void;
    setMarquee: (rect: import("@open-pencil/scene-graph/primitives").Rect | null) => void;
    setSnapGuides: (guides: import("@open-pencil/scene-graph").SnapGuide[]) => void;
    setRotationPreview: (preview: {
      nodeId: string;
      angle: number;
    } | null) => void;
    setHoveredNode: (id: string | null) => void;
    setDropTarget: (id: string | null) => void;
    setLayoutInsertIndicator: (indicator: {
      parentId: string;
      index: number;
      x: number;
      y: number;
      length: number;
      direction: "HORIZONTAL" | "VERTICAL";
    } | null) => void;
    setAutoLayoutHover: (hover: {
      nodeId: string;
      kind: "frame" | "children" | "spacing" | "spacing-value" | "padding" | "padding-value";
      index?: number;
      side?: "top" | "right" | "bottom" | "left";
    } | null) => void;
    select: (ids: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    selectInverse: () => void;
    requestRender: () => void;
    requestRepaint: () => void;
    onEditorEvent: <K extends EditorEventName$2>(event: K, handler: EditorEvents$2[K]) => import("nanoevents").Unsubscribe;
    setCanvasKit: (ck: import("canvaskit-wasm").CanvasKit, renderer: SkiaRenderer) => void;
    removeCanvasRenderer: (renderer: SkiaRenderer) => void;
    replaceGraph: (newGraph: import("@open-pencil/scene-graph").SceneGraph) => void;
    subscribeToGraph: () => void;
    getNode: (id: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
    getChildren: (id: string) => import("@open-pencil/scene-graph").SceneNode[];
    getPages: (includeInternal?: boolean) => import("@open-pencil/scene-graph").SceneNode[];
    graph: import("@open-pencil/scene-graph").SceneGraph;
    renderer: SkiaRenderer | null;
    canvasRenderers: SkiaRenderer[];
    textEditor: TextEditor | null;
    undo: import("@open-pencil/scene-graph").UndoManager;
    state: EditorState$1;
  };
  node: import("vue").ComputedRef<import("@open-pencil/scene-graph").SceneNode | null>;
  layoutDirection: import("vue").ComputedRef<import("@open-pencil/scene-graph").LayoutDirection>;
  gapAuto: import("vue").ComputedRef<boolean>;
  isInAutoLayout: import("vue").ComputedRef<boolean>;
  isGrid: import("vue").ComputedRef<boolean>;
  isFlex: import("vue").ComputedRef<boolean>;
  widthSizing: import("vue").ComputedRef<import("@open-pencil/scene-graph").LayoutSizing>;
  heightSizing: import("vue").ComputedRef<import("@open-pencil/scene-graph").LayoutSizing>;
  widthSizingOptions: import("vue").ComputedRef<{
    value: import("@open-pencil/scene-graph").LayoutSizing;
    label: string;
  }[]>;
  heightSizingOptions: import("vue").ComputedRef<{
    value: import("@open-pencil/scene-graph").LayoutSizing;
    label: string;
  }[]>;
  alignGrid: import("vue").ComputedRef<AlignCell[]>;
  showIndividualPadding: import("vue").Ref<boolean, boolean>;
  hasUniformPadding: import("vue").ComputedRef<boolean>;
  hasSymmetricPadding: import("vue").ComputedRef<boolean>;
  trackSizingOptions: ({
    value: "FR";
    label: "Fill (fr)";
  } | {
    value: "FIXED";
    label: "Fixed (px)";
  } | {
    value: "AUTO";
    label: "Auto";
  })[];
  updateProp: (key: string, value: number | string) => void;
  updateSizeLimit: (prop: SizeLimitProp, value: number) => void;
  setSizeLimitToCurrent: (prop: SizeLimitProp) => void;
  commitSizeLimit: (prop: SizeLimitProp, _value: number, previous: number) => void;
  addSizeLimit: (prop: SizeLimitProp) => void;
  removeSizeLimit: (prop: SizeLimitProp) => void;
  commitProp: (key: string, _value: number | string, previous: number | string) => void;
  setAxisSizing: (axis: LayoutAxis, sizing: import("@open-pencil/scene-graph").LayoutSizing) => void;
  updateAxisSize: (axis: LayoutAxis, value: number) => void;
  commitAxisSize: (axis: LayoutAxis, _value: number, previous: number) => void;
  setHorizontalPadding: (v: number) => void;
  commitHorizontalPadding: (_value: number, previous: number) => void;
  setVerticalPadding: (v: number) => void;
  commitVerticalPadding: (_value: number, previous: number) => void;
  setAlignment: (primary: import("@open-pencil/scene-graph").LayoutAlign, counter: import("@open-pencil/scene-graph").LayoutCounterAlign) => void;
  setGapAuto: (enabled: boolean) => void;
  setLayoutDirection: (direction: import("@open-pencil/scene-graph").SceneNode["layoutDirection"]) => void;
  updateGridTrack: (prop: "gridTemplateColumns" | "gridTemplateRows", index: number, updates: Partial<import("@open-pencil/scene-graph").GridTrack>) => void;
  addTrack: (prop: "gridTemplateColumns" | "gridTemplateRows") => void;
  removeTrack: (prop: "gridTemplateColumns" | "gridTemplateRows", index: number) => void;
  trackLabel: typeof trackLabel;
  toggleIndividualPadding: () => void;
};
//#endregion
//#region src/controls/appearance/types.d.ts
type CornerRadiusKey = 'topLeftRadius' | 'topRightRadius' | 'bottomRightRadius' | 'bottomLeftRadius';
type CornerGeometryKey = CornerRadiusKey | 'cornerSmoothing';
//#endregion
//#region src/controls/appearance/use.d.ts
/**
 * Returns appearance-related state and actions for the current selection.
 *
 * Use this composable for visibility, opacity, and corner-radius controls in
 * property panels.
 */
declare function useAppearance(): {
  setBlendMode: (value: import("@open-pencil/scene-graph").BlendMode) => void;
  toggleVisibility: () => void;
  toggleIndependentCorners: () => void;
  updateCornerProp: (key: CornerGeometryKey, value: number) => void;
  commitCornerProp: (key: CornerGeometryKey, _value: number, previous: number) => void;
  updateProp: (key: string, value: number | string) => void;
  commitProp: (key: string, _value: number | string, previous: number | string) => void;
  hasCornerRadius: import("vue").ComputedRef<boolean>;
  independentCorners: import("vue").ComputedRef<MixedValue<boolean>>;
  showIndependentCorners: import("vue").ComputedRef<boolean>;
  cornerRadiusValue: import("vue").ComputedRef<MixedValue<number>>;
  cornerSmoothingPercent: import("vue").ComputedRef<number | typeof MIXED>;
  opacityPercent: import("vue").ComputedRef<number | typeof MIXED>;
  blendModeValue: import("vue").ComputedRef<import("@open-pencil/scene-graph").BlendMode | typeof MIXED>;
  visibilityState: import("vue").ComputedRef<"visible" | "mixed" | "hidden">;
  editor: {
    wrapInAutoLayout: () => void;
    groupSelected: () => string | null;
    frameSelection: () => string | null;
    booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
    flattenSelected: () => string | null;
    outlineTextSelected: () => string | null;
    outlineStrokeSelected: () => string | null;
    ungroupSelected: () => void;
    createComponentFromSelection: () => void;
    createComponentSetFromComponents: () => void;
    createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
    detachInstance: () => void;
    focusComponent: (componentId: string) => Promise<void>;
    goToMainComponent: () => Promise<void>;
    getComponentSetPropertyDefs: (componentSetId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    addPropertyDefinition: (componentSetId: string, name: string, type?: import("@open-pencil/scene-graph").ComponentPropertyType, defaultValue?: string) => string | undefined;
    removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
    renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
    collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
    findVariantByValues: (componentSetId: string, values: Record<string, string>) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getDefaultVariantForComponentSet: (componentSetId: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
    switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
    getInstanceComponentPropertyDefinitions: (instanceId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    getInstanceComponentPropertyValue: (instanceId: string, definition: import("@open-pencil/scene-graph").ComponentPropertyDefinition) => string;
    setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
    duplicateSelected: () => void;
    writeCopyData: (data: DataTransfer) => Promise<void>;
    pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
      replaceSelection?: boolean;
    }) => Promise<void>;
    deleteSelected: () => void;
    storeImage: (bytes: Uint8Array) => string;
    placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
    copySelectionAsText: (ids: string[]) => string;
    copySelectionAsSVG: (ids: string[]) => string | null;
    copySelectionAsJSX: (ids: string[]) => string | null;
    setDocumentColorSpace: (colorSpace: import("@open-pencil/scene-graph").DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
    commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
    commitMoveWithReparent: (originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>) => void;
    commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
    commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<import("@open-pencil/scene-graph").SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
    commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    }>) => void;
    commitRotation: (nodeId: string, origRotation: number) => void;
    commitNodeUpdate: (nodeId: string, previous: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    undoAction: () => void;
    redoAction: () => void;
    snapshotPage: () => PageSnapshot;
    restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
    pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
    screenToCanvas: (sx: number, sy: number) => {
      x: number;
      y: number;
    };
    setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
    applyZoom: (delta: number, centerX: number, centerY: number) => void;
    pan: (dx: number, dy: number) => void;
    zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
    zoomToFit: () => void;
    zoomTo100: () => void;
    zoomToLevel: (level: number) => void;
    zoomToSelection: () => void;
    startTextEditing: (nodeId: string) => void;
    commitTextEdit: () => void;
    getVariablesByType: (type: import("@open-pencil/scene-graph").VariableType) => import("@open-pencil/scene-graph").Variable[];
    getVariable: (id: string) => import("@open-pencil/scene-graph").Variable | undefined;
    resolveColorVariable: (id: string) => import("@open-pencil/scene-graph").Color | undefined;
    resolveNumberVariable: (id: string) => number | undefined;
    getVariablesForCollection: (collectionId: string) => import("@open-pencil/scene-graph").Variable[];
    getCollection: (id: string) => import("@open-pencil/scene-graph").VariableCollection | undefined;
    getCollections: () => import("@open-pencil/scene-graph").VariableCollection[];
    getCollectionCount: () => number;
    getVariableCount: () => number;
    renameCollection: (id: string, newName: string) => void;
    addCollection: (collection: import("@open-pencil/scene-graph").VariableCollection) => void;
    removeCollection: (id: string) => void;
    addVariable: (variable: import("@open-pencil/scene-graph").Variable) => void;
    removeVariable: (id: string) => void;
    renameVariable: (id: string, newName: string) => void;
    updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
    addMode: (collectionId: string, name?: string) => string | undefined;
    removeMode: (collectionId: string, modeId: string) => void;
    renameMode: (collectionId: string, modeId: string, newName: string) => void;
    setDefaultMode: (collectionId: string, modeId: string) => void;
    duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
    setActiveMode: (collectionId: string, modeId: string) => void;
    replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
    alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
    canDistributeNodes: (nodeIds: string[]) => boolean;
    distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    rotateNodes: (nodeIds: string[], degrees: number) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    flushNudge: () => void;
    bindVariable: (nodeId: string, path: string, variableId: string) => void;
    unbindVariable: (nodeId: string, path: string) => void;
    setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
    updateNode: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>) => void;
    updateNodeWithUndo: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    setOpacity: (opacity: number, coalesceKey?: string) => void;
    moveToPage: (pageId: string) => void;
    previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
    renameSelected: (options: RenameSelectionOptions) => void;
    renameNode: (id: string, name: string) => void;
    toggleNodeVisibility: (id: string) => void;
    toggleNodeLock: (id: string) => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    reparentNodes: (nodeIds: string[], newParentId: string) => void;
    wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: import("@open-pencil/scene-graph").SceneNode[], extraProps?: Partial<import("@open-pencil/scene-graph").SceneNode>) => string | null;
    reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
    reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    isTopLevel: (parentId: string | null) => boolean;
    adoptNodesIntoSection: (sectionId: string) => void;
    setTool: (tool: Tool$2) => void;
    createFrameFromPreset: (preset: FramePresetDimensions) => string;
    resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
    penAddVertex: (x: number, y: number) => void;
    penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
    penSetClosingToFirst: (closing: boolean) => void;
    penSetPendingClose: (closing: boolean) => void;
    penSetKnotPosition: (x: number, y: number) => void;
    penCommit: (closed: boolean) => void;
    penCancel: () => void;
    createShape: (type: import("@open-pencil/scene-graph").NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
    switchPage: (pageId: string) => Promise<void>;
    addPage: (name?: string) => string;
    deletePage: (pageId: string) => void;
    movePage: (pageId: string, index: number) => void;
    renamePage: (pageId: string, name: string) => void;
    setPageColor: (color: import("@open-pencil/scene-graph").Color) => void;
    clearPageViewports: () => void;
    hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => import("@open-pencil/scene-graph").SceneNode | null;
    selectAtPoint: (cx: number, cy: number) => void;
    getSelectedNodes: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    }[];
    getSelectedNode: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    } | undefined;
    getLayerTree: () => {
      node: import("@open-pencil/scene-graph").SceneNode;
      depth: number;
    }[];
    validateEnteredContainer: () => void;
    enterContainer: (id: string) => void;
    exitContainer: () => void;
    setMarquee: (rect: import("@open-pencil/scene-graph/primitives").Rect | null) => void;
    setSnapGuides: (guides: import("@open-pencil/scene-graph").SnapGuide[]) => void;
    setRotationPreview: (preview: {
      nodeId: string;
      angle: number;
    } | null) => void;
    setHoveredNode: (id: string | null) => void;
    setDropTarget: (id: string | null) => void;
    setLayoutInsertIndicator: (indicator: {
      parentId: string;
      index: number;
      x: number;
      y: number;
      length: number;
      direction: "HORIZONTAL" | "VERTICAL";
    } | null) => void;
    setAutoLayoutHover: (hover: {
      nodeId: string;
      kind: "frame" | "children" | "spacing" | "spacing-value" | "padding" | "padding-value";
      index?: number;
      side?: "top" | "right" | "bottom" | "left";
    } | null) => void;
    select: (ids: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    selectInverse: () => void;
    requestRender: () => void;
    requestRepaint: () => void;
    onEditorEvent: <K extends EditorEventName$2>(event: K, handler: EditorEvents$2[K]) => import("nanoevents").Unsubscribe;
    setCanvasKit: (ck: import("canvaskit-wasm").CanvasKit, renderer: SkiaRenderer) => void;
    removeCanvasRenderer: (renderer: SkiaRenderer) => void;
    replaceGraph: (newGraph: import("@open-pencil/scene-graph").SceneGraph) => void;
    subscribeToGraph: () => void;
    getNode: (id: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
    getChildren: (id: string) => import("@open-pencil/scene-graph").SceneNode[];
    getPages: (includeInternal?: boolean) => import("@open-pencil/scene-graph").SceneNode[];
    graph: import("@open-pencil/scene-graph").SceneGraph;
    renderer: SkiaRenderer | null;
    canvasRenderers: SkiaRenderer[];
    textEditor: TextEditor | null;
    undo: import("@open-pencil/scene-graph").UndoManager;
    state: EditorState$1;
  };
  nodes: import("vue").ComputedRef<{
    id: string;
    type: import("@open-pencil/scene-graph").NodeType;
    name: string;
    parentId: string | null;
    childIds: string[];
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    source: import("@open-pencil/scene-graph").SourceMetadata;
    figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
    fills: import("@open-pencil/scene-graph").Fill[];
    strokes: import("@open-pencil/scene-graph").Stroke[];
    effects: import("@open-pencil/scene-graph").Effect[];
    layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
    fillStyleId: string | null;
    strokeStyleId: string | null;
    textStyleId: string | null;
    effectStyleId: string | null;
    gridStyleId: string | null;
    sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
    blendMode: import("@open-pencil/scene-graph").BlendMode;
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: number;
    italic: boolean;
    textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
    textDirection: import("@open-pencil/scene-graph").TextDirection;
    textLanguage: string | null;
    textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
    textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
    textCase: import("@open-pencil/scene-graph").TextCase;
    textDecoration: import("@open-pencil/scene-graph").TextDecoration;
    textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
    textDecorationThickness: number | null;
    textDecorationFills: import("@open-pencil/scene-graph").Fill[];
    textDecorationSkipInk: boolean;
    textUnderlineOffset: number | null;
    leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
    lineHeight: number | null;
    letterSpacing: number;
    maxLines: number | null;
    styleRuns: import("@open-pencil/scene-graph").StyleRun[];
    fontVariations: import("@open-pencil/scene-graph").FontVariation[];
    fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
    horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
    verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
    layoutMode: import("@open-pencil/scene-graph").LayoutMode;
    layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
    layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
    primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
    counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
    primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
    counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
    itemSpacing: number;
    counterAxisSpacing: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    layoutPositioning: "AUTO" | "ABSOLUTE";
    layoutGrow: number;
    layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
    vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
    handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
    booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
    fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    arcData: import("@open-pencil/scene-graph").ArcData | null;
    strokeCap: import("@open-pencil/scene-graph").StrokeCap;
    strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
    maskType: import("@open-pencil/scene-graph").MaskType;
    maskIsOutline: boolean;
    gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
    gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
    gridColumnGap: number;
    gridRowGap: number;
    gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
    counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
    itemReverseZIndex: boolean;
    strokesIncludedInLayout: boolean;
    expanded: boolean;
    textTruncation: "DISABLED" | "ENDING";
    autoRename: boolean;
    pointCount: number;
    starInnerRadius: number;
    componentId: string | null;
    overrides: Record<string, unknown>;
    componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
    symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
    variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
    boundVariables: Record<string, string>;
    variableModes: import("@open-pencil/scene-graph").VariableModeMap;
    exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
    pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
    pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
    internalOnly: boolean;
    flipX: boolean;
    flipY: boolean;
    textPicture: Uint8Array | null;
    figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
  }[]>;
  node: import("vue").ComputedRef<{
    id: string;
    type: import("@open-pencil/scene-graph").NodeType;
    name: string;
    parentId: string | null;
    childIds: string[];
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    source: import("@open-pencil/scene-graph").SourceMetadata;
    figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
    fills: import("@open-pencil/scene-graph").Fill[];
    strokes: import("@open-pencil/scene-graph").Stroke[];
    effects: import("@open-pencil/scene-graph").Effect[];
    layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
    fillStyleId: string | null;
    strokeStyleId: string | null;
    textStyleId: string | null;
    effectStyleId: string | null;
    gridStyleId: string | null;
    sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
    blendMode: import("@open-pencil/scene-graph").BlendMode;
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: number;
    italic: boolean;
    textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
    textDirection: import("@open-pencil/scene-graph").TextDirection;
    textLanguage: string | null;
    textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
    textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
    textCase: import("@open-pencil/scene-graph").TextCase;
    textDecoration: import("@open-pencil/scene-graph").TextDecoration;
    textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
    textDecorationThickness: number | null;
    textDecorationFills: import("@open-pencil/scene-graph").Fill[];
    textDecorationSkipInk: boolean;
    textUnderlineOffset: number | null;
    leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
    lineHeight: number | null;
    letterSpacing: number;
    maxLines: number | null;
    styleRuns: import("@open-pencil/scene-graph").StyleRun[];
    fontVariations: import("@open-pencil/scene-graph").FontVariation[];
    fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
    horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
    verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
    layoutMode: import("@open-pencil/scene-graph").LayoutMode;
    layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
    layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
    primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
    counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
    primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
    counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
    itemSpacing: number;
    counterAxisSpacing: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    layoutPositioning: "AUTO" | "ABSOLUTE";
    layoutGrow: number;
    layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
    vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
    handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
    booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
    fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    arcData: import("@open-pencil/scene-graph").ArcData | null;
    strokeCap: import("@open-pencil/scene-graph").StrokeCap;
    strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
    maskType: import("@open-pencil/scene-graph").MaskType;
    maskIsOutline: boolean;
    gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
    gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
    gridColumnGap: number;
    gridRowGap: number;
    gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
    counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
    itemReverseZIndex: boolean;
    strokesIncludedInLayout: boolean;
    expanded: boolean;
    textTruncation: "DISABLED" | "ENDING";
    autoRename: boolean;
    pointCount: number;
    starInnerRadius: number;
    componentId: string | null;
    overrides: Record<string, unknown>;
    componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
    symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
    variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
    boundVariables: Record<string, string>;
    variableModes: import("@open-pencil/scene-graph").VariableModeMap;
    exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
    pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
    pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
    internalOnly: boolean;
    flipX: boolean;
    flipY: boolean;
    textPicture: Uint8Array | null;
    figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
  } | null>;
  active: import("vue").ComputedRef<boolean>;
  isMulti: import("vue").ComputedRef<boolean>;
};
//#endregion
//#region src/controls/mask/use.d.ts
/** Headless state and actions for the selected mask node. */
declare function useMask(): {
  active: import("vue").ComputedRef<boolean>;
  maskType: import("vue").ComputedRef<MaskType>;
  setMaskType: (value: MaskType) => void;
};
//#endregion
//#region src/controls/typography/use.d.ts
/**
 * Options for {@link useTypography}.
 */
interface TypographyFontLoader {
  load: (family: string, style: string) => Promise<unknown>;
}
interface UseTypographyOptions {
  /**
   * Optional font loader invoked before changing family or weight.
   */
  fontLoader?: TypographyFontLoader;
}
/**
 * Returns typography-related state and actions for the current text selection.
 *
 * This composable is designed for text property panels and formatting controls.
 */
declare function useTypography(options?: UseTypographyOptions): {
  setFamily: (family: string) => Promise<void>;
  setWeight: (weight: number) => Promise<void>;
  setAlign: (align: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED") => void;
  setDirection: (direction: import("@open-pencil/scene-graph").TextDirection) => void;
  setVerticalAlign: (align: import("@open-pencil/scene-graph").TextAlignVertical) => void;
  setTextCase: (textCase: import("@open-pencil/scene-graph").TextCase) => void;
  setTruncation: (textTruncation: "DISABLED" | "ENDING") => void;
  setFontFeature: (tag: string, enabled: boolean) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleDecoration: (deco: "UNDERLINE" | "STRIKETHROUGH") => void;
  onFormattingChange: (values: string[]) => void;
  updateProp: (key: keyof import("@open-pencil/scene-graph").SceneNode, value: number | string | null) => void;
  commitProp: (key: keyof import("@open-pencil/scene-graph").SceneNode, _value: number | string | null, previous: number | string | null) => void;
  weights: {
    value: number;
    label: string;
  }[];
  node: import("vue").ComputedRef<import("@open-pencil/scene-graph").SceneNode | null>;
  fontFamily: import("vue").ComputedRef<string>;
  fontWeight: import("vue").ComputedRef<number>;
  fontSize: import("vue").ComputedRef<number>;
  currentWeightLabel: import("vue").ComputedRef<string>;
  activeFormatting: import("vue").ComputedRef<string[]>;
  missingFonts: import("vue").ComputedRef<string[]>;
  hasMissingFonts: import("vue").ComputedRef<boolean>;
  editor: {
    wrapInAutoLayout: () => void;
    groupSelected: () => string | null;
    frameSelection: () => string | null;
    booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
    flattenSelected: () => string | null;
    outlineTextSelected: () => string | null;
    outlineStrokeSelected: () => string | null;
    ungroupSelected: () => void;
    createComponentFromSelection: () => void;
    createComponentSetFromComponents: () => void;
    createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
    detachInstance: () => void;
    focusComponent: (componentId: string) => Promise<void>;
    goToMainComponent: () => Promise<void>;
    getComponentSetPropertyDefs: (componentSetId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    addPropertyDefinition: (componentSetId: string, name: string, type?: import("@open-pencil/scene-graph").ComponentPropertyType, defaultValue?: string) => string | undefined;
    removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
    renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
    collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
    findVariantByValues: (componentSetId: string, values: Record<string, string>) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getDefaultVariantForComponentSet: (componentSetId: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
    switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
    getInstanceComponentPropertyDefinitions: (instanceId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    getInstanceComponentPropertyValue: (instanceId: string, definition: import("@open-pencil/scene-graph").ComponentPropertyDefinition) => string;
    setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
    duplicateSelected: () => void;
    writeCopyData: (data: DataTransfer) => Promise<void>;
    pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
      replaceSelection?: boolean;
    }) => Promise<void>;
    deleteSelected: () => void;
    storeImage: (bytes: Uint8Array) => string;
    placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
    copySelectionAsText: (ids: string[]) => string;
    copySelectionAsSVG: (ids: string[]) => string | null;
    copySelectionAsJSX: (ids: string[]) => string | null;
    setDocumentColorSpace: (colorSpace: import("@open-pencil/scene-graph").DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
    commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
    commitMoveWithReparent: (originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>) => void;
    commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
    commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<import("@open-pencil/scene-graph").SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
    commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    }>) => void;
    commitRotation: (nodeId: string, origRotation: number) => void;
    commitNodeUpdate: (nodeId: string, previous: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    undoAction: () => void;
    redoAction: () => void;
    snapshotPage: () => PageSnapshot;
    restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
    pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
    screenToCanvas: (sx: number, sy: number) => {
      x: number;
      y: number;
    };
    setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
    applyZoom: (delta: number, centerX: number, centerY: number) => void;
    pan: (dx: number, dy: number) => void;
    zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
    zoomToFit: () => void;
    zoomTo100: () => void;
    zoomToLevel: (level: number) => void;
    zoomToSelection: () => void;
    startTextEditing: (nodeId: string) => void;
    commitTextEdit: () => void;
    getVariablesByType: (type: import("@open-pencil/scene-graph").VariableType) => import("@open-pencil/scene-graph").Variable[];
    getVariable: (id: string) => import("@open-pencil/scene-graph").Variable | undefined;
    resolveColorVariable: (id: string) => import("@open-pencil/scene-graph").Color | undefined;
    resolveNumberVariable: (id: string) => number | undefined;
    getVariablesForCollection: (collectionId: string) => import("@open-pencil/scene-graph").Variable[];
    getCollection: (id: string) => import("@open-pencil/scene-graph").VariableCollection | undefined;
    getCollections: () => import("@open-pencil/scene-graph").VariableCollection[];
    getCollectionCount: () => number;
    getVariableCount: () => number;
    renameCollection: (id: string, newName: string) => void;
    addCollection: (collection: import("@open-pencil/scene-graph").VariableCollection) => void;
    removeCollection: (id: string) => void;
    addVariable: (variable: import("@open-pencil/scene-graph").Variable) => void;
    removeVariable: (id: string) => void;
    renameVariable: (id: string, newName: string) => void;
    updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
    addMode: (collectionId: string, name?: string) => string | undefined;
    removeMode: (collectionId: string, modeId: string) => void;
    renameMode: (collectionId: string, modeId: string, newName: string) => void;
    setDefaultMode: (collectionId: string, modeId: string) => void;
    duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
    setActiveMode: (collectionId: string, modeId: string) => void;
    replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
    alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
    canDistributeNodes: (nodeIds: string[]) => boolean;
    distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    rotateNodes: (nodeIds: string[], degrees: number) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    flushNudge: () => void;
    bindVariable: (nodeId: string, path: string, variableId: string) => void;
    unbindVariable: (nodeId: string, path: string) => void;
    setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
    updateNode: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>) => void;
    updateNodeWithUndo: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    setOpacity: (opacity: number, coalesceKey?: string) => void;
    moveToPage: (pageId: string) => void;
    previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
    renameSelected: (options: RenameSelectionOptions) => void;
    renameNode: (id: string, name: string) => void;
    toggleNodeVisibility: (id: string) => void;
    toggleNodeLock: (id: string) => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    reparentNodes: (nodeIds: string[], newParentId: string) => void;
    wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: import("@open-pencil/scene-graph").SceneNode[], extraProps?: Partial<import("@open-pencil/scene-graph").SceneNode>) => string | null;
    reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
    reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    isTopLevel: (parentId: string | null) => boolean;
    adoptNodesIntoSection: (sectionId: string) => void;
    setTool: (tool: Tool$2) => void;
    createFrameFromPreset: (preset: FramePresetDimensions) => string;
    resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
    penAddVertex: (x: number, y: number) => void;
    penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
    penSetClosingToFirst: (closing: boolean) => void;
    penSetPendingClose: (closing: boolean) => void;
    penSetKnotPosition: (x: number, y: number) => void;
    penCommit: (closed: boolean) => void;
    penCancel: () => void;
    createShape: (type: import("@open-pencil/scene-graph").NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
    switchPage: (pageId: string) => Promise<void>;
    addPage: (name?: string) => string;
    deletePage: (pageId: string) => void;
    movePage: (pageId: string, index: number) => void;
    renamePage: (pageId: string, name: string) => void;
    setPageColor: (color: import("@open-pencil/scene-graph").Color) => void;
    clearPageViewports: () => void;
    hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => import("@open-pencil/scene-graph").SceneNode | null;
    selectAtPoint: (cx: number, cy: number) => void;
    getSelectedNodes: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    }[];
    getSelectedNode: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    } | undefined;
    getLayerTree: () => {
      node: import("@open-pencil/scene-graph").SceneNode;
      depth: number;
    }[];
    validateEnteredContainer: () => void;
    enterContainer: (id: string) => void;
    exitContainer: () => void;
    setMarquee: (rect: import("@open-pencil/scene-graph/primitives").Rect | null) => void;
    setSnapGuides: (guides: import("@open-pencil/scene-graph").SnapGuide[]) => void;
    setRotationPreview: (preview: {
      nodeId: string;
      angle: number;
    } | null) => void;
    setHoveredNode: (id: string | null) => void;
    setDropTarget: (id: string | null) => void;
    setLayoutInsertIndicator: (indicator: {
      parentId: string;
      index: number;
      x: number;
      y: number;
      length: number;
      direction: "HORIZONTAL" | "VERTICAL";
    } | null) => void;
    setAutoLayoutHover: (hover: {
      nodeId: string;
      kind: "frame" | "children" | "spacing" | "spacing-value" | "padding" | "padding-value";
      index?: number;
      side?: "top" | "right" | "bottom" | "left";
    } | null) => void;
    select: (ids: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    selectInverse: () => void;
    requestRender: () => void;
    requestRepaint: () => void;
    onEditorEvent: <K extends EditorEventName$2>(event: K, handler: EditorEvents$2[K]) => import("nanoevents").Unsubscribe;
    setCanvasKit: (ck: import("canvaskit-wasm").CanvasKit, renderer: SkiaRenderer) => void;
    removeCanvasRenderer: (renderer: SkiaRenderer) => void;
    replaceGraph: (newGraph: import("@open-pencil/scene-graph").SceneGraph) => void;
    subscribeToGraph: () => void;
    getNode: (id: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
    getChildren: (id: string) => import("@open-pencil/scene-graph").SceneNode[];
    getPages: (includeInternal?: boolean) => import("@open-pencil/scene-graph").SceneNode[];
    graph: import("@open-pencil/scene-graph").SceneGraph;
    renderer: SkiaRenderer | null;
    canvasRenderers: SkiaRenderer[];
    textEditor: TextEditor | null;
    undo: import("@open-pencil/scene-graph").UndoManager;
    state: EditorState$1;
  };
};
//#endregion
//#region src/document/workspace/use.d.ts
type DocumentWorkspaceItem = {
  id: string;
  name: string;
  updatedAt: string;
};
interface DocumentWorkspaceSource<Item extends DocumentWorkspaceItem> {
  refresh(): Promise<Item[] | null>;
  loadPreview(id: string): Promise<Uint8Array | null>;
  subscribe?(listener: () => void): () => void;
}
type UseDocumentWorkspaceOptions<Item extends DocumentWorkspaceItem> = {
  source: DocumentWorkspaceSource<Item>;
  refreshInterval?: number;
  refreshOnFocus?: boolean;
  refreshOnReconnect?: boolean;
  previewConcurrency?: number;
  previewMimeType?: string;
  onPreviewError?: (id: string, error: unknown) => void;
};
declare function useDocumentWorkspace<Item extends DocumentWorkspaceItem>(options: UseDocumentWorkspaceOptions<Item>): {
  documents: Readonly<Ref<readonly Item[]>>;
  loading: Readonly<Ref<boolean, boolean>>;
  error: Readonly<Ref<Readonly<unknown>, Readonly<unknown>>>;
  lastRefreshedAt: Readonly<Ref<Date | null, Date | null>>;
  previewUrls: Readonly<Ref<{
    readonly [x: string]: string;
  }, {
    readonly [x: string]: string;
  }>>;
  previewErrors: Readonly<Ref<{
    readonly [x: string]: Readonly<unknown>;
  }, {
    readonly [x: string]: Readonly<unknown>;
  }>>;
  hasDocuments: import("vue").ComputedRef<boolean>;
  refresh: () => Promise<void>;
  invalidate: () => Promise<void>;
  clearPreviews: () => void;
  loadPreview: (id: string) => void;
  previewDirective: import("vue").ObjectDirective<Element, string, string, any>;
  previewURL: (id: string) => string;
};
//#endregion
//#region src/document/export/helpers.d.ts
type ExportPanelTarget = 'selection' | 'page';
declare function formatSupportsScale(format: ExportFormatId$1): boolean;
//#endregion
//#region src/document/export/use.d.ts
declare function useExport(): {
  addSetting: () => void;
  removeSetting: (index: number) => void;
  updateScale: (index: number, scale: number) => void;
  updateFormat: (index: number, format: import("@open-pencil/scene-graph").ExportFormatId) => void;
  addSelectionSetting: () => void;
  addPageSetting: () => void;
  removeSelectionSetting: (index: number) => void;
  removePageSetting: (index: number) => void;
  updateSelectionScale: (index: number, scale: number) => void;
  updatePageScale: (index: number, scale: number) => void;
  updateSelectionFormat: (index: number, format: import("@open-pencil/scene-graph").ExportFormatId) => void;
  updatePageFormat: (index: number, format: import("@open-pencil/scene-graph").ExportFormatId) => void;
  hasSelection: import("vue").ComputedRef<boolean>;
  activeTarget: import("vue").ComputedRef<ExportPanelTarget>;
  targetIds: import("vue").ComputedRef<string[]>;
  selectedNodeName: import("vue").ComputedRef<string | null>;
  currentPageName: import("vue").ComputedRef<string>;
  activeName: import("vue").ComputedRef<string>;
  activeSettings: import("vue").ComputedRef<import("@open-pencil/scene-graph").ExportSetting[]>;
  mixed: import("vue").ComputedRef<boolean>;
  editor: {
    wrapInAutoLayout: () => void;
    groupSelected: () => string | null;
    frameSelection: () => string | null;
    booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
    flattenSelected: () => string | null;
    outlineTextSelected: () => string | null;
    outlineStrokeSelected: () => string | null;
    ungroupSelected: () => void;
    createComponentFromSelection: () => void;
    createComponentSetFromComponents: () => void;
    createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
    detachInstance: () => void;
    focusComponent: (componentId: string) => Promise<void>;
    goToMainComponent: () => Promise<void>;
    getComponentSetPropertyDefs: (componentSetId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    addPropertyDefinition: (componentSetId: string, name: string, type?: import("@open-pencil/scene-graph").ComponentPropertyType, defaultValue?: string) => string | undefined;
    removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
    renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
    collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
    findVariantByValues: (componentSetId: string, values: Record<string, string>) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getDefaultVariantForComponentSet: (componentSetId: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
    switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
    getInstanceComponentPropertyDefinitions: (instanceId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    getInstanceComponentPropertyValue: (instanceId: string, definition: import("@open-pencil/scene-graph").ComponentPropertyDefinition) => string;
    setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
    duplicateSelected: () => void;
    writeCopyData: (data: DataTransfer) => Promise<void>;
    pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
      replaceSelection?: boolean;
    }) => Promise<void>;
    deleteSelected: () => void;
    storeImage: (bytes: Uint8Array) => string;
    placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
    copySelectionAsText: (ids: string[]) => string;
    copySelectionAsSVG: (ids: string[]) => string | null;
    copySelectionAsJSX: (ids: string[]) => string | null;
    setDocumentColorSpace: (colorSpace: import("@open-pencil/scene-graph").DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
    commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
    commitMoveWithReparent: (originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>) => void;
    commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
    commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<import("@open-pencil/scene-graph").SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
    commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    }>) => void;
    commitRotation: (nodeId: string, origRotation: number) => void;
    commitNodeUpdate: (nodeId: string, previous: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    undoAction: () => void;
    redoAction: () => void;
    snapshotPage: () => PageSnapshot;
    restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
    pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
    screenToCanvas: (sx: number, sy: number) => {
      x: number;
      y: number;
    };
    setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
    applyZoom: (delta: number, centerX: number, centerY: number) => void;
    pan: (dx: number, dy: number) => void;
    zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
    zoomToFit: () => void;
    zoomTo100: () => void;
    zoomToLevel: (level: number) => void;
    zoomToSelection: () => void;
    startTextEditing: (nodeId: string) => void;
    commitTextEdit: () => void;
    getVariablesByType: (type: import("@open-pencil/scene-graph").VariableType) => import("@open-pencil/scene-graph").Variable[];
    getVariable: (id: string) => import("@open-pencil/scene-graph").Variable | undefined;
    resolveColorVariable: (id: string) => import("@open-pencil/scene-graph").Color | undefined;
    resolveNumberVariable: (id: string) => number | undefined;
    getVariablesForCollection: (collectionId: string) => import("@open-pencil/scene-graph").Variable[];
    getCollection: (id: string) => import("@open-pencil/scene-graph").VariableCollection | undefined;
    getCollections: () => import("@open-pencil/scene-graph").VariableCollection[];
    getCollectionCount: () => number;
    getVariableCount: () => number;
    renameCollection: (id: string, newName: string) => void;
    addCollection: (collection: import("@open-pencil/scene-graph").VariableCollection) => void;
    removeCollection: (id: string) => void;
    addVariable: (variable: import("@open-pencil/scene-graph").Variable) => void;
    removeVariable: (id: string) => void;
    renameVariable: (id: string, newName: string) => void;
    updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
    addMode: (collectionId: string, name?: string) => string | undefined;
    removeMode: (collectionId: string, modeId: string) => void;
    renameMode: (collectionId: string, modeId: string, newName: string) => void;
    setDefaultMode: (collectionId: string, modeId: string) => void;
    duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
    setActiveMode: (collectionId: string, modeId: string) => void;
    replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
    alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
    canDistributeNodes: (nodeIds: string[]) => boolean;
    distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    rotateNodes: (nodeIds: string[], degrees: number) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    flushNudge: () => void;
    bindVariable: (nodeId: string, path: string, variableId: string) => void;
    unbindVariable: (nodeId: string, path: string) => void;
    setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
    updateNode: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>) => void;
    updateNodeWithUndo: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    setOpacity: (opacity: number, coalesceKey?: string) => void;
    moveToPage: (pageId: string) => void;
    previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
    renameSelected: (options: RenameSelectionOptions) => void;
    renameNode: (id: string, name: string) => void;
    toggleNodeVisibility: (id: string) => void;
    toggleNodeLock: (id: string) => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    reparentNodes: (nodeIds: string[], newParentId: string) => void;
    wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: import("@open-pencil/scene-graph").SceneNode[], extraProps?: Partial<import("@open-pencil/scene-graph").SceneNode>) => string | null;
    reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
    reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    isTopLevel: (parentId: string | null) => boolean;
    adoptNodesIntoSection: (sectionId: string) => void;
    setTool: (tool: Tool$2) => void;
    createFrameFromPreset: (preset: FramePresetDimensions) => string;
    resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
    penAddVertex: (x: number, y: number) => void;
    penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
    penSetClosingToFirst: (closing: boolean) => void;
    penSetPendingClose: (closing: boolean) => void;
    penSetKnotPosition: (x: number, y: number) => void;
    penCommit: (closed: boolean) => void;
    penCancel: () => void;
    createShape: (type: import("@open-pencil/scene-graph").NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
    switchPage: (pageId: string) => Promise<void>;
    addPage: (name?: string) => string;
    deletePage: (pageId: string) => void;
    movePage: (pageId: string, index: number) => void;
    renamePage: (pageId: string, name: string) => void;
    setPageColor: (color: import("@open-pencil/scene-graph").Color) => void;
    clearPageViewports: () => void;
    hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => import("@open-pencil/scene-graph").SceneNode | null;
    selectAtPoint: (cx: number, cy: number) => void;
    getSelectedNodes: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    }[];
    getSelectedNode: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    } | undefined;
    getLayerTree: () => {
      node: import("@open-pencil/scene-graph").SceneNode;
      depth: number;
    }[];
    validateEnteredContainer: () => void;
    enterContainer: (id: string) => void;
    exitContainer: () => void;
    setMarquee: (rect: import("@open-pencil/scene-graph/primitives").Rect | null) => void;
    setSnapGuides: (guides: import("@open-pencil/scene-graph").SnapGuide[]) => void;
    setRotationPreview: (preview: {
      nodeId: string;
      angle: number;
    } | null) => void;
    setHoveredNode: (id: string | null) => void;
    setDropTarget: (id: string | null) => void;
    setLayoutInsertIndicator: (indicator: {
      parentId: string;
      index: number;
      x: number;
      y: number;
      length: number;
      direction: "HORIZONTAL" | "VERTICAL";
    } | null) => void;
    setAutoLayoutHover: (hover: {
      nodeId: string;
      kind: "frame" | "children" | "spacing" | "spacing-value" | "padding" | "padding-value";
      index?: number;
      side?: "top" | "right" | "bottom" | "left";
    } | null) => void;
    select: (ids: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    selectInverse: () => void;
    requestRender: () => void;
    requestRepaint: () => void;
    onEditorEvent: <K extends EditorEventName$2>(event: K, handler: EditorEvents$2[K]) => import("nanoevents").Unsubscribe;
    setCanvasKit: (ck: import("canvaskit-wasm").CanvasKit, renderer: SkiaRenderer) => void;
    removeCanvasRenderer: (renderer: SkiaRenderer) => void;
    replaceGraph: (newGraph: import("@open-pencil/scene-graph").SceneGraph) => void;
    subscribeToGraph: () => void;
    getNode: (id: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
    getChildren: (id: string) => import("@open-pencil/scene-graph").SceneNode[];
    getPages: (includeInternal?: boolean) => import("@open-pencil/scene-graph").SceneNode[];
    graph: import("@open-pencil/scene-graph").SceneGraph;
    renderer: SkiaRenderer | null;
    canvasRenderers: SkiaRenderer[];
    textEditor: TextEditor | null;
    undo: import("@open-pencil/scene-graph").UndoManager;
    state: EditorState$1;
  };
  selectedIds: import("vue").ComputedRef<string[]>;
  scales: readonly [0.5, 0.75, 1, 1.5, 2, 3, 4];
  maxScale: number;
  minScale: number;
  clampExportScale: typeof clampExportScale;
  formats: import("@open-pencil/scene-graph").ExportFormatId[];
  formatSupportsScale: typeof formatSupportsScale;
};
//#endregion
//#region src/controls/fill/use.d.ts
/**
 * Returns fill-related panel helpers and a reusable default fill value.
 *
 * This composable extends variable-binding behavior with SDK-level defaults for
 * fill editing UIs.
 */
declare function useFillControls(): {
  defaultFill: import("@open-pencil/scene-graph").Fill;
  colorVariables: import("vue").ComputedRef<import("@open-pencil/scene-graph").Variable[]>;
  bindVariable: (nodeId: string, index: number, variableId: string) => void;
  unbindVariable: (nodeId: string, index: number) => void;
  createAndBindVariable: (nodeId: string, index: number, color: import("@open-pencil/scene-graph").Color, name?: string) => void;
  store: {
    wrapInAutoLayout: () => void;
    groupSelected: () => string | null;
    frameSelection: () => string | null;
    booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
    flattenSelected: () => string | null;
    outlineTextSelected: () => string | null;
    outlineStrokeSelected: () => string | null;
    ungroupSelected: () => void;
    createComponentFromSelection: () => void;
    createComponentSetFromComponents: () => void;
    createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
    detachInstance: () => void;
    focusComponent: (componentId: string) => Promise<void>;
    goToMainComponent: () => Promise<void>;
    getComponentSetPropertyDefs: (componentSetId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    addPropertyDefinition: (componentSetId: string, name: string, type?: import("@open-pencil/scene-graph").ComponentPropertyType, defaultValue?: string) => string | undefined;
    removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
    renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
    collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
    findVariantByValues: (componentSetId: string, values: Record<string, string>) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getDefaultVariantForComponentSet: (componentSetId: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
    switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
    getInstanceComponentPropertyDefinitions: (instanceId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    getInstanceComponentPropertyValue: (instanceId: string, definition: import("@open-pencil/scene-graph").ComponentPropertyDefinition) => string;
    setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
    duplicateSelected: () => void;
    writeCopyData: (data: DataTransfer) => Promise<void>;
    pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
      replaceSelection?: boolean;
    }) => Promise<void>;
    deleteSelected: () => void;
    storeImage: (bytes: Uint8Array) => string;
    placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
    copySelectionAsText: (ids: string[]) => string;
    copySelectionAsSVG: (ids: string[]) => string | null;
    copySelectionAsJSX: (ids: string[]) => string | null;
    setDocumentColorSpace: (colorSpace: import("@open-pencil/scene-graph").DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
    commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
    commitMoveWithReparent: (originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>) => void;
    commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
    commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<import("@open-pencil/scene-graph").SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
    commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    }>) => void;
    commitRotation: (nodeId: string, origRotation: number) => void;
    commitNodeUpdate: (nodeId: string, previous: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    undoAction: () => void;
    redoAction: () => void;
    snapshotPage: () => PageSnapshot;
    restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
    pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
    screenToCanvas: (sx: number, sy: number) => {
      x: number;
      y: number;
    };
    setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
    applyZoom: (delta: number, centerX: number, centerY: number) => void;
    pan: (dx: number, dy: number) => void;
    zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
    zoomToFit: () => void;
    zoomTo100: () => void;
    zoomToLevel: (level: number) => void;
    zoomToSelection: () => void;
    startTextEditing: (nodeId: string) => void;
    commitTextEdit: () => void;
    getVariablesByType: (type: import("@open-pencil/scene-graph").VariableType) => import("@open-pencil/scene-graph").Variable[];
    getVariable: (id: string) => import("@open-pencil/scene-graph").Variable | undefined;
    resolveColorVariable: (id: string) => import("@open-pencil/scene-graph").Color | undefined;
    resolveNumberVariable: (id: string) => number | undefined;
    getVariablesForCollection: (collectionId: string) => import("@open-pencil/scene-graph").Variable[];
    getCollection: (id: string) => import("@open-pencil/scene-graph").VariableCollection | undefined;
    getCollections: () => import("@open-pencil/scene-graph").VariableCollection[];
    getCollectionCount: () => number;
    getVariableCount: () => number;
    renameCollection: (id: string, newName: string) => void;
    addCollection: (collection: import("@open-pencil/scene-graph").VariableCollection) => void;
    removeCollection: (id: string) => void;
    addVariable: (variable: import("@open-pencil/scene-graph").Variable) => void;
    removeVariable: (id: string) => void;
    renameVariable: (id: string, newName: string) => void;
    updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
    addMode: (collectionId: string, name?: string) => string | undefined;
    removeMode: (collectionId: string, modeId: string) => void;
    renameMode: (collectionId: string, modeId: string, newName: string) => void;
    setDefaultMode: (collectionId: string, modeId: string) => void;
    duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
    setActiveMode: (collectionId: string, modeId: string) => void;
    replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
    alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
    canDistributeNodes: (nodeIds: string[]) => boolean;
    distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    rotateNodes: (nodeIds: string[], degrees: number) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    flushNudge: () => void;
    bindVariable: (nodeId: string, path: string, variableId: string) => void;
    unbindVariable: (nodeId: string, path: string) => void;
    setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
    updateNode: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>) => void;
    updateNodeWithUndo: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    setOpacity: (opacity: number, coalesceKey?: string) => void;
    moveToPage: (pageId: string) => void;
    previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
    renameSelected: (options: RenameSelectionOptions) => void;
    renameNode: (id: string, name: string) => void;
    toggleNodeVisibility: (id: string) => void;
    toggleNodeLock: (id: string) => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    reparentNodes: (nodeIds: string[], newParentId: string) => void;
    wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: import("@open-pencil/scene-graph").SceneNode[], extraProps?: Partial<import("@open-pencil/scene-graph").SceneNode>) => string | null;
    reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
    reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    isTopLevel: (parentId: string | null) => boolean;
    adoptNodesIntoSection: (sectionId: string) => void;
    setTool: (tool: Tool$2) => void;
    createFrameFromPreset: (preset: FramePresetDimensions) => string;
    resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
    penAddVertex: (x: number, y: number) => void;
    penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
    penSetClosingToFirst: (closing: boolean) => void;
    penSetPendingClose: (closing: boolean) => void;
    penSetKnotPosition: (x: number, y: number) => void;
    penCommit: (closed: boolean) => void;
    penCancel: () => void;
    createShape: (type: import("@open-pencil/scene-graph").NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
    switchPage: (pageId: string) => Promise<void>;
    addPage: (name?: string) => string;
    deletePage: (pageId: string) => void;
    movePage: (pageId: string, index: number) => void;
    renamePage: (pageId: string, name: string) => void;
    setPageColor: (color: import("@open-pencil/scene-graph").Color) => void;
    clearPageViewports: () => void;
    hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => import("@open-pencil/scene-graph").SceneNode | null;
    selectAtPoint: (cx: number, cy: number) => void;
    getSelectedNodes: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    }[];
    getSelectedNode: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    } | undefined;
    getLayerTree: () => {
      node: import("@open-pencil/scene-graph").SceneNode;
      depth: number;
    }[];
    validateEnteredContainer: () => void;
    enterContainer: (id: string) => void;
    exitContainer: () => void;
    setMarquee: (rect: import("@open-pencil/scene-graph/primitives").Rect | null) => void;
    setSnapGuides: (guides: import("@open-pencil/scene-graph").SnapGuide[]) => void;
    setRotationPreview: (preview: {
      nodeId: string;
      angle: number;
    } | null) => void;
    setHoveredNode: (id: string | null) => void;
    setDropTarget: (id: string | null) => void;
    setLayoutInsertIndicator: (indicator: {
      parentId: string;
      index: number;
      x: number;
      y: number;
      length: number;
      direction: "HORIZONTAL" | "VERTICAL";
    } | null) => void;
    setAutoLayoutHover: (hover: {
      nodeId: string;
      kind: "frame" | "children" | "spacing" | "spacing-value" | "padding" | "padding-value";
      index?: number;
      side?: "top" | "right" | "bottom" | "left";
    } | null) => void;
    select: (ids: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    selectInverse: () => void;
    requestRender: () => void;
    requestRepaint: () => void;
    onEditorEvent: <K extends EditorEventName$2>(event: K, handler: EditorEvents$2[K]) => import("nanoevents").Unsubscribe;
    setCanvasKit: (ck: import("canvaskit-wasm").CanvasKit, renderer: SkiaRenderer) => void;
    removeCanvasRenderer: (renderer: SkiaRenderer) => void;
    replaceGraph: (newGraph: import("@open-pencil/scene-graph").SceneGraph) => void;
    subscribeToGraph: () => void;
    getNode: (id: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
    getChildren: (id: string) => import("@open-pencil/scene-graph").SceneNode[];
    getPages: (includeInternal?: boolean) => import("@open-pencil/scene-graph").SceneNode[];
    graph: import("@open-pencil/scene-graph").SceneGraph;
    renderer: SkiaRenderer | null;
    canvasRenderers: SkiaRenderer[];
    textEditor: TextEditor | null;
    undo: import("@open-pencil/scene-graph").UndoManager;
    state: EditorState$1;
  };
  searchTerm: import("vue").Ref<string, string>;
  variables: import("vue").ComputedRef<import("@open-pencil/scene-graph").Variable[]>;
  filteredVariables: import("vue").ComputedRef<import("@open-pencil/scene-graph").Variable[]>;
  bindingPath: (index?: number) => string;
  getBoundVariable: (nodeId: string, index?: number) => import("@open-pencil/scene-graph").Variable | undefined;
  getBindingState: (nodeIds: string[], index?: number) => VariableBindingState;
};
//#endregion
//#region src/controls/variable-binding/use.d.ts
type VariableBindingState = 'unbound' | 'bound' | 'mixed';
interface UseVariableBindingOptions {
  type: VariableType;
  path: string | ((index: number) => string);
}
declare function useVariableBinding(options: UseVariableBindingOptions): {
  store: {
    wrapInAutoLayout: () => void;
    groupSelected: () => string | null;
    frameSelection: () => string | null;
    booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
    flattenSelected: () => string | null;
    outlineTextSelected: () => string | null;
    outlineStrokeSelected: () => string | null;
    ungroupSelected: () => void;
    createComponentFromSelection: () => void;
    createComponentSetFromComponents: () => void;
    createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
    detachInstance: () => void;
    focusComponent: (componentId: string) => Promise<void>;
    goToMainComponent: () => Promise<void>;
    getComponentSetPropertyDefs: (componentSetId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    addPropertyDefinition: (componentSetId: string, name: string, type?: import("@open-pencil/scene-graph").ComponentPropertyType, defaultValue?: string) => string | undefined;
    removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
    renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
    collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
    findVariantByValues: (componentSetId: string, values: Record<string, string>) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getDefaultVariantForComponentSet: (componentSetId: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
    switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
    getInstanceComponentPropertyDefinitions: (instanceId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    getInstanceComponentPropertyValue: (instanceId: string, definition: import("@open-pencil/scene-graph").ComponentPropertyDefinition) => string;
    setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
    duplicateSelected: () => void;
    writeCopyData: (data: DataTransfer) => Promise<void>;
    pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
      replaceSelection?: boolean;
    }) => Promise<void>;
    deleteSelected: () => void;
    storeImage: (bytes: Uint8Array) => string;
    placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
    copySelectionAsText: (ids: string[]) => string;
    copySelectionAsSVG: (ids: string[]) => string | null;
    copySelectionAsJSX: (ids: string[]) => string | null;
    setDocumentColorSpace: (colorSpace: import("@open-pencil/scene-graph").DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
    commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
    commitMoveWithReparent: (originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>) => void;
    commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
    commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<import("@open-pencil/scene-graph").SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
    commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    }>) => void;
    commitRotation: (nodeId: string, origRotation: number) => void;
    commitNodeUpdate: (nodeId: string, previous: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    undoAction: () => void;
    redoAction: () => void;
    snapshotPage: () => PageSnapshot;
    restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
    pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
    screenToCanvas: (sx: number, sy: number) => {
      x: number;
      y: number;
    };
    setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
    applyZoom: (delta: number, centerX: number, centerY: number) => void;
    pan: (dx: number, dy: number) => void;
    zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
    zoomToFit: () => void;
    zoomTo100: () => void;
    zoomToLevel: (level: number) => void;
    zoomToSelection: () => void;
    startTextEditing: (nodeId: string) => void;
    commitTextEdit: () => void;
    getVariablesByType: (type: VariableType) => Variable[];
    getVariable: (id: string) => Variable | undefined;
    resolveColorVariable: (id: string) => import("@open-pencil/scene-graph").Color | undefined;
    resolveNumberVariable: (id: string) => number | undefined;
    getVariablesForCollection: (collectionId: string) => Variable[];
    getCollection: (id: string) => import("@open-pencil/scene-graph").VariableCollection | undefined;
    getCollections: () => import("@open-pencil/scene-graph").VariableCollection[];
    getCollectionCount: () => number;
    getVariableCount: () => number;
    renameCollection: (id: string, newName: string) => void;
    addCollection: (collection: import("@open-pencil/scene-graph").VariableCollection) => void;
    removeCollection: (id: string) => void;
    addVariable: (variable: Variable) => void;
    removeVariable: (id: string) => void;
    renameVariable: (id: string, newName: string) => void;
    updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
    addMode: (collectionId: string, name?: string) => string | undefined;
    removeMode: (collectionId: string, modeId: string) => void;
    renameMode: (collectionId: string, modeId: string, newName: string) => void;
    setDefaultMode: (collectionId: string, modeId: string) => void;
    duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
    setActiveMode: (collectionId: string, modeId: string) => void;
    replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
    alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
    canDistributeNodes: (nodeIds: string[]) => boolean;
    distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    rotateNodes: (nodeIds: string[], degrees: number) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    flushNudge: () => void;
    bindVariable: (nodeId: string, path: string, variableId: string) => void;
    unbindVariable: (nodeId: string, path: string) => void;
    setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
    updateNode: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>) => void;
    updateNodeWithUndo: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    setOpacity: (opacity: number, coalesceKey?: string) => void;
    moveToPage: (pageId: string) => void;
    previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
    renameSelected: (options: RenameSelectionOptions) => void;
    renameNode: (id: string, name: string) => void;
    toggleNodeVisibility: (id: string) => void;
    toggleNodeLock: (id: string) => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    reparentNodes: (nodeIds: string[], newParentId: string) => void;
    wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: import("@open-pencil/scene-graph").SceneNode[], extraProps?: Partial<import("@open-pencil/scene-graph").SceneNode>) => string | null;
    reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
    reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    isTopLevel: (parentId: string | null) => boolean;
    adoptNodesIntoSection: (sectionId: string) => void;
    setTool: (tool: Tool$2) => void;
    createFrameFromPreset: (preset: FramePresetDimensions) => string;
    resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
    penAddVertex: (x: number, y: number) => void;
    penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
    penSetClosingToFirst: (closing: boolean) => void;
    penSetPendingClose: (closing: boolean) => void;
    penSetKnotPosition: (x: number, y: number) => void;
    penCommit: (closed: boolean) => void;
    penCancel: () => void;
    createShape: (type: import("@open-pencil/scene-graph").NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
    switchPage: (pageId: string) => Promise<void>;
    addPage: (name?: string) => string;
    deletePage: (pageId: string) => void;
    movePage: (pageId: string, index: number) => void;
    renamePage: (pageId: string, name: string) => void;
    setPageColor: (color: import("@open-pencil/scene-graph").Color) => void;
    clearPageViewports: () => void;
    hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => import("@open-pencil/scene-graph").SceneNode | null;
    selectAtPoint: (cx: number, cy: number) => void;
    getSelectedNodes: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    }[];
    getSelectedNode: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    } | undefined;
    getLayerTree: () => {
      node: import("@open-pencil/scene-graph").SceneNode;
      depth: number;
    }[];
    validateEnteredContainer: () => void;
    enterContainer: (id: string) => void;
    exitContainer: () => void;
    setMarquee: (rect: import("@open-pencil/scene-graph/primitives").Rect | null) => void;
    setSnapGuides: (guides: import("@open-pencil/scene-graph").SnapGuide[]) => void;
    setRotationPreview: (preview: {
      nodeId: string;
      angle: number;
    } | null) => void;
    setHoveredNode: (id: string | null) => void;
    setDropTarget: (id: string | null) => void;
    setLayoutInsertIndicator: (indicator: {
      parentId: string;
      index: number;
      x: number;
      y: number;
      length: number;
      direction: "HORIZONTAL" | "VERTICAL";
    } | null) => void;
    setAutoLayoutHover: (hover: {
      nodeId: string;
      kind: "frame" | "children" | "spacing" | "spacing-value" | "padding" | "padding-value";
      index?: number;
      side?: "top" | "right" | "bottom" | "left";
    } | null) => void;
    select: (ids: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    selectInverse: () => void;
    requestRender: () => void;
    requestRepaint: () => void;
    onEditorEvent: <K extends EditorEventName$2>(event: K, handler: EditorEvents$2[K]) => import("nanoevents").Unsubscribe;
    setCanvasKit: (ck: import("canvaskit-wasm").CanvasKit, renderer: SkiaRenderer) => void;
    removeCanvasRenderer: (renderer: SkiaRenderer) => void;
    replaceGraph: (newGraph: import("@open-pencil/scene-graph").SceneGraph) => void;
    subscribeToGraph: () => void;
    getNode: (id: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
    getChildren: (id: string) => import("@open-pencil/scene-graph").SceneNode[];
    getPages: (includeInternal?: boolean) => import("@open-pencil/scene-graph").SceneNode[];
    graph: import("@open-pencil/scene-graph").SceneGraph;
    renderer: SkiaRenderer | null;
    canvasRenderers: SkiaRenderer[];
    textEditor: TextEditor | null;
    undo: import("@open-pencil/scene-graph").UndoManager;
    state: EditorState$1;
  };
  searchTerm: import("vue").Ref<string, string>;
  variables: import("vue").ComputedRef<Variable[]>;
  filteredVariables: import("vue").ComputedRef<Variable[]>;
  bindingPath: (index?: number) => string;
  getBoundVariable: (nodeId: string, index?: number) => Variable | undefined;
  getBindingState: (nodeIds: string[], index?: number) => VariableBindingState;
  bindVariable: (nodeId: string, variableId: string, index?: number) => void;
  unbindVariable: (nodeId: string, index?: number) => void;
};
//#endregion
//#region src/controls/color-variable-binding/use.d.ts
type ColorBindingKind = 'fills' | 'strokes';
declare function useColorVariableBinding(kind: ColorBindingKind): {
  colorVariables: import("vue").ComputedRef<import("@open-pencil/scene-graph").Variable[]>;
  bindVariable: (nodeId: string, index: number, variableId: string) => void;
  unbindVariable: (nodeId: string, index: number) => void;
  createAndBindVariable: (nodeId: string, index: number, color: Color$1, name?: string) => void;
  store: {
    wrapInAutoLayout: () => void;
    groupSelected: () => string | null;
    frameSelection: () => string | null;
    booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
    flattenSelected: () => string | null;
    outlineTextSelected: () => string | null;
    outlineStrokeSelected: () => string | null;
    ungroupSelected: () => void;
    createComponentFromSelection: () => void;
    createComponentSetFromComponents: () => void;
    createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
    detachInstance: () => void;
    focusComponent: (componentId: string) => Promise<void>;
    goToMainComponent: () => Promise<void>;
    getComponentSetPropertyDefs: (componentSetId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    addPropertyDefinition: (componentSetId: string, name: string, type?: import("@open-pencil/scene-graph").ComponentPropertyType, defaultValue?: string) => string | undefined;
    removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
    renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
    collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
    findVariantByValues: (componentSetId: string, values: Record<string, string>) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getDefaultVariantForComponentSet: (componentSetId: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
    switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
    getInstanceComponentPropertyDefinitions: (instanceId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    getInstanceComponentPropertyValue: (instanceId: string, definition: import("@open-pencil/scene-graph").ComponentPropertyDefinition) => string;
    setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
    duplicateSelected: () => void;
    writeCopyData: (data: DataTransfer) => Promise<void>;
    pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
      replaceSelection?: boolean;
    }) => Promise<void>;
    deleteSelected: () => void;
    storeImage: (bytes: Uint8Array) => string;
    placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
    copySelectionAsText: (ids: string[]) => string;
    copySelectionAsSVG: (ids: string[]) => string | null;
    copySelectionAsJSX: (ids: string[]) => string | null;
    setDocumentColorSpace: (colorSpace: import("@open-pencil/scene-graph").DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
    commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
    commitMoveWithReparent: (originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>) => void;
    commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
    commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<import("@open-pencil/scene-graph").SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
    commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    }>) => void;
    commitRotation: (nodeId: string, origRotation: number) => void;
    commitNodeUpdate: (nodeId: string, previous: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    undoAction: () => void;
    redoAction: () => void;
    snapshotPage: () => PageSnapshot;
    restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
    pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
    screenToCanvas: (sx: number, sy: number) => {
      x: number;
      y: number;
    };
    setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
    applyZoom: (delta: number, centerX: number, centerY: number) => void;
    pan: (dx: number, dy: number) => void;
    zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
    zoomToFit: () => void;
    zoomTo100: () => void;
    zoomToLevel: (level: number) => void;
    zoomToSelection: () => void;
    startTextEditing: (nodeId: string) => void;
    commitTextEdit: () => void;
    getVariablesByType: (type: import("@open-pencil/scene-graph").VariableType) => import("@open-pencil/scene-graph").Variable[];
    getVariable: (id: string) => import("@open-pencil/scene-graph").Variable | undefined;
    resolveColorVariable: (id: string) => Color$1 | undefined;
    resolveNumberVariable: (id: string) => number | undefined;
    getVariablesForCollection: (collectionId: string) => import("@open-pencil/scene-graph").Variable[];
    getCollection: (id: string) => VariableCollection | undefined;
    getCollections: () => VariableCollection[];
    getCollectionCount: () => number;
    getVariableCount: () => number;
    renameCollection: (id: string, newName: string) => void;
    addCollection: (collection: VariableCollection) => void;
    removeCollection: (id: string) => void;
    addVariable: (variable: import("@open-pencil/scene-graph").Variable) => void;
    removeVariable: (id: string) => void;
    renameVariable: (id: string, newName: string) => void;
    updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
    addMode: (collectionId: string, name?: string) => string | undefined;
    removeMode: (collectionId: string, modeId: string) => void;
    renameMode: (collectionId: string, modeId: string, newName: string) => void;
    setDefaultMode: (collectionId: string, modeId: string) => void;
    duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
    setActiveMode: (collectionId: string, modeId: string) => void;
    replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
    alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
    canDistributeNodes: (nodeIds: string[]) => boolean;
    distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    rotateNodes: (nodeIds: string[], degrees: number) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    flushNudge: () => void;
    bindVariable: (nodeId: string, path: string, variableId: string) => void;
    unbindVariable: (nodeId: string, path: string) => void;
    setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
    updateNode: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>) => void;
    updateNodeWithUndo: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    setOpacity: (opacity: number, coalesceKey?: string) => void;
    moveToPage: (pageId: string) => void;
    previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
    renameSelected: (options: RenameSelectionOptions) => void;
    renameNode: (id: string, name: string) => void;
    toggleNodeVisibility: (id: string) => void;
    toggleNodeLock: (id: string) => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    reparentNodes: (nodeIds: string[], newParentId: string) => void;
    wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: import("@open-pencil/scene-graph").SceneNode[], extraProps?: Partial<import("@open-pencil/scene-graph").SceneNode>) => string | null;
    reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
    reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    isTopLevel: (parentId: string | null) => boolean;
    adoptNodesIntoSection: (sectionId: string) => void;
    setTool: (tool: Tool$2) => void;
    createFrameFromPreset: (preset: FramePresetDimensions) => string;
    resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
    penAddVertex: (x: number, y: number) => void;
    penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
    penSetClosingToFirst: (closing: boolean) => void;
    penSetPendingClose: (closing: boolean) => void;
    penSetKnotPosition: (x: number, y: number) => void;
    penCommit: (closed: boolean) => void;
    penCancel: () => void;
    createShape: (type: import("@open-pencil/scene-graph").NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
    switchPage: (pageId: string) => Promise<void>;
    addPage: (name?: string) => string;
    deletePage: (pageId: string) => void;
    movePage: (pageId: string, index: number) => void;
    renamePage: (pageId: string, name: string) => void;
    setPageColor: (color: Color$1) => void;
    clearPageViewports: () => void;
    hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => import("@open-pencil/scene-graph").SceneNode | null;
    selectAtPoint: (cx: number, cy: number) => void;
    getSelectedNodes: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    }[];
    getSelectedNode: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    } | undefined;
    getLayerTree: () => {
      node: import("@open-pencil/scene-graph").SceneNode;
      depth: number;
    }[];
    validateEnteredContainer: () => void;
    enterContainer: (id: string) => void;
    exitContainer: () => void;
    setMarquee: (rect: import("@open-pencil/scene-graph/primitives").Rect | null) => void;
    setSnapGuides: (guides: import("@open-pencil/scene-graph").SnapGuide[]) => void;
    setRotationPreview: (preview: {
      nodeId: string;
      angle: number;
    } | null) => void;
    setHoveredNode: (id: string | null) => void;
    setDropTarget: (id: string | null) => void;
    setLayoutInsertIndicator: (indicator: {
      parentId: string;
      index: number;
      x: number;
      y: number;
      length: number;
      direction: "HORIZONTAL" | "VERTICAL";
    } | null) => void;
    setAutoLayoutHover: (hover: {
      nodeId: string;
      kind: "frame" | "children" | "spacing" | "spacing-value" | "padding" | "padding-value";
      index?: number;
      side?: "top" | "right" | "bottom" | "left";
    } | null) => void;
    select: (ids: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    selectInverse: () => void;
    requestRender: () => void;
    requestRepaint: () => void;
    onEditorEvent: <K extends EditorEventName$2>(event: K, handler: EditorEvents$2[K]) => import("nanoevents").Unsubscribe;
    setCanvasKit: (ck: import("canvaskit-wasm").CanvasKit, renderer: SkiaRenderer) => void;
    removeCanvasRenderer: (renderer: SkiaRenderer) => void;
    replaceGraph: (newGraph: import("@open-pencil/scene-graph").SceneGraph) => void;
    subscribeToGraph: () => void;
    getNode: (id: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
    getChildren: (id: string) => import("@open-pencil/scene-graph").SceneNode[];
    getPages: (includeInternal?: boolean) => import("@open-pencil/scene-graph").SceneNode[];
    graph: import("@open-pencil/scene-graph").SceneGraph;
    renderer: SkiaRenderer | null;
    canvasRenderers: SkiaRenderer[];
    textEditor: TextEditor | null;
    undo: import("@open-pencil/scene-graph").UndoManager;
    state: EditorState$1;
  };
  searchTerm: import("vue").Ref<string, string>;
  variables: import("vue").ComputedRef<import("@open-pencil/scene-graph").Variable[]>;
  filteredVariables: import("vue").ComputedRef<import("@open-pencil/scene-graph").Variable[]>;
  bindingPath: (index?: number) => string;
  getBoundVariable: (nodeId: string, index?: number) => import("@open-pencil/scene-graph").Variable | undefined;
  getBindingState: (nodeIds: string[], index?: number) => VariableBindingState;
};
//#endregion
//#region src/controls/number-variable-binding/use.d.ts
type NumberBindingPath = 'width' | 'height' | 'minWidth' | 'maxWidth' | 'minHeight' | 'maxHeight' | 'cornerRadius' | 'topLeftRadius' | 'topRightRadius' | 'bottomLeftRadius' | 'bottomRightRadius' | 'itemSpacing' | 'counterAxisSpacing' | 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft' | 'opacity' | 'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing' | 'paragraphSpacing' | 'paragraphIndent';
declare function useNumberVariableBinding(path: NumberBindingPath): {
  numberVariables: import("vue").ComputedRef<import("@open-pencil/scene-graph").Variable[]>;
  createAndBindVariable: (nodeId: string, value: number, name?: string) => void;
  store: {
    wrapInAutoLayout: () => void;
    groupSelected: () => string | null;
    frameSelection: () => string | null;
    booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
    flattenSelected: () => string | null;
    outlineTextSelected: () => string | null;
    outlineStrokeSelected: () => string | null;
    ungroupSelected: () => void;
    createComponentFromSelection: () => void;
    createComponentSetFromComponents: () => void;
    createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
    detachInstance: () => void;
    focusComponent: (componentId: string) => Promise<void>;
    goToMainComponent: () => Promise<void>;
    getComponentSetPropertyDefs: (componentSetId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    addPropertyDefinition: (componentSetId: string, name: string, type?: import("@open-pencil/scene-graph").ComponentPropertyType, defaultValue?: string) => string | undefined;
    removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
    renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
    collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
    findVariantByValues: (componentSetId: string, values: Record<string, string>) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getDefaultVariantForComponentSet: (componentSetId: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
    switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
    getInstanceComponentPropertyDefinitions: (instanceId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    getInstanceComponentPropertyValue: (instanceId: string, definition: import("@open-pencil/scene-graph").ComponentPropertyDefinition) => string;
    setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
    duplicateSelected: () => void;
    writeCopyData: (data: DataTransfer) => Promise<void>;
    pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
      replaceSelection?: boolean;
    }) => Promise<void>;
    deleteSelected: () => void;
    storeImage: (bytes: Uint8Array) => string;
    placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
    copySelectionAsText: (ids: string[]) => string;
    copySelectionAsSVG: (ids: string[]) => string | null;
    copySelectionAsJSX: (ids: string[]) => string | null;
    setDocumentColorSpace: (colorSpace: import("@open-pencil/scene-graph").DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
    commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
    commitMoveWithReparent: (originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>) => void;
    commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
    commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<import("@open-pencil/scene-graph").SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
    commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    }>) => void;
    commitRotation: (nodeId: string, origRotation: number) => void;
    commitNodeUpdate: (nodeId: string, previous: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    undoAction: () => void;
    redoAction: () => void;
    snapshotPage: () => PageSnapshot;
    restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
    pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
    screenToCanvas: (sx: number, sy: number) => {
      x: number;
      y: number;
    };
    setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
    applyZoom: (delta: number, centerX: number, centerY: number) => void;
    pan: (dx: number, dy: number) => void;
    zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
    zoomToFit: () => void;
    zoomTo100: () => void;
    zoomToLevel: (level: number) => void;
    zoomToSelection: () => void;
    startTextEditing: (nodeId: string) => void;
    commitTextEdit: () => void;
    getVariablesByType: (type: import("@open-pencil/scene-graph").VariableType) => import("@open-pencil/scene-graph").Variable[];
    getVariable: (id: string) => import("@open-pencil/scene-graph").Variable | undefined;
    resolveColorVariable: (id: string) => import("@open-pencil/scene-graph").Color | undefined;
    resolveNumberVariable: (id: string) => number | undefined;
    getVariablesForCollection: (collectionId: string) => import("@open-pencil/scene-graph").Variable[];
    getCollection: (id: string) => import("@open-pencil/scene-graph").VariableCollection | undefined;
    getCollections: () => import("@open-pencil/scene-graph").VariableCollection[];
    getCollectionCount: () => number;
    getVariableCount: () => number;
    renameCollection: (id: string, newName: string) => void;
    addCollection: (collection: import("@open-pencil/scene-graph").VariableCollection) => void;
    removeCollection: (id: string) => void;
    addVariable: (variable: import("@open-pencil/scene-graph").Variable) => void;
    removeVariable: (id: string) => void;
    renameVariable: (id: string, newName: string) => void;
    updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
    addMode: (collectionId: string, name?: string) => string | undefined;
    removeMode: (collectionId: string, modeId: string) => void;
    renameMode: (collectionId: string, modeId: string, newName: string) => void;
    setDefaultMode: (collectionId: string, modeId: string) => void;
    duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
    setActiveMode: (collectionId: string, modeId: string) => void;
    replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
    alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
    canDistributeNodes: (nodeIds: string[]) => boolean;
    distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    rotateNodes: (nodeIds: string[], degrees: number) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    flushNudge: () => void;
    bindVariable: (nodeId: string, path: string, variableId: string) => void;
    unbindVariable: (nodeId: string, path: string) => void;
    setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
    updateNode: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>) => void;
    updateNodeWithUndo: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    setOpacity: (opacity: number, coalesceKey?: string) => void;
    moveToPage: (pageId: string) => void;
    previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
    renameSelected: (options: RenameSelectionOptions) => void;
    renameNode: (id: string, name: string) => void;
    toggleNodeVisibility: (id: string) => void;
    toggleNodeLock: (id: string) => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    reparentNodes: (nodeIds: string[], newParentId: string) => void;
    wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: import("@open-pencil/scene-graph").SceneNode[], extraProps?: Partial<import("@open-pencil/scene-graph").SceneNode>) => string | null;
    reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
    reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    isTopLevel: (parentId: string | null) => boolean;
    adoptNodesIntoSection: (sectionId: string) => void;
    setTool: (tool: Tool$2) => void;
    createFrameFromPreset: (preset: FramePresetDimensions) => string;
    resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
    penAddVertex: (x: number, y: number) => void;
    penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
    penSetClosingToFirst: (closing: boolean) => void;
    penSetPendingClose: (closing: boolean) => void;
    penSetKnotPosition: (x: number, y: number) => void;
    penCommit: (closed: boolean) => void;
    penCancel: () => void;
    createShape: (type: import("@open-pencil/scene-graph").NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
    switchPage: (pageId: string) => Promise<void>;
    addPage: (name?: string) => string;
    deletePage: (pageId: string) => void;
    movePage: (pageId: string, index: number) => void;
    renamePage: (pageId: string, name: string) => void;
    setPageColor: (color: import("@open-pencil/scene-graph").Color) => void;
    clearPageViewports: () => void;
    hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => import("@open-pencil/scene-graph").SceneNode | null;
    selectAtPoint: (cx: number, cy: number) => void;
    getSelectedNodes: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    }[];
    getSelectedNode: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    } | undefined;
    getLayerTree: () => {
      node: import("@open-pencil/scene-graph").SceneNode;
      depth: number;
    }[];
    validateEnteredContainer: () => void;
    enterContainer: (id: string) => void;
    exitContainer: () => void;
    setMarquee: (rect: import("@open-pencil/scene-graph/primitives").Rect | null) => void;
    setSnapGuides: (guides: import("@open-pencil/scene-graph").SnapGuide[]) => void;
    setRotationPreview: (preview: {
      nodeId: string;
      angle: number;
    } | null) => void;
    setHoveredNode: (id: string | null) => void;
    setDropTarget: (id: string | null) => void;
    setLayoutInsertIndicator: (indicator: {
      parentId: string;
      index: number;
      x: number;
      y: number;
      length: number;
      direction: "HORIZONTAL" | "VERTICAL";
    } | null) => void;
    setAutoLayoutHover: (hover: {
      nodeId: string;
      kind: "frame" | "children" | "spacing" | "spacing-value" | "padding" | "padding-value";
      index?: number;
      side?: "top" | "right" | "bottom" | "left";
    } | null) => void;
    select: (ids: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    selectInverse: () => void;
    requestRender: () => void;
    requestRepaint: () => void;
    onEditorEvent: <K extends EditorEventName$2>(event: K, handler: EditorEvents$2[K]) => import("nanoevents").Unsubscribe;
    setCanvasKit: (ck: import("canvaskit-wasm").CanvasKit, renderer: SkiaRenderer) => void;
    removeCanvasRenderer: (renderer: SkiaRenderer) => void;
    replaceGraph: (newGraph: import("@open-pencil/scene-graph").SceneGraph) => void;
    subscribeToGraph: () => void;
    getNode: (id: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
    getChildren: (id: string) => import("@open-pencil/scene-graph").SceneNode[];
    getPages: (includeInternal?: boolean) => import("@open-pencil/scene-graph").SceneNode[];
    graph: import("@open-pencil/scene-graph").SceneGraph;
    renderer: SkiaRenderer | null;
    canvasRenderers: SkiaRenderer[];
    textEditor: TextEditor | null;
    undo: import("@open-pencil/scene-graph").UndoManager;
    state: EditorState$1;
  };
  searchTerm: import("vue").Ref<string, string>;
  variables: import("vue").ComputedRef<import("@open-pencil/scene-graph").Variable[]>;
  filteredVariables: import("vue").ComputedRef<import("@open-pencil/scene-graph").Variable[]>;
  bindingPath: (index?: number) => string;
  getBoundVariable: (nodeId: string, index?: number) => import("@open-pencil/scene-graph").Variable | undefined;
  getBindingState: (nodeIds: string[], index?: number) => VariableBindingState;
  bindVariable: (nodeId: string, variableId: string, index?: number) => void;
  unbindVariable: (nodeId: string, index?: number) => void;
};
//#endregion
//#region src/controls/effects/helpers.d.ts
declare function isShadow(type: string): type is "DROP_SHADOW" | "INNER_SHADOW";
declare function createDefaultEffect(): Effect;
//#endregion
//#region src/controls/effects/use.d.ts
/**
 * Returns effect-editing helpers for property panels.
 *
 * This composable manages default effect creation, expanded-row state,
 * scrub-preview behavior, and effect type/color updates.
 */
declare function useEffectsControls(): {
  updateType: (patch: (index: number, changes: Partial<import("@open-pencil/scene-graph").Effect>) => void, node: import("@open-pencil/scene-graph").SceneNode | null, index: number, type: "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR" | "FOREGROUND_BLUR") => void;
  updateColor: (patch: (index: number, changes: Partial<import("@open-pencil/scene-graph").Effect>) => void, index: number, color: import("@open-pencil/scene-graph").Color) => void;
  handleRemove: (removeFn: (index: number) => void, index: number) => void;
  adjustExpandedAfterRemove: (index: number) => void;
  toggleExpand: (index: number) => void;
  scrubEffect: (node: import("@open-pencil/scene-graph").SceneNode | null, index: number, changes: Partial<import("@open-pencil/scene-graph").Effect>) => void;
  commitEffect: (node: import("@open-pencil/scene-graph").SceneNode | null, index: number, changes: Partial<import("@open-pencil/scene-graph").Effect>) => void;
  expandedIndex: import("vue").Ref<number | null, number | null>;
  effectOptions: {
    value: "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR" | "FOREGROUND_BLUR";
    label: string;
  }[];
  createDefaultEffect: typeof createDefaultEffect;
  isShadow: typeof isShadow;
};
//#endregion
//#region src/controls/shared-style/use.d.ts
declare function useSharedStyleBinding(kind: SharedStyleKind): {
  kind: SharedStyleKind;
  active: import("vue").ComputedRef<boolean>;
  styleId: import("vue").ComputedRef<MixedValue<string | null>>;
  styles: import("vue").ComputedRef<import("@open-pencil/scene-graph").SharedStyle[]>;
  bind: (nextStyleId: string) => void;
  unbind: () => void;
};
//#endregion
//#region src/controls/stroke/helpers.d.ts
type StrokeSides = 'ALL' | 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT' | 'CUSTOM';
declare const BORDER_SIDES: readonly ["top", "right", "bottom", "left"];
declare function currentAlign(activeNode: SceneNode | null): Stroke['align'];
declare function currentSides(activeNode: SceneNode | null): StrokeSides;
declare function dashState(stroke: Stroke | undefined): {
  dash: number;
  gap: number;
  on: boolean;
};
declare function toggleDash(stroke: Stroke | undefined): Partial<Stroke>;
declare function setDash(stroke: Stroke | undefined, value: number): Partial<Stroke>;
declare function setGap(stroke: Stroke | undefined, value: number): Partial<Stroke>;
declare function borderWeight(activeNode: SceneNode | null, side: (typeof BORDER_SIDES)[number]): number;
//#endregion
//#region src/controls/stroke/use.d.ts
/**
 * Returns stroke-related helpers for property panels.
 *
 * This composable provides alignment and side helpers plus mixed-selection
 * state and undo-aware actions for caps, joins, and miter limits.
 */
declare function useStrokeControls(): {
  sideOptions: {
    value: StrokeSides;
    label: string;
  }[];
  borderSides: readonly ["top", "right", "bottom", "left"];
  sideMenuOpen: import("vue").Ref<boolean, boolean>;
  defaultStroke: import("@open-pencil/scene-graph").Stroke;
  updateAlign: (align: "CENTER" | "INSIDE" | "OUTSIDE", activeNode: import("@open-pencil/scene-graph").SceneNode | null) => void;
  currentAlign: typeof currentAlign;
  currentSides: typeof currentSides;
  dashState: typeof dashState;
  toggleDash: typeof toggleDash;
  setDash: typeof setDash;
  setGap: typeof setGap;
  borderWeight: typeof borderWeight;
  selectSide: (side: StrokeSides, activeNode: import("@open-pencil/scene-graph").SceneNode | null) => void;
  updateBorderWeight: (side: (typeof BORDER_SIDES)[number], value: number, activeNode: import("@open-pencil/scene-graph").SceneNode | null) => void;
  setCap: (value: import("@open-pencil/scene-graph").StrokeCap) => void;
  setJoin: (value: import("@open-pencil/scene-graph").StrokeJoin) => void;
  updateMiterLimit: (value: number) => void;
  commitMiterLimit: (value: number) => void;
  advancedActive: import("vue").ComputedRef<boolean>;
  cap: import("vue").ComputedRef<MixedValue<import("@open-pencil/scene-graph").StrokeCap>>;
  join: import("vue").ComputedRef<MixedValue<import("@open-pencil/scene-graph").StrokeJoin>>;
  miterLimit: import("vue").ComputedRef<MixedValue<number>>;
  alignOptions: ({
    value: "INSIDE";
    label: "Inside";
  } | {
    value: "CENTER";
    label: "Center";
  } | {
    value: "OUTSIDE";
    label: "Outside";
  })[];
  capOptions: ({
    value: "NONE";
    label: "Butt cap";
  } | {
    value: "ROUND";
    label: "Round cap";
  } | {
    value: "SQUARE";
    label: "Square cap";
  })[];
  joinOptions: ({
    value: "MITER";
    label: "Miter join";
  } | {
    value: "BEVEL";
    label: "Bevel join";
  } | {
    value: "ROUND";
    label: "Round join";
  })[];
};
//#endregion
//#region src/controls/color-model/types.d.ts
type BuiltInColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsb' | 'okhcl';
type ColorFieldFormat = BuiltInColorFormat | (string & {});
type RGBChannel = 'r' | 'g' | 'b';
type HSLChannel = 'h' | 's' | 'l';
type HSBChannel = 'h' | 's' | 'b';
type OkHCLChannel = 'h' | 'c' | 'l' | 'a';
interface ColorFieldOption {
  value: ColorFieldFormat;
  label: string;
}
interface OkHCLControls {
  fieldFormat: ColorFieldFormat;
  fieldOptions: ColorFieldOption[];
  okhcl: OkHCLColor | null;
  previewColorSpace?: RenderColorSpace;
  clipped?: boolean;
  setFieldFormat: (format: ColorFieldFormat) => void;
  updateOkHCL: (patch: Partial<OkHCLColor>) => void;
}
interface UseColorModelOptions {
  color: MaybeRefOrGetter<Color$1>;
  okhcl?: MaybeRefOrGetter<OkHCLColor | null | undefined>;
  format?: MaybeRefOrGetter<ColorFieldFormat | undefined>;
  defaultFormat?: ColorFieldFormat;
  onUpdate?: (color: Color$1) => void;
  onUpdateOkHCL?: (patch: Partial<OkHCLColor>) => void;
  onFormatChange?: (format: ColorFieldFormat) => void;
}
interface SliderPreviewModel {
  hue: Color$1;
  hslSaturation: Color$1;
  hslLightness: Color$1;
  hsbSaturation: Color$1;
  hsbBrightness: Color$1;
}
interface OkHCLSliderPreviewModel {
  okhclHue: Color$1;
  okhclChroma: Color$1;
  okhclLightness: Color$1;
}
interface SliderGradientModel {
  hslSaturation: string;
  hslLightness: string;
  hsbSaturation: string;
  hsbBrightness: string;
}
interface OkHCLSliderGradientModel {
  okhclChroma: string;
  okhclLightness: string;
}
type RekaColorValue = Color;
//#endregion
//#region src/controls/color-model/use.d.ts
/** Built-in presentation formats understood by the color model. */
declare const BUILT_IN_COLOR_FORMATS: readonly ["hex", "rgb", "hsl", "hsb", "okhcl"];
/**
 * Creates reactive color-space values, channel actions, and slider presentation data without
 * requiring an editor context.
 */
declare function useColorModel(options: UseColorModelOptions): {
  color: import("vue").ComputedRef<Color$1>;
  format: import("vue").ComputedRef<ColorFieldFormat>;
  hex: import("vue").ComputedRef<string>;
  rekaColor: import("vue").ComputedRef<import("reka-ui").Color>;
  rgb: import("vue").ComputedRef<import("reka-ui").RGBColor>;
  hsl: import("vue").ComputedRef<import("reka-ui").HSLColor>;
  hsb: import("vue").ComputedRef<import("reka-ui").HSBColor>;
  okhcl: import("vue").ComputedRef<import("@open-pencil/core/color").OkHCLColor>;
  sliderPreview: import("vue").ComputedRef<SliderPreviewModel>;
  sliderGradient: import("vue").ComputedRef<SliderGradientModel>;
  okhclSliderPreview: import("vue").ComputedRef<OkHCLSliderPreviewModel>;
  okhclSliderGradient: import("vue").ComputedRef<OkHCLSliderGradientModel>;
  setFormat: (nextFormat: ColorFieldFormat) => void;
  updateColor: (nextColor: Color$1) => Color$1;
  updateHex: (input: string) => Color$1;
  updateFromReka: (nextColor: RekaColorValue) => Color$1;
  updateHue: (hue: number) => Color$1;
  updateAlpha: (alpha: number) => Color$1;
  updateRGBChannel: (channel: RGBChannel, channelValue: number) => Color$1;
  updateHSLChannel: (channel: HSLChannel, channelValue: number) => Color$1;
  updateHSBChannel: (channel: HSBChannel, channelValue: number) => Color$1;
  updateOkHCLChannel: (channel: OkHCLChannel, channelValue: number) => import("@open-pencil/core/color").OkHCLColor;
};
//#endregion
//#region src/controls/color-model/model.d.ts
declare function applySolidFillColor(fill: Fill, color: Color$1): Fill;
declare function applySolidStrokeColor(color: Color$1): Partial<Stroke>;
declare function toPercent(value: number): number;
declare function fromPercent(value: number): number;
//#endregion
//#region src/controls/okhcl/helpers.d.ts
declare function getFillOkHCLColor(node: SceneNode | null, index: number): OkHCLColor | null;
declare function getStrokeOkHCLColor(node: SceneNode | null, index: number): OkHCLColor | null;
//#endregion
//#region src/controls/okhcl/use.d.ts
declare function useOkHCL(): {
  getFillOkHCLColor: typeof getFillOkHCLColor;
  getStrokeOkHCLColor: typeof getStrokeOkHCLColor;
  getFillPreviewInfo: (node: import("@open-pencil/scene-graph").SceneNode | null, index: number) => {
    previewColorSpace: import("@open-pencil/scene-graph").DocumentColorSpace;
    clipped: boolean;
  };
  getStrokePreviewInfo: (node: import("@open-pencil/scene-graph").SceneNode | null, index: number) => {
    previewColorSpace: import("@open-pencil/scene-graph").DocumentColorSpace;
    clipped: boolean;
  };
  getFieldFormat: (node: import("@open-pencil/scene-graph").SceneNode | null, index: number, kind: "fill" | "stroke") => ColorFieldFormat;
  setFillFieldFormat: (node: import("@open-pencil/scene-graph").SceneNode, index: number, format: ColorFieldFormat) => void;
  setStrokeFieldFormat: (node: import("@open-pencil/scene-graph").SceneNode, index: number, format: ColorFieldFormat) => void;
  updateFillOkHCL: (node: import("@open-pencil/scene-graph").SceneNode, index: number, patch: Partial<import("@open-pencil/core/color").OkHCLColor>) => void;
  updateStrokeOkHCL: (node: import("@open-pencil/scene-graph").SceneNode, index: number, patch: Partial<import("@open-pencil/core/color").OkHCLColor>) => void;
  fieldOptions: ({
    value: "rgb";
    label: string;
  } | {
    value: "hsl";
    label: string;
  } | {
    value: "hsb";
    label: string;
  } | {
    value: "okhcl";
    label: string;
  })[];
};
//#endregion
//#region src/variables/use.d.ts
declare function useVariables(): {
  addVariable: (type?: import("@open-pencil/scene-graph").VariableType) => void;
  removeVariable: (id: string) => void;
  renameVariable: (id: string, newName: string) => void;
  updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
  formatModeValue: (variable: Variable, modeId: string) => string;
  parseVariableValue: (variable: Variable, raw: string) => import("@open-pencil/scene-graph").VariableValue | undefined;
  shortName: (variable: Variable) => string;
  setActiveCollection: (id: string) => void;
  addCollection: () => void;
  renameCollection: (id: string, newName: string) => void;
  removeCollection: (id: string) => void;
  addMode: () => string | undefined;
  removeMode: (modeId: string) => void;
  renameMode: (modeId: string, newName: string) => void;
  setDefaultMode: (modeId: string) => void;
  duplicateMode: (modeId: string) => string | undefined;
  setActiveMode: (modeId: string) => void;
  editor: {
    wrapInAutoLayout: () => void;
    groupSelected: () => string | null;
    frameSelection: () => string | null;
    booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
    flattenSelected: () => string | null;
    outlineTextSelected: () => string | null;
    outlineStrokeSelected: () => string | null;
    ungroupSelected: () => void;
    createComponentFromSelection: () => void;
    createComponentSetFromComponents: () => void;
    createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
    detachInstance: () => void;
    focusComponent: (componentId: string) => Promise<void>;
    goToMainComponent: () => Promise<void>;
    getComponentSetPropertyDefs: (componentSetId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    addPropertyDefinition: (componentSetId: string, name: string, type?: import("@open-pencil/scene-graph").ComponentPropertyType, defaultValue?: string) => string | undefined;
    removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
    renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
    collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
    findVariantByValues: (componentSetId: string, values: Record<string, string>) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getDefaultVariantForComponentSet: (componentSetId: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
    switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
    getInstanceComponentPropertyDefinitions: (instanceId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    getInstanceComponentPropertyValue: (instanceId: string, definition: import("@open-pencil/scene-graph").ComponentPropertyDefinition) => string;
    setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
    duplicateSelected: () => void;
    writeCopyData: (data: DataTransfer) => Promise<void>;
    pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
      replaceSelection?: boolean;
    }) => Promise<void>;
    deleteSelected: () => void;
    storeImage: (bytes: Uint8Array) => string;
    placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
    copySelectionAsText: (ids: string[]) => string;
    copySelectionAsSVG: (ids: string[]) => string | null;
    copySelectionAsJSX: (ids: string[]) => string | null;
    setDocumentColorSpace: (colorSpace: import("@open-pencil/scene-graph").DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
    commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
    commitMoveWithReparent: (originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>) => void;
    commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
    commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<import("@open-pencil/scene-graph").SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
    commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    }>) => void;
    commitRotation: (nodeId: string, origRotation: number) => void;
    commitNodeUpdate: (nodeId: string, previous: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    undoAction: () => void;
    redoAction: () => void;
    snapshotPage: () => PageSnapshot;
    restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
    pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
    screenToCanvas: (sx: number, sy: number) => {
      x: number;
      y: number;
    };
    setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
    applyZoom: (delta: number, centerX: number, centerY: number) => void;
    pan: (dx: number, dy: number) => void;
    zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
    zoomToFit: () => void;
    zoomTo100: () => void;
    zoomToLevel: (level: number) => void;
    zoomToSelection: () => void;
    startTextEditing: (nodeId: string) => void;
    commitTextEdit: () => void;
    getVariablesByType: (type: import("@open-pencil/scene-graph").VariableType) => Variable[];
    getVariable: (id: string) => Variable | undefined;
    resolveColorVariable: (id: string) => import("@open-pencil/scene-graph").Color | undefined;
    resolveNumberVariable: (id: string) => number | undefined;
    getVariablesForCollection: (collectionId: string) => Variable[];
    getCollection: (id: string) => import("@open-pencil/scene-graph").VariableCollection | undefined;
    getCollections: () => import("@open-pencil/scene-graph").VariableCollection[];
    getCollectionCount: () => number;
    getVariableCount: () => number;
    renameCollection: (id: string, newName: string) => void;
    addCollection: (collection: import("@open-pencil/scene-graph").VariableCollection) => void;
    removeCollection: (id: string) => void;
    addVariable: (variable: Variable) => void;
    removeVariable: (id: string) => void;
    renameVariable: (id: string, newName: string) => void;
    updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
    addMode: (collectionId: string, name?: string) => string | undefined;
    removeMode: (collectionId: string, modeId: string) => void;
    renameMode: (collectionId: string, modeId: string, newName: string) => void;
    setDefaultMode: (collectionId: string, modeId: string) => void;
    duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
    setActiveMode: (collectionId: string, modeId: string) => void;
    replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
    alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
    canDistributeNodes: (nodeIds: string[]) => boolean;
    distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    rotateNodes: (nodeIds: string[], degrees: number) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    flushNudge: () => void;
    bindVariable: (nodeId: string, path: string, variableId: string) => void;
    unbindVariable: (nodeId: string, path: string) => void;
    setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
    updateNode: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>) => void;
    updateNodeWithUndo: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    setOpacity: (opacity: number, coalesceKey?: string) => void;
    moveToPage: (pageId: string) => void;
    previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
    renameSelected: (options: RenameSelectionOptions) => void;
    renameNode: (id: string, name: string) => void;
    toggleNodeVisibility: (id: string) => void;
    toggleNodeLock: (id: string) => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    reparentNodes: (nodeIds: string[], newParentId: string) => void;
    wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: import("@open-pencil/scene-graph").SceneNode[], extraProps?: Partial<import("@open-pencil/scene-graph").SceneNode>) => string | null;
    reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
    reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    isTopLevel: (parentId: string | null) => boolean;
    adoptNodesIntoSection: (sectionId: string) => void;
    setTool: (tool: Tool$2) => void;
    createFrameFromPreset: (preset: FramePresetDimensions) => string;
    resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
    penAddVertex: (x: number, y: number) => void;
    penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
    penSetClosingToFirst: (closing: boolean) => void;
    penSetPendingClose: (closing: boolean) => void;
    penSetKnotPosition: (x: number, y: number) => void;
    penCommit: (closed: boolean) => void;
    penCancel: () => void;
    createShape: (type: import("@open-pencil/scene-graph").NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
    switchPage: (pageId: string) => Promise<void>;
    addPage: (name?: string) => string;
    deletePage: (pageId: string) => void;
    movePage: (pageId: string, index: number) => void;
    renamePage: (pageId: string, name: string) => void;
    setPageColor: (color: import("@open-pencil/scene-graph").Color) => void;
    clearPageViewports: () => void;
    hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => import("@open-pencil/scene-graph").SceneNode | null;
    selectAtPoint: (cx: number, cy: number) => void;
    getSelectedNodes: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    }[];
    getSelectedNode: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    } | undefined;
    getLayerTree: () => {
      node: import("@open-pencil/scene-graph").SceneNode;
      depth: number;
    }[];
    validateEnteredContainer: () => void;
    enterContainer: (id: string) => void;
    exitContainer: () => void;
    setMarquee: (rect: import("@open-pencil/scene-graph/primitives").Rect | null) => void;
    setSnapGuides: (guides: import("@open-pencil/scene-graph").SnapGuide[]) => void;
    setRotationPreview: (preview: {
      nodeId: string;
      angle: number;
    } | null) => void;
    setHoveredNode: (id: string | null) => void;
    setDropTarget: (id: string | null) => void;
    setLayoutInsertIndicator: (indicator: {
      parentId: string;
      index: number;
      x: number;
      y: number;
      length: number;
      direction: "HORIZONTAL" | "VERTICAL";
    } | null) => void;
    setAutoLayoutHover: (hover: {
      nodeId: string;
      kind: "frame" | "children" | "spacing" | "spacing-value" | "padding" | "padding-value";
      index?: number;
      side?: "top" | "right" | "bottom" | "left";
    } | null) => void;
    select: (ids: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    selectInverse: () => void;
    requestRender: () => void;
    requestRepaint: () => void;
    onEditorEvent: <K extends EditorEventName$2>(event: K, handler: EditorEvents$2[K]) => import("nanoevents").Unsubscribe;
    setCanvasKit: (ck: import("canvaskit-wasm").CanvasKit, renderer: SkiaRenderer) => void;
    removeCanvasRenderer: (renderer: SkiaRenderer) => void;
    replaceGraph: (newGraph: import("@open-pencil/scene-graph").SceneGraph) => void;
    subscribeToGraph: () => void;
    getNode: (id: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
    getChildren: (id: string) => import("@open-pencil/scene-graph").SceneNode[];
    getPages: (includeInternal?: boolean) => import("@open-pencil/scene-graph").SceneNode[];
    graph: import("@open-pencil/scene-graph").SceneGraph;
    renderer: SkiaRenderer | null;
    canvasRenderers: SkiaRenderer[];
    textEditor: TextEditor | null;
    undo: import("@open-pencil/scene-graph").UndoManager;
    state: EditorState$1;
  };
  collections: import("vue").ComputedRef<import("@open-pencil/scene-graph").VariableCollection[]>;
  activeCollectionId: import("vue").Ref<string, string>;
  activeCollection: import("vue").ComputedRef<import("@open-pencil/scene-graph").VariableCollection | null>;
  activeModes: import("vue").ComputedRef<import("@open-pencil/scene-graph").VariableCollectionMode[]>;
  variables: import("vue").ComputedRef<Variable[]>;
  searchTerm: import("vue").Ref<string, string>;
  setSearchTerm: (term: string) => void;
};
//#endregion
//#region src/variables/dialog/use.d.ts
declare function useVariablesDialogState(): {
  collectionRename: InlineRenameState<string>;
  modeRename: InlineRenameState<string>;
  startRenameCollection: (id: string) => void;
  startRenameMode: (modeId: string) => void;
  addVariable: (type?: import("@open-pencil/scene-graph").VariableType) => void;
  removeVariable: (id: string) => void;
  renameVariable: (id: string, newName: string) => void;
  updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
  formatModeValue: (variable: import("@open-pencil/scene-graph").Variable, modeId: string) => string;
  parseVariableValue: (variable: import("@open-pencil/scene-graph").Variable, raw: string) => import("@open-pencil/scene-graph").VariableValue | undefined;
  shortName: (variable: import("@open-pencil/scene-graph").Variable) => string;
  setActiveCollection: (id: string) => void;
  addCollection: () => void;
  renameCollection: (id: string, newName: string) => void;
  removeCollection: (id: string) => void;
  addMode: () => string | undefined;
  removeMode: (modeId: string) => void;
  renameMode: (modeId: string, newName: string) => void;
  setDefaultMode: (modeId: string) => void;
  duplicateMode: (modeId: string) => string | undefined;
  setActiveMode: (modeId: string) => void;
  editor: {
    wrapInAutoLayout: () => void;
    groupSelected: () => string | null;
    frameSelection: () => string | null;
    booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
    flattenSelected: () => string | null;
    outlineTextSelected: () => string | null;
    outlineStrokeSelected: () => string | null;
    ungroupSelected: () => void;
    createComponentFromSelection: () => void;
    createComponentSetFromComponents: () => void;
    createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
    detachInstance: () => void;
    focusComponent: (componentId: string) => Promise<void>;
    goToMainComponent: () => Promise<void>;
    getComponentSetPropertyDefs: (componentSetId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    addPropertyDefinition: (componentSetId: string, name: string, type?: import("@open-pencil/scene-graph").ComponentPropertyType, defaultValue?: string) => string | undefined;
    removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
    renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
    collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
    findVariantByValues: (componentSetId: string, values: Record<string, string>) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getDefaultVariantForComponentSet: (componentSetId: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
    switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
    getInstanceComponentPropertyDefinitions: (instanceId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    getInstanceComponentPropertyValue: (instanceId: string, definition: import("@open-pencil/scene-graph").ComponentPropertyDefinition) => string;
    setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
    duplicateSelected: () => void;
    writeCopyData: (data: DataTransfer) => Promise<void>;
    pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
      replaceSelection?: boolean;
    }) => Promise<void>;
    deleteSelected: () => void;
    storeImage: (bytes: Uint8Array) => string;
    placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
    copySelectionAsText: (ids: string[]) => string;
    copySelectionAsSVG: (ids: string[]) => string | null;
    copySelectionAsJSX: (ids: string[]) => string | null;
    setDocumentColorSpace: (colorSpace: import("@open-pencil/scene-graph").DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
    commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
    commitMoveWithReparent: (originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>) => void;
    commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
    commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<import("@open-pencil/scene-graph").SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
    commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    }>) => void;
    commitRotation: (nodeId: string, origRotation: number) => void;
    commitNodeUpdate: (nodeId: string, previous: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    undoAction: () => void;
    redoAction: () => void;
    snapshotPage: () => PageSnapshot;
    restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
    pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
    screenToCanvas: (sx: number, sy: number) => {
      x: number;
      y: number;
    };
    setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
    applyZoom: (delta: number, centerX: number, centerY: number) => void;
    pan: (dx: number, dy: number) => void;
    zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
    zoomToFit: () => void;
    zoomTo100: () => void;
    zoomToLevel: (level: number) => void;
    zoomToSelection: () => void;
    startTextEditing: (nodeId: string) => void;
    commitTextEdit: () => void;
    getVariablesByType: (type: import("@open-pencil/scene-graph").VariableType) => import("@open-pencil/scene-graph").Variable[];
    getVariable: (id: string) => import("@open-pencil/scene-graph").Variable | undefined;
    resolveColorVariable: (id: string) => import("@open-pencil/scene-graph").Color | undefined;
    resolveNumberVariable: (id: string) => number | undefined;
    getVariablesForCollection: (collectionId: string) => import("@open-pencil/scene-graph").Variable[];
    getCollection: (id: string) => import("@open-pencil/scene-graph").VariableCollection | undefined;
    getCollections: () => import("@open-pencil/scene-graph").VariableCollection[];
    getCollectionCount: () => number;
    getVariableCount: () => number;
    renameCollection: (id: string, newName: string) => void;
    addCollection: (collection: import("@open-pencil/scene-graph").VariableCollection) => void;
    removeCollection: (id: string) => void;
    addVariable: (variable: import("@open-pencil/scene-graph").Variable) => void;
    removeVariable: (id: string) => void;
    renameVariable: (id: string, newName: string) => void;
    updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
    addMode: (collectionId: string, name?: string) => string | undefined;
    removeMode: (collectionId: string, modeId: string) => void;
    renameMode: (collectionId: string, modeId: string, newName: string) => void;
    setDefaultMode: (collectionId: string, modeId: string) => void;
    duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
    setActiveMode: (collectionId: string, modeId: string) => void;
    replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
    alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
    canDistributeNodes: (nodeIds: string[]) => boolean;
    distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    rotateNodes: (nodeIds: string[], degrees: number) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    flushNudge: () => void;
    bindVariable: (nodeId: string, path: string, variableId: string) => void;
    unbindVariable: (nodeId: string, path: string) => void;
    setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
    updateNode: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>) => void;
    updateNodeWithUndo: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    setOpacity: (opacity: number, coalesceKey?: string) => void;
    moveToPage: (pageId: string) => void;
    previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
    renameSelected: (options: RenameSelectionOptions) => void;
    renameNode: (id: string, name: string) => void;
    toggleNodeVisibility: (id: string) => void;
    toggleNodeLock: (id: string) => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    reparentNodes: (nodeIds: string[], newParentId: string) => void;
    wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: import("@open-pencil/scene-graph").SceneNode[], extraProps?: Partial<import("@open-pencil/scene-graph").SceneNode>) => string | null;
    reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
    reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    isTopLevel: (parentId: string | null) => boolean;
    adoptNodesIntoSection: (sectionId: string) => void;
    setTool: (tool: Tool$2) => void;
    createFrameFromPreset: (preset: FramePresetDimensions) => string;
    resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
    penAddVertex: (x: number, y: number) => void;
    penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
    penSetClosingToFirst: (closing: boolean) => void;
    penSetPendingClose: (closing: boolean) => void;
    penSetKnotPosition: (x: number, y: number) => void;
    penCommit: (closed: boolean) => void;
    penCancel: () => void;
    createShape: (type: import("@open-pencil/scene-graph").NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
    switchPage: (pageId: string) => Promise<void>;
    addPage: (name?: string) => string;
    deletePage: (pageId: string) => void;
    movePage: (pageId: string, index: number) => void;
    renamePage: (pageId: string, name: string) => void;
    setPageColor: (color: import("@open-pencil/scene-graph").Color) => void;
    clearPageViewports: () => void;
    hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => import("@open-pencil/scene-graph").SceneNode | null;
    selectAtPoint: (cx: number, cy: number) => void;
    getSelectedNodes: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    }[];
    getSelectedNode: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    } | undefined;
    getLayerTree: () => {
      node: import("@open-pencil/scene-graph").SceneNode;
      depth: number;
    }[];
    validateEnteredContainer: () => void;
    enterContainer: (id: string) => void;
    exitContainer: () => void;
    setMarquee: (rect: import("@open-pencil/scene-graph/primitives").Rect | null) => void;
    setSnapGuides: (guides: import("@open-pencil/scene-graph").SnapGuide[]) => void;
    setRotationPreview: (preview: {
      nodeId: string;
      angle: number;
    } | null) => void;
    setHoveredNode: (id: string | null) => void;
    setDropTarget: (id: string | null) => void;
    setLayoutInsertIndicator: (indicator: {
      parentId: string;
      index: number;
      x: number;
      y: number;
      length: number;
      direction: "HORIZONTAL" | "VERTICAL";
    } | null) => void;
    setAutoLayoutHover: (hover: {
      nodeId: string;
      kind: "frame" | "children" | "spacing" | "spacing-value" | "padding" | "padding-value";
      index?: number;
      side?: "top" | "right" | "bottom" | "left";
    } | null) => void;
    select: (ids: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    selectInverse: () => void;
    requestRender: () => void;
    requestRepaint: () => void;
    onEditorEvent: <K extends EditorEventName$2>(event: K, handler: EditorEvents$2[K]) => import("nanoevents").Unsubscribe;
    setCanvasKit: (ck: import("canvaskit-wasm").CanvasKit, renderer: SkiaRenderer) => void;
    removeCanvasRenderer: (renderer: SkiaRenderer) => void;
    replaceGraph: (newGraph: import("@open-pencil/scene-graph").SceneGraph) => void;
    subscribeToGraph: () => void;
    getNode: (id: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
    getChildren: (id: string) => import("@open-pencil/scene-graph").SceneNode[];
    getPages: (includeInternal?: boolean) => import("@open-pencil/scene-graph").SceneNode[];
    graph: import("@open-pencil/scene-graph").SceneGraph;
    renderer: SkiaRenderer | null;
    canvasRenderers: SkiaRenderer[];
    textEditor: TextEditor | null;
    undo: import("@open-pencil/scene-graph").UndoManager;
    state: EditorState$1;
  };
  collections: import("vue").ComputedRef<import("@open-pencil/scene-graph").VariableCollection[]>;
  activeCollectionId: import("vue").Ref<string, string>;
  activeCollection: import("vue").ComputedRef<import("@open-pencil/scene-graph").VariableCollection | null>;
  activeModes: import("vue").ComputedRef<import("@open-pencil/scene-graph").VariableCollectionMode[]>;
  variables: import("vue").ComputedRef<import("@open-pencil/scene-graph").Variable[]>;
  searchTerm: import("vue").Ref<string, string>;
  setSearchTerm: (term: string) => void;
};
//#endregion
//#region src/variables/editor/use.d.ts
/**
 * Composes variables dialog state, table columns, and TanStack table wiring
 * into a single higher-level variables editor API.
 */
declare function useVariablesEditor(options: {
  /** Component used for color variable editing. */colorInput: Component; /** Icon map keyed by variable resolved type. */
  icons: Record<string, Component>; /** Fallback icon when no specific icon matches a variable type. */
  fallbackIcon: Component; /** Icon used for destructive remove actions. */
  deleteIcon: Component;
}): {
  columns: import("vue").ComputedRef<import("@tanstack/vue-table").ColumnDef<import("@open-pencil/scene-graph").Variable>[]>;
  table: import("@tanstack/vue-table").Table<import("@open-pencil/scene-graph").Variable>;
  hasCollections: import("vue").ComputedRef<boolean>;
  collectionRename: InlineRenameState<string>;
  modeRename: InlineRenameState<string>;
  startRenameCollection: (id: string) => void;
  startRenameMode: (modeId: string) => void;
  addVariable: (type?: import("@open-pencil/scene-graph").VariableType) => void;
  removeVariable: (id: string) => void;
  renameVariable: (id: string, newName: string) => void;
  updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
  formatModeValue: (variable: import("@open-pencil/scene-graph").Variable, modeId: string) => string;
  parseVariableValue: (variable: import("@open-pencil/scene-graph").Variable, raw: string) => import("@open-pencil/scene-graph").VariableValue | undefined;
  shortName: (variable: import("@open-pencil/scene-graph").Variable) => string;
  setActiveCollection: (id: string) => void;
  addCollection: () => void;
  renameCollection: (id: string, newName: string) => void;
  removeCollection: (id: string) => void;
  addMode: () => string | undefined;
  removeMode: (modeId: string) => void;
  renameMode: (modeId: string, newName: string) => void;
  setDefaultMode: (modeId: string) => void;
  duplicateMode: (modeId: string) => string | undefined;
  setActiveMode: (modeId: string) => void;
  editor: {
    wrapInAutoLayout: () => void;
    groupSelected: () => string | null;
    frameSelection: () => string | null;
    booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
    flattenSelected: () => string | null;
    outlineTextSelected: () => string | null;
    outlineStrokeSelected: () => string | null;
    ungroupSelected: () => void;
    createComponentFromSelection: () => void;
    createComponentSetFromComponents: () => void;
    createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
    detachInstance: () => void;
    focusComponent: (componentId: string) => Promise<void>;
    goToMainComponent: () => Promise<void>;
    getComponentSetPropertyDefs: (componentSetId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    addPropertyDefinition: (componentSetId: string, name: string, type?: import("@open-pencil/scene-graph").ComponentPropertyType, defaultValue?: string) => string | undefined;
    removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
    renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
    collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
    findVariantByValues: (componentSetId: string, values: Record<string, string>) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getDefaultVariantForComponentSet: (componentSetId: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
    switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
    getInstanceComponentPropertyDefinitions: (instanceId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    getInstanceComponentPropertyValue: (instanceId: string, definition: import("@open-pencil/scene-graph").ComponentPropertyDefinition) => string;
    setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
    duplicateSelected: () => void;
    writeCopyData: (data: DataTransfer) => Promise<void>;
    pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
      replaceSelection?: boolean;
    }) => Promise<void>;
    deleteSelected: () => void;
    storeImage: (bytes: Uint8Array) => string;
    placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
    copySelectionAsText: (ids: string[]) => string;
    copySelectionAsSVG: (ids: string[]) => string | null;
    copySelectionAsJSX: (ids: string[]) => string | null;
    setDocumentColorSpace: (colorSpace: import("@open-pencil/scene-graph").DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
    commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
    commitMoveWithReparent: (originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>) => void;
    commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
    commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<import("@open-pencil/scene-graph").SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
    commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    }>) => void;
    commitRotation: (nodeId: string, origRotation: number) => void;
    commitNodeUpdate: (nodeId: string, previous: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    undoAction: () => void;
    redoAction: () => void;
    snapshotPage: () => PageSnapshot;
    restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
    pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
    screenToCanvas: (sx: number, sy: number) => {
      x: number;
      y: number;
    };
    setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
    applyZoom: (delta: number, centerX: number, centerY: number) => void;
    pan: (dx: number, dy: number) => void;
    zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
    zoomToFit: () => void;
    zoomTo100: () => void;
    zoomToLevel: (level: number) => void;
    zoomToSelection: () => void;
    startTextEditing: (nodeId: string) => void;
    commitTextEdit: () => void;
    getVariablesByType: (type: import("@open-pencil/scene-graph").VariableType) => import("@open-pencil/scene-graph").Variable[];
    getVariable: (id: string) => import("@open-pencil/scene-graph").Variable | undefined;
    resolveColorVariable: (id: string) => import("@open-pencil/scene-graph").Color | undefined;
    resolveNumberVariable: (id: string) => number | undefined;
    getVariablesForCollection: (collectionId: string) => import("@open-pencil/scene-graph").Variable[];
    getCollection: (id: string) => import("@open-pencil/scene-graph").VariableCollection | undefined;
    getCollections: () => import("@open-pencil/scene-graph").VariableCollection[];
    getCollectionCount: () => number;
    getVariableCount: () => number;
    renameCollection: (id: string, newName: string) => void;
    addCollection: (collection: import("@open-pencil/scene-graph").VariableCollection) => void;
    removeCollection: (id: string) => void;
    addVariable: (variable: import("@open-pencil/scene-graph").Variable) => void;
    removeVariable: (id: string) => void;
    renameVariable: (id: string, newName: string) => void;
    updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
    addMode: (collectionId: string, name?: string) => string | undefined;
    removeMode: (collectionId: string, modeId: string) => void;
    renameMode: (collectionId: string, modeId: string, newName: string) => void;
    setDefaultMode: (collectionId: string, modeId: string) => void;
    duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
    setActiveMode: (collectionId: string, modeId: string) => void;
    replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
    alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
    canDistributeNodes: (nodeIds: string[]) => boolean;
    distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    rotateNodes: (nodeIds: string[], degrees: number) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    flushNudge: () => void;
    bindVariable: (nodeId: string, path: string, variableId: string) => void;
    unbindVariable: (nodeId: string, path: string) => void;
    setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
    updateNode: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>) => void;
    updateNodeWithUndo: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    setOpacity: (opacity: number, coalesceKey?: string) => void;
    moveToPage: (pageId: string) => void;
    previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
    renameSelected: (options: RenameSelectionOptions) => void;
    renameNode: (id: string, name: string) => void;
    toggleNodeVisibility: (id: string) => void;
    toggleNodeLock: (id: string) => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    reparentNodes: (nodeIds: string[], newParentId: string) => void;
    wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: import("@open-pencil/scene-graph").SceneNode[], extraProps?: Partial<import("@open-pencil/scene-graph").SceneNode>) => string | null;
    reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
    reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    isTopLevel: (parentId: string | null) => boolean;
    adoptNodesIntoSection: (sectionId: string) => void;
    setTool: (tool: Tool$2) => void;
    createFrameFromPreset: (preset: FramePresetDimensions) => string;
    resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
    penAddVertex: (x: number, y: number) => void;
    penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
    penSetClosingToFirst: (closing: boolean) => void;
    penSetPendingClose: (closing: boolean) => void;
    penSetKnotPosition: (x: number, y: number) => void;
    penCommit: (closed: boolean) => void;
    penCancel: () => void;
    createShape: (type: import("@open-pencil/scene-graph").NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
    switchPage: (pageId: string) => Promise<void>;
    addPage: (name?: string) => string;
    deletePage: (pageId: string) => void;
    movePage: (pageId: string, index: number) => void;
    renamePage: (pageId: string, name: string) => void;
    setPageColor: (color: import("@open-pencil/scene-graph").Color) => void;
    clearPageViewports: () => void;
    hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => import("@open-pencil/scene-graph").SceneNode | null;
    selectAtPoint: (cx: number, cy: number) => void;
    getSelectedNodes: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    }[];
    getSelectedNode: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    } | undefined;
    getLayerTree: () => {
      node: import("@open-pencil/scene-graph").SceneNode;
      depth: number;
    }[];
    validateEnteredContainer: () => void;
    enterContainer: (id: string) => void;
    exitContainer: () => void;
    setMarquee: (rect: import("@open-pencil/scene-graph/primitives").Rect | null) => void;
    setSnapGuides: (guides: import("@open-pencil/scene-graph").SnapGuide[]) => void;
    setRotationPreview: (preview: {
      nodeId: string;
      angle: number;
    } | null) => void;
    setHoveredNode: (id: string | null) => void;
    setDropTarget: (id: string | null) => void;
    setLayoutInsertIndicator: (indicator: {
      parentId: string;
      index: number;
      x: number;
      y: number;
      length: number;
      direction: "HORIZONTAL" | "VERTICAL";
    } | null) => void;
    setAutoLayoutHover: (hover: {
      nodeId: string;
      kind: "frame" | "children" | "spacing" | "spacing-value" | "padding" | "padding-value";
      index?: number;
      side?: "top" | "right" | "bottom" | "left";
    } | null) => void;
    select: (ids: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    selectInverse: () => void;
    requestRender: () => void;
    requestRepaint: () => void;
    onEditorEvent: <K extends EditorEventName$2>(event: K, handler: EditorEvents$2[K]) => import("nanoevents").Unsubscribe;
    setCanvasKit: (ck: import("canvaskit-wasm").CanvasKit, renderer: SkiaRenderer) => void;
    removeCanvasRenderer: (renderer: SkiaRenderer) => void;
    replaceGraph: (newGraph: import("@open-pencil/scene-graph").SceneGraph) => void;
    subscribeToGraph: () => void;
    getNode: (id: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
    getChildren: (id: string) => import("@open-pencil/scene-graph").SceneNode[];
    getPages: (includeInternal?: boolean) => import("@open-pencil/scene-graph").SceneNode[];
    graph: import("@open-pencil/scene-graph").SceneGraph;
    renderer: SkiaRenderer | null;
    canvasRenderers: SkiaRenderer[];
    textEditor: TextEditor | null;
    undo: import("@open-pencil/scene-graph").UndoManager;
    state: EditorState$1;
  };
  collections: import("vue").ComputedRef<import("@open-pencil/scene-graph").VariableCollection[]>;
  activeCollectionId: import("vue").Ref<string, string>;
  activeCollection: import("vue").ComputedRef<import("@open-pencil/scene-graph").VariableCollection | null>;
  activeModes: import("vue").ComputedRef<import("@open-pencil/scene-graph").VariableCollectionMode[]>;
  variables: import("vue").ComputedRef<import("@open-pencil/scene-graph").Variable[]>;
  searchTerm: import("vue").Ref<string, string>;
  setSearchTerm: (term: string) => void;
};
//#endregion
//#region src/variables/table/helpers.d.ts
interface VariablesTableOptions {
  activeModes: ComputedRef<{
    modeId: string;
    name: string;
  }[]>;
  formatModeValue: (variable: Variable, modeId: string) => string;
  parseVariableValue: (variable: Variable, raw: string) => VariableValue | undefined;
  shortName: (variable: Variable) => string;
  renameVariable: (id: string, newName: string) => void;
  updateVariableValue: (id: string, modeId: string, value: VariableValue) => void;
  removeVariable: (id: string) => void;
  ColorInput: Component;
  icons: Record<string, Component>;
  fallbackIcon: Component;
  deleteIcon: Component;
}
//#endregion
//#region src/variables/table/use.d.ts
declare function useVariablesTable(options: VariablesTableOptions): {
  columns: import("vue").ComputedRef<import("@tanstack/vue-table").ColumnDef<import("@open-pencil/scene-graph").Variable>[]>;
};
//#endregion
//#region src/primitives/PageList/usePageList.d.ts
/**
 * Returns reactive page state and page-management actions.
 *
 * Use this composable to build page switchers, page lists, or navigation
 * panels without manually reading the graph in each component.
 */
declare function usePageList(): {
  editor: {
    wrapInAutoLayout: () => void;
    groupSelected: () => string | null;
    frameSelection: () => string | null;
    booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
    flattenSelected: () => string | null;
    outlineTextSelected: () => string | null;
    outlineStrokeSelected: () => string | null;
    ungroupSelected: () => void;
    createComponentFromSelection: () => void;
    createComponentSetFromComponents: () => void;
    createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
    detachInstance: () => void;
    focusComponent: (componentId: string) => Promise<void>;
    goToMainComponent: () => Promise<void>;
    getComponentSetPropertyDefs: (componentSetId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    addPropertyDefinition: (componentSetId: string, name: string, type?: import("@open-pencil/scene-graph").ComponentPropertyType, defaultValue?: string) => string | undefined;
    removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
    renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
    collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
    findVariantByValues: (componentSetId: string, values: Record<string, string>) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getDefaultVariantForComponentSet: (componentSetId: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
    switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
    getInstanceComponentPropertyDefinitions: (instanceId: string) => import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
    getInstanceComponentPropertyValue: (instanceId: string, definition: import("@open-pencil/scene-graph").ComponentPropertyDefinition) => string;
    setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
    duplicateSelected: () => void;
    writeCopyData: (data: DataTransfer) => Promise<void>;
    pasteFromHTML: (html: string, cursorPos?: import("@open-pencil/scene-graph").Vector, options?: {
      replaceSelection?: boolean;
    }) => Promise<void>;
    deleteSelected: () => void;
    storeImage: (bytes: Uint8Array) => string;
    placeFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    placeImageFiles: (files: File[], cx: number, cy: number) => Promise<void>;
    loadFontsForNodes: (nodeIds: string[]) => Promise<[string, string][]>;
    copySelectionAsText: (ids: string[]) => string;
    copySelectionAsSVG: (ids: string[]) => string | null;
    copySelectionAsJSX: (ids: string[]) => string | null;
    setDocumentColorSpace: (colorSpace: import("@open-pencil/scene-graph").DocumentColorSpace, mode?: DocumentColorProfileMode) => void;
    commitMove: (originals: Map<string, import("@open-pencil/scene-graph").Vector>) => void;
    commitMoveWithReparent: (originals: Map<string, {
      x: number;
      y: number;
      parentId: string;
    }>) => void;
    commitDuplicateMove: (rootIds: string[], previousSelection: Set<string>) => void;
    commitResize: (nodeId: string, original: import("@open-pencil/scene-graph/primitives").Rect & Partial<Pick<import("@open-pencil/scene-graph").SceneNode, "vectorNetwork" | "fillGeometry" | "strokeGeometry">>) => void;
    commitGroupResize: (nodeId: string, origRect: import("@open-pencil/scene-graph/primitives").Rect, origChildren: Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
    }>) => void;
    commitRotation: (nodeId: string, origRotation: number) => void;
    commitNodeUpdate: (nodeId: string, previous: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    undoAction: () => void;
    redoAction: () => void;
    snapshotPage: () => PageSnapshot;
    restorePageFromSnapshot: (snapshot: PageSnapshot) => void;
    pushUndoEntry: (entry: import("@open-pencil/scene-graph").UndoEntry) => void;
    screenToCanvas: (sx: number, sy: number) => {
      x: number;
      y: number;
    };
    setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
    applyZoom: (delta: number, centerX: number, centerY: number) => void;
    pan: (dx: number, dy: number) => void;
    zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
    zoomToFit: () => void;
    zoomTo100: () => void;
    zoomToLevel: (level: number) => void;
    zoomToSelection: () => void;
    startTextEditing: (nodeId: string) => void;
    commitTextEdit: () => void;
    getVariablesByType: (type: import("@open-pencil/scene-graph").VariableType) => import("@open-pencil/scene-graph").Variable[];
    getVariable: (id: string) => import("@open-pencil/scene-graph").Variable | undefined;
    resolveColorVariable: (id: string) => import("@open-pencil/scene-graph").Color | undefined;
    resolveNumberVariable: (id: string) => number | undefined;
    getVariablesForCollection: (collectionId: string) => import("@open-pencil/scene-graph").Variable[];
    getCollection: (id: string) => import("@open-pencil/scene-graph").VariableCollection | undefined;
    getCollections: () => import("@open-pencil/scene-graph").VariableCollection[];
    getCollectionCount: () => number;
    getVariableCount: () => number;
    renameCollection: (id: string, newName: string) => void;
    addCollection: (collection: import("@open-pencil/scene-graph").VariableCollection) => void;
    removeCollection: (id: string) => void;
    addVariable: (variable: import("@open-pencil/scene-graph").Variable) => void;
    removeVariable: (id: string) => void;
    renameVariable: (id: string, newName: string) => void;
    updateVariableValue: (id: string, modeId: string, value: import("@open-pencil/scene-graph").VariableValue) => void;
    addMode: (collectionId: string, name?: string) => string | undefined;
    removeMode: (collectionId: string, modeId: string) => void;
    renameMode: (collectionId: string, modeId: string, newName: string) => void;
    setDefaultMode: (collectionId: string, modeId: string) => void;
    duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
    setActiveMode: (collectionId: string, modeId: string) => void;
    replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
    alignNodes: (nodeIds: string[], axis: "horizontal" | "vertical", align: "min" | "center" | "max") => void;
    canDistributeNodes: (nodeIds: string[]) => boolean;
    distributeNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    flipNodes: (nodeIds: string[], axis: "horizontal" | "vertical") => void;
    rotateNodes: (nodeIds: string[], degrees: number) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    flushNudge: () => void;
    bindVariable: (nodeId: string, path: string, variableId: string) => void;
    unbindVariable: (nodeId: string, path: string) => void;
    setLayoutMode: (id: string, mode: import("@open-pencil/scene-graph").LayoutMode) => void;
    updateNode: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>) => void;
    updateNodeWithUndo: (id: string, changes: Partial<import("@open-pencil/scene-graph").SceneNode>, label?: string) => void;
    setOpacity: (opacity: number, coalesceKey?: string) => void;
    moveToPage: (pageId: string) => void;
    previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
    renameSelected: (options: RenameSelectionOptions) => void;
    renameNode: (id: string, name: string) => void;
    toggleNodeVisibility: (id: string) => void;
    toggleNodeLock: (id: string) => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    reparentNodes: (nodeIds: string[], newParentId: string) => void;
    wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: import("@open-pencil/scene-graph").SceneNode[], extraProps?: Partial<import("@open-pencil/scene-graph").SceneNode>) => string | null;
    reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
    reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    isTopLevel: (parentId: string | null) => boolean;
    adoptNodesIntoSection: (sectionId: string) => void;
    setTool: (tool: Tool$2) => void;
    createFrameFromPreset: (preset: FramePresetDimensions) => string;
    resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
    penAddVertex: (x: number, y: number) => void;
    penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
    penSetClosingToFirst: (closing: boolean) => void;
    penSetPendingClose: (closing: boolean) => void;
    penSetKnotPosition: (x: number, y: number) => void;
    penCommit: (closed: boolean) => void;
    penCancel: () => void;
    createShape: (type: import("@open-pencil/scene-graph").NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
    switchPage: (pageId: string) => Promise<void>;
    addPage: (name?: string) => string;
    deletePage: (pageId: string) => void;
    movePage: (pageId: string, index: number) => void;
    renamePage: (pageId: string, name: string) => void;
    setPageColor: (color: import("@open-pencil/scene-graph").Color) => void;
    clearPageViewports: () => void;
    hitTestAtPoint: (cx: number, cy: number, deep?: boolean) => import("@open-pencil/scene-graph").SceneNode | null;
    selectAtPoint: (cx: number, cy: number) => void;
    getSelectedNodes: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    }[];
    getSelectedNode: () => {
      id: string;
      type: import("@open-pencil/scene-graph").NodeType;
      name: string;
      parentId: string | null;
      childIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      source: import("@open-pencil/scene-graph").SourceMetadata;
      figmaDerivedLayout: Partial<import("@open-pencil/scene-graph/primitives").Rect> | null;
      fills: import("@open-pencil/scene-graph").Fill[];
      strokes: import("@open-pencil/scene-graph").Stroke[];
      effects: import("@open-pencil/scene-graph").Effect[];
      layoutGrids: import("@open-pencil/scene-graph").LayoutGrid[];
      fillStyleId: string | null;
      strokeStyleId: string | null;
      textStyleId: string | null;
      effectStyleId: string | null;
      gridStyleId: string | null;
      sharedStyleType: import("@open-pencil/scene-graph").SharedStyleType | null;
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
      blendMode: import("@open-pencil/scene-graph").BlendMode;
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: number;
      italic: boolean;
      textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
      textDirection: import("@open-pencil/scene-graph").TextDirection;
      textLanguage: string | null;
      textAlignVertical: import("@open-pencil/scene-graph").TextAlignVertical;
      textAutoResize: import("@open-pencil/scene-graph").TextAutoResize;
      textCase: import("@open-pencil/scene-graph").TextCase;
      textDecoration: import("@open-pencil/scene-graph").TextDecoration;
      textDecorationStyle: import("@open-pencil/scene-graph").TextDecorationStyle;
      textDecorationThickness: number | null;
      textDecorationFills: import("@open-pencil/scene-graph").Fill[];
      textDecorationSkipInk: boolean;
      textUnderlineOffset: number | null;
      leadingTrim: import("@open-pencil/scene-graph").LeadingTrim;
      lineHeight: number | null;
      letterSpacing: number;
      maxLines: number | null;
      styleRuns: import("@open-pencil/scene-graph").StyleRun[];
      fontVariations: import("@open-pencil/scene-graph").FontVariation[];
      fontFeatures: import("@open-pencil/scene-graph").FontFeature[];
      horizontalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      verticalConstraint: import("@open-pencil/scene-graph").ConstraintType;
      layoutMode: import("@open-pencil/scene-graph").LayoutMode;
      layoutDirection: import("@open-pencil/scene-graph").LayoutDirection;
      layoutWrap: import("@open-pencil/scene-graph").LayoutWrap;
      primaryAxisAlign: import("@open-pencil/scene-graph").LayoutAlign;
      counterAxisAlign: import("@open-pencil/scene-graph").LayoutCounterAlign;
      primaryAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      counterAxisSizing: import("@open-pencil/scene-graph").LayoutSizing;
      itemSpacing: number;
      counterAxisSpacing: number;
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;
      layoutPositioning: "AUTO" | "ABSOLUTE";
      layoutGrow: number;
      layoutAlignSelf: import("@open-pencil/scene-graph").LayoutAlignSelf;
      vectorNetwork: import("@open-pencil/scene-graph").VectorNetwork | null;
      handleMirroring: import("@open-pencil/scene-graph").HandleMirroring;
      booleanOperation?: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
      fillGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      strokeGeometry: import("@open-pencil/scene-graph").GeometryPath[];
      arcData: import("@open-pencil/scene-graph").ArcData | null;
      strokeCap: import("@open-pencil/scene-graph").StrokeCap;
      strokeJoin: import("@open-pencil/scene-graph").StrokeJoin;
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
      maskType: import("@open-pencil/scene-graph").MaskType;
      maskIsOutline: boolean;
      gridTemplateColumns: import("@open-pencil/scene-graph").GridTrack[];
      gridTemplateRows: import("@open-pencil/scene-graph").GridTrack[];
      gridColumnGap: number;
      gridRowGap: number;
      gridPosition: import("@open-pencil/scene-graph").GridPosition | null;
      counterAxisAlignContent: "AUTO" | "SPACE_BETWEEN";
      itemReverseZIndex: boolean;
      strokesIncludedInLayout: boolean;
      expanded: boolean;
      textTruncation: "DISABLED" | "ENDING";
      autoRename: boolean;
      pointCount: number;
      starInnerRadius: number;
      componentId: string | null;
      overrides: Record<string, unknown>;
      componentPropertyDefinitions: import("@open-pencil/scene-graph").ComponentPropertyDefinition[];
      componentPropertyReferences: import("@open-pencil/scene-graph").ComponentPropertyReference[];
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
      symbolLinks: import("@open-pencil/scene-graph").SymbolLink[];
      variantPropSpecs: import("@open-pencil/scene-graph").VariantPropSpec[];
      boundVariables: Record<string, string>;
      variableModes: import("@open-pencil/scene-graph").VariableModeMap;
      exportSettings: import("@open-pencil/scene-graph").ExportSetting[];
      pluginData: import("@open-pencil/scene-graph").PluginDataEntry[];
      pluginRelaunchData: import("@open-pencil/scene-graph").PluginRelaunchDataEntry[];
      internalOnly: boolean;
      flipX: boolean;
      flipY: boolean;
      textPicture: Uint8Array | null;
      figmaDerivedTextGlyphs: import("@open-pencil/scene-graph").FigmaDerivedTextGlyph[] | null;
    } | undefined;
    getLayerTree: () => {
      node: import("@open-pencil/scene-graph").SceneNode;
      depth: number;
    }[];
    validateEnteredContainer: () => void;
    enterContainer: (id: string) => void;
    exitContainer: () => void;
    setMarquee: (rect: import("@open-pencil/scene-graph/primitives").Rect | null) => void;
    setSnapGuides: (guides: import("@open-pencil/scene-graph").SnapGuide[]) => void;
    setRotationPreview: (preview: {
      nodeId: string;
      angle: number;
    } | null) => void;
    setHoveredNode: (id: string | null) => void;
    setDropTarget: (id: string | null) => void;
    setLayoutInsertIndicator: (indicator: {
      parentId: string;
      index: number;
      x: number;
      y: number;
      length: number;
      direction: "HORIZONTAL" | "VERTICAL";
    } | null) => void;
    setAutoLayoutHover: (hover: {
      nodeId: string;
      kind: "frame" | "children" | "spacing" | "spacing-value" | "padding" | "padding-value";
      index?: number;
      side?: "top" | "right" | "bottom" | "left";
    } | null) => void;
    select: (ids: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    selectInverse: () => void;
    requestRender: () => void;
    requestRepaint: () => void;
    onEditorEvent: <K extends EditorEventName$2>(event: K, handler: EditorEvents$2[K]) => import("nanoevents").Unsubscribe;
    setCanvasKit: (ck: import("canvaskit-wasm").CanvasKit, renderer: SkiaRenderer) => void;
    removeCanvasRenderer: (renderer: SkiaRenderer) => void;
    replaceGraph: (newGraph: import("@open-pencil/scene-graph").SceneGraph) => void;
    subscribeToGraph: () => void;
    getNode: (id: string) => import("@open-pencil/scene-graph").SceneNode | undefined;
    getImage: (hash: string) => Uint8Array<ArrayBufferLike> | undefined;
    getChildren: (id: string) => import("@open-pencil/scene-graph").SceneNode[];
    getPages: (includeInternal?: boolean) => import("@open-pencil/scene-graph").SceneNode[];
    graph: import("@open-pencil/scene-graph").SceneGraph;
    renderer: SkiaRenderer | null;
    canvasRenderers: SkiaRenderer[];
    textEditor: TextEditor | null;
    undo: import("@open-pencil/scene-graph").UndoManager;
    state: EditorState$1;
  };
  pages: import("vue").ComputedRef<import("@open-pencil/scene-graph").SceneNode[]>;
  currentPageId: import("vue").ComputedRef<string>;
  switchPage: (pageId: string) => Promise<void>;
  addPage: (name?: string) => string;
  deletePage: (pageId: string) => void;
  movePage: (pageId: string, index: number) => void;
  renamePage: (pageId: string, name: string) => void;
};
//#endregion
//#region src/controls/binding-provider/types.d.ts
type BindingState = 'unbound' | 'bound' | 'mixed';
type BoundEditPolicy = 'detach-on-edit' | 'readonly-when-bound' | 'edit-variable';
type BindingMutationSource = 'edit' | 'scrub' | 'step';
interface BindingTarget {
  nodeId: string;
  path: string;
}
interface BindingProvider<V = unknown> {
  /** Optional reactive revision consumed by BindableValueRoot. */
  revision?: Readonly<Ref<unknown>>;
  listVariables(): Variable[];
  filterVariables(term: string): Variable[];
  getBound(target: BindingTarget): Variable | undefined;
  getState(targets: BindingTarget[]): BindingState;
  resolve(variableId: string): V | undefined;
  bind(target: BindingTarget, variableId: string): void;
  unbind(target: BindingTarget): void;
  create?(target: BindingTarget, value: V, name: string): void;
  setValue?(variableId: string, value: V): void;
  runBatch?<T>(label: string, action: () => T): T;
  beginBatch?(label: string): void;
  commitBatch?(): void;
  rollbackBatch?(): void;
}
//#endregion
//#region src/primitives/BindableValue/types.d.ts
type BindableValueTriggerProps = PrimitiveProps;
interface BindableValueRootProps<V = unknown> {
  /** Binding implementation. Falls back to the nearest injected provider. */
  provider?: BindingProvider<V>;
  /** Node/property pairs participating in this binding. */
  targets: BindingTarget[];
  /** Direct field value used when the targets are not consistently bound. */
  value: V;
  /** Behavior when a consistently bound field is edited. @default 'detach-on-edit' */
  policy?: BoundEditPolicy;
  /** Undo label for a field interaction transaction. @default 'Edit bound value' */
  batchLabel?: string;
}
interface BindableValueStateAttrs {
  'data-unbound'?: '';
  'data-bound'?: '';
  'data-mixed'?: '';
  'data-picker-open'?: '';
  'data-policy': BoundEditPolicy;
}
interface BindableValueActions<V = unknown> {
  bind(variableId: string): void;
  unbind(): void;
  create(name: string): void;
  openPicker(): void;
  closePicker(): void;
  togglePicker(): void;
  setSearchTerm(term: string): void;
  beginMutation(source: BindingMutationSource): boolean;
  applyValue(value: V): boolean;
  commitMutation(): void;
  cancelMutation(): void;
}
interface BindableValueSlotProps<V = unknown> {
  state: BindingState;
  variable: Variable | undefined;
  resolvedValue: V | undefined;
  policy: BoundEditPolicy;
  open: boolean;
  searchTerm: string;
  variables: Variable[];
  stateAttrs: BindableValueStateAttrs;
  actions: BindableValueActions<V>;
}
interface BindableValueRootSlots<V = unknown> {
  /** Complete render contract for binding-aware controls. */
  default(props: BindableValueSlotProps<V>): VNode[];
}
interface BindableValueContext<V = unknown> {
  provider: BindingProvider<V>;
  targets: ComputedRef<BindingTarget[]>;
  value: ComputedRef<V>;
  state: ComputedRef<BindingState>;
  variable: ComputedRef<Variable | undefined>;
  resolvedValue: ComputedRef<V | undefined>;
  policy: ComputedRef<BoundEditPolicy>;
  open: Ref<boolean>;
  searchTerm: Ref<string>;
  variables: ComputedRef<Variable[]>;
  stateAttrs: ComputedRef<BindableValueStateAttrs>;
  slotProps: ComputedRef<BindableValueSlotProps<V>>;
  actions: BindableValueActions<V>;
}
//#endregion
//#region src/primitives/Fill/types.d.ts
type FillCategory = 'SOLID' | 'GRADIENT' | 'IMAGE';
interface FillActions {
  toSolid: () => void;
  toGradient: () => void;
  toImage: () => void;
}
interface FillRootSlotProps {
  fill: Fill;
  category: FillCategory;
  swatchBackground: string;
  transparent: boolean;
  actions: FillActions;
}
interface FillRootSlots {
  default?: (props: FillRootSlotProps) => unknown;
}
interface FillSwatchProps extends PrimitiveProps {
  /** Fill represented by the swatch. */
  fill: Fill;
  /** Accessible name for the preview. */
  label?: string;
}
interface FillSwatchSlotProps {
  fill: Fill;
  color: Color$1;
  category: FillCategory;
  background: string;
  transparent: boolean;
  bindingState: BindingState | undefined;
  stateAttrs: BindableValueStateAttrs | undefined;
}
interface FillSwatchSlots {
  default?: (props: FillSwatchSlotProps) => unknown;
}
//#endregion
//#region src/primitives/Fill/FillRoot.vue.d.ts
type __VLS_Props$11 = {
  fill: Fill;
};
type __VLS_Slots$34 = FillRootSlots;
declare const __VLS_base$34: import("vue").DefineComponent<__VLS_Props$11, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
  update: (fill: Fill) => any;
}, string, import("vue").PublicProps, Readonly<__VLS_Props$11> & Readonly<{
  onUpdate?: ((fill: Fill) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$42: __VLS_WithSlots$34<typeof __VLS_base$34, __VLS_Slots$34>;
declare const _default$12: typeof __VLS_export$42;
type __VLS_WithSlots$34<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=FillRoot.vue.d.ts.map
//#endregion
//#region src/primitives/Fill/FillSwatch.vue.d.ts
type __VLS_Slots$33 = FillSwatchSlots;
declare const __VLS_base$33: import("vue").DefineComponent<FillSwatchProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<FillSwatchProps> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$41: __VLS_WithSlots$33<typeof __VLS_base$33, __VLS_Slots$33>;
declare const _default$13: typeof __VLS_export$41;
type __VLS_WithSlots$33<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=FillSwatch.vue.d.ts.map
//#endregion
//#region src/primitives/Fill/useFill.d.ts
declare function fillCategory(fill: Fill): FillCategory;
declare function fillIsTransparent(fill: Fill): boolean;
declare function fillSwatchBackground(fill: Fill): string;
/** Fill category state and immutable conversion actions without picker or popover behavior. */
declare function useFill(fill: Ref<Fill>, onUpdate: (fill: Fill) => void): {
  category: import("vue").ComputedRef<FillCategory>;
  swatchBackground: import("vue").ComputedRef<string>;
  transparent: import("vue").ComputedRef<boolean>;
  actions: {
    toSolid: () => void;
    toGradient: () => void;
    toImage: () => void;
  };
  toSolid: () => void;
  toGradient: () => void;
  toImage: () => void;
};
//#endregion
//#region src/primitives/GradientEditor/useGradientStops.d.ts
type GradientSubtype = 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND';
/**
 * Returns gradient-stop state and mutation helpers for a fill.
 *
 * Use this composable for gradient editors that need subtype switching,
 * active-stop selection, stop dragging, and stop color/opacity editing.
 */
declare function useGradientStops(fill: Ref<Fill>, onUpdate: (fill: Fill) => void): {
  activeStopIndex: Ref<number, number>;
  stops: import("vue").ComputedRef<GradientStop[]>;
  subtype: import("vue").ComputedRef<GradientSubtype>;
  subtypes: {
    value: GradientSubtype;
    label: string;
  }[];
  activeColor: import("vue").ComputedRef<Color$1>;
  barBackground: import("vue").ComputedRef<string>;
  setSubtype: (type: GradientSubtype) => void;
  selectStop: (index: number) => void;
  addStop: () => void;
  removeStop: (index: number) => void;
  updateStopPosition: (index: number, position: number) => void;
  updateStopColor: (index: number, hex: string) => void;
  updateStopOpacity: (index: number, opacity: number) => void;
  updateActiveColor: (color: Color$1) => void;
  dragStop: (index: number, position: number) => void;
};
//#endregion
//#region src/primitives/FontPicker/useFontPicker.d.ts
type FontAccessState = 'unsupported' | 'prompt' | 'granted' | 'denied';
interface FontAccessController {
  state: () => FontAccessState;
  load: () => Promise<string[] | FontFamilyOption$1[]>;
}
/**
 * Options for {@link useFontPicker}.
 */
interface UseFontPickerOptions {
  /** Writable model for the selected font family. */
  modelValue: {
    value: string;
  };
  /** Async source for available font families. */
  listFamilies: () => Promise<string[] | FontFamilyOption$1[]>;
  /** Host-provided local-font permission controller. */
  localFontAccess?: FontAccessController;
  /** Optional callback fired after a family is selected. */
  onSelect?: (family: string) => void;
}
/**
 * Returns searchable font-picker state and selection helpers.
 */
declare function useFontPicker(options: UseFontPickerOptions): {
  families: import("vue").Ref<{
    family: string;
    source: FontFamilySource$1;
  }[], FontFamilyOption$1[] | {
    family: string;
    source: FontFamilySource$1;
  }[]>;
  searchTerm: import("vue").Ref<string, string>;
  open: import("vue").Ref<boolean, boolean>;
  filtered: import("vue").ComputedRef<{
    family: string;
    source: FontFamilySource$1;
  }[]>;
  loading: import("vue").Ref<boolean, boolean>;
  accessState: import("vue").Ref<FontAccessState, FontAccessState>;
  requestAccess: () => Promise<void>;
  select: (family: string) => void;
};
//#endregion
//#region src/canvas/CanvasRoot.vue.d.ts
declare var __VLS_1$9: {
  canvasRef: HTMLCanvasElement | null;
  ready: boolean;
  renderNow: () => void;
};
type __VLS_Slots$32 = {} & {
  default?: (props: typeof __VLS_1$9) => any;
};
declare const __VLS_base$32: import("vue").DefineComponent<UseCanvasOptions, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<UseCanvasOptions> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$40: __VLS_WithSlots$32<typeof __VLS_base$32, __VLS_Slots$32>;
declare const _default$4: typeof __VLS_export$40;
type __VLS_WithSlots$32<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=CanvasRoot.vue.d.ts.map
//#endregion
//#region src/canvas/CanvasSurface.vue.d.ts
declare const _default$5: typeof __VLS_export$39;
declare const __VLS_export$39: import("vue").DefineComponent<{}, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>; //# sourceMappingURL=CanvasSurface.vue.d.ts.map
//#endregion
//#region src/canvas/context/index.d.ts
interface CanvasContext {
  canvasRef: Ref<HTMLCanvasElement | null>;
  ready: Ref<boolean>;
  renderNow: () => void;
  hitTestSectionTitle: (cx: number, cy: number) => SceneNode | null;
  hitTestComponentLabel: (cx: number, cy: number) => SceneNode | null;
  hitTestFrameTitle: (cx: number, cy: number) => SceneNode | null;
}
declare function useCanvasContext(): CanvasContext;
//#endregion
//#region src/primitives/ColorPicker/ColorInputRoot.vue.d.ts
type __VLS_Props$10 = {
  color: Color$1;
  editable?: boolean;
  okhcl?: OkHCLControls | null;
};
declare var __VLS_1$8: {
  color: Color$1;
  editable: boolean;
  hex: string;
  actions: {
    updateFromHex: (input: string) => Color$1;
    updateColor: (nextColor: Color$1) => Color$1;
  };
  okhcl: OkHCLControls | null;
};
type __VLS_Slots$31 = {} & {
  default?: (props: typeof __VLS_1$8) => any;
};
declare const __VLS_base$31: import("vue").DefineComponent<__VLS_Props$10, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
  update: (color: Color$1) => any;
}, string, import("vue").PublicProps, Readonly<__VLS_Props$10> & Readonly<{
  onUpdate?: ((color: Color$1) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$38: __VLS_WithSlots$31<typeof __VLS_base$31, __VLS_Slots$31>;
declare const _default$9: typeof __VLS_export$38;
type __VLS_WithSlots$31<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=ColorInputRoot.vue.d.ts.map
//#endregion
//#region src/primitives/ColorPicker/ColorPickerRoot.vue.d.ts
interface ColorPickerUI {
  content?: string;
  swatch?: string;
}
type __VLS_Props$9 = {
  color: Color$1;
  label?: string;
  ui?: ColorPickerUI;
};
declare var __VLS_16: {
    style: {
      background: string;
    };
  }, __VLS_32: {
    color: Color$1;
  };
type __VLS_Slots$30 = {} & {
  trigger?: (props: typeof __VLS_16) => any;
} & {
  default?: (props: typeof __VLS_32) => any;
};
declare const __VLS_base$30: import("vue").DefineComponent<__VLS_Props$9, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
  cancel: () => any;
  update: (color: Color$1) => any;
  openChange: (open: boolean) => any;
}, string, import("vue").PublicProps, Readonly<__VLS_Props$9> & Readonly<{
  onCancel?: (() => any) | undefined;
  onUpdate?: ((color: Color$1) => any) | undefined;
  onOpenChange?: ((open: boolean) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$37: __VLS_WithSlots$30<typeof __VLS_base$30, __VLS_Slots$30>;
declare const _default$10: typeof __VLS_export$37;
type __VLS_WithSlots$30<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=ColorPickerRoot.vue.d.ts.map
//#endregion
//#region src/primitives/ChannelSlider/types.d.ts
type ChannelSliderOrientation = 'horizontal' | 'vertical';
interface ChannelSliderRootProps extends PrimitiveProps {
  /** Controlled channel value. */
  modelValue: number;
  /** Accessible channel name announced by the thumb. */
  label: string;
  /** Minimum channel value. */
  min?: number;
  /** Maximum channel value. */
  max?: number;
  /** Channel increment. */
  step?: number;
  /** Slider orientation. */
  orientation?: ChannelSliderOrientation;
  /** Prevents pointer and keyboard interaction. */
  disabled?: boolean;
  /** Reverses the visual direction of the slider. */
  inverted?: boolean;
  /** Formats the value announced by assistive technology. */
  formatValueText?: (value: number) => string;
}
type ChannelSliderPartProps = PrimitiveProps;
interface ChannelSliderRootSlotProps {
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  orientation: ChannelSliderOrientation;
}
interface ChannelSliderThumbSlotProps {
  value: number;
  valueText: string;
  label: string;
}
//#endregion
//#region src/primitives/ChannelSlider/ChannelSliderRoot.vue.d.ts
type __VLS_Slots$29 = {
  default?: (props: ChannelSliderRootSlotProps) => unknown;
};
declare const __VLS_base$29: import("vue").DefineComponent<ChannelSliderRootProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
  "update:modelValue": (value: number) => any;
  valueCommit: (value: number) => any;
}, string, import("vue").PublicProps, Readonly<ChannelSliderRootProps> & Readonly<{
  "onUpdate:modelValue"?: ((value: number) => any) | undefined;
  onValueCommit?: ((value: number) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$36: __VLS_WithSlots$29<typeof __VLS_base$29, __VLS_Slots$29>;
declare const _default$6: typeof __VLS_export$36;
type __VLS_WithSlots$29<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=ChannelSliderRoot.vue.d.ts.map
//#endregion
//#region src/primitives/ChannelSlider/ChannelSliderTrack.vue.d.ts
declare var __VLS_8$5: {};
type __VLS_Slots$28 = {} & {
  default?: (props: typeof __VLS_8$5) => any;
};
declare const __VLS_base$28: import("vue").DefineComponent<import("reka-ui").PrimitiveProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("reka-ui").PrimitiveProps> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$35: __VLS_WithSlots$28<typeof __VLS_base$28, __VLS_Slots$28>;
declare const _default$8: typeof __VLS_export$35;
type __VLS_WithSlots$28<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=ChannelSliderTrack.vue.d.ts.map
//#endregion
//#region src/primitives/ChannelSlider/ChannelSliderThumb.vue.d.ts
type __VLS_Slots$27 = {
  default?: (props: ChannelSliderThumbSlotProps) => unknown;
};
declare const __VLS_base$27: import("vue").DefineComponent<import("reka-ui").PrimitiveProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("reka-ui").PrimitiveProps> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$34: __VLS_WithSlots$27<typeof __VLS_base$27, __VLS_Slots$27>;
declare const _default$7: typeof __VLS_export$34;
type __VLS_WithSlots$27<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=ChannelSliderThumb.vue.d.ts.map
//#endregion
//#region src/primitives/FontPicker/types.d.ts
interface FontPickerUI {
  trigger?: string;
  content?: string;
  item?: string;
  itemMeta?: string;
  search?: string;
  viewport?: string;
  empty?: string;
  emptyAction?: string;
}
//#endregion
//#region src/primitives/FontPicker/FontPickerRoot.vue.d.ts
type __VLS_Props$8 = {
  listFamilies: () => Promise<string[] | FontFamilyOption[]>;
  localFontAccess?: FontAccessController;
  ui?: FontPickerUI;
  emptySearchText?: string;
  emptyFontsText?: string;
  emptyFontsHint?: string;
};
type __VLS_ModelProps = {
  modelValue: string;
};
type __VLS_PublicProps = __VLS_Props$8 & __VLS_ModelProps;
declare var __VLS_22: {
    value: string;
    open: boolean;
  }, __VLS_41: {
    searchTerm: string;
  }, __VLS_66: {
    family: string;
    source: FontFamilySource$1;
    selected: boolean;
  }, __VLS_74: {
    selected: boolean;
  };
type __VLS_Slots$26 = {} & {
  trigger?: (props: typeof __VLS_22) => any;
} & {
  search?: (props: typeof __VLS_41) => any;
} & {
  item?: (props: typeof __VLS_66) => any;
} & {
  indicator?: (props: typeof __VLS_74) => any;
};
declare const __VLS_base$26: import("vue").DefineComponent<__VLS_PublicProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
  select: (family: string) => any;
  "update:modelValue": (value: string) => any;
}, string, import("vue").PublicProps, Readonly<__VLS_PublicProps> & Readonly<{
  onSelect?: ((family: string) => any) | undefined;
  "onUpdate:modelValue"?: ((value: string) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$33: __VLS_WithSlots$26<typeof __VLS_base$26, __VLS_Slots$26>;
declare const _default$14: typeof __VLS_export$33;
type __VLS_WithSlots$26<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=FontPickerRoot.vue.d.ts.map
//#endregion
//#region src/primitives/GradientEditor/GradientEditorRoot.vue.d.ts
type __VLS_Props$7 = {
  fill: Fill;
};
declare var __VLS_1$7: {
  stops: import("@open-pencil/scene-graph").GradientStop[];
  subtype: "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND";
  subtypes: {
    value: "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND";
    label: string;
  }[];
  activeStopIndex: number;
  activeColor: import("@open-pencil/scene-graph").Color;
  barBackground: string;
  actions: {
    setSubtype: (type: "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND") => void;
    selectStop: (index: number) => void;
    addStop: () => void;
    removeStop: (index: number) => void;
    updateStopPosition: (index: number, position: number) => void;
    updateStopColor: (index: number, hex: string) => void;
    updateStopOpacity: (index: number, opacity: number) => void;
    updateActiveColor: (color: import("@open-pencil/scene-graph").Color) => void;
    dragStop: (index: number, position: number) => void;
  };
};
type __VLS_Slots$25 = {} & {
  default?: (props: typeof __VLS_1$7) => any;
};
declare const __VLS_base$25: import("vue").DefineComponent<__VLS_Props$7, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
  update: (fill: Fill) => any;
}, string, import("vue").PublicProps, Readonly<__VLS_Props$7> & Readonly<{
  onUpdate?: ((fill: Fill) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$32: __VLS_WithSlots$25<typeof __VLS_base$25, __VLS_Slots$25>;
declare const _default$16: typeof __VLS_export$32;
type __VLS_WithSlots$25<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=GradientEditorRoot.vue.d.ts.map
//#endregion
//#region src/primitives/GradientEditor/GradientEditorBar.vue.d.ts
type __VLS_Props$6 = {
  stops: GradientStop[];
  activeStopIndex: number;
  barBackground: string;
  ui?: {
    bar?: string;
  };
};
declare function stopPointerDown(index: number, e: PointerEvent): void;
declare var __VLS_1$6: {
  stops: GradientStop[];
  activeStopIndex: number;
  barBackground: string;
  actions: {
    stopPointerDown: typeof stopPointerDown;
  };
  draggingIndex: number | null;
};
type __VLS_Slots$24 = {} & {
  default?: (props: typeof __VLS_1$6) => any;
};
declare const __VLS_base$24: import("vue").DefineComponent<__VLS_Props$6, {
  barRef: Readonly<import("vue").Ref<HTMLElement, HTMLElement>>;
}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
  selectStop: (index: number) => any;
  dragStop: (index: number, position: number) => any;
}, string, import("vue").PublicProps, Readonly<__VLS_Props$6> & Readonly<{
  onSelectStop?: ((index: number) => any) | undefined;
  onDragStop?: ((index: number, position: number) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$31: __VLS_WithSlots$24<typeof __VLS_base$24, __VLS_Slots$24>;
declare const _default$15: typeof __VLS_export$31;
type __VLS_WithSlots$24<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=GradientEditorBar.vue.d.ts.map
//#endregion
//#region src/primitives/GradientEditor/types.d.ts
interface GradientEditorStopProps extends PrimitiveProps {
  stop: GradientStop;
  index: number;
  active: boolean;
  dragging?: boolean;
  interactive?: boolean;
  removable?: boolean;
  positionStep?: number;
  label?: string;
}
interface GradientEditorStopActions {
  select: () => void;
  updatePosition: (position: number) => void;
  updateColor: (hex: string) => void;
  updateOpacity: (opacity: number) => void;
  remove: () => void;
}
interface GradientEditorStopSlotProps {
  stop: GradientStop;
  index: number;
  active: boolean;
  selected: boolean;
  dragging: boolean;
  positionPercent: number;
  opacityPercent: number;
  hex: string;
  css: string;
  actions: GradientEditorStopActions;
}
interface GradientEditorStopSlots {
  default?: (props: GradientEditorStopSlotProps) => unknown;
}
//#endregion
//#region src/primitives/GradientEditor/GradientEditorStop.vue.d.ts
type __VLS_Slots$23 = GradientEditorStopSlots;
declare const __VLS_base$23: import("vue").DefineComponent<GradientEditorStopProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
  select: (index: number) => any;
  updatePosition: (index: number, position: number) => any;
  updateColor: (index: number, hex: string) => any;
  updateOpacity: (index: number, opacity: number) => any;
  remove: (index: number) => any;
}, string, import("vue").PublicProps, Readonly<GradientEditorStopProps> & Readonly<{
  onSelect?: ((index: number) => any) | undefined;
  onUpdatePosition?: ((index: number, position: number) => any) | undefined;
  onUpdateColor?: ((index: number, hex: string) => any) | undefined;
  onUpdateOpacity?: ((index: number, opacity: number) => any) | undefined;
  onRemove?: ((index: number) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$30: __VLS_WithSlots$23<typeof __VLS_base$23, __VLS_Slots$23>;
declare const _default$17: typeof __VLS_export$30;
type __VLS_WithSlots$23<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=GradientEditorStop.vue.d.ts.map
//#endregion
//#region src/primitives/LayerTree/LayerTreeRoot.vue.d.ts
type __VLS_Props$5 = {
  indentPerLevel?: number;
};
declare function select(id: string, selection: boolean | LayerSelectionMode): void;
declare function toggleExpand(id: string): void;
declare function setVirtualizer(next: LayerTreeVirtualizer): void;
declare var __VLS_8$4: {
  items: {
    id: string;
    name: string;
    type: string;
    layoutMode: string;
    visible: boolean;
    locked: boolean;
    children?: /*elided*/any[] | undefined;
  }[];
  flattenItems: import("reka-ui").FlattenedItem<LayerNode>[];
  visibleRows: LayerRow[];
  expanded: string[];
  treeVersion: number;
  selectedIds: Set<string>;
  focused: boolean;
  draggingId: string | null;
  instruction: {
    type: "reorder-above" | "reorder-below" | "make-child";
  } | null;
  instructionTargetId: string | null;
  actions: {
    select: typeof select;
    toggleExpand: typeof toggleExpand;
    setFocused: (value: boolean) => void;
    setVirtualizer: typeof setVirtualizer;
  };
};
type __VLS_Slots$22 = {} & {
  default?: (props: typeof __VLS_8$4) => any;
};
declare const __VLS_base$22: import("vue").DefineComponent<__VLS_Props$5, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
  toggleVisibility: (id: string) => any;
  rename: (id: string, name: string) => any;
  select: (id: string, additive: boolean) => any;
  toggleExpand: (id: string) => any;
  toggleLock: (id: string) => any;
}, string, import("vue").PublicProps, Readonly<__VLS_Props$5> & Readonly<{
  onToggleVisibility?: ((id: string) => any) | undefined;
  onRename?: ((id: string, name: string) => any) | undefined;
  onSelect?: ((id: string, additive: boolean) => any) | undefined;
  onToggleExpand?: ((id: string) => any) | undefined;
  onToggleLock?: ((id: string) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$29: __VLS_WithSlots$22<typeof __VLS_base$22, __VLS_Slots$22>;
declare const _default$19: typeof __VLS_export$29;
type __VLS_WithSlots$22<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=LayerTreeRoot.vue.d.ts.map
//#endregion
//#region src/primitives/LayerTree/LayerTreeItem.vue.d.ts
type __VLS_Props$4 = {
  node: LayerNode;
  level: number;
  hasChildren: boolean;
};
declare var __VLS_1$5: {
  node: LayerNode;
  level: number;
  hasChildren: boolean;
  isSelected: boolean;
  isDragging: boolean;
  focused: boolean;
  padLeft: string;
  actions: {
    select: (additive: boolean) => void;
    toggleExpand: () => void;
    toggleVisibility: () => void;
    toggleLock: () => void;
    rename: (name: string) => void;
  };
};
type __VLS_Slots$21 = {} & {
  default?: (props: typeof __VLS_1$5) => any;
};
declare const __VLS_base$21: import("vue").DefineComponent<__VLS_Props$4, {
  rowEl: import("vue").Ref<HTMLElement | null, HTMLElement | null>;
}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
  toggleVisibility: (id: string) => any;
  rename: (id: string, name: string) => any;
  select: (id: string, additive: boolean) => any;
  toggleExpand: (id: string) => any;
  toggleLock: (id: string) => any;
}, string, import("vue").PublicProps, Readonly<__VLS_Props$4> & Readonly<{
  onToggleVisibility?: ((id: string) => any) | undefined;
  onRename?: ((id: string, name: string) => any) | undefined;
  onSelect?: ((id: string, additive: boolean) => any) | undefined;
  onToggleExpand?: ((id: string) => any) | undefined;
  onToggleLock?: ((id: string) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$28: __VLS_WithSlots$21<typeof __VLS_base$21, __VLS_Slots$21>;
declare const _default$18: typeof __VLS_export$28;
type __VLS_WithSlots$21<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=LayerTreeItem.vue.d.ts.map
//#endregion
//#region src/primitives/LayerTree/model.d.ts
interface LayerTreeModel {
  items: LayerNode[];
  byId: Map<string, LayerNode>;
}
declare function buildLayerTreeModel(graph: SceneGraph, parentId: string): LayerTreeModel;
declare function indexLayerNodes(items: readonly LayerNode[]): Map<string, LayerNode>;
declare function patchLayerNode(target: LayerNode, source: SceneNode): boolean;
declare function visibleLayerRows(items: readonly LayerNode[], expandedIds: ReadonlySet<string>): LayerRow[];
declare function layerSelectionForTarget(visibleIds: readonly string[], currentIds: ReadonlySet<string>, anchorId: string | null, targetId: string, mode: LayerSelectionMode): Set<string>;
//#endregion
//#region src/primitives/LayoutControls/types.d.ts
type LayoutContext = ShallowUnwrapRef<ReturnType<typeof useLayout>>;
type LayoutActionKey = 'updateProp' | 'updateSizeLimit' | 'setSizeLimitToCurrent' | 'commitSizeLimit' | 'addSizeLimit' | 'removeSizeLimit' | 'commitProp' | 'setAxisSizing' | 'updateAxisSize' | 'commitAxisSize' | 'setHorizontalPadding' | 'commitHorizontalPadding' | 'setVerticalPadding' | 'commitVerticalPadding' | 'setAlignment' | 'setGapAuto' | 'setLayoutDirection' | 'updateGridTrack' | 'addTrack' | 'removeTrack' | 'toggleIndividualPadding';
type LayoutControlsRootSlotProps = Omit<LayoutContext, LayoutActionKey> & {
  actions: Pick<LayoutContext, LayoutActionKey>;
};
interface LayoutControlsRootSlots {
  /** Current layout state and mutation actions for the active selection. */
  default(props: LayoutControlsRootSlotProps): VNode[];
}
//#endregion
//#region src/primitives/LayoutControls/LayoutControlsRoot.vue.d.ts
type __VLS_Slots$20 = LayoutControlsRootSlots;
declare const __VLS_base$20: import("vue").DefineComponent<{}, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
declare const __VLS_export$27: __VLS_WithSlots$20<typeof __VLS_base$20, __VLS_Slots$20>;
declare const _default$20: typeof __VLS_export$27;
type __VLS_WithSlots$20<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=LayoutControlsRoot.vue.d.ts.map
//#endregion
//#region src/primitives/LayoutControls/context.d.ts
type RawLayoutControlsContext = ShallowUnwrapRef<ReturnType<typeof useLayout>>;
type LayoutControlsContext = Omit<RawLayoutControlsContext, 'node'> & {
  node: SceneNode;
};
declare function useLayoutControlsContext(): LayoutControlsContext;
//#endregion
//#region src/primitives/AppearanceControls/types.d.ts
interface AppearanceControlsActions {
  updateProp(key: string, value: number): void;
  commitProp(key: string, value: number, previous: number): void;
  setBlendMode(value: BlendMode): void;
  toggleVisibility(): void;
  toggleIndependentCorners(): void;
  updateCornerProp(key: CornerGeometryKey, value: number): void;
  commitCornerProp(key: CornerGeometryKey, value: number, previous: number): void;
}
interface AppearanceControlsRootSlotProps {
  node: SceneNode | null;
  isMulti: boolean;
  active: boolean;
  hasCornerRadius: boolean;
  independentCorners: MixedValue<boolean>;
  showIndependentCorners: boolean;
  cornerRadiusValue: MixedValue<number>;
  cornerSmoothingPercent: MixedValue<number>;
  opacityPercent: MixedValue<number>;
  blendModeValue: MixedValue<BlendMode>;
  visibilityState: 'visible' | 'hidden' | 'mixed';
  actions: AppearanceControlsActions;
}
interface AppearanceControlsRootSlots {
  /** Complete selection-derived appearance state and mutation actions. */
  default(props: AppearanceControlsRootSlotProps): VNode[];
}
//#endregion
//#region src/primitives/AppearanceControls/AppearanceControlsRoot.vue.d.ts
type __VLS_Slots$19 = AppearanceControlsRootSlots;
declare const __VLS_base$19: import("vue").DefineComponent<{}, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
declare const __VLS_export$26: __VLS_WithSlots$19<typeof __VLS_base$19, __VLS_Slots$19>;
declare const _default: typeof __VLS_export$26;
type __VLS_WithSlots$19<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=AppearanceControlsRoot.vue.d.ts.map
//#endregion
//#region src/controls/constraints/model.d.ts
type ConstraintAxis = 'horizontal' | 'vertical';
type ConstraintEdge = 'leading' | 'trailing';
type ConstraintValue = ConstraintType | typeof MIXED;
declare function isConstraintEligible(graph: SceneGraph, node: SceneNode): boolean;
declare function constraintPins(value: ConstraintValue): {
  leading: boolean;
  trailing: boolean;
  center: boolean;
  scale: boolean;
};
declare function toggleConstraintPin(value: ConstraintValue, edge: ConstraintEdge, additive: boolean): ConstraintType;
//#endregion
//#region src/primitives/ConstraintsControl/types.d.ts
interface ConstraintsControlActions {
  setHorizontal(value: ConstraintType): void;
  setVertical(value: ConstraintType): void;
  setCenter(axis: ConstraintAxis): void;
  togglePin(axis: ConstraintAxis, edge: ConstraintEdge, additive: boolean): void;
}
interface ConstraintsControlRootSlotProps {
  active: boolean;
  isMulti: boolean;
  horizontal: ConstraintValue;
  vertical: ConstraintValue;
  actions: ConstraintsControlActions;
}
interface ConstraintsControlRootSlots {
  /** Constraint state and undo-aware actions for the current eligible selection. */
  default(props: ConstraintsControlRootSlotProps): VNode[];
}
//#endregion
//#region src/primitives/ConstraintsControl/ConstraintsControlRoot.vue.d.ts
type __VLS_Slots$18 = ConstraintsControlRootSlots;
declare const __VLS_base$18: import("vue").DefineComponent<{}, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
declare const __VLS_export$25: __VLS_WithSlots$18<typeof __VLS_base$18, __VLS_Slots$18>;
declare const _default$11: typeof __VLS_export$25;
type __VLS_WithSlots$18<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=ConstraintsControlRoot.vue.d.ts.map
//#endregion
//#region src/controls/constraints/use.d.ts
declare function useConstraints(): {
  active: import("vue").ComputedRef<boolean>;
  isMulti: import("vue").ComputedRef<boolean>;
  horizontal: import("vue").ComputedRef<ConstraintValue>;
  vertical: import("vue").ComputedRef<ConstraintValue>;
  setAxis: (axis: ConstraintAxis, value: ConstraintType) => void;
  togglePin: (axis: ConstraintAxis, edge: ConstraintEdge, additive: boolean) => void;
};
//#endregion
//#region src/controls/component-props/model.d.ts
interface ComponentPropertyOption {
  value: string;
  label: string;
  missing?: boolean;
}
interface ComponentPropertyControl {
  id: string;
  name: string;
  type: ComponentPropertyType;
  value: MixedValue<string>;
  options: ComponentPropertyOption[];
}
declare function compatibleComponentPropertyDefinitions(definitions: ComponentPropertyDefinition[][]): ComponentPropertyDefinition[];
declare function mergedComponentPropertyValue(values: string[]): MixedValue<string>;
declare function instanceSwapOptions(components: SceneNode[], definition: ComponentPropertyDefinition, value: string): ComponentPropertyOption[];
//#endregion
//#region src/controls/component-props/use.d.ts
declare function useComponentProperties(): {
  active: import("vue").ComputedRef<boolean>;
  controls: import("vue").ComputedRef<ComponentPropertyControl[]>;
  setValue: (propertyId: string, value: string) => void;
};
//#endregion
//#region src/primitives/PageList/PageListRoot.vue.d.ts
type __VLS_Props$3 = {
  dividerPattern?: RegExp;
};
declare function isDivider(page: {
  name: string;
  childIds: string[];
}): boolean;
declare function handleAdd(): void;
declare function handleSwitch(pageId: string): void;
declare function handleRename(pageId: string, name: string): void;
declare function handleDelete(pageId: string): void;
declare function handleMove(pageId: string, index: number): void;
declare var __VLS_1$4: {
  pages: import("@open-pencil/scene-graph").SceneNode[];
  currentPageId: string;
  isDivider: typeof isDivider;
  actions: {
    add: typeof handleAdd;
    switch: typeof handleSwitch;
    rename: typeof handleRename;
    delete: typeof handleDelete;
    move: typeof handleMove;
  };
};
type __VLS_Slots$17 = {} & {
  default?: (props: typeof __VLS_1$4) => any;
};
declare const __VLS_base$17: import("vue").DefineComponent<__VLS_Props$3, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
  move: (pageId: string, index: number) => any;
  delete: (pageId: string) => any;
  add: () => any;
  rename: (pageId: string, name: string) => any;
  switch: (pageId: string) => any;
}, string, import("vue").PublicProps, Readonly<__VLS_Props$3> & Readonly<{
  onMove?: ((pageId: string, index: number) => any) | undefined;
  onDelete?: ((pageId: string) => any) | undefined;
  onAdd?: (() => any) | undefined;
  onRename?: ((pageId: string, name: string) => any) | undefined;
  onSwitch?: ((pageId: string) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$24: __VLS_WithSlots$17<typeof __VLS_base$17, __VLS_Slots$17>;
declare const _default$24: typeof __VLS_export$24;
type __VLS_WithSlots$17<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=PageListRoot.vue.d.ts.map
//#endregion
//#region src/primitives/PositionControls/PositionControlsRoot.vue.d.ts
declare function align(axis: 'horizontal' | 'vertical', pos: 'min' | 'center' | 'max'): void;
declare function flip(axis: 'horizontal' | 'vertical'): void;
declare function rotate(degrees: number): void;
declare var __VLS_1$3: {
  active: boolean;
  isMulti: boolean;
  ids: string[];
  xValue: number | symbol;
  yValue: number | symbol;
  wValue: number | symbol;
  hValue: number | symbol;
  rotationValue: number | symbol;
  mixed: symbol;
  actions: {
    updateProp: (key: string, value: number | string) => void;
    commitProp: (key: string, _value: number | string, previous: number | string) => void;
    align: typeof align;
    flip: typeof flip;
    rotate: typeof rotate;
  };
};
type __VLS_Slots$16 = {} & {
  default?: (props: typeof __VLS_1$3) => any;
};
declare const __VLS_base$16: import("vue").DefineComponent<{}, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
declare const __VLS_export$23: __VLS_WithSlots$16<typeof __VLS_base$16, __VLS_Slots$16>;
declare const _default$25: typeof __VLS_export$23;
type __VLS_WithSlots$16<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=PositionControlsRoot.vue.d.ts.map
//#endregion
//#region src/primitives/PropertyList/types.d.ts
interface PropertyListItemMap {
  fills: Fill;
  strokes: Stroke;
  effects: Effect;
}
type PropertyListKey = keyof PropertyListItemMap;
type PropertyListItemFor<K extends PropertyListKey> = PropertyListItemMap[K];
type PropertyListPatchFor<K extends PropertyListKey> = Partial<PropertyListItemFor<K>>;
type PropertyListIdentity = string | number;
interface PropertyListActions<K extends PropertyListKey> {
  add(item: PropertyListItemFor<K>): void;
  remove(index: number): void;
  update(index: number, item: PropertyListItemFor<K>): void;
  patch(index: number, changes: PropertyListPatchFor<K>): void;
  toggleVisibility(index: number): void;
  reorder(fromIndex: number, toIndex: number): void;
}
interface PropertyListContext<K extends PropertyListKey = PropertyListKey> {
  propKey: K;
  items: ComputedRef<PropertyListItemFor<K>[]>;
  isMixed: ComputedRef<boolean>;
  disabled: ComputedRef<boolean>;
  keyOf(item: PropertyListItemFor<K>, index: number): PropertyListIdentity;
  actions: PropertyListActions<K>;
}
interface PropertyListRootProps<K extends PropertyListKey> {
  /** Discriminator that provides exact Fill, Stroke, or Effect types to slots and actions. */
  propKey: K;
  /** Controlled list items. */
  items: PropertyListItemFor<K>[];
  /** Marks values across the current selection as inconsistent. @default false */
  mixed?: boolean;
  /** Prevents item actions. @default false */
  disabled?: boolean;
  /** Stable identity for keyed rows. Defaults to the item index. */
  getKey?: (item: PropertyListItemFor<K>, index: number) => PropertyListIdentity;
  /** Optional accessible label exposed to consumers. */
  label?: string;
}
interface PropertyListRootSlotProps<K extends PropertyListKey> {
  items: PropertyListItemFor<K>[];
  isMixed: boolean;
  disabled: boolean;
  keyOf(item: PropertyListItemFor<K>, index: number): PropertyListIdentity;
  actions: PropertyListActions<K>;
}
interface PropertyListRootSlots<K extends PropertyListKey> {
  default?(props: PropertyListRootSlotProps<K>): VNode[];
}
interface PropertyListItemActions<K extends PropertyListKey> {
  update(item: PropertyListItemFor<K>): void;
  patch(changes: PropertyListPatchFor<K>): void;
  remove(): void;
  toggleVisibility(): void;
}
interface PropertyListPartProps<K extends PropertyListKey> {
  /** Must match the nearest PropertyListRoot and preserves generic inference. */
  propKey: K;
  /** Element or component rendered by this part. @default 'button' */
  as?: string | Component;
  /** Merge behavior into the single child element. @default false */
  asChild?: boolean;
  /** Prevent activation. @default false */
  disabled?: boolean;
}
interface PropertyListItemSlotProps<K extends PropertyListKey> {
  item: PropertyListItemFor<K> | undefined;
  index: number;
  hidden: boolean;
  dragging: boolean;
  disabled: boolean;
  actions: PropertyListItemActions<K>;
}
//#endregion
//#region src/controls/property-list/use.d.ts
declare function useEditorPropertyList<K extends PropertyListKey>(propKey: K): {
  items: import("vue").ComputedRef<PropertyListItemFor<K>[]>;
  isMixed: import("vue").ComputedRef<boolean>;
  isMulti: import("vue").ComputedRef<boolean>;
  active: import("vue").ComputedRef<boolean>;
  activeNode: import("vue").ComputedRef<SceneNode | null>;
  selectedNodeIds: import("vue").ComputedRef<string[]>;
  flush: () => void;
  actions: PropertyListActions<K>;
};
//#endregion
//#region src/primitives/PropertyList/PropertyListRoot.vue.d.ts
declare const __VLS_export$22: <K extends PropertyListKey>(__VLS_props: NonNullable<Awaited<typeof __VLS_setup>>["props"], __VLS_ctx?: __VLS_PrettifyLocal$5<Pick<NonNullable<Awaited<typeof __VLS_setup>>, "attrs" | "emit" | "slots">>, __VLS_exposed?: NonNullable<Awaited<typeof __VLS_setup>>["expose"], __VLS_setup?: Promise<{
  props: import("vue").PublicProps & __VLS_PrettifyLocal$5<PropertyListRootProps<K> & {
    onAdd?: ((item: PropertyListItemFor<K>) => any) | undefined;
    onToggleVisibility?: ((index: number) => any) | undefined;
    onUpdate?: ((index: number, item: PropertyListItemFor<K>) => any) | undefined;
    onRemove?: ((index: number) => any) | undefined;
    onPatch?: ((index: number, changes: Partial<PropertyListItemFor<K>>) => any) | undefined;
    onReorder?: ((fromIndex: number, toIndex: number) => any) | undefined;
  }> & (typeof globalThis extends {
    __VLS_PROPS_FALLBACK: infer P;
  } ? P : {});
  expose: (exposed: {}) => void;
  attrs: any;
  slots: PropertyListRootSlots<K>;
  emit: ((evt: "add", item: PropertyListItemFor<K>) => void) & ((evt: "toggleVisibility", index: number) => void) & ((evt: "update", index: number, item: PropertyListItemFor<K>) => void) & ((evt: "remove", index: number) => void) & ((evt: "patch", index: number, changes: Partial<PropertyListItemFor<K>>) => void) & ((evt: "reorder", fromIndex: number, toIndex: number) => void);
}>) => import("vue").VNode & {
  __ctx?: Awaited<typeof __VLS_setup>;
};
declare const _default$30: typeof __VLS_export$22;
type __VLS_PrettifyLocal$5<T> = (T extends any ? { [K in keyof T]: T[K] } : { [K in keyof T as K]: T[K] }) & {}; //# sourceMappingURL=PropertyListRoot.vue.d.ts.map
//#endregion
//#region src/primitives/PropertyList/PropertyListItem.vue.d.ts
declare const __VLS_export$21: <K extends PropertyListKey>(__VLS_props: NonNullable<Awaited<typeof __VLS_setup>>["props"], __VLS_ctx?: __VLS_PrettifyLocal$4<Pick<NonNullable<Awaited<typeof __VLS_setup>>, "attrs" | "emit" | "slots">>, __VLS_exposed?: NonNullable<Awaited<typeof __VLS_setup>>["expose"], __VLS_setup?: Promise<{
  props: import("vue").PublicProps & __VLS_PrettifyLocal$4<{
    propKey: K;
    index: number;
    dragging?: boolean;
    disabled?: boolean;
    as?: string | Component;
    asChild?: boolean;
  } & {
    onToggleVisibility?: ((index: number) => any) | undefined;
    onUpdate?: ((index: number, item: PropertyListItemFor<K>) => any) | undefined;
    onRemove?: ((index: number) => any) | undefined;
    onPatch?: ((index: number, changes: Partial<PropertyListItemFor<K>>) => any) | undefined;
  }> & (typeof globalThis extends {
    __VLS_PROPS_FALLBACK: infer P;
  } ? P : {});
  expose: (exposed: {}) => void;
  attrs: any;
  slots: {
    default(props: PropertyListItemSlotProps<K>): VNode[];
  };
  emit: ((evt: "toggleVisibility", index: number) => void) & ((evt: "update", index: number, item: PropertyListItemFor<K>) => void) & ((evt: "remove", index: number) => void) & ((evt: "patch", index: number, changes: Partial<PropertyListItemFor<K>>) => void);
}>) => import("vue").VNode & {
  __ctx?: Awaited<typeof __VLS_setup>;
};
declare const _default$28: typeof __VLS_export$21;
type __VLS_PrettifyLocal$4<T> = (T extends any ? { [K in keyof T]: T[K] } : { [K in keyof T as K]: T[K] }) & {}; //# sourceMappingURL=PropertyListItem.vue.d.ts.map
//#endregion
//#region src/primitives/PropertyList/PropertyListAdd.vue.d.ts
declare const __VLS_export$20: <K extends PropertyListKey>(__VLS_props: NonNullable<Awaited<typeof __VLS_setup>>["props"], __VLS_ctx?: __VLS_PrettifyLocal$3<Pick<NonNullable<Awaited<typeof __VLS_setup>>, "attrs" | "emit" | "slots">>, __VLS_exposed?: NonNullable<Awaited<typeof __VLS_setup>>["expose"], __VLS_setup?: Promise<{
  props: import("vue").PublicProps & __VLS_PrettifyLocal$3<(PropertyListPartProps<K> & {
    item: PropertyListItemFor<K>;
  }) & {
    onAdd?: ((item: PropertyListItemFor<K>) => any) | undefined;
  }> & (typeof globalThis extends {
    __VLS_PROPS_FALLBACK: infer P;
  } ? P : {});
  expose: (exposed: {}) => void;
  attrs: any;
  slots: {
    default?: (props: {}) => any;
  };
  emit: (evt: "add", item: PropertyListItemFor<K>) => void;
}>) => import("vue").VNode & {
  __ctx?: Awaited<typeof __VLS_setup>;
};
declare const _default$27: typeof __VLS_export$20;
type __VLS_PrettifyLocal$3<T> = (T extends any ? { [K in keyof T]: T[K] } : { [K in keyof T as K]: T[K] }) & {}; //# sourceMappingURL=PropertyListAdd.vue.d.ts.map
//#endregion
//#region src/primitives/PropertyList/PropertyListRemove.vue.d.ts
declare const __VLS_export$19: <K extends PropertyListKey>(__VLS_props: NonNullable<Awaited<typeof __VLS_setup>>["props"], __VLS_ctx?: __VLS_PrettifyLocal$2<Pick<NonNullable<Awaited<typeof __VLS_setup>>, "attrs" | "emit" | "slots">>, __VLS_exposed?: NonNullable<Awaited<typeof __VLS_setup>>["expose"], __VLS_setup?: Promise<{
  props: import("vue").PublicProps & __VLS_PrettifyLocal$2<(PropertyListPartProps<K> & {
    index: number;
  }) & {
    onRemove?: ((index: number) => any) | undefined;
  }> & (typeof globalThis extends {
    __VLS_PROPS_FALLBACK: infer P;
  } ? P : {});
  expose: (exposed: {}) => void;
  attrs: any;
  slots: {
    default?: (props: {}) => any;
  };
  emit: (evt: "remove", index: number) => void;
}>) => import("vue").VNode & {
  __ctx?: Awaited<typeof __VLS_setup>;
};
declare const _default$29: typeof __VLS_export$19;
type __VLS_PrettifyLocal$2<T> = (T extends any ? { [K in keyof T]: T[K] } : { [K in keyof T as K]: T[K] }) & {}; //# sourceMappingURL=PropertyListRemove.vue.d.ts.map
//#endregion
//#region src/primitives/PropertyList/PropertyListVisibility.vue.d.ts
declare const __VLS_export$18: <K extends PropertyListKey>(__VLS_props: NonNullable<Awaited<typeof __VLS_setup>>["props"], __VLS_ctx?: __VLS_PrettifyLocal$1<Pick<NonNullable<Awaited<typeof __VLS_setup>>, "attrs" | "emit" | "slots">>, __VLS_exposed?: NonNullable<Awaited<typeof __VLS_setup>>["expose"], __VLS_setup?: Promise<{
  props: import("vue").PublicProps & __VLS_PrettifyLocal$1<(PropertyListPartProps<K> & {
    index: number;
  }) & {
    onToggle?: ((index: number) => any) | undefined;
  }> & (typeof globalThis extends {
    __VLS_PROPS_FALLBACK: infer P;
  } ? P : {});
  expose: (exposed: {}) => void;
  attrs: any;
  slots: {
    default?: (props: {
      visible: boolean;
    }) => any;
  };
  emit: (evt: "toggle", index: number) => void;
}>) => import("vue").VNode & {
  __ctx?: Awaited<typeof __VLS_setup>;
};
declare const _default$31: typeof __VLS_export$18;
type __VLS_PrettifyLocal$1<T> = (T extends any ? { [K in keyof T]: T[K] } : { [K in keyof T as K]: T[K] }) & {}; //# sourceMappingURL=PropertyListVisibility.vue.d.ts.map
//#endregion
//#region src/primitives/PropertyList/context.d.ts
declare function usePropertyList<K extends PropertyListKey>(): PropertyListContext<K>;
//#endregion
//#region src/primitives/PropertyGrid/types.d.ts
type PropertyGridColumns = 1 | 2 | 3;
type PropertyGridDistribution = 'equal' | 'wide-first';
interface PropertyGridRootProps {
  /** Number of field columns. @default 1 */
  columns?: PropertyGridColumns;
  /** Relative distribution of field columns. @default 'equal' */
  distribution?: PropertyGridDistribution;
}
interface PropertyGridRootSlots {
  /** Property fields arranged by the consumer's visual theme. */
  default(): VNode[];
  /** Optional intrinsic-width controls kept separate from the field grid. */
  actions?(): VNode[];
}
//#endregion
//#region src/primitives/PropertyGrid/PropertyGridRoot.vue.d.ts
type __VLS_Slots$15 = PropertyGridRootSlots;
declare const __VLS_base$15: import("vue").DefineComponent<PropertyGridRootProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<PropertyGridRootProps> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$17: __VLS_WithSlots$15<typeof __VLS_base$15, __VLS_Slots$15>;
declare const _default$26: typeof __VLS_export$17;
type __VLS_WithSlots$15<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=PropertyGridRoot.vue.d.ts.map
//#endregion
//#region src/primitives/PropertySection/types.d.ts
interface PropertySectionRootProps {
  /** Controlled expanded state. */
  open?: boolean;
  /** Initial expanded state when uncontrolled. @default true */
  defaultOpen?: boolean;
  /** Marks the section as having no current items. @default false */
  empty?: boolean;
  /** Prevents the section from being toggled. @default false */
  disabled?: boolean;
  /** Keep collapsed content mounted in the DOM. @default false */
  unmountOnHide?: boolean;
}
type PropertySectionPartProps = PrimitiveProps;
interface PropertySectionStateAttrs {
  'data-state': 'open' | 'closed';
  'data-empty'?: '';
  'data-disabled'?: '';
}
interface PropertySectionActionAPI {
  open(): void;
  close(): void;
  toggle(): void;
}
interface PropertySectionSlotProps {
  open: boolean;
  empty: boolean;
  stateAttrs: PropertySectionStateAttrs;
  actions: PropertySectionActionAPI;
}
interface PropertySectionRootSlots {
  default(props: PropertySectionSlotProps): VNode[];
}
interface PropertySectionContext {
  open: ComputedRef<boolean>;
  empty: ComputedRef<boolean>;
  disabled: ComputedRef<boolean>;
  stateAttrs: ComputedRef<PropertySectionStateAttrs>;
  slotProps: ComputedRef<PropertySectionSlotProps>;
  actions: PropertySectionActionAPI;
}
//#endregion
//#region src/primitives/PropertySection/PropertySectionRoot.vue.d.ts
type __VLS_Slots$14 = PropertySectionRootSlots;
declare const __VLS_base$14: import("vue").DefineComponent<PropertySectionRootProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
  "update:open": (open: boolean) => any;
}, string, import("vue").PublicProps, Readonly<PropertySectionRootProps> & Readonly<{
  "onUpdate:open"?: ((open: boolean) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$16: __VLS_WithSlots$14<typeof __VLS_base$14, __VLS_Slots$14>;
declare const _default$36: typeof __VLS_export$16;
type __VLS_WithSlots$14<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=PropertySectionRoot.vue.d.ts.map
//#endregion
//#region src/primitives/PropertySection/PropertySectionHeader.vue.d.ts
declare var __VLS_8$3: {
  open: boolean;
  empty: boolean;
  stateAttrs: PropertySectionStateAttrs;
  actions: PropertySectionActionAPI;
};
type __VLS_Slots$13 = {} & {
  default?: (props: typeof __VLS_8$3) => any;
};
declare const __VLS_base$13: import("vue").DefineComponent<import("reka-ui").PrimitiveProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("reka-ui").PrimitiveProps> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$15: __VLS_WithSlots$13<typeof __VLS_base$13, __VLS_Slots$13>;
declare const _default$35: typeof __VLS_export$15;
type __VLS_WithSlots$13<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=PropertySectionHeader.vue.d.ts.map
//#endregion
//#region src/primitives/PropertySection/PropertySectionTitle.vue.d.ts
declare var __VLS_8$2: {
  open: boolean;
  empty: boolean;
  stateAttrs: PropertySectionStateAttrs;
  actions: PropertySectionActionAPI;
};
type __VLS_Slots$12 = {} & {
  default?: (props: typeof __VLS_8$2) => any;
};
declare const __VLS_base$12: import("vue").DefineComponent<import("reka-ui").PrimitiveProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("reka-ui").PrimitiveProps> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$14: __VLS_WithSlots$12<typeof __VLS_base$12, __VLS_Slots$12>;
declare const _default$37: typeof __VLS_export$14;
type __VLS_WithSlots$12<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=PropertySectionTitle.vue.d.ts.map
//#endregion
//#region src/primitives/PropertySection/PropertySectionActions.vue.d.ts
declare var __VLS_8$1: {
  open: boolean;
  empty: boolean;
  stateAttrs: PropertySectionStateAttrs;
  actions: PropertySectionActionAPI;
};
type __VLS_Slots$11 = {} & {
  default?: (props: typeof __VLS_8$1) => any;
};
declare const __VLS_base$11: import("vue").DefineComponent<import("reka-ui").PrimitiveProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("reka-ui").PrimitiveProps> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$13: __VLS_WithSlots$11<typeof __VLS_base$11, __VLS_Slots$11>;
declare const _default$32: typeof __VLS_export$13;
type __VLS_WithSlots$11<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=PropertySectionActions.vue.d.ts.map
//#endregion
//#region src/primitives/PropertySection/PropertySectionContent.vue.d.ts
declare var __VLS_8: {
  open: boolean;
  empty: boolean;
  stateAttrs: PropertySectionStateAttrs;
  actions: PropertySectionActionAPI;
};
type __VLS_Slots$10 = {} & {
  default?: (props: typeof __VLS_8) => any;
};
declare const __VLS_base$10: import("vue").DefineComponent<import("reka-ui").PrimitiveProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("reka-ui").PrimitiveProps> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$12: __VLS_WithSlots$10<typeof __VLS_base$10, __VLS_Slots$10>;
declare const _default$33: typeof __VLS_export$12;
type __VLS_WithSlots$10<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=PropertySectionContent.vue.d.ts.map
//#endregion
//#region src/primitives/PropertySection/PropertySectionEmptyAction.vue.d.ts
declare var __VLS_10$1: {
  open: boolean;
  empty: boolean;
  stateAttrs: PropertySectionStateAttrs;
  actions: PropertySectionActionAPI;
};
type __VLS_Slots$9 = {} & {
  default?: (props: typeof __VLS_10$1) => any;
};
declare const __VLS_base$9: import("vue").DefineComponent<import("reka-ui").PrimitiveProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
  activate: () => any;
}, string, import("vue").PublicProps, Readonly<import("reka-ui").PrimitiveProps> & Readonly<{
  onActivate?: (() => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$11: __VLS_WithSlots$9<typeof __VLS_base$9, __VLS_Slots$9>;
declare const _default$34: typeof __VLS_export$11;
type __VLS_WithSlots$9<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=PropertySectionEmptyAction.vue.d.ts.map
//#endregion
//#region src/primitives/PropertySection/context.d.ts
declare const usePropertySection: () => PropertySectionContext, providePropertySection: (value: PropertySectionContext) => PropertySectionContext;
//#endregion
//#region src/primitives/SegmentedControl/types.d.ts
type SegmentedControlMode = 'single' | 'multiple' | 'action';
type SegmentedControlOrientation = 'horizontal' | 'vertical';
interface SegmentedControlRootProps {
  /** Selection behavior or stateless action behavior. @default 'single' */
  mode?: SegmentedControlMode;
  /** Controlled selected value or values. */
  modelValue?: string | string[];
  /** Arrow-key navigation axis. @default 'horizontal' */
  orientation?: SegmentedControlOrientation;
  /** Disable every item. @default false */
  disabled?: boolean;
  /** Require a value in single-selection mode. @default false */
  required?: boolean;
  /** Enable arrow-key roving focus. @default true */
  rovingFocus?: boolean;
  /** Wrap keyboard focus at the first and last item. @default true */
  loop?: boolean;
}
interface SegmentedControlItemProps {
  /** Stable selection or action identifier. */
  value: string;
  /** Disable this item. @default false */
  disabled?: boolean;
  /** Element or component rendered by this item. @default 'button' */
  as?: string | Component;
  /** Merge item behavior into the single child element. @default false */
  asChild?: boolean;
}
interface SegmentedControlItemSlotProps {
  value: string;
  selected: boolean;
  disabled: boolean;
  mode: SegmentedControlMode;
}
interface SegmentedControlRootSlots {
  default(props: {
    mode: SegmentedControlMode;
    modelValue: string | string[] | undefined;
  }): VNode[];
}
interface SegmentedControlItemSlots {
  default(props: SegmentedControlItemSlotProps): VNode[];
}
interface SegmentedControlContext {
  mode: ComputedRef<SegmentedControlMode>;
  modelValue: ComputedRef<string | string[] | undefined>;
  disabled: ComputedRef<boolean>;
  selected(value: string): boolean;
  activate(value: string): void;
}
//#endregion
//#region src/primitives/SegmentedControl/SegmentedControlRoot.vue.d.ts
type __VLS_Slots$8 = SegmentedControlRootSlots;
declare const __VLS_base$8: import("vue").DefineComponent<SegmentedControlRootProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
  action: (value: string) => any;
  "update:modelValue": (value: string | string[] | undefined) => any;
}, string, import("vue").PublicProps, Readonly<SegmentedControlRootProps> & Readonly<{
  onAction?: ((value: string) => any) | undefined;
  "onUpdate:modelValue"?: ((value: string | string[] | undefined) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$10: __VLS_WithSlots$8<typeof __VLS_base$8, __VLS_Slots$8>;
declare const _default$39: typeof __VLS_export$10;
type __VLS_WithSlots$8<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=SegmentedControlRoot.vue.d.ts.map
//#endregion
//#region src/primitives/SegmentedControl/SegmentedControlItem.vue.d.ts
type __VLS_Slots$7 = SegmentedControlItemSlots;
declare const __VLS_base$7: import("vue").DefineComponent<SegmentedControlItemProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<SegmentedControlItemProps> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$9: __VLS_WithSlots$7<typeof __VLS_base$7, __VLS_Slots$7>;
declare const _default$38: typeof __VLS_export$9;
type __VLS_WithSlots$7<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=SegmentedControlItem.vue.d.ts.map
//#endregion
//#region src/primitives/SegmentedControl/context.d.ts
declare const useSegmentedControl: () => SegmentedControlContext, provideSegmentedControl: (value: SegmentedControlContext) => SegmentedControlContext;
//#endregion
//#region src/primitives/BindableValue/BindableValueRoot.vue.d.ts
declare const __VLS_export$8: <V>(__VLS_props: NonNullable<Awaited<typeof __VLS_setup>>["props"], __VLS_ctx?: __VLS_PrettifyLocal<Pick<NonNullable<Awaited<typeof __VLS_setup>>, "attrs" | "emit" | "slots">>, __VLS_exposed?: NonNullable<Awaited<typeof __VLS_setup>>["expose"], __VLS_setup?: Promise<{
  props: import("vue").PublicProps & __VLS_PrettifyLocal<BindableValueRootProps<V>> & (typeof globalThis extends {
    __VLS_PROPS_FALLBACK: infer P;
  } ? P : {});
  expose: (exposed: {}) => void;
  attrs: any;
  slots: BindableValueRootSlots<V>;
  emit: {};
}>) => import("vue").VNode & {
  __ctx?: Awaited<typeof __VLS_setup>;
};
declare const _default$2: typeof __VLS_export$8;
type __VLS_PrettifyLocal<T> = (T extends any ? { [K in keyof T]: T[K] } : { [K in keyof T as K]: T[K] }) & {}; //# sourceMappingURL=BindableValueRoot.vue.d.ts.map
//#endregion
//#region src/primitives/BindableValue/BindableValueTrigger.vue.d.ts
declare var __VLS_10: {
  state: BindingState;
  variable: import("@open-pencil/scene-graph").Variable | undefined;
  resolvedValue: unknown;
  policy: BoundEditPolicy;
  open: boolean;
  searchTerm: string;
  variables: import("@open-pencil/scene-graph").Variable[];
  stateAttrs: BindableValueStateAttrs;
  actions: BindableValueActions<unknown>;
};
type __VLS_Slots$6 = {} & {
  default?: (props: typeof __VLS_10) => any;
};
declare const __VLS_base$6: import("vue").DefineComponent<import("reka-ui").PrimitiveProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("reka-ui").PrimitiveProps> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$7: __VLS_WithSlots$6<typeof __VLS_base$6, __VLS_Slots$6>;
declare const _default$3: typeof __VLS_export$7;
type __VLS_WithSlots$6<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=BindableValueTrigger.vue.d.ts.map
//#endregion
//#region src/primitives/BindableValue/BindableValuePicker.vue.d.ts
declare var __VLS_11: {
  state: BindingState;
  variable: import("@open-pencil/scene-graph").Variable | undefined;
  resolvedValue: unknown;
  policy: BoundEditPolicy;
  open: boolean;
  searchTerm: string;
  variables: import("@open-pencil/scene-graph").Variable[];
  stateAttrs: BindableValueStateAttrs;
  actions: BindableValueActions<unknown>;
};
type __VLS_Slots$5 = {} & {
  default?: (props: typeof __VLS_11) => any;
};
declare const __VLS_base$5: import("vue").DefineComponent<{}, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
declare const __VLS_export$6: __VLS_WithSlots$5<typeof __VLS_base$5, __VLS_Slots$5>;
declare const _default$1: typeof __VLS_export$6;
type __VLS_WithSlots$5<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=BindableValuePicker.vue.d.ts.map
//#endregion
//#region src/primitives/BindableValue/context.d.ts
declare function useBindableValue<V>(): BindableValueContext<V>;
declare function useOptionalBindableValue<V>(): BindableValueContext<V> | undefined;
//#endregion
//#region src/controls/binding-provider/color.d.ts
declare function useColorBindingProvider(): BindingProvider<Color$1>;
//#endregion
//#region src/controls/binding-provider/context.d.ts
declare function provideBindingProvider(provider: BindingProvider): void;
declare function useBindingProvider<V>(): BindingProvider<V> | undefined;
//#endregion
//#region src/controls/binding-provider/open-pencil.d.ts
interface OpenPencilBindingProviderOptions<V> {
  type: VariableType;
  resolve(editor: Editor$1, variableId: string): V | undefined;
  create?(editor: Editor$1, target: BindingTarget, value: V, name: string): void;
  setValue?(editor: Editor$1, variableId: string, value: V): void;
}
declare function useOpenPencilBindingProvider<V>(options: OpenPencilBindingProviderOptions<V>): BindingProvider<V>;
//#endregion
//#region src/controls/binding-provider/number.d.ts
declare function useNumberBindingProvider(): BindingProvider<number>;
//#endregion
//#region src/controls/number-expression/evaluate.d.ts
type NumberExpressionError = 'empty' | 'syntax' | 'non-finite' | 'percent-requires-finite-max' | 'relative-requires-value';
type NumberExpressionResult = {
  ok: true;
  value: number;
  kind: 'absolute' | 'relative' | 'percent';
} | {
  ok: false;
  error: NumberExpressionError;
};
interface NumberExpressionOptions {
  current: number;
  max?: number;
  mixed?: boolean;
}
declare function evaluateNumberExpression(expression: string, {
  current,
  max,
  mixed
}: NumberExpressionOptions): NumberExpressionResult;
declare function clampNumberValue(value: number, min?: number, max?: number): number;
declare function normalizeNumberValue(value: number): number;
declare function stepNumberValue(value: number, direction: 1 | -1, step: number, modifiers?: {
  shiftKey?: boolean;
  altKey?: boolean;
}, min?: number, max?: number): number;
//#endregion
//#region src/primitives/NumberField/types.d.ts
type NumberFieldEditPolicy = 'editable' | 'readonly' | 'detach-on-edit';
type NumberFieldMutationSource = 'edit' | 'scrub' | 'step';
interface NumberFieldRootProps {
  /** Current numeric value or the mixed-value sentinel. */
  modelValue: number | symbol;
  /** Minimum allowed value. */
  min?: number;
  /** Maximum allowed value and percentage-expression basis. */
  max?: number;
  /** Pointer-scrub and Arrow-key increment. */
  step?: number;
  /** Multiplier applied to pointer-scrub movement. */
  sensitivity?: number;
  /** Text shown when modelValue is mixed. */
  placeholder?: string;
  /** Accessible name for the spinbutton. */
  ariaLabel?: string;
  /** Prevents editing, scrubbing, and keyboard stepping. */
  disabled?: boolean;
  /** Marks the value as controlled by an external binding. */
  bound?: boolean;
  /** Mutation policy used when the value is bound. */
  editPolicy?: NumberFieldEditPolicy;
}
interface NumberFieldRootEmits {
  /** Emitted for live numeric updates and committed expression results. */
  (event: 'update:modelValue', value: number): void;
  /** Emitted once after a changed interaction is committed. */
  (event: 'commit', value: number, previous: number): void;
  /** Emitted when the inline editing state changes. */
  (event: 'editing-change', editing: boolean): void;
  /** Emitted when a committed expression cannot be evaluated. */
  (event: 'invalid', expression: string, reason: NumberExpressionError): void;
  /** Emitted before detach-on-edit mutates a bound value. */
  (event: 'detach-request', source: NumberFieldMutationSource): void;
}
interface NumberFieldState {
  editing: boolean;
  scrubbing: boolean;
  mixed: boolean;
  disabled: boolean;
  bound: boolean;
}
interface NumberFieldStateAttrs {
  'data-editing'?: '';
  'data-scrubbing'?: '';
  'data-mixed'?: '';
  'data-disabled'?: '';
  'data-bound'?: '';
}
interface NumberFieldRootAttrs extends NumberFieldStateAttrs {
  role: 'spinbutton' | undefined;
  tabindex: 0 | -1 | undefined;
  'aria-valuenow'?: number;
  'aria-valuemin'?: number;
  'aria-valuemax'?: number;
  'aria-disabled'?: 'true';
  'aria-label'?: string;
  onFocus: () => void;
  onKeydown: (event: KeyboardEvent) => void;
}
interface NumberFieldActions {
  startScrub(event: PointerEvent): void;
  startEdit(): void;
  cancelEdit(): void;
  commitEdit(event?: Event): void;
  setDraft(value: string): void;
  input(event: Event): void;
  keydown(event: KeyboardEvent): void;
}
interface NumberFieldSlotProps extends NumberFieldState {
  modelValue: number | symbol;
  displayValue: string;
  draftValue: string;
  isMixed: boolean;
  placeholder: string;
  state: NumberFieldState;
  attrs: NumberFieldRootAttrs;
  actions: NumberFieldActions;
}
interface NumberFieldRootSlots {
  /** Complete render contract for composing a numeric field. */
  default(props: NumberFieldSlotProps): VNode[];
}
interface NumberFieldValueSlots {
  /** Non-editing display value plus the complete field render contract. */
  default(props: NumberFieldSlotProps & {
    value: string;
  }): VNode[];
}
interface NumberFieldContext {
  modelValue: ComputedRef<number | symbol>;
  numericValue: ComputedRef<number>;
  displayValue: ComputedRef<string>;
  draftValue: Ref<string>;
  isMixed: ComputedRef<boolean>;
  editing: Ref<boolean>;
  scrubbing: Ref<boolean>;
  disabled: ComputedRef<boolean>;
  bound: ComputedRef<boolean>;
  min: ComputedRef<number>;
  max: ComputedRef<number>;
  step: ComputedRef<number>;
  ariaLabel: ComputedRef<string | undefined>;
  inputRef: Ref<HTMLInputElement | null>;
  state: ComputedRef<NumberFieldState>;
  stateAttrs: ComputedRef<NumberFieldStateAttrs>;
  rootAttrs: ComputedRef<NumberFieldRootAttrs>;
  slotProps: ComputedRef<NumberFieldSlotProps>;
  actions: NumberFieldActions;
  invalidReason: Ref<NumberExpressionError | null>;
}
//#endregion
//#region src/primitives/NumberField/NumberFieldRoot.vue.d.ts
type __VLS_Slots$4 = NumberFieldRootSlots;
declare const __VLS_base$4: import("vue").DefineComponent<NumberFieldRootProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {} & {
  "update:modelValue": (value: number) => any;
  "editing-change": (editing: boolean) => any;
  commit: (value: number, previous: number) => any;
  invalid: (expression: string, reason: NumberExpressionError) => any;
  "detach-request": (source: NumberFieldMutationSource) => any;
}, string, import("vue").PublicProps, Readonly<NumberFieldRootProps> & Readonly<{
  "onUpdate:modelValue"?: ((value: number) => any) | undefined;
  "onEditing-change"?: ((editing: boolean) => any) | undefined;
  onCommit?: ((value: number, previous: number) => any) | undefined;
  onInvalid?: ((expression: string, reason: NumberExpressionError) => any) | undefined;
  "onDetach-request"?: ((source: NumberFieldMutationSource) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$5: __VLS_WithSlots$4<typeof __VLS_base$4, __VLS_Slots$4>;
declare const _default$22: typeof __VLS_export$5;
type __VLS_WithSlots$4<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=NumberFieldRoot.vue.d.ts.map
//#endregion
//#region src/primitives/NumberField/NumberFieldInput.vue.d.ts
declare const __VLS_export$4: import("vue").DefineComponent<{}, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
declare const _default$21: typeof __VLS_export$4;
//#endregion
//#region src/primitives/NumberField/NumberFieldValue.vue.d.ts
type __VLS_Slots$3 = NumberFieldValueSlots;
declare const __VLS_base$3: import("vue").DefineComponent<{}, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
declare const __VLS_export$3: __VLS_WithSlots$3<typeof __VLS_base$3, __VLS_Slots$3>;
declare const _default$23: typeof __VLS_export$3;
type __VLS_WithSlots$3<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=NumberFieldValue.vue.d.ts.map
//#endregion
//#region src/primitives/NumberField/parts.d.ts
declare const NumberFieldLeading: import("vue").DefineComponent<{}, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
  [key: string]: any;
}>, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
declare const NumberFieldUnit: import("vue").DefineComponent<{}, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
  [key: string]: any;
}>, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
declare const NumberFieldTrailing: import("vue").DefineComponent<{}, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
  [key: string]: any;
}>, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
declare const NumberFieldMenu: import("vue").DefineComponent<{}, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
  [key: string]: any;
}>, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
//#endregion
//#region src/primitives/NumberField/context.d.ts
declare const useNumberField: () => NumberFieldContext, provideNumberField: (value: NumberFieldContext) => NumberFieldContext;
//#endregion
//#region src/primitives/TypographyControls/TypographyControlsRoot.vue.d.ts
type __VLS_Props$2 = {
  fontLoader?: TypographyFontLoader;
};
declare function onAlignChange(val: AcceptableValue): void;
declare function onFormattingChange(val: AcceptableValue | AcceptableValue[]): void;
declare var __VLS_1$2: {
  node: import("vue").ComputedRef<import("@open-pencil/scene-graph").SceneNode | null>;
  weights: {
    value: number;
    label: string;
  }[];
  missingFonts: import("vue").ComputedRef<string[]>;
  hasMissingFonts: import("vue").ComputedRef<boolean>;
  activeFormatting: import("vue").ComputedRef<string[]>;
  actions: {
    setFamily: (family: string) => Promise<void>;
    setWeight: (weight: number) => Promise<void>;
    setDirection: (direction: import("@open-pencil/scene-graph").TextDirection) => void;
    setVerticalAlign: (align: import("@open-pencil/scene-graph").TextAlignVertical) => void;
    setTextCase: (textCase: import("@open-pencil/scene-graph").TextCase) => void;
    setTruncation: (textTruncation: "DISABLED" | "ENDING") => void;
    setFontFeature: (tag: string, enabled: boolean) => void;
    updateProp: (key: keyof import("@open-pencil/scene-graph").SceneNode, value: number | string | null) => void;
    commitProp: (key: keyof import("@open-pencil/scene-graph").SceneNode, _value: number | string | null, previous: number | string | null) => void;
    align: typeof onAlignChange;
    formatting: typeof onFormattingChange;
    toggleBold: () => void;
    toggleItalic: () => void;
    toggleDecoration: (deco: "UNDERLINE" | "STRIKETHROUGH") => void;
  };
};
type __VLS_Slots$2 = {} & {
  default?: (props: typeof __VLS_1$2) => any;
};
declare const __VLS_base$2: import("vue").DefineComponent<__VLS_Props$2, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<__VLS_Props$2> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$2: __VLS_WithSlots$2<typeof __VLS_base$2, __VLS_Slots$2>;
declare const _default$42: typeof __VLS_export$2;
type __VLS_WithSlots$2<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=TypographyControlsRoot.vue.d.ts.map
//#endregion
//#region src/primitives/Toolbar/ToolbarRoot.vue.d.ts
type __VLS_Props$1 = {
  tools?: EditorToolDef$1[];
};
declare function setTool(tool: Tool$1): void;
declare function toggleFlyout(tool: Tool$1): void;
declare function closeFlyout(): void;
declare var __VLS_1$1: {
  tools: EditorToolDef$1[];
  activeTool: Tool$1;
  flyoutSelections: import("vue").Reactive<Map<Tool$1, Tool$1>>;
  expandedFlyout: Tool$1 | null;
  actions: {
    setTool: typeof setTool;
    toggleFlyout: typeof toggleFlyout;
    closeFlyout: typeof closeFlyout;
  };
};
type __VLS_Slots$1 = {} & {
  default?: (props: typeof __VLS_1$1) => any;
};
declare const __VLS_base$1: import("vue").DefineComponent<__VLS_Props$1, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<__VLS_Props$1> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export$1: __VLS_WithSlots$1<typeof __VLS_base$1, __VLS_Slots$1>;
declare const _default$41: typeof __VLS_export$1;
type __VLS_WithSlots$1<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=ToolbarRoot.vue.d.ts.map
//#endregion
//#region src/primitives/Toolbar/ToolbarItem.vue.d.ts
type __VLS_Props = {
  tool: Tool$1;
};
declare var __VLS_1: {
  active: boolean;
  actions: {
    select: () => void;
  };
  tool: Tool$1;
};
type __VLS_Slots = {} & {
  default?: (props: typeof __VLS_1) => any;
};
declare const __VLS_base: import("vue").DefineComponent<__VLS_Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default$40: typeof __VLS_export;
type __VLS_WithSlots<T, S> = T & {
  new (): {
    $slots: S;
  };
}; //# sourceMappingURL=ToolbarItem.vue.d.ts.map
//#endregion
//#region src/primitives/Toolbar/context.d.ts
interface ToolbarContext {
  editor: Editor$1;
  tools: EditorToolDef$1[];
  activeTool: ComputedRef<Tool$1>;
  flyoutSelections: ReadonlyMap<Tool$1, Tool$1>;
  expandedFlyout: Ref<Tool$1 | null>;
  setTool: (tool: Tool$1) => void;
  toggleFlyout: (tool: Tool$1) => void;
  closeFlyout: () => void;
}
declare function useToolbar(): ToolbarContext;
//#endregion
//#region src/shared/dom-events.d.ts
declare function inputValue(e: Event): string;
declare function inputNumberValue(e: Event): number;
declare function blurTarget(e: Event): void;
declare function selectTarget(e: Event): void;
//#endregion
export { AVAILABLE_LOCALES, type AppearanceControlsActions, _default as AppearanceControlsRoot, type AppearanceControlsRootSlotProps, type AppearanceControlsRootSlots, BUILT_IN_COLOR_FORMATS, type BindableValueActions, type BindableValueContext, _default$1 as BindableValuePicker, _default$2 as BindableValueRoot, type BindableValueRootProps, type BindableValueRootSlots, type BindableValueSlotProps, type BindableValueStateAttrs, _default$3 as BindableValueTrigger, type BindableValueTriggerProps, type BindingMutationSource, type BindingProvider, type BindingState, type BindingTarget, type BoundEditPolicy, type BuiltInColorFormat, type CanvasContext, _default$4 as CanvasRoot, _default$5 as CanvasSurface, type ChannelSliderOrientation, type ChannelSliderPartProps, _default$6 as ChannelSliderRoot, type ChannelSliderRootProps, type ChannelSliderRootSlotProps, _default$7 as ChannelSliderThumb, type ChannelSliderThumbSlotProps, _default$8 as ChannelSliderTrack, type ColorFieldFormat, type ColorFieldOption, _default$9 as ColorInputRoot, _default$10 as ColorPickerRoot, type ComponentPropertyControl, type ComponentPropertyOption, type ConstraintAxis, type ConstraintEdge, type ConstraintValue, type ConstraintsControlActions, _default$11 as ConstraintsControlRoot, type ConstraintsControlRootSlotProps, type ConstraintsControlRootSlots, type CornerGeometryKey, type CornerRadiusKey, type DocumentWorkspaceItem, type DocumentWorkspaceSource, EDITOR_COMMAND_METADATA, EDITOR_KEY, EDITOR_TOOLS, type Editor, type EditorCommand, type EditorCommandId, type EditorCommandMetadata, type EditorEventName, type EditorEvents, type EditorOptions, type EditorState, type EditorToolDef, type ExportFormatId, type ExportSetting, type FillActions, type FillCategory, _default$12 as FillRoot, type FillRootSlotProps, type FillRootSlots, _default$13 as FillSwatch, type FillSwatchProps, type FillSwatchSlotProps, type FillSwatchSlots, type FlatReorderAxis, type FlatReorderInstruction, type FlatReorderItem, type FontFamilyOption, _default$14 as FontPickerRoot, type FontPickerUI, _default$15 as GradientEditorBar, _default$16 as GradientEditorRoot, _default$17 as GradientEditorStop, type GradientEditorStopActions, type GradientEditorStopProps, type GradientEditorStopSlotProps, type GradientEditorStopSlots, LOCALE_DIR_NAMES, LOCALE_LABELS, type LayerDragInstruction, type LayerNode, type LayerRow, type LayerSelectionMode, type LayerTreeContext, _default$18 as LayerTreeItem, _default$19 as LayerTreeRoot, type LayerTreeVirtualizer, type LayoutAxis, type LayoutControlsContext, _default$20 as LayoutControlsRoot, type LayoutControlsRootSlotProps, type LayoutControlsRootSlots, type Locale, MIXED, type MenuActionNode, type MenuEntry, type MenuSeparatorNode, type MixedValue, type NumberBindingPath, type NumberExpressionError, type NumberExpressionOptions, type NumberExpressionResult, type NumberFieldActions, type NumberFieldContext, type NumberFieldEditPolicy, _default$21 as NumberFieldInput, NumberFieldLeading, NumberFieldMenu, type NumberFieldMutationSource, _default$22 as NumberFieldRoot, type NumberFieldRootAttrs, type NumberFieldRootEmits, type NumberFieldRootProps, type NumberFieldRootSlots, type NumberFieldSlotProps, type NumberFieldState, type NumberFieldStateAttrs, NumberFieldTrailing, NumberFieldUnit, _default$23 as NumberFieldValue, type NumberFieldValueSlots, type OkHCLControls, type OpenPencilBindingProviderOptions, _default$24 as PageListRoot, _default$25 as PositionControlsRoot, type PropertyGridColumns, type PropertyGridDistribution, _default$26 as PropertyGridRoot, type PropertyGridRootProps, type PropertyGridRootSlots, type PropertyListActions, _default$27 as PropertyListAdd, type PropertyListContext, type PropertyListIdentity, _default$28 as PropertyListItem, type PropertyListItemActions, type PropertyListItemFor, type PropertyListItemMap, type PropertyListItemSlotProps, type PropertyListKey, type PropertyListPartProps, type PropertyListPatchFor, _default$29 as PropertyListRemove, _default$30 as PropertyListRoot, type PropertyListRootProps, type PropertyListRootSlotProps, type PropertyListRootSlots, _default$31 as PropertyListVisibility, type PropertySectionActionAPI, _default$32 as PropertySectionActions, _default$33 as PropertySectionContent, type PropertySectionContext, _default$34 as PropertySectionEmptyAction, _default$35 as PropertySectionHeader, type PropertySectionPartProps, _default$36 as PropertySectionRoot, type PropertySectionRootProps, type PropertySectionRootSlots, type PropertySectionSlotProps, type PropertySectionStateAttrs, _default$37 as PropertySectionTitle, type SegmentedControlContext, _default$38 as SegmentedControlItem, type SegmentedControlItemProps, type SegmentedControlItemSlotProps, type SegmentedControlItemSlots, type SegmentedControlMode, type SegmentedControlOrientation, _default$39 as SegmentedControlRoot, type SegmentedControlRootProps, type SegmentedControlRootSlots, type ShortcutPlatform, type SizeLimitProp, TOOL_SHORTCUTS, TRANSLATED_LOCALES, type TestId, type Tool, type ToolbarContext, _default$40 as ToolbarItem, _default$41 as ToolbarRoot, type TranslatedLocale, _default$42 as TypographyControlsRoot, type UseCanvasOptions, type UseColorModelOptions, type UseDocumentWorkspaceOptions, type UseFlatReorderDragOptions, type UseTypographyOptions, type UseVariableBindingOptions, type VariableBindingState, acpPermissionOptionTestId, applySolidFillColor, applySolidStrokeColor, blurTarget, buildLayerTreeModel, clampNumberValue, commandMessages, compatibleComponentPropertyDefinitions, constraintPins, createEditor, dialogMessages, editorCommandMetadata, evaluateNumberExpression, extractImageFilesFromClipboard, fillCategory, fillIsTransparent, fillSwatchBackground, formatShortcut, fromPercent, getToolbarToolSelection, i18n, indexLayerNodes, inputNumberValue, inputValue, instanceSwapOptions, isConstraintEligible, isToolbarToolActive, layerSelectionForTarget, locale, localeSetting, menuMessages, mergedComponentPropertyValue, messageDefaults, normalizeNumberValue, pageMessages, panelMessages, patchLayerNode, provideBindingProvider, provideEditor, selectTarget, setLocale, shortcutPlatform, stepNumberValue, testId, testIdSelector, toPercent, toggleConstraintPin, toolCursor, toolMessages, toolbarFlyoutItemTestId, toolbarFlyoutTestId, toolbarToolTestId, useAppearance, useBindableValue, useBindingProvider, useCanvas, useCanvasContext, useCanvasDrop, useCanvasInput, useCanvasVirtualReference, useColorBindingProvider, useColorModel, useColorVariableBinding, useCommandMessages, useComponentProperties, useConstraints, useDialogMessages, useDocumentWorkspace, useEditor, useEditorCommands, useEditorEvent, useEditorPropertyList, useEffectsControls, useExport, useFill, useFillControls, useFlatReorderDrag, useFontPicker, useGradientStops, useI18n, useI18nNamespace, useInlineRename, useLayerDrag, useLayerTree, useLayout, useLayoutControlsContext, useMask, useMenuMessages, useMenuModel, useNodeFontStatus, useNodeProps, useNumberBindingProvider, useNumberField, useNumberVariableBinding, useOkHCL, useOpenPencilBindingProvider, useOptionalBindableValue, usePageList, usePageMessages, usePanelMessages, usePosition, usePropScrub, usePropertyList, usePropertySection, useSceneComputed, useSegmentedControl, useSelectionCapabilities, useSelectionState, useSharedStyleBinding, useStrokeControls, useTextEdit, useToolMessages, useToolbar, useToolbarState, useTypography, useVariableBinding, useVariableTypeMessages, useVariables, useVariablesDialogState, useVariablesEditor, useVariablesTable, useViewportKind, vTestId, variableTypeMessages, variablesAddTestId, visibleLayerRows };
//# sourceMappingURL=index.d.ts.map
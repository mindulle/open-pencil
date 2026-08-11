import { EditorContext } from "./types.js";
import { FramePresetDimensions } from "./shapes/frame-presets.js";
import { PenDragOptions } from "./shapes/pen.js";
import { NodeType } from "@open-pencil/scene-graph";

//#region src/editor/shapes.d.ts
declare function createShapeActions(ctx: EditorContext): {
  adoptNodesIntoSection: (sectionId: string) => void;
  setTool: (tool: typeof ctx.state.activeTool) => void;
  createFrameFromPreset: (preset: FramePresetDimensions) => string;
  resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
  penAddVertex: (x: number, y: number) => void;
  penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
  penSetClosingToFirst: (closing: boolean) => void;
  penSetPendingClose: (closing: boolean) => void;
  penSetKnotPosition: (x: number, y: number) => void;
  penCommit: (closed: boolean) => void;
  penCancel: () => void;
  createShape: (type: NodeType, x: number, y: number, w: number, h: number, parentId?: string, name?: string) => string;
};
//#endregion
export { type PenDragOptions, createShapeActions };
//# sourceMappingURL=shapes.d.ts.map
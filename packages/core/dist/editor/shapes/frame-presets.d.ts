import { EditorContext } from "../types.js";

//#region src/editor/shapes/frame-presets.d.ts
interface FramePresetDimensions {
  name: string;
  width: number;
  height: number;
}
type CreateShape = (type: 'FRAME', x: number, y: number, width: number, height: number, parentId: string | undefined, name: string) => string;
declare function createFramePresetActions(ctx: EditorContext, createShape: CreateShape): {
  createFrameFromPreset: (preset: FramePresetDimensions) => string;
  resizeFrameToPreset: (id: string, preset: FramePresetDimensions) => void;
};
//#endregion
export { FramePresetDimensions, createFramePresetActions };
//# sourceMappingURL=frame-presets.d.ts.map
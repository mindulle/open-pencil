import { BlendMode, CanvasKit } from "canvaskit-wasm";
import { BlendMode as BlendMode$1 } from "@open-pencil/scene-graph";

//#region src/canvas/blend.d.ts
declare function figmaBlendModeToSkia(ck: CanvasKit, mode?: BlendMode$1): BlendMode;
declare function needsIsolatedBlendLayer(mode?: BlendMode$1): boolean;
//#endregion
export { figmaBlendModeToSkia, needsIsolatedBlendLayer };
//# sourceMappingURL=blend.d.ts.map
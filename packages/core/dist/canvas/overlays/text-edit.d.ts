import { TextEditor } from "../../text/editor.js";
import { SkiaRenderer } from "../renderer.js";
import { Canvas } from "canvaskit-wasm";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/overlays/text-edit.d.ts
declare function drawTextEditOverlay(r: SkiaRenderer, canvas: Canvas, node: SceneNode, editor: TextEditor): void;
//#endregion
export { drawTextEditOverlay };
//# sourceMappingURL=text-edit.d.ts.map
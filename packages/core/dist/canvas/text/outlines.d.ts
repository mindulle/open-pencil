import { SkiaRenderer } from "../renderer.js";
import { Path } from "canvaskit-wasm";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/text/outlines.d.ts
declare function textNodeToOutlinePath(r: SkiaRenderer, node: SceneNode): Path | null;
//#endregion
export { textNodeToOutlinePath };
//# sourceMappingURL=outlines.d.ts.map
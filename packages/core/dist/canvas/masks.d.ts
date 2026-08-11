import { SkiaRenderer } from "./renderer.js";
import { Canvas } from "canvaskit-wasm";
import { MaskType } from "@open-pencil/scene-graph";
import { Rect } from "@open-pencil/scene-graph/primitives";

//#region src/canvas/masks.d.ts
declare function renderMaskedChildIds(r: SkiaRenderer, canvas: Canvas, childIds: string[], getVisibleMaskType: (childId: string) => MaskType | null, renderChild: (childId: string) => void, renderMask: (childId: string) => void, getChildBounds?: (childId: string) => Rect | null): void;
//#endregion
export { renderMaskedChildIds };
//# sourceMappingURL=masks.d.ts.map
import { LabelCache } from "./cache.js";
import { Font } from "canvaskit-wasm";
import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/labels/hit-test.d.ts
declare function hitTestSectionTitle(graph: SceneGraph, canvasX: number, canvasY: number, zoom: number, pageId: string, font: Font | null, labelCache?: LabelCache): SceneNode | null;
declare function hitTestComponentLabel(graph: SceneGraph, canvasX: number, canvasY: number, zoom: number, pageId: string, font: Font | null, labelCache?: LabelCache): SceneNode | null;
declare function hitTestFrameTitle(graph: SceneGraph, canvasX: number, canvasY: number, zoom: number, selectedIds: Set<string>, font: Font | null): SceneNode | null;
//#endregion
export { hitTestComponentLabel, hitTestFrameTitle, hitTestSectionTitle };
//# sourceMappingURL=hit-test.d.ts.map
import { SkiaRenderer } from "../renderer.js";

//#region src/canvas/renderer/state.d.ts
declare function invalidateScenePicture(r: SkiaRenderer): void;
declare function clearSubtreePictureCache(r: SkiaRenderer): void;
declare function invalidateAllPictures(r: SkiaRenderer): void;
declare function invalidateNodePicture(r: SkiaRenderer, nodeId: string): void;
declare function flashNode(r: SkiaRenderer, nodeId: string): void;
declare function aiMarkActive(r: SkiaRenderer, nodeIds: string[]): void;
declare function aiMarkDone(r: SkiaRenderer, nodeIds: string[]): void;
declare function aiFlashDone(r: SkiaRenderer, nodeIds: string[]): void;
declare function aiClearActive(r: SkiaRenderer): void;
declare function aiClearAll(r: SkiaRenderer): void;
declare function hasActiveFlashes(r: SkiaRenderer): boolean;
//#endregion
export { aiClearActive, aiClearAll, aiFlashDone, aiMarkActive, aiMarkDone, clearSubtreePictureCache, flashNode, hasActiveFlashes, invalidateAllPictures, invalidateNodePicture, invalidateScenePicture };
//# sourceMappingURL=state.d.ts.map
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/text/auto-resize.d.ts
declare const TEXT_AUTO_RESIZE_KEYS: Set<keyof SceneNode>;
declare function hasTextAutoResizeChange(changes: Partial<SceneNode>): boolean;
declare function textAutoResizeChanges(node: SceneNode | undefined, changes: Partial<SceneNode>): Partial<Pick<SceneNode, 'width' | 'height' | 'figmaDerivedLayout' | 'figmaDerivedTextGlyphs'>>;
//#endregion
export { TEXT_AUTO_RESIZE_KEYS, hasTextAutoResizeChange, textAutoResizeChanges };
//# sourceMappingURL=auto-resize.d.ts.map
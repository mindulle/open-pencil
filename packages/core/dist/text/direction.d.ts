import { LayoutDirection, SceneNode, TextDirection } from "@open-pencil/scene-graph";

//#region src/text/direction.d.ts
declare function detectTextDirection(text: string): Exclude<TextDirection, 'AUTO'>;
declare function resolveTextDirection(direction: TextDirection, text: string): Exclude<TextDirection, 'AUTO'>;
declare function resolveNodeTextDirection(node: Pick<SceneNode, 'textDirection' | 'text'>): 'LTR' | 'RTL';
declare function resolveNodeLayoutDirection(node: {
  layoutDirection?: LayoutDirection;
}, inheritedDirection?: Exclude<LayoutDirection, 'AUTO'>): Exclude<LayoutDirection, 'AUTO'>;
declare function isLogicalTextAlignStart(node: Pick<SceneNode, 'textAlignHorizontal' | 'textDirection' | 'text'>): boolean;
declare function isLogicalTextAlignEnd(node: Pick<SceneNode, 'textAlignHorizontal' | 'textDirection' | 'text'>): boolean;
//#endregion
export { detectTextDirection, isLogicalTextAlignEnd, isLogicalTextAlignStart, resolveNodeLayoutDirection, resolveNodeTextDirection, resolveTextDirection };
//# sourceMappingURL=direction.d.ts.map
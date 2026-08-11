import { Color, Fill, SceneNode, Stroke } from "@open-pencil/scene-graph";
import PptxGenJS from "pptxgenjs";

//#region src/io/formats/pptx/style.d.ts
/** Scene paint/effect/text style → PPT property mapping (no slide geometry). */
declare function firstVisibleFill(node: SceneNode): Fill | null;
declare function firstVisibleStroke(node: SceneNode): Stroke | null;
declare function isRounded(node: SceneNode): boolean;
declare function hasAsymmetricCorners(node: SceneNode): boolean;
declare function effectiveRadius(node: SceneNode): number;
/** DROP_SHADOW without blur (design-system solid offset shadow) — drawn as a separate shape. */
declare function getSolidOffsetShadow(node: SceneNode): import("@open-pencil/scene-graph").Effect | null;
declare function mapShadow(node: SceneNode, opacity: number): PptxGenJS.ShadowProps | undefined;
declare function mapHAlign(a: SceneNode['textAlignHorizontal']): 'left' | 'center' | 'right' | 'justify';
declare function mapVAlign(a: SceneNode['textAlignVertical']): 'top' | 'middle' | 'bottom';
declare function applyTextCase(text: string, textCase: SceneNode['textCase']): string;
declare function hex(color: Color): string;
declare function transparency(alpha: number): number;
declare function clamp01(v: number): number;
declare function clampRot(deg: number): number;
declare function round2(v: number): number;
//#endregion
export { applyTextCase, clamp01, clampRot, effectiveRadius, firstVisibleFill, firstVisibleStroke, getSolidOffsetShadow, hasAsymmetricCorners, hex, isRounded, mapHAlign, mapShadow, mapVAlign, round2, transparency };
//# sourceMappingURL=style.d.ts.map
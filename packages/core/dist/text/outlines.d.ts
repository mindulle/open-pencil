import { OutlineCommand } from "./opentype.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/text/outlines.d.ts
type TextOutlineUnsupportedReason = 'not-text' | 'empty-text' | 'missing-font' | 'missing-glyph' | 'complex-script';
type TextOutlineSupport = {
  supported: true;
} | {
  supported: false;
  reason: TextOutlineUnsupportedReason;
};
interface TextOutlineGlyph {
  commands: OutlineCommand[];
  x: number;
  y: number;
}
interface TextOutlineLayout {
  glyphs: TextOutlineGlyph[];
  width: number;
  height: number;
}
declare function getTextOutlineSupport(node: SceneNode): TextOutlineSupport;
declare function textNodeToOutlineLayout(node: SceneNode): TextOutlineLayout | null;
//#endregion
export { TextOutlineGlyph, TextOutlineLayout, TextOutlineSupport, TextOutlineUnsupportedReason, getTextOutlineSupport, textNodeToOutlineLayout };
//# sourceMappingURL=outlines.d.ts.map
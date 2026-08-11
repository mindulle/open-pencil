import { NodeChange } from "@open-pencil/kiwi/fig/codec";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/text/clipboard.d.ts
interface ClipboardShapedGlyph {
  glyphIndex: number;
  firstCharacter: number;
  x: number;
  y: number;
  advance: number;
}
interface ClipboardShapedText {
  lineHeight: number;
  lineAscent: number;
  lineWidth: number;
  baseline: number;
  baselines?: NonNullable<NodeChange['derivedTextData']>['baselines'];
  glyphs: ClipboardShapedGlyph[];
  logicalIndexToCharacterOffsetMap: number[];
}
declare function shapeTextForClipboard(node: SceneNode): Promise<ClipboardShapedText | null>;
//#endregion
export { ClipboardShapedGlyph, ClipboardShapedText, shapeTextForClipboard };
//# sourceMappingURL=clipboard.d.ts.map
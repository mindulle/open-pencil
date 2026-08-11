import { NodeChange } from "@open-pencil/kiwi/fig/codec";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/text/derived-text/clipboard.d.ts
interface ShapedClipboardText {
  lineHeight: number;
  lineAscent: number;
  lineWidth: number;
  baseline: number;
  baselines?: NonNullable<NodeChange['derivedTextData']>['baselines'];
  glyphs: Array<{
    firstCharacter: number;
    x: number;
    y: number;
    advance: number;
  }>;
  logicalIndexToCharacterOffsetMap: number[];
}
declare function buildDerivedTextDataV4(node: SceneNode, digestMap: Map<string, Uint8Array>, shaped?: ShapedClipboardText | null, blobs?: Uint8Array[]): Promise<NodeChange['derivedTextData']>;
//#endregion
export { ShapedClipboardText, buildDerivedTextDataV4 };
//# sourceMappingURL=clipboard.d.ts.map
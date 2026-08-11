import { Paragraph } from "canvaskit-wasm";
import { SceneNode, StyleRun } from "@open-pencil/scene-graph";

//#region src/editor/text/session.d.ts
type TextEditSizeSnapshot = Partial<Pick<SceneNode, 'width' | 'height'>>;
type TextEditSnapshot = {
  text: string;
  styleRuns: StyleRun[];
  size?: TextEditSizeSnapshot;
};
type TextEditSession = {
  nodeId: string;
  before: TextEditSnapshot;
};
declare function createTextEditSession(node: SceneNode): TextEditSession;
declare function snapshotTextNode(node: SceneNode | undefined, fallbackText?: string): TextEditSnapshot;
declare function resizeTextNodeForEdit(node: SceneNode | undefined, paragraph: Paragraph | null): TextEditSizeSnapshot;
declare function textSnapshotChanged(before: TextEditSnapshot, after: TextEditSnapshot): boolean;
//#endregion
export { TextEditSession, TextEditSizeSnapshot, TextEditSnapshot, createTextEditSession, resizeTextNodeForEdit, snapshotTextNode, textSnapshotChanged };
//# sourceMappingURL=session.d.ts.map
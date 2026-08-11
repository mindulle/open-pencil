import { SkiaRenderer } from "../canvas/renderer.js";
import { CanvasKit, Paragraph } from "canvaskit-wasm";
import { SceneNode } from "@open-pencil/scene-graph";
import { Rect } from "@open-pencil/scene-graph/primitives";

//#region src/text/editor.d.ts
interface TextCaret {
  x: number;
  y0: number;
  y1: number;
}
interface TextEditorState {
  nodeId: string;
  text: string;
  cursor: number;
  selectionAnchor: number | null;
  paragraph: Paragraph | null;
  paragraphFontGeneration: number;
  textDirection: 'LTR' | 'RTL';
}
declare class TextEditor {
  private ck;
  private renderer;
  private _state;
  private paragraphNode;
  caretVisible: boolean;
  constructor(ck: CanvasKit);
  private prepareMove;
  private replaceRange;
  private currentLineMetrics;
  private collapseSelectionTo;
  get state(): TextEditorState | null;
  get isActive(): boolean;
  get nodeId(): string | null;
  setRenderer(renderer: SkiaRenderer | null): void;
  start(node: SceneNode): void;
  stop(): {
    nodeId: string;
    text: string;
  } | null;
  rebuildParagraph(node: SceneNode): void;
  hasSelection(): boolean;
  getSelectionRange(): [number, number] | null;
  getSelectedText(): string;
  selectAll(): void;
  selectWord(pos: number): void;
  setCursorAt(x: number, y: number, extend?: boolean): void;
  selectLine(pos: number): void;
  selectWordAt(x: number, y: number): void;
  selectLineAt(x: number, y: number): void;
  insert(text: string, node: SceneNode): void;
  backspace(node: SceneNode): void;
  delete(node: SceneNode): void;
  private moveHorizontal;
  moveLeft(extend?: boolean): void;
  moveRight(extend?: boolean): void;
  private moveVertical;
  moveUp(extend?: boolean): void;
  moveDown(extend?: boolean): void;
  private moveToLineEdge;
  moveToLineStart(extend?: boolean): void;
  moveToLineEnd(extend?: boolean): void;
  private moveWord;
  private skipWordBoundaryRun;
  private skipWordInteriorRun;
  private advanceWhile;
  moveWordLeft(extend?: boolean): void;
  moveWordRight(extend?: boolean): void;
  getCaretRect(): TextCaret | null;
  getSelectionRects(): Rect[];
}
//#endregion
export { TextCaret, TextEditor, TextEditorState };
//# sourceMappingURL=editor.d.ts.map
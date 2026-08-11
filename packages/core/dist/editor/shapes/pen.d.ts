import { EditorContext } from "../types.js";
import { Vector } from "@open-pencil/scene-graph/primitives";

//#region src/editor/shapes/pen.d.ts
interface PenDragOptions {
  keepOpposite?: boolean;
  constrainToOpposite?: boolean;
  oppositeTangent?: Vector | null;
}
type CreateShape = (type: 'VECTOR', x: number, y: number, w: number, h: number, parentId?: string) => string;
declare function createPenActions(ctx: EditorContext, createShape: CreateShape): {
  penAddVertex: (x: number, y: number) => void;
  penSetDragTangent: (tx: number, ty: number, options?: PenDragOptions) => void;
  penSetClosingToFirst: (closing: boolean) => void;
  penSetPendingClose: (closing: boolean) => void;
  penSetKnotPosition: (x: number, y: number) => void;
  penCommit: (closed: boolean) => void;
  penCancel: () => void;
};
//#endregion
export { PenDragOptions, createPenActions };
//# sourceMappingURL=pen.d.ts.map
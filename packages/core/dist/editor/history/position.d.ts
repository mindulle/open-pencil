import { EditorContext } from "../types.js";
import { Vector } from "@open-pencil/scene-graph/primitives";

//#region src/editor/history/position.d.ts
declare function collectNodePositions(ctx: EditorContext, ids: Iterable<string>): Map<string, Vector>;
declare function pushPositionUndo(ctx: EditorContext, label: string, originals: Map<string, Vector>, finals: Map<string, Vector>): void;
//#endregion
export { collectNodePositions, pushPositionUndo };
//# sourceMappingURL=position.d.ts.map
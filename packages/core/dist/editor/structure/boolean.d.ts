import { EditorContext } from "../types.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/structure/boolean.d.ts
type BooleanOperation = 'UNION' | 'SUBTRACT' | 'INTERSECT' | 'EXCLUDE';
declare function booleanOperationSelected(ctx: EditorContext, isTopLevel: (parentId: string | null) => boolean, selectedNodes: SceneNode[], operation: BooleanOperation): string | null;
//#endregion
export { BooleanOperation, booleanOperationSelected };
//# sourceMappingURL=boolean.d.ts.map
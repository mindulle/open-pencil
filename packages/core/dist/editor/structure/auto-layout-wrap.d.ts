import { EditorContext } from "../types.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/structure/auto-layout-wrap.d.ts
declare function wrapInAutoLayout(ctx: EditorContext, isTopLevel: (parentId: string | null) => boolean, selectedNodes: SceneNode[]): void;
//#endregion
export { wrapInAutoLayout };
//# sourceMappingURL=auto-layout-wrap.d.ts.map
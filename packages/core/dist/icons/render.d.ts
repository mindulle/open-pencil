import { IconData } from "./types.js";
import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";
import { Color as Color$1 } from "@open-pencil/scene-graph/primitives";

//#region src/icons/render.d.ts
declare function createIconFromPaths(graph: SceneGraph, icon: IconData, name: string, size: number, color: Color$1, parentId: string, overrides?: Partial<SceneNode>): SceneNode;
//#endregion
export { createIconFromPaths };
//# sourceMappingURL=render.d.ts.map
import { SceneGraph } from "./coordinate.js";
import { SceneNode } from "./types2.js";

//#region src/hit-test.d.ts
declare function hitTest(graph: SceneGraph, px: number, py: number, scopeId?: string): SceneNode | null;
declare function hitTestDeep(graph: SceneGraph, px: number, py: number, scopeId?: string): SceneNode | null;
declare function hitTestFrame(graph: SceneGraph, px: number, py: number, excludeIds: Set<string>, scopeId?: string): SceneNode | null;
//#endregion
export { hitTest, hitTestDeep, hitTestFrame };
//# sourceMappingURL=hit-test.d.ts.map
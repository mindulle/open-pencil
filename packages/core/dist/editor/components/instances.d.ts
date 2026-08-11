import { EditorContext } from "../types.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/components/instances.d.ts
declare function createComponentInstanceActions(ctx: EditorContext): {
  createInstanceFromComponent: (componentId: string, x?: number, y?: number, parentId?: string) => string | null;
  detachInstance: (selectedNode: SceneNode | undefined) => void;
};
//#endregion
export { createComponentInstanceActions };
//# sourceMappingURL=instances.d.ts.map
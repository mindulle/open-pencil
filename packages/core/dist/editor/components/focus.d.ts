import { EditorContext } from "../types.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/components/focus.d.ts
declare function createComponentFocusActions(ctx: EditorContext): {
  focusComponent: (componentId: string, switchPage: (pageId: string) => Promise<void>) => Promise<void>;
  goToMainComponent: (selectedNode: SceneNode | undefined, switchPage: (pageId: string) => Promise<void>) => Promise<void>;
};
//#endregion
export { createComponentFocusActions };
//# sourceMappingURL=focus.d.ts.map
import { EditorContext } from "../types.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/structure/container-wrap.d.ts
declare function wrapSelectionInContainer(ctx: EditorContext, isTopLevel: (parentId: string | null) => boolean, containerType: 'GROUP' | 'FRAME' | 'COMPONENT' | 'COMPONENT_SET', selectedNodes: SceneNode[], extraProps?: Partial<SceneNode>): string | null;
//#endregion
export { wrapSelectionInContainer };
//# sourceMappingURL=container-wrap.d.ts.map
import { EditorContext } from "./types.js";
import { RenameSelectionOptions, RenameSelectionPreview } from "./structure/rename.js";
import { BooleanOperation } from "./structure/boolean.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/structure.d.ts
declare function createStructureActions(ctx: EditorContext): {
  moveToPage: (pageId: string) => void;
  previewRenameSelected: (options: RenameSelectionOptions) => RenameSelectionPreview;
  renameSelected: (options: RenameSelectionOptions) => void;
  renameNode: (id: string, name: string) => void;
  toggleNodeVisibility: (id: string) => void;
  toggleNodeLock: (id: string) => void;
  toggleVisibility: () => void;
  toggleLock: () => void;
  reparentNodes: (nodeIds: string[], newParentId: string) => void;
  wrapSelectionInContainer: (containerType: "GROUP" | "FRAME" | "COMPONENT" | "COMPONENT_SET", selectedNodes: SceneNode[], extraProps?: Partial<SceneNode>) => string | null;
  wrapInAutoLayout: (selectedNodes: SceneNode[]) => void;
  groupSelected: (selectedNodes: SceneNode[]) => string | null;
  frameSelection: (selectedNodes: SceneNode[]) => string | null;
  booleanOperationSelected: (selectedNodes: SceneNode[], operation: BooleanOperation) => string | null;
  ungroupSelected: (selectedNode: SceneNode | undefined) => void;
  flattenSelected: (selectedNodes: SceneNode[]) => string | null;
  outlineTextSelected: (selectedNodes: SceneNode[]) => string | null;
  outlineStrokeSelected: (selectedNodes: SceneNode[]) => string | null;
  reorderInAutoLayout: (nodeId: string, parentId: string, insertIndex: number) => void;
  reorderChildWithUndo: (nodeId: string, newParentId: string, insertIndex: number) => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  isTopLevel: (parentId: string | null) => boolean;
};
//#endregion
export { createStructureActions };
//# sourceMappingURL=structure.d.ts.map
import { NodeType, SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/structure/rename.d.ts
interface RenameSelectionOptions {
  match: string;
  replacement: string;
  startNumber: number;
}
interface RenameSelectionPreview {
  names: ReadonlyMap<string, string>;
  error: 'invalid-pattern' | null;
}
declare function defaultNodeName(type: NodeType): string;
declare function previewRenamedNodes(nodes: readonly SceneNode[], options: RenameSelectionOptions): RenameSelectionPreview;
//#endregion
export { RenameSelectionOptions, RenameSelectionPreview, defaultNodeName, previewRenamedNodes };
//# sourceMappingURL=rename.d.ts.map
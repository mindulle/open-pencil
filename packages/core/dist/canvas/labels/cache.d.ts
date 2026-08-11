import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/canvas/labels/cache.d.ts
interface CachedSection {
  nodeId: string;
  absX: number;
  absY: number;
  nested: boolean;
}
interface CachedComponent {
  nodeId: string;
  absX: number;
  absY: number;
  parentType: string;
}
interface Viewport {
  x: number;
  y: number;
  w: number;
  h: number;
}
declare class LabelCache {
  private sections;
  private components;
  private cachedSceneVersion;
  private cachedPositionPreviewVersion;
  private cachedPageId;
  update(graph: SceneGraph, pageId: string | null, sceneVersion: number, positionPreviewVersion?: number): void;
  invalidate(): void;
  getSections(graph: SceneGraph, viewport: Viewport): Array<{
    node: SceneNode;
    absX: number;
    absY: number;
    nested: boolean;
  }>;
  getComponents(graph: SceneGraph, viewport: Viewport): Array<{
    node: SceneNode;
    absX: number;
    absY: number;
    inside: boolean;
  }>;
  getAllSections(): readonly CachedSection[];
  getAllComponents(): readonly CachedComponent[];
  private rebuild;
  private walkChildren;
}
//#endregion
export { CachedComponent, CachedSection, LabelCache };
//# sourceMappingURL=cache.d.ts.map
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/design-jsx/props-overrides.d.ts
declare function applySizeOverrides(props: Record<string, unknown>, o: Partial<SceneNode>, parentLayout: SceneNode['layoutMode']): {
  w: unknown;
  h: unknown;
};
declare function propsToOverrides(props: Record<string, unknown>, isText: boolean, parentLayout: SceneNode['layoutMode']): Partial<SceneNode>;
//#endregion
export { applySizeOverrides, propsToOverrides };
//# sourceMappingURL=props-overrides.d.ts.map
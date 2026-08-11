import { RenderOptions } from "./types.js";
import { RenderResult, renderTree } from "./renderer.js";
import { ComponentType } from "./mini-react.js";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/design-jsx/render.d.ts
declare function buildComponent(jsxString: string): ComponentType;
/**
 * Render a JSX string into the scene graph.
 * Works in both Node/Bun and the browser.
 */
declare function renderJSX(graph: SceneGraph, jsxString: string, options?: RenderOptions): Promise<RenderResult[]>;
//#endregion
export { buildComponent, renderJSX, renderTree as renderTreeNode };
//# sourceMappingURL=render.d.ts.map
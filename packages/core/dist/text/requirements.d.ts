import { FontFallbackScript } from "./fallbacks.js";
import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/text/requirements.d.ts
declare function collectGraphFontKeys(graph: SceneGraph, nodeIds: readonly string[]): Array<[string, string]>;
interface GraphFontRequirements {
  characters: string;
  nodes: SceneNode[];
  scripts: FontFallbackScript[];
}
declare function collectGraphFontRequirements(graph: SceneGraph, nodeIds: readonly string[]): GraphFontRequirements;
//#endregion
export { GraphFontRequirements, collectGraphFontKeys, collectGraphFontRequirements };
//# sourceMappingURL=requirements.d.ts.map
import { FigmaFontName } from "./fonts.js";
import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/figma-api/text.d.ts
declare function getFontName(node: SceneNode): FigmaFontName;
declare function setFontName(graph: SceneGraph, nodeId: string, fontName: FigmaFontName): void;
declare function insertCharacters(graph: SceneGraph, node: SceneNode, start: number, characters: string): void;
declare function deleteCharacters(graph: SceneGraph, node: SceneNode, start: number, end: number): void;
//#endregion
export { deleteCharacters, getFontName, insertCharacters, setFontName };
//# sourceMappingURL=text.d.ts.map
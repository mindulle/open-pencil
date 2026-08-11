import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";
import { Color as Color$1 } from "@open-pencil/scene-graph/primitives";

//#region src/tools/describe/shared.d.ts
declare const CONTAINER_TYPES: Set<string>;
declare const BUTTON_MAX_WIDTH = 200;
declare const BUTTON_MAX_HEIGHT = 50;
declare const BUTTON_MIN_HEIGHT = 28;
declare const BUTTON_MIN_RADIUS = 2;
declare function findAncestorBackground(node: SceneNode, graph: SceneGraph): Color$1 | null;
declare function looksLikeButton(node: SceneNode): boolean;
//#endregion
export { BUTTON_MAX_HEIGHT, BUTTON_MAX_WIDTH, BUTTON_MIN_HEIGHT, BUTTON_MIN_RADIUS, CONTAINER_TYPES, findAncestorBackground, looksLikeButton };
//# sourceMappingURL=shared.d.ts.map
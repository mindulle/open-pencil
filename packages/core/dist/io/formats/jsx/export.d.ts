import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/io/formats/jsx/export.d.ts
type JSXFormat = 'openpencil' | 'tailwind';
declare function sceneNodeToJSX(nodeId: string, graph: SceneGraph, format?: JSXFormat): string;
declare function selectionToJSX(nodeIds: string[], graph: SceneGraph, format?: JSXFormat): string;
//#endregion
export { JSXFormat, sceneNodeToJSX, selectionToJSX };
//# sourceMappingURL=export.d.ts.map
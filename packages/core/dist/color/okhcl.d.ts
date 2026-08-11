import { SceneNode } from "@open-pencil/scene-graph";
import { Color as Color$1 } from "@open-pencil/scene-graph/primitives";

//#region src/color/okhcl.d.ts
interface OkHCLColor {
  h: number;
  c: number;
  l: number;
  a?: number;
}
interface OkHCLPayload {
  version: 1;
  kind: 'fill' | 'stroke';
  index: number;
  color: OkHCLColor;
}
declare function okhclToRGBA(color: OkHCLColor): Color$1;
declare function rgbaToOkHCL(color: Color$1): OkHCLColor;
declare function serializeOkHCLPayload(payload: OkHCLPayload): string;
declare function parseOkHCLPayload(value: string): OkHCLPayload | null;
declare function setNodeFillOkHCL(node: SceneNode, index: number, color: OkHCLColor): Partial<SceneNode>;
declare function setNodeStrokeOkHCL(node: SceneNode, index: number, color: OkHCLColor): Partial<SceneNode>;
declare function clearNodeFillOkHCL(node: SceneNode, index: number): Partial<SceneNode>;
declare function clearNodeStrokeOkHCL(node: SceneNode, index: number): Partial<SceneNode>;
declare function getNodeOkHCLPayloads(node: SceneNode): OkHCLPayload[];
declare function getFillOkHCL(node: SceneNode, index: number): OkHCLPayload | null;
declare function getStrokeOkHCL(node: SceneNode, index: number): OkHCLPayload | null;
//#endregion
export { OkHCLColor, OkHCLPayload, clearNodeFillOkHCL, clearNodeStrokeOkHCL, getFillOkHCL, getNodeOkHCLPayloads, getStrokeOkHCL, okhclToRGBA, parseOkHCLPayload, rgbaToOkHCL, serializeOkHCLPayload, setNodeFillOkHCL, setNodeStrokeOkHCL };
//# sourceMappingURL=okhcl.d.ts.map
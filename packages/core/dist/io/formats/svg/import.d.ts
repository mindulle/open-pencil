import { SVGVectorizeResult } from "../../../vector/vectorize/svg/to-vectors.js";
import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";
import { Size } from "@open-pencil/scene-graph/primitives";

//#region src/io/formats/svg/import.d.ts
type SVGImportData = SVGVectorizeResult & Size;
interface SVGImportOptions {
  name?: string;
  defaultColor?: string;
  x?: number;
  y?: number;
}
declare function prepareSVGImport(source: string, options?: Pick<SVGImportOptions, 'defaultColor'>): SVGImportData | null;
declare function createSVGNodesFromImport(graph: SceneGraph, parentId: string, data: SVGImportData, options?: SVGImportOptions): SceneNode | null;
declare function createSVGNodes(graph: SceneGraph, parentId: string, source: string, options?: SVGImportOptions): SceneNode | null;
//#endregion
export { SVGImportData, SVGImportOptions, createSVGNodes, createSVGNodesFromImport, prepareSVGImport };
//# sourceMappingURL=import.d.ts.map
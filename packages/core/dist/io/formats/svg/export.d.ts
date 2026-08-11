import { geometryBlobToSVGPath, vectorNetworkToSVGPaths } from "./paths.js";
import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/io/formats/svg/export.d.ts
interface SVGExportOptions {
  /** Include XML declaration (default: true) */
  xmlDeclaration?: boolean;
  /** Target export color space (default: srgb) */
  colorSpace?: 'srgb' | 'display-p3';
}
declare function renderNodesToSVG(graph: SceneGraph, _pageId: string, nodeIds: string[], options?: SVGExportOptions): string | null;
//#endregion
export { SVGExportOptions, geometryBlobToSVGPath, renderNodesToSVG, vectorNetworkToSVGPaths };
//# sourceMappingURL=export.d.ts.map
import { nodeHasRadius } from "../../../canvas/shapes.js";
import { SceneNode, VectorNetwork } from "@open-pencil/scene-graph";

//#region src/io/formats/svg/paths.d.ts
declare function round(n: number, decimals?: number): number;
declare function geometryBlobToSVGPath(blob: Uint8Array, decimals?: number | null): string;
declare function vectorNetworkToSVGPaths(network: VectorNetwork, decimals?: number | null): string[];
declare function makePolygonPoints(node: SceneNode): string;
declare const hasRadius: typeof nodeHasRadius;
declare function roundedRectPath(node: SceneNode): string;
declare function arcPath(node: SceneNode): string;
//#endregion
export { arcPath, geometryBlobToSVGPath, hasRadius, makePolygonPoints, round, roundedRectPath, vectorNetworkToSVGPaths };
//# sourceMappingURL=paths.d.ts.map
import { SVGVectorizeResult, VectorizedPath, svgToVectorPaths } from "./vectorize/svg/to-vectors.js";
import { VectorFramePlacement, createVectorFrameChildren, resolveVectorFramePlacement } from "./vectorize/placement.js";
import { GetCanvasKit, PreprocessForVectorizeResult, preprocessForVectorize } from "./vectorize/preprocess.js";
import { computeAccurateBounds, nearestPointOnNetwork } from "./curve-math.js";
import { breakAtVertex, deleteVertex, findAllHandles, findOppositeHandle, mirrorHandle, removeVertex, splitSegmentAt } from "./bezier.js";
import { fitCircleArc, isClosedThinCrescent, vectorNetworkToCenterlinePath } from "./centerline.js";
import { regenerateFillGeometry } from "./fill-geometry.js";
import { CanvasKit, Path } from "canvaskit-wasm";
import { buildStyleOverrideTable, decodeVectorNetworkBlob, encodeVectorNetworkBlob } from "@open-pencil/fig/node-change";
import { VectorNetwork, WindingRule } from "@open-pencil/scene-graph";

//#region src/vector/index.d.ts
declare function vectorNetworkToPath(ck: CanvasKit, network: VectorNetwork): Path[];
declare function geometryBlobToPath(ck: CanvasKit, blob: Uint8Array, windingRule: WindingRule): Path;
//#endregion
export { type GetCanvasKit, type PreprocessForVectorizeResult, type SVGVectorizeResult, type VectorFramePlacement, type VectorizedPath, breakAtVertex, buildStyleOverrideTable, computeAccurateBounds, createVectorFrameChildren, decodeVectorNetworkBlob, deleteVertex, encodeVectorNetworkBlob, findAllHandles, findOppositeHandle, fitCircleArc, geometryBlobToPath, isClosedThinCrescent, mirrorHandle, nearestPointOnNetwork, preprocessForVectorize, regenerateFillGeometry, removeVertex, resolveVectorFramePlacement, splitSegmentAt, svgToVectorPaths, vectorNetworkToCenterlinePath, vectorNetworkToPath };
//# sourceMappingURL=index.d.ts.map
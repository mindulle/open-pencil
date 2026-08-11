import { CanvasKit, Path } from "canvaskit-wasm";
import { VectorNetwork } from "@open-pencil/scene-graph";
import { Vector as Vector$1 } from "@open-pencil/scene-graph/primitives";

//#region src/vector/centerline.d.ts
declare function fitCircleArc(pts: Vector$1[]): {
  cx: number;
  cy: number;
  r: number;
  startAngleDeg: number;
  sweepDeg: number;
} | null;
declare function isClosedThinCrescent(network: VectorNetwork): {
  ordered: number[];
} | null;
declare function vectorNetworkToCenterlinePath(ck: CanvasKit, network: VectorNetwork): Path;
//#endregion
export { fitCircleArc, isClosedThinCrescent, vectorNetworkToCenterlinePath };
//# sourceMappingURL=centerline.d.ts.map
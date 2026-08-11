import { Vector } from "./primitives2.js";

//#region src/matrix.d.ts
type Mat3 = number[];
declare const Matrix: {
  identity: () => Mat3;
  multiply: (...ms: Mat3[]) => Mat3;
  translated: (dx: number, dy: number) => Mat3;
  rotated: (radians: number, px?: number, py?: number) => Mat3;
  scaled: (sx: number, sy: number, px?: number, py?: number) => Mat3;
  invert: (m: Mat3) => Mat3 | null;
  mapPoints: (matrix: Mat3, ptArr: number[]) => number[];
  mapPoint: (m: Mat3, p: Vector) => Vector;
};
//#endregion
export { Mat3, Matrix };
//# sourceMappingURL=matrix2.d.ts.map
//#region src/fig/types.d.ts
interface GUID {
  sessionID: number;
  localID: number;
}
interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}
interface Vector {
  x: number;
  y: number;
}
interface Matrix {
  m00: number;
  m01: number;
  m02: number;
  m10: number;
  m11: number;
  m12: number;
}
//#endregion
export { Color, GUID, Matrix, Vector };
//# sourceMappingURL=types.d.ts.map
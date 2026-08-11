//#region src/primitives.d.ts
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
interface Size {
  width: number;
  height: number;
}
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
type JSONPrimitive = string | number | boolean | null;
type JSONValue = JSONPrimitive | JSONObject | JSONArray;
type JSONObject = {
  [key: string]: unknown;
};
type JSONArray = unknown[];
//#endregion
export { Color, GUID, JSONArray, JSONObject, JSONPrimitive, JSONValue, Matrix, Rect, Size, Vector };
//# sourceMappingURL=primitives2.d.ts.map
import { CanvasKit } from "canvaskit-wasm";

//#region src/canvaskit.d.ts
interface CanvasKitOptions {
  locateFile?: (file: string) => string;
}
declare function getCanvasKit(options?: CanvasKitOptions): Promise<CanvasKit>;
//#endregion
export { CanvasKitOptions, getCanvasKit };
//# sourceMappingURL=canvaskit.d.ts.map
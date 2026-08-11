import { CanvasKit } from "canvaskit-wasm";

//#region src/vector/vectorize/preprocess.d.ts
type GetCanvasKit = () => CanvasKit | null;
interface PreprocessForVectorizeResult {
  pngBytes: Uint8Array;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
}
declare function preprocessForVectorize(bytes: Uint8Array, getCk: GetCanvasKit): PreprocessForVectorizeResult | null;
//#endregion
export { GetCanvasKit, PreprocessForVectorizeResult, preprocessForVectorize };
//# sourceMappingURL=preprocess.d.ts.map
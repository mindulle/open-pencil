import { NodeChange } from "./codec.js";

//#region src/fig/parse.d.ts
/**
 * Deduplicates pluginData/pluginRelaunchData entries on raw NodeChange objects.
 * Some .fig files have millions of identical entries where only a small
 * fraction are unique by full triple.
 * Full-triple key (id+key+value) preserves multi-entry subsystems like OkHCL.
 */
declare function deduplicateNodeChangePluginData(nodeChanges: NodeChange[]): void;
interface FigKiwiPayload {
  schemaDeflated: Uint8Array;
  dataRaw: Uint8Array;
  version: number;
}
declare function parseFigKiwiContainer(data: Uint8Array): FigKiwiPayload | null;
interface FigKiwiDecodeResult {
  nodeChanges: NodeChange[];
  blobs: Uint8Array[];
  figKiwiVersion: number;
  /** Deflated kiwi schema bytes from the original file (for roundtrip fidelity). */
  figSchemaDeflated: Uint8Array;
}
/** Decode one raw `fig-kiwi` canvas payload. Outer `.fig` archive handling lives in `@open-pencil/fig`. */
declare function decodeFigKiwiCanvas(data: Uint8Array): FigKiwiDecodeResult;
//#endregion
export { FigKiwiDecodeResult, type NodeChange, decodeFigKiwiCanvas, deduplicateNodeChangePluginData, parseFigKiwiContainer };
//# sourceMappingURL=parse.d.ts.map
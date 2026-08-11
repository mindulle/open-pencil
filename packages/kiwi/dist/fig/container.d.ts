//#region src/fig/container.d.ts
declare const FIG_KIWI_DEFAULT_VERSION = 101;
declare function parseFigKiwiChunks(binary: Uint8Array): Uint8Array[] | null;
declare function decompressFigKiwiData(compressed: Uint8Array): Uint8Array;
declare function decompressFigKiwiDataAsync(compressed: Uint8Array): Promise<Uint8Array>;
declare function buildFigKiwi(schemaDeflated: Uint8Array, dataRaw: Uint8Array, version?: number): Uint8Array;
//#endregion
export { FIG_KIWI_DEFAULT_VERSION, buildFigKiwi, decompressFigKiwiData, decompressFigKiwiDataAsync, parseFigKiwiChunks };
//# sourceMappingURL=container.d.ts.map
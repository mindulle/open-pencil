import { VectorRegion, VectorSegment } from "@open-pencil/scene-graph";

//#region src/vector/regions.d.ts
declare function remapRegions(regions: VectorRegion[], indexMap: Map<number, number | null>): VectorRegion[];
declare function reindexRegionLoops(regions: VectorRegion[], oldSegIndex: number, newSegIndices: number[], segments?: VectorSegment[]): VectorRegion[];
//#endregion
export { reindexRegionLoops, remapRegions };
//# sourceMappingURL=regions.d.ts.map
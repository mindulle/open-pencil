import { VectorNetwork } from "@open-pencil/scene-graph";

//#region src/vector/connectivity.d.ts
declare function findConnectedComponents(network: VectorNetwork): number[][];
/**
 * Extract a sub-network from a VectorNetwork given a set of vertex indices.
 */
declare function extractSubNetwork(network: VectorNetwork, vertexIndices: number[]): VectorNetwork;
//#endregion
export { extractSubNetwork, findConnectedComponents };
//# sourceMappingURL=connectivity.d.ts.map
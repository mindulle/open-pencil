import { Mat3 } from "./matrix2.js";
import { VectorNetwork } from "./types2.js";

//#region src/vector-network.d.ts
/** Concatenate vector networks while preserving independent geometry. */
declare function mergeVectorNetworks(networks: readonly VectorNetwork[]): VectorNetwork;
/**
 * Map a VectorNetwork through an affine matrix: vertices as points,
 * tangents as direction vectors (linear part only, no translation).
 * Returns a deep copy; the input is not mutated.
 */
declare function transformVectorNetwork(m: Mat3, vn: VectorNetwork): VectorNetwork;
/** Structural equality of two VectorNetworks (order-sensitive, exact values). */
declare function vectorNetworksEqual(a: VectorNetwork, b: VectorNetwork): boolean;
/** Deep-copy a VectorNetwork, stripping any Vue Proxy wrappers. */
declare function cloneVectorNetwork(vn: VectorNetwork): VectorNetwork;
/**
 * Validate a VectorNetwork structure, returning an array of error messages.
 * Empty array means the network is valid.
 */
declare function validateVectorNetwork(value: unknown): string[];
type NormalizableVectorNetwork = Omit<VectorNetwork, 'regions'> & {
  regions?: VectorNetwork['regions'];
};
/**
 * Ensure every segment has tangentStart/tangentEnd and a regions array.
 * Missing tangents default to {x:0, y:0} (straight line segments).
 * Use at system boundaries where input may come from JSON/MCP.
 */
declare function normalizeVectorNetwork(vn: NormalizableVectorNetwork): VectorNetwork;
//#endregion
export { NormalizableVectorNetwork, cloneVectorNetwork, mergeVectorNetworks, normalizeVectorNetwork, transformVectorNetwork, validateVectorNetwork, vectorNetworksEqual };
//# sourceMappingURL=vector-network2.d.ts.map
import { GeometryPath, VectorNetwork } from "@open-pencil/scene-graph";

//#region src/vector/fill-geometry.d.ts
/**
 * Rebuild fillGeometry command blobs from a (possibly edited) VectorNetwork so
 * fills follow network edits. Imported .fig vectors pair fillGeometry entries
 * with network regions positionally (fillGeometry[i] ↔ regions[i]); per-path
 * fills are preserved. Networks without regions (open chains) map to a
 * single fillGeometry entry.
 */
declare function regenerateFillGeometry(network: VectorNetwork, existing: GeometryPath[]): GeometryPath[];
//#endregion
export { regenerateFillGeometry };
//# sourceMappingURL=fill-geometry.d.ts.map
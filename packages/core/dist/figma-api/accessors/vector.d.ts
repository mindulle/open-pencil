import { NodeProxyInternals } from "../accessor-utils.js";
import { Fill, VectorSegment, VectorVertex, WindingRule } from "@open-pencil/scene-graph";

//#region src/figma-api/accessors/vector.d.ts
interface FigmaVectorPath {
  readonly windingRule: WindingRule | 'NONE';
  readonly data: string;
}
interface FigmaVectorRegion {
  readonly windingRule: WindingRule;
  readonly loops: ReadonlyArray<ReadonlyArray<number>>;
  readonly fills?: readonly Fill[];
  readonly fillStyleId?: string;
}
interface FigmaVectorNetwork {
  readonly vertices: readonly VectorVertex[];
  readonly segments: readonly (Omit<VectorSegment, 'tangentStart' | 'tangentEnd'> & {
    readonly tangentStart?: VectorSegment['tangentStart'];
    readonly tangentEnd?: VectorSegment['tangentEnd'];
  })[];
  readonly regions?: readonly FigmaVectorRegion[];
}
declare function installVectorNodeProxyAccessors(target: object, internals: NodeProxyInternals, mixed: symbol): void;
//#endregion
export { FigmaVectorNetwork, FigmaVectorPath, installVectorNodeProxyAccessors };
//# sourceMappingURL=vector.d.ts.map
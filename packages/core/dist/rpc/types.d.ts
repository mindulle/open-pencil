import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/rpc/types.d.ts
interface RPCCommand<A = unknown, R = unknown> {
  name: string;
  execute: (graph: SceneGraph, args: A) => R | Promise<R>;
}
//#endregion
export { RPCCommand };
//# sourceMappingURL=types.d.ts.map
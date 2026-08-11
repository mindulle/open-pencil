import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/kiwi/fig/population/delta.d.ts
interface FigPopulationDelta {
  created: Array<[string, SceneNode]>;
  updated: Array<[string, Partial<SceneNode>]>;
  deleted: string[];
  instanceIndex: Array<[string, string[]]>;
  populatedRootIds: string[];
}
interface FigMutationJournal {
  before: Map<string, Partial<SceneNode>>;
  created: Set<string>;
  deleted: Set<string>;
  stop: () => void;
}
declare function installFigMutationJournal(graph: SceneGraph): FigMutationJournal;
declare function buildFigPopulationDelta(graph: SceneGraph, journal: FigMutationJournal, populatedRootIds: Iterable<string>): FigPopulationDelta;
declare function applyFigPopulationDelta(graph: SceneGraph, delta: FigPopulationDelta): void;
//#endregion
export { FigMutationJournal, FigPopulationDelta, applyFigPopulationDelta, buildFigPopulationDelta, installFigMutationJournal };
//# sourceMappingURL=delta.d.ts.map
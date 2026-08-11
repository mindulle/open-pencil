import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/kiwi/fig/population/client.d.ts
interface FigPopulationWorkerTelemetry {
  event: 'registered' | 'populate' | 'fallback' | 'stale' | 'terminated';
  reason?: 'oversized' | 'graph-mutation' | 'worker-error';
  durationMs?: number;
  applyMs?: number;
  created?: number;
  updated?: number;
  deleted?: number;
}
declare function registerFigPopulationWorker(graph: SceneGraph, worker: Worker): void;
declare function canUseFigPopulationWorker(graph: SceneGraph): boolean;
interface FigPopulationWorker {
  populate: (pageId: string) => Promise<boolean | null>;
  terminate: () => void;
}
declare function createFigPopulationWorker(graph: SceneGraph): FigPopulationWorker | null;
//#endregion
export { FigPopulationWorker, FigPopulationWorkerTelemetry, canUseFigPopulationWorker, createFigPopulationWorker, registerFigPopulationWorker };
//# sourceMappingURL=client.d.ts.map
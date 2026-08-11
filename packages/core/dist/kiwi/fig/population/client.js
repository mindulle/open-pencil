import { randomHex } from "../../../random.js";
import { getLazyFigImportContext } from "../lazy-import.js";
import { applyFigPopulationDelta } from "./delta.js";
//#region src/kiwi/fig/population/client.ts
const MAX_FIG_POPULATION_WORKER_NODES = 2e5;
const FIG_POPULATION_WORKER_TIMEOUT_MS = 3e4;
const populationWorkers = /* @__PURE__ */ new WeakMap();
function emitTelemetry(detail) {
	if (typeof globalThis.dispatchEvent !== "function") return;
	globalThis.dispatchEvent(new CustomEvent("openpencil:fig-population-worker", { detail }));
}
function registerFigPopulationWorker(graph, worker) {
	if (graph.nodes.size > MAX_FIG_POPULATION_WORKER_NODES) {
		emitTelemetry({
			event: "fallback",
			reason: "oversized"
		});
		worker.terminate();
		return;
	}
	const client = createPopulationWorkerClient(graph, worker);
	populationWorkers.set(graph, client);
	emitTelemetry({ event: "registered" });
}
function isDevelopmentBuild(env) {
	return env?.DEV ?? false;
}
function canUseFigPopulationWorker(graph) {
	return isDevelopmentBuild(import.meta.env) && populationWorkers.has(graph) && getLazyFigImportContext(graph) !== void 0;
}
function createFigPopulationWorker(graph) {
	if (!canUseFigPopulationWorker(graph)) return null;
	return populationWorkers.get(graph) ?? null;
}
function createPopulationWorkerClient(graph, worker) {
	const pending = /* @__PURE__ */ new Map();
	let revision = 0;
	let stale = false;
	let disposed = false;
	let applyingDelta = false;
	const invalidate = () => {
		if (applyingDelta || stale || graph.isApplyingLayout) return;
		revision++;
		stale = true;
		emitTelemetry({
			event: "stale",
			reason: "graph-mutation"
		});
	};
	let unbind;
	const releaseSubscription = () => {
		unbind?.();
		unbind = void 0;
	};
	const fail = (emit = true) => {
		stale = true;
		if (emit) emitTelemetry({
			event: "fallback",
			reason: "worker-error"
		});
		for (const request of pending.values()) {
			clearTimeout(request.timeout);
			request.resolve(null);
		}
		pending.clear();
		releaseSubscription();
		worker.terminate();
		populationWorkers.delete(graph);
	};
	unbind = graph.onNodeEvents({
		created: invalidate,
		updated: invalidate,
		deleted: invalidate,
		reparented: invalidate,
		reordered: invalidate
	});
	worker.onmessage = (event) => {
		const result = event.data;
		if (result.type === "population-error") return fail();
		const request = pending.get(result.requestId);
		if (!request) return;
		clearTimeout(request.timeout);
		pending.delete(result.requestId);
		if (stale || revision !== request.revision || result.baseRevision !== request.revision) {
			emitTelemetry({
				event: "stale",
				reason: "graph-mutation"
			});
			return request.resolve(null);
		}
		applyingDelta = true;
		const applyStartedAt = performance.now();
		try {
			applyFigPopulationDelta(graph, result.delta);
			const context = getLazyFigImportContext(graph);
			if (context) context.populatedRootIds = new Set(result.delta.populatedRootIds);
		} catch {
			applyingDelta = false;
			fail();
			return request.resolve(null);
		} finally {
			applyingDelta = false;
		}
		request.resolve(result.populated);
		emitTelemetry({
			event: "populate",
			durationMs: performance.now() - request.startedAt,
			applyMs: performance.now() - applyStartedAt,
			created: result.delta.created.length,
			updated: result.delta.updated.length,
			deleted: result.delta.deleted.length
		});
	};
	worker.onerror = () => fail();
	return {
		populate(pageId) {
			if (stale) return Promise.resolve(null);
			const requestId = randomHex();
			const baseRevision = revision;
			return new Promise((resolve) => {
				const timeout = setTimeout(() => fail(), FIG_POPULATION_WORKER_TIMEOUT_MS);
				pending.set(requestId, {
					resolve,
					revision: baseRevision,
					startedAt: performance.now(),
					timeout
				});
				worker.postMessage({
					type: "populate",
					requestId,
					baseRevision,
					pageId
				}, []);
			});
		},
		terminate() {
			if (disposed) return;
			disposed = true;
			emitTelemetry({ event: "terminated" });
			fail(false);
		}
	};
}
//#endregion
export { canUseFigPopulationWorker, createFigPopulationWorker, registerFigPopulationWorker };

//# sourceMappingURL=client.js.map
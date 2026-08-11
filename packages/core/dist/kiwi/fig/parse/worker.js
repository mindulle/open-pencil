import { getLazyFigImportContext, populateLazyFigImportRoots } from "../lazy-import.js";
import { buildFigPopulationDelta, installFigMutationJournal } from "../population/delta.js";
import { serializeSceneGraph, serializedSceneGraphTransferList } from "./transfer.js";
import { importNodeChanges } from "../import.js";
import { parseFigBuffer } from "@open-pencil/fig";
//#region src/kiwi/fig/parse/worker.ts
const postWorkerMessage = (message, transfer) => {
	globalThis.postMessage(message, { transfer });
};
let graph;
function isPopulateRequest(request) {
	return !(request instanceof ArrayBuffer) && "type" in request;
}
self.onmessage = (event) => {
	const request = event.data;
	try {
		if (isPopulateRequest(request)) {
			if (!graph) throw new Error("FIG parse worker has no retained graph");
			const journal = installFigMutationJournal(graph);
			try {
				const populated = populateLazyFigImportRoots(graph, [request.pageId]);
				const context = getLazyFigImportContext(graph);
				if (!context) throw new Error("FIG population worker has no lazy import context");
				postWorkerMessage({
					type: "population-result",
					requestId: request.requestId,
					baseRevision: request.baseRevision,
					populated,
					delta: buildFigPopulationDelta(graph, journal, context.populatedRootIds)
				}, []);
			} finally {
				journal.stop();
			}
			return;
		}
		const parseRequest = request instanceof ArrayBuffer ? { buffer: request } : request;
		const { nodeChanges, blobs, images, figKiwiVersion, figSchemaDeflated } = parseFigBuffer(parseRequest.buffer);
		const parsedGraph = importNodeChanges(nodeChanges, blobs, new Map(images), parseRequest.options);
		parsedGraph.figKiwiVersion = figKiwiVersion;
		parsedGraph.figSchemaDeflated = figSchemaDeflated;
		graph = parseRequest.options?.populate === "first-page" ? parsedGraph : void 0;
		const serialized = serializeSceneGraph(parsedGraph);
		const transfer = parseRequest.options?.populate === "first-page" ? [] : serializedSceneGraphTransferList(serialized);
		postWorkerMessage({ graph: serialized }, transfer);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		postWorkerMessage(isPopulateRequest(request) ? {
			type: "population-error",
			error: errorMessage
		} : { error: errorMessage }, []);
	}
};
//#endregion

//# sourceMappingURL=worker.js.map
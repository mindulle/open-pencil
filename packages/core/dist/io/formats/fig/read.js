import { IS_BROWSER } from "../../../constants.js";
import { registerFigPopulationWorker } from "../../../kiwi/fig/population/client.js";
import { deserializeSceneGraph } from "../../../kiwi/fig/parse/transfer.js";
import { importNodeChanges } from "../../../kiwi/fig/import.js";
import { parseFigBuffer } from "@open-pencil/fig";
//#region src/io/formats/fig/read.ts
function parseFigFileSync(buffer, options = {}) {
	const { nodeChanges, blobs, images: imageEntries, figKiwiVersion, figSchemaDeflated } = parseFigBuffer(buffer);
	const graph = importNodeChanges(nodeChanges, blobs, new Map(imageEntries), options);
	graph.figKiwiVersion = figKiwiVersion;
	graph.figSchemaDeflated = figSchemaDeflated;
	return graph;
}
function parseViaWorker(buffer, options) {
	return new Promise((resolve, reject) => {
		const worker = new Worker(new URL("../../../kiwi/fig/parse/worker.ts", import.meta.url), { type: "module" });
		worker.onmessage = (e) => {
			if (e.data.error || !e.data.graph) {
				worker.terminate();
				reject(new Error(e.data.error ?? "Worker failed to parse .fig file"));
				return;
			}
			try {
				const graph = deserializeSceneGraph(e.data.graph);
				if (options.populate === "first-page") {
					worker.onmessage = null;
					worker.onerror = null;
					registerFigPopulationWorker(graph, worker);
				} else worker.terminate();
				resolve(graph);
			} catch (error) {
				worker.terminate();
				reject(error instanceof Error ? error : new Error(String(error)));
			}
		};
		worker.onerror = (err) => {
			worker.terminate();
			reject(new Error(err.message || "Worker failed to parse .fig file"));
		};
		worker.postMessage({
			buffer,
			options
		}, [buffer]);
	});
}
async function parseFigFile(buffer, options = {}) {
	if (typeof Worker !== "undefined" && IS_BROWSER) {
		const copy = buffer.slice(0);
		try {
			return await parseViaWorker(buffer, options);
		} catch (error) {
			console.warn("Worker parsing failed, falling back to main thread:", error);
			return parseFigFileSync(copy, options);
		}
	}
	return parseFigFileSync(buffer, options);
}
async function readFigFile(file, options = {}) {
	return parseFigFile(await file.arrayBuffer(), options);
}
//#endregion
export { parseFigFile, readFigFile };

//# sourceMappingURL=read.js.map
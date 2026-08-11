import { getLazyFigImportContext, setLazyFigImportContext } from "../lazy-import.js";
import { SceneGraph } from "@open-pencil/scene-graph";
//#region src/kiwi/fig/parse/transfer.ts
function serializeSceneGraph(graph) {
	const lazyFigImport = getLazyFigImportContext(graph);
	return {
		rootId: graph.rootId,
		nodes: [...graph.nodes],
		images: [...graph.images],
		variables: [...graph.variables],
		variableCollections: [...graph.variableCollections],
		activeMode: [...graph.activeMode],
		instanceIndex: [...graph.instanceIndex].map(([id, nodeIds]) => [id, [...nodeIds]]),
		figKiwiVersion: graph.figKiwiVersion,
		figSchemaDeflated: graph.figSchemaDeflated,
		documentColorSpace: graph.documentColorSpace,
		lazyFigImport: lazyFigImport ? {
			changeMap: [...lazyFigImport.changeMap],
			guidToNodeId: [...lazyFigImport.guidToNodeId],
			blobs: lazyFigImport.blobs,
			populatedRootIds: [...lazyFigImport.populatedRootIds]
		} : void 0
	};
}
function serializedSceneGraphTransferList(data) {
	const buffers = /* @__PURE__ */ new Set();
	for (const [, image] of data.images) if (image.buffer instanceof ArrayBuffer && image.byteOffset === 0 && image.byteLength === image.buffer.byteLength) buffers.add(image.buffer);
	for (const blob of data.lazyFigImport?.blobs ?? []) if (blob.buffer instanceof ArrayBuffer && blob.byteOffset === 0 && blob.byteLength === blob.buffer.byteLength) buffers.add(blob.buffer);
	if (data.figSchemaDeflated) {
		if (data.figSchemaDeflated.buffer instanceof ArrayBuffer && data.figSchemaDeflated.byteOffset === 0 && data.figSchemaDeflated.byteLength === data.figSchemaDeflated.buffer.byteLength) buffers.add(data.figSchemaDeflated.buffer);
	}
	return [...buffers];
}
function deserializeSceneGraph(data) {
	const graph = new SceneGraph();
	graph.rootId = data.rootId;
	graph.nodes = new Map(data.nodes);
	graph.images = new Map(data.images);
	graph.variables = new Map(data.variables);
	graph.variableCollections = new Map(data.variableCollections);
	graph.activeMode = new Map(data.activeMode);
	graph.instanceIndex = new Map(data.instanceIndex.map(([id, nodeIds]) => [id, new Set(nodeIds)]));
	graph.figKiwiVersion = data.figKiwiVersion;
	graph.figSchemaDeflated = data.figSchemaDeflated;
	graph.documentColorSpace = data.documentColorSpace;
	if (data.lazyFigImport) setLazyFigImportContext(graph, {
		changeMap: new Map(data.lazyFigImport.changeMap),
		guidToNodeId: new Map(data.lazyFigImport.guidToNodeId),
		blobs: data.lazyFigImport.blobs,
		populatedRootIds: new Set(data.lazyFigImport.populatedRootIds)
	});
	return graph;
}
//#endregion
export { deserializeSceneGraph, serializeSceneGraph, serializedSceneGraphTransferList };

//# sourceMappingURL=transfer.js.map
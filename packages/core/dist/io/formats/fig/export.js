import { CANVAS_BG_COLOR, IS_BROWSER, IS_TAURI } from "../../../constants.js";
import { decodeBase64 } from "../../../bytes/base64.js";
import { buildFontDigestMap } from "../../../kiwi/fig/node-change/font/digests.js";
import { fractionalPosition, makeCanvasNodeChange, makeDocumentNodeChange, safeColor, sceneNodeToKiwi as sceneNodeToKiwi$1 } from "../../../kiwi/fig/node-change/serialize.js";
import { renderThumbnail } from "../raster/render.js";
import { populateAllLazyFigImportRoots } from "../../../kiwi/fig/lazy-import.js";
import { deserializeSceneGraph, serializeSceneGraph } from "../../../kiwi/fig/parse/transfer.js";
import { deflateSync, inflateSync } from "fflate";
import { buildComponentPropIndex, stringToGuid } from "@open-pencil/fig/node-change";
import { getCompiledSchema, getSchemaBytes, initCodec } from "@open-pencil/kiwi/fig/codec";
import { ByteBuffer, compileSchema, decodeBinarySchema } from "@open-pencil/kiwi/schema-runtime";
import { compressFigDataSync, compressFigDataSync as compressFigDataSync$1 } from "@open-pencil/fig";
//#region src/io/formats/fig/export.ts
const THUMBNAIL_1X1 = decodeBase64("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==");
function variableValueToKiwi(value, type, varIdToGuid) {
	if (value && typeof value === "object" && "aliasId" in value) return {
		value: { alias: { guid: varIdToGuid.get(value.aliasId) ?? stringToGuid(value.aliasId) } },
		dataType: "ALIAS",
		resolvedDataType: {
			COLOR: "COLOR",
			BOOLEAN: "BOOLEAN",
			STRING: "STRING"
		}[type] ?? "FLOAT"
	};
	if (type === "COLOR" && typeof value === "object" && "r" in value) return {
		value: { colorValue: safeColor(value) },
		dataType: "COLOR",
		resolvedDataType: "COLOR"
	};
	if (type === "BOOLEAN") return {
		value: { boolValue: !!value },
		dataType: "BOOLEAN",
		resolvedDataType: "BOOLEAN"
	};
	if (type === "STRING") return {
		value: { textValue: typeof value === "string" ? value : JSON.stringify(value) },
		dataType: "STRING",
		resolvedDataType: "STRING"
	};
	return {
		value: { floatValue: Number(value) },
		dataType: "FLOAT",
		resolvedDataType: "FLOAT"
	};
}
function collectImageEntries(graph) {
	const entries = [];
	for (const [hash, data] of graph.images) entries.push({
		name: `images/${hash}`,
		data
	});
	return entries;
}
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 225;
async function renderFigThumbnail(graph, pageId, ck, renderer, renderHeadless = false) {
	if (!pageId) return THUMBNAIL_1X1;
	if (ck && renderer) return renderThumbnail(ck, renderer, graph, pageId, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT) ?? THUMBNAIL_1X1;
	if (!renderHeadless || IS_BROWSER || IS_TAURI) return THUMBNAIL_1X1;
	const { headlessRenderThumbnail } = await import("../raster/index.js");
	return await headlessRenderThumbnail(graph, pageId, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT) ?? THUMBNAIL_1X1;
}
function assignVariableGuid(id, localIdCounter, assignedGuidValues, nodeSourceGuidValues) {
	if (/^\d+:\d+$/.test(id) && !assignedGuidValues.has(id) && !nodeSourceGuidValues.has(id)) {
		const guid = stringToGuid(id);
		assignedGuidValues.add(id);
		return guid;
	}
	const guid = {
		sessionID: 0,
		localID: localIdCounter.value++
	};
	assignedGuidValues.add(`${guid.sessionID}:${guid.localID}`);
	return guid;
}
function assignVariableGuids(graph, localIdCounter, varIdToGuid, modeIdToGuid, assignedGuidValues, nodeSourceGuidValues) {
	for (const [colId, col] of graph.variableCollections) {
		const colGuid = assignVariableGuid(colId, localIdCounter, assignedGuidValues, nodeSourceGuidValues);
		varIdToGuid.set(colId, colGuid);
		for (const mode of col.modes) {
			const modeGuid = assignVariableGuid(mode.modeId, localIdCounter, assignedGuidValues, nodeSourceGuidValues);
			modeIdToGuid.set(mode.modeId, modeGuid);
		}
		for (const varId of col.variableIds) {
			const varGuid = assignVariableGuid(varId, localIdCounter, assignedGuidValues, nodeSourceGuidValues);
			varIdToGuid.set(varId, varGuid);
		}
	}
}
function appendVariableNodeChanges(graph, nodeChanges, internalCanvasGuid, varIdToGuid, modeIdToGuid) {
	let collIdx = 0;
	for (const [colId, col] of graph.variableCollections) {
		const colGuid = varIdToGuid.get(colId) ?? stringToGuid(colId);
		nodeChanges.push({
			guid: colGuid,
			parentIndex: {
				guid: internalCanvasGuid,
				position: fractionalPosition(collIdx++)
			},
			type: "VARIABLE_SET",
			name: col.name,
			phase: "CREATED",
			strokeAlign: "CENTER",
			strokeJoin: "BEVEL",
			variableSetModes: col.modes.map((m, i) => {
				return {
					id: modeIdToGuid.get(m.modeId) ?? stringToGuid(m.modeId),
					name: m.name,
					sortPosition: fractionalPosition(i)
				};
			})
		});
		appendVariablesForCollection(graph, nodeChanges, colGuid, internalCanvasGuid, col.variableIds, varIdToGuid, modeIdToGuid);
	}
}
function appendVariablesForCollection(graph, nodeChanges, colGuid, parentGuid, variableIds, varIdToGuid, modeIdToGuid) {
	let varIdx = 0;
	for (const varId of variableIds) {
		const variable = graph.variables.get(varId);
		if (!variable) continue;
		const varGuid = varIdToGuid.get(varId) ?? stringToGuid(varId);
		const resolvedType = {
			COLOR: "COLOR",
			BOOLEAN: "BOOLEAN",
			STRING: "STRING"
		}[variable.type] ?? "FLOAT";
		const entries = Object.entries(variable.valuesByMode).map(([modeId, value]) => ({
			modeID: modeIdToGuid.get(modeId) ?? stringToGuid(modeId),
			variableData: variableValueToKiwi(value, variable.type, varIdToGuid)
		}));
		const nc = {
			guid: varGuid,
			parentIndex: {
				guid: parentGuid,
				position: fractionalPosition(varIdx++)
			},
			type: "VARIABLE",
			name: variable.name,
			phase: "CREATED",
			strokeAlign: "CENTER",
			strokeJoin: "BEVEL",
			variableSetID: { guid: colGuid },
			variableResolvedType: resolvedType,
			variableDataValues: { entries },
			variableScopes: ["ALL_SCOPES"]
		};
		if (variable.key) nc.key = variable.key;
		if (variable.version) nc.version = variable.version;
		nodeChanges.push(nc);
	}
}
function applyImportedCanvasFields(page, canvasNc) {
	if (!page.source.id) return;
	if (!("pageType" in page.source.fig.rawNodeFields)) delete canvasNc.pageType;
	if ("backgroundColor" in page.source.fig.rawNodeFields) canvasNc.backgroundColor = structuredClone(page.source.fig.rawNodeFields.backgroundColor);
	if ("backgroundPaints" in page.source.fig.rawNodeFields) canvasNc.backgroundPaints = structuredClone(page.source.fig.rawNodeFields.backgroundPaints);
	if ("guides" in page.source.fig.rawNodeFields) canvasNc.guides = structuredClone(page.source.fig.rawNodeFields.guides);
	const strokeJoin = page.source.fig.rawNodeFields.strokeJoin;
	if (typeof strokeJoin === "string") canvasNc.strokeJoin = strokeJoin;
	const strokeWeight = page.source.fig.rawNodeFields.strokeWeight;
	if (typeof strokeWeight === "number") canvasNc.strokeWeight = strokeWeight;
}
function buildCanvasEntries(graph, pages, docGuid, localIdCounter, nodeIdToGuid, assignedGuidValues) {
	const canvasEntries = [];
	let internalCanvasGuid = null;
	for (let p = 0; p < pages.length; p++) {
		const page = pages[p];
		const canvasGuid = (() => {
			if (!page.source.id) return {
				sessionID: 0,
				localID: localIdCounter.value++
			};
			const importedGuid = stringToGuid(page.source.id);
			const key = `${importedGuid.sessionID}:${importedGuid.localID}`;
			if (!assignedGuidValues.has(key)) return importedGuid;
			return {
				sessionID: 0,
				localID: localIdCounter.value++
			};
		})();
		if (page.source.id && canvasGuid.sessionID === 0) localIdCounter.value = Math.max(localIdCounter.value, canvasGuid.localID + 1);
		nodeIdToGuid.set(page.id, canvasGuid);
		assignedGuidValues.add(`${canvasGuid.sessionID}:${canvasGuid.localID}`);
		if (page.internalOnly) internalCanvasGuid = canvasGuid;
		const canvasNc = makeCanvasNodeChange(canvasGuid, docGuid, page.source.orderKey ?? fractionalPosition(p), page.name, {
			backgroundOpacity: 1,
			backgroundColor: { ...CANVAS_BG_COLOR },
			backgroundEnabled: true
		});
		applyImportedCanvasFields(page, canvasNc);
		if (page.internalOnly) canvasNc.internalOnly = true;
		canvasEntries.push({
			page,
			canvasGuid,
			canvasNc
		});
	}
	const hasSharedStyles = [...graph.nodes.values()].some((node) => node.sharedStyleType !== null);
	if ((graph.variableCollections.size > 0 || hasSharedStyles) && internalCanvasGuid === null) {
		internalCanvasGuid = {
			sessionID: 0,
			localID: localIdCounter.value++
		};
		assignedGuidValues.add(`${internalCanvasGuid.sessionID}:${internalCanvasGuid.localID}`);
		canvasEntries.push({
			page: {
				id: "",
				name: "Internal Only Canvas",
				internalOnly: true
			},
			canvasGuid: internalCanvasGuid,
			canvasNc: makeCanvasNodeChange(internalCanvasGuid, docGuid, fractionalPosition(canvasEntries.length), "Internal Only Canvas", { internalOnly: true })
		});
	}
	return {
		canvasEntries,
		internalCanvasGuid
	};
}
function appendInternalResources(context) {
	const { graph, internalCanvasGuid, nodeChanges } = context;
	if (!internalCanvasGuid) return;
	const sharedStyleNodes = [...graph.nodes.values()].filter((node) => node.sharedStyleType !== null);
	for (let index = 0; index < sharedStyleNodes.length; index++) nodeChanges.push(...sceneNodeToKiwi$1(sharedStyleNodes[index], internalCanvasGuid, index, context.localIdCounter, graph, context.blobs, context.nodeIdToGuid, context.fontDigestMap, context.varIdToGuid, context.glyphBlobMap, context.blobIndexByHex, context.assignedGuidValues, context.componentPropertyDefinitionsById, context.modeIdToGuid));
	if (graph.variableCollections.size > 0) appendVariableNodeChanges(graph, nodeChanges, internalCanvasGuid, context.varIdToGuid, context.modeIdToGuid);
}
async function exportFigFile(sourceGraph, ck, renderer, pageId, renderHeadlessThumbnail = false) {
	const graph = deserializeSceneGraph(structuredClone(serializeSceneGraph(sourceGraph)));
	populateAllLazyFigImportRoots(graph);
	await initCodec();
	let compiled;
	let schemaDeflated;
	if (graph.figSchemaDeflated) {
		compiled = compileSchema(decodeBinarySchema(new ByteBuffer(inflateSync(graph.figSchemaDeflated))));
		schemaDeflated = graph.figSchemaDeflated;
	} else {
		compiled = getCompiledSchema();
		schemaDeflated = deflateSync(getSchemaBytes());
	}
	const docGuid = {
		sessionID: 0,
		localID: 0
	};
	const localIdCounter = { value: 2 };
	const documentNc = makeDocumentNodeChange(docGuid, graph.documentColorSpace);
	const rootNode = graph.getNode(graph.rootId);
	if (rootNode) Object.assign(documentNc, rootNode.source.fig.rawNodeFields);
	const nodeChanges = [documentNc];
	const blobs = [];
	const pages = graph.getPages(true);
	const nodeIdToGuid = /* @__PURE__ */ new Map();
	const assignedGuidValues = /* @__PURE__ */ new Set();
	assignedGuidValues.add(`${docGuid.sessionID}:${docGuid.localID}`);
	const varIdToGuid = /* @__PURE__ */ new Map();
	const modeIdToGuid = /* @__PURE__ */ new Map();
	const fontDigestMap = await buildFontDigestMap(graph);
	const glyphBlobMap = /* @__PURE__ */ new Map();
	const blobIndexByHex = /* @__PURE__ */ new Map();
	const componentPropertyDefinitionsById = buildComponentPropIndex(graph);
	let maxLocalId0 = localIdCounter.value - 1;
	let maxLocalId1 = localIdCounter.value - 1;
	const nodeSourceGuidValues = /* @__PURE__ */ new Set();
	for (const node of graph.nodes.values()) if (node.source.id) {
		nodeSourceGuidValues.add(node.source.id);
		const g = stringToGuid(node.source.id);
		if (g.sessionID === 0 && g.localID > maxLocalId0) maxLocalId0 = g.localID;
		if (g.sessionID === 1 && g.localID > maxLocalId1) maxLocalId1 = g.localID;
	}
	localIdCounter.value = Math.max(localIdCounter.value, maxLocalId0 + 1, maxLocalId1 + 1);
	const { canvasEntries, internalCanvasGuid } = buildCanvasEntries(graph, pages, docGuid, localIdCounter, nodeIdToGuid, assignedGuidValues);
	assignVariableGuids(graph, localIdCounter, varIdToGuid, modeIdToGuid, assignedGuidValues, nodeSourceGuidValues);
	for (const entry of canvasEntries) nodeChanges.push(entry.canvasNc);
	const orderedCanvasEntries = [...canvasEntries.filter((entry) => entry.page.internalOnly), ...canvasEntries.filter((entry) => !entry.page.internalOnly)];
	for (const { page, canvasGuid } of orderedCanvasEntries) {
		const children = graph.getChildren(page.id).filter((child) => !child.internalOnly);
		for (let i = 0; i < children.length; i++) nodeChanges.push(...sceneNodeToKiwi$1(children[i], canvasGuid, i, localIdCounter, graph, blobs, nodeIdToGuid, fontDigestMap, varIdToGuid, glyphBlobMap, blobIndexByHex, assignedGuidValues, componentPropertyDefinitionsById, modeIdToGuid));
	}
	appendInternalResources({
		graph,
		nodeChanges,
		internalCanvasGuid,
		localIdCounter,
		blobs,
		nodeIdToGuid,
		fontDigestMap,
		varIdToGuid,
		modeIdToGuid,
		glyphBlobMap,
		blobIndexByHex,
		assignedGuidValues,
		componentPropertyDefinitionsById
	});
	const msg = {
		type: "NODE_CHANGES",
		sessionID: 0,
		ackID: 0,
		nodeChanges
	};
	if (blobs.length > 0) msg.blobs = blobs.map((bytes) => ({ bytes }));
	const kiwiData = compiled.encodeMessage(msg);
	const thumbnailPNG = await renderFigThumbnail(graph, pageId ?? pages[0]?.id, ck, renderer, renderHeadlessThumbnail);
	const metaJSON = JSON.stringify({
		version: 1,
		app: "OpenPencil",
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	});
	const imageEntries = collectImageEntries(graph);
	const version = graph.figKiwiVersion ?? void 0;
	if (IS_TAURI) {
		const { invoke } = await import("@tauri-apps/api/core");
		return new Uint8Array(await invoke("build_fig_file", {
			schemaDeflated: Array.from(schemaDeflated),
			kiwiData: Array.from(kiwiData),
			thumbnailPng: Array.from(thumbnailPNG),
			metaJson: metaJSON,
			images: imageEntries.map((e) => ({
				name: e.name,
				data: Array.from(e.data)
			})),
			figKiwiVersion: version
		}));
	}
	return compressFigData(schemaDeflated, kiwiData, thumbnailPNG, metaJSON, imageEntries, version);
}
function canUseWorker() {
	return typeof Worker !== "undefined" && IS_BROWSER;
}
function compressViaWorker(schemaDeflated, kiwiData, thumbnailPNG, metaJSON, imageEntries, figKiwiVersion) {
	return new Promise((resolve, reject) => {
		const worker = new Worker(new URL("./export-worker.ts", import.meta.url), { type: "module" });
		worker.onmessage = (e) => {
			resolve(e.data);
			worker.terminate();
		};
		worker.onerror = (err) => {
			reject(new Error(err.message));
			worker.terminate();
		};
		worker.postMessage({
			schemaDeflated,
			kiwiData,
			thumbnailPNG,
			metaJSON,
			images: imageEntries,
			figKiwiVersion
		});
	});
}
function compressFigData(schemaDeflated, kiwiData, thumbnailPNG, metaJSON, imageEntries, figKiwiVersion) {
	if (canUseWorker()) return compressViaWorker(schemaDeflated, kiwiData, thumbnailPNG, metaJSON, imageEntries, figKiwiVersion);
	return Promise.resolve(compressFigDataSync$1(schemaDeflated, kiwiData, thumbnailPNG, metaJSON, imageEntries, figKiwiVersion));
}
//#endregion
export { compressFigData, compressFigDataSync, exportFigFile };

//# sourceMappingURL=export.js.map
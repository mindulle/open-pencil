import { decodeBase64, decodeBase64Text, encodeBase64, encodeBase64Text } from "./bytes/base64.js";
import { shapeTextForClipboard } from "./canvas/text/clipboard.js";
import { buildFontDigestMap } from "./kiwi/fig/node-change/font/digests.js";
import { buildFigKiwi, decompressFigKiwiDataAsync, makeCanvasNodeChange, makeDocumentNodeChange, parseFigKiwiChunks, sceneNodeToKiwi as sceneNodeToKiwi$1 } from "./kiwi/fig/node-change/serialize.js";
import { randomInt } from "./random.js";
import { buildDerivedTextDataV4 } from "./text/derived-text/clipboard.js";
import { buildOpenPencilClipboardHTML, parseOpenPencilClipboard } from "./clipboard/openpencil.js";
import { deflateSync, inflateSync } from "fflate";
import { populateAndApplyOverrides } from "@open-pencil/fig/instance-overrides";
import { nodeChangeToProps, shouldImportTextAsAutoSize, sortChildren } from "@open-pencil/fig/node-change";
import { getCompiledSchema, getSchemaBytes, initCodec } from "@open-pencil/kiwi/fig/codec";
import { ByteBuffer, compileSchema, decodeBinarySchema } from "@open-pencil/kiwi/schema-runtime";
//#region src/clipboard.ts
async function prefetchFigmaSchema() {
	await initCodec();
}
async function parseFigmaClipboard(html) {
	const metaMatch = html.match(/\(figmeta\)(.*?)\(\/figmeta\)/);
	const bufMatch = html.match(/\(figma\)(.*?)\(\/figma\)/s);
	if (!metaMatch || !bufMatch) return null;
	const meta = JSON.parse(decodeBase64Text(metaMatch[1]));
	const binary = decodeBase64(bufMatch[1]);
	try {
		const chunks = parseFigKiwiChunks(binary);
		if (!chunks) return null;
		const compiled = compileSchema(decodeBinarySchema(new ByteBuffer(inflateSync(chunks[0]))));
		const dataRaw = await decompressFigKiwiDataAsync(chunks[1]);
		const msg = compiled.decodeMessage(dataRaw);
		const blobs = (msg.blobs ?? []).map((b) => b.bytes instanceof Uint8Array ? b.bytes : new Uint8Array(Object.values(b.bytes)));
		return {
			nodes: msg.nodeChanges ?? [],
			meta,
			blobs
		};
	} catch {
		return null;
	}
}
const NON_VISUAL_TYPES = /* @__PURE__ */ new Set([
	"DOCUMENT",
	"CANVAS",
	"VARIABLE_SET",
	"VARIABLE",
	"VARIABLE_COLLECTION",
	"STYLE",
	"STYLE_SET",
	"INTERNAL_ONLY_NODE",
	"WIDGET",
	"STAMP",
	"STICKY",
	"SHAPE_WITH_TEXT",
	"CONNECTOR",
	"CODE_BLOCK",
	"TABLE_NODE",
	"TABLE_CELL",
	"SECTION_OVERLAY",
	"SLIDE"
]);
function isChildOfVisualNode(nc, parentTypes) {
	const parentId = nc.parentIndex?.guid ? `${nc.parentIndex.guid.sessionID}:${nc.parentIndex.guid.localID}` : null;
	return !!parentId && parentTypes.has(parentId) && !NON_VISUAL_TYPES.has(parentTypes.get(parentId) ?? "");
}
function figmaNodesBounds(nodeChanges) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	const parentTypes = /* @__PURE__ */ new Map();
	for (const nc of nodeChanges) {
		if (!nc.guid) continue;
		const id = `${nc.guid.sessionID}:${nc.guid.localID}`;
		parentTypes.set(id, nc.type ?? "");
	}
	for (const nc of nodeChanges) {
		if (!nc.type || NON_VISUAL_TYPES.has(nc.type)) continue;
		if (isChildOfVisualNode(nc, parentTypes)) continue;
		const x = nc.transform?.m02 ?? 0;
		const y = nc.transform?.m12 ?? 0;
		const w = nc.size?.x ?? 0;
		const h = nc.size?.y ?? 0;
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x + w);
		maxY = Math.max(maxY, y + h);
	}
	if (minX === Infinity) return null;
	return {
		x: minX,
		y: minY,
		w: maxX - minX,
		h: maxY - minY
	};
}
function buildClipboardMaps(nodeChanges) {
	const guidMap = /* @__PURE__ */ new Map();
	const parentMap = /* @__PURE__ */ new Map();
	for (const nc of nodeChanges) {
		if (!nc.guid) continue;
		const id = `${nc.guid.sessionID}:${nc.guid.localID}`;
		guidMap.set(id, nc);
		if (nc.parentIndex?.guid) parentMap.set(id, `${nc.parentIndex.guid.sessionID}:${nc.parentIndex.guid.localID}`);
	}
	return {
		guidMap,
		parentMap
	};
}
function findInternalNodeIds(guidMap, parentMap) {
	const internalCanvasIds = /* @__PURE__ */ new Set();
	for (const [id, nc] of guidMap) if (nc.type === "CANVAS" && nc.internalOnly) internalCanvasIds.add(id);
	const internalFigmaIds = /* @__PURE__ */ new Set();
	function markInternal(id) {
		internalFigmaIds.add(id);
		for (const [childId, pid] of parentMap) if (pid === id && !internalFigmaIds.has(childId)) markInternal(childId);
	}
	for (const canvasId of internalCanvasIds) markInternal(canvasId);
	return {
		internalCanvasIds,
		internalFigmaIds
	};
}
function classifyTopLevelNodes(guidMap, parentMap, internalCanvasIds) {
	const topLevel = [];
	const internalTopLevel = [];
	for (const [id, nc] of guidMap) {
		if (NON_VISUAL_TYPES.has(nc.type ?? "")) continue;
		const parentId = parentMap.get(id);
		if (!parentId || !guidMap.has(parentId) || NON_VISUAL_TYPES.has(guidMap.get(parentId)?.type ?? "")) if (parentId && internalCanvasIds.has(parentId)) internalTopLevel.push(id);
		else topLevel.push(id);
	}
	return {
		topLevel,
		internalTopLevel
	};
}
function remapComponentIds(created, graph) {
	for (const [, ourId] of created) {
		const node = graph.getNode(ourId);
		if (node?.type !== "INSTANCE" || !node.componentId) continue;
		const ourComponentId = created.get(node.componentId);
		if (ourComponentId) graph.updateNode(ourId, { componentId: ourComponentId });
	}
}
function detachOrphanedInstances(created, graph) {
	for (const [, ourId] of created) {
		const node = graph.getNode(ourId);
		if (node?.type !== "INSTANCE") continue;
		if (node.childIds.length === 0 && (!node.componentId || !graph.getNode(node.componentId))) graph.updateNode(ourId, {
			type: "FRAME",
			componentId: ""
		});
	}
}
function importClipboardNodes(nodeChanges, graph, targetParentId, offsetX = 0, offsetY = 0, blobs = []) {
	const { guidMap, parentMap } = buildClipboardMaps(nodeChanges);
	const { internalCanvasIds, internalFigmaIds } = findInternalNodeIds(guidMap, parentMap);
	const { topLevel, internalTopLevel } = classifyTopLevelNodes(guidMap, parentMap, internalCanvasIds);
	const created = /* @__PURE__ */ new Map();
	const createdIds = [];
	function createNode(figmaId, ourParentId) {
		if (created.has(figmaId)) return;
		const nc = guidMap.get(figmaId);
		if (!nc) return;
		const { nodeType, ...props } = nodeChangeToProps(nc, blobs);
		if (nodeType === "DOCUMENT" || nodeType === "VARIABLE") return;
		if (shouldImportTextAsAutoSize(nc, guidMap.get(parentMap.get(figmaId) ?? ""))) props.textAutoResize = "WIDTH_AND_HEIGHT";
		if (ourParentId === targetParentId) {
			props.x = (props.x ?? 0) + offsetX;
			props.y = (props.y ?? 0) + offsetY;
		}
		const node = graph.createNode(nodeType, ourParentId, props);
		created.set(figmaId, node.id);
		if (ourParentId === targetParentId && !internalFigmaIds.has(figmaId)) createdIds.push(node.id);
		const children = [];
		for (const [childId, pid] of parentMap) if (pid === figmaId && !NON_VISUAL_TYPES.has(guidMap.get(childId)?.type ?? "")) children.push(childId);
		sortChildren(children, nc, guidMap);
		for (const childId of children) createNode(childId, node.id);
	}
	for (const id of internalTopLevel) createNode(id, targetParentId);
	for (const id of topLevel) createNode(id, targetParentId);
	remapComponentIds(created, graph);
	populateAndApplyOverrides(graph, guidMap, created, blobs);
	for (const figmaId of internalTopLevel) {
		const ourId = created.get(figmaId);
		if (ourId) graph.deleteNode(ourId);
	}
	detachOrphanedInstances(created, graph);
	return createdIds;
}
async function buildFigmaClipboardHTML(nodes, graph) {
	const compiled = getCompiledSchema();
	const schemaDeflated = deflateSync(getSchemaBytes());
	const fontDigestMap = await buildFontDigestMap(graph);
	const docGuid = {
		sessionID: 0,
		localID: 0
	};
	const canvasGuid = {
		sessionID: 0,
		localID: 1
	};
	const localIdCounter = { value: 100 };
	const nodeChanges = [makeDocumentNodeChange(docGuid, graph.documentColorSpace), makeCanvasNodeChange(canvasGuid, docGuid, "!", "Page 1")];
	const exportedTextNodes = [];
	const collectTextNodes = (node) => {
		if (node.type === "TEXT") exportedTextNodes.push(node);
		for (const childId of node.childIds) {
			const child = graph.getNode(childId);
			if (child) collectTextNodes(child);
		}
	};
	const blobs = [];
	for (let i = 0; i < nodes.length; i++) {
		collectTextNodes(nodes[i]);
		nodeChanges.push(...sceneNodeToKiwi$1(nodes[i], canvasGuid, i, localIdCounter, graph, blobs, void 0, fontDigestMap));
	}
	const textNodeQueue = [...exportedTextNodes];
	await Promise.all(nodeChanges.map(async (change) => {
		if (change.type !== "TEXT") return;
		const source = textNodeQueue.shift();
		if (!source) return;
		change.textAutoResize = "NONE";
		change.textUserLayoutVersion = 5;
		change.lineHeight = {
			value: source.lineHeight ?? 100,
			units: source.lineHeight ? "PIXELS" : "PERCENT"
		};
		change.derivedTextData = await buildDerivedTextDataV4(source, fontDigestMap, await shapeTextForClipboard(source).catch(() => null), blobs);
	}));
	const msg = {
		type: "NODE_CHANGES",
		sessionID: 0,
		ackID: 0,
		pasteID: randomInt(),
		pasteFileKey: "openpencil",
		nodeChanges
	};
	if (blobs.length > 0) msg.blobs = blobs.map((bytes) => ({ bytes }));
	const bufferB64 = encodeBase64(buildFigKiwi(schemaDeflated, compiled.encodeMessage(msg)));
	const meta = {
		fileKey: "openpencil",
		pasteID: msg.pasteID,
		dataType: "scene"
	};
	return `<meta charset='utf-8'><span data-metadata="<!--(figmeta)${encodeBase64Text(JSON.stringify(meta))}(/figmeta)-->"></span><span data-buffer="<!--(figma)${bufferB64}(/figma)-->"></span>`;
}
//#endregion
export { buildFigmaClipboardHTML, buildOpenPencilClipboardHTML, figmaNodesBounds, importClipboardNodes, parseFigmaClipboard, parseOpenPencilClipboard, prefetchFigmaSchema };

//# sourceMappingURL=clipboard.js.map
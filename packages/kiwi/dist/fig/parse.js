import { ByteBuffer, compileSchema, decodeBinarySchema, isZstdCompressed } from "../chunks/fig/codec.js";
import { decompress } from "fzstd";
import { inflateSync } from "fflate";
//#region src/fig/parse.ts
/**
* Deduplicates pluginData/pluginRelaunchData entries on raw NodeChange objects.
* Some .fig files have millions of identical entries where only a small
* fraction are unique by full triple.
* Full-triple key (id+key+value) preserves multi-entry subsystems like OkHCL.
*/
function deduplicateNodeChangePluginData(nodeChanges) {
	for (const nc of nodeChanges) {
		if (nc.pluginData && nc.pluginData.length > 1) {
			const map = /* @__PURE__ */ new Map();
			for (const entry of nc.pluginData) map.set(`${entry.pluginID}\0${entry.key}\0${entry.value}`, entry);
			if (map.size < nc.pluginData.length) nc.pluginData = [...map.values()];
		}
		if (nc.pluginRelaunchData && nc.pluginRelaunchData.length > 1) {
			const map = /* @__PURE__ */ new Map();
			for (const entry of nc.pluginRelaunchData) map.set(`${entry.pluginID}\0${entry.command}\0${entry.message}\0${entry.isDeleted}`, entry);
			if (map.size < nc.pluginRelaunchData.length) nc.pluginRelaunchData = [...map.values()];
		}
	}
}
function parseFigKiwiContainer(data) {
	if (new TextDecoder().decode(data.slice(0, 8)) !== "fig-kiwi") return null;
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	const version = view.getUint32(8, true);
	let offset = 12;
	const chunks = [];
	while (offset < data.length) {
		if (offset + 4 > data.length) break;
		const len = view.getUint32(offset, true);
		offset += 4;
		if (offset + len > data.length) throw new Error(`Corrupted .fig file: chunk at offset ${offset - 4} declares length ${len} but only ${data.length - offset} bytes remain`);
		chunks.push(data.slice(offset, offset + len));
		offset += len;
	}
	if (chunks.length < 2) return null;
	const compressed = chunks[1];
	let dataRaw;
	if (isZstdCompressed(compressed)) dataRaw = decompress(compressed);
	else dataRaw = inflateSync(compressed);
	return {
		schemaDeflated: chunks[0],
		dataRaw,
		version
	};
}
/** Decode one raw `fig-kiwi` canvas payload. Outer `.fig` archive handling lives in `@open-pencil/fig`. */
function decodeFigKiwiCanvas(data) {
	const payload = parseFigKiwiContainer(data);
	if (!payload) throw new Error("Invalid fig-kiwi container");
	const message = compileSchema(decodeBinarySchema(new ByteBuffer(inflateSync(payload.schemaDeflated)))).decodeMessage(payload.dataRaw);
	const nodeChanges = message.nodeChanges;
	if (!nodeChanges || nodeChanges.length === 0) throw new Error("No nodes found in .fig file");
	deduplicateNodeChangePluginData(nodeChanges);
	return {
		nodeChanges,
		blobs: (message.blobs ?? []).map((blob) => blob.bytes instanceof Uint8Array ? blob.bytes : new Uint8Array(Object.values(blob.bytes))),
		figKiwiVersion: payload.version,
		figSchemaDeflated: payload.schemaDeflated
	};
}
//#endregion
export { decodeFigKiwiCanvas, deduplicateNodeChangePluginData, parseFigKiwiContainer };

//# sourceMappingURL=parse.js.map
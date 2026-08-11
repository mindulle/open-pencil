import { effectiveFigmaRawNodeFields, effectiveFigmaSourcePayload, readEffectiveFigmaRawField, staleFigmaRawFields } from "./source-metadata.js";
import { inflateSync, unzipSync, zipSync } from "fflate";
import { FIG_KIWI_DEFAULT_VERSION, buildFigKiwi, decompressFigKiwiData, parseFigKiwiChunks } from "@open-pencil/kiwi/fig/container";
import { decodeFigKiwiCanvas } from "@open-pencil/kiwi/fig/parse";
//#region src/archive.ts
function isLikelyAsset(name) {
	const lower = name.toLowerCase();
	return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".json");
}
function findCanvasData(entries) {
	const canonical = entries["canvas.fig"] ?? entries.canvas;
	if (canonical) return canonical;
	let largest = null;
	for (const [name, data] of Object.entries(entries)) {
		if (!data || isLikelyAsset(name)) continue;
		if (!largest || data.byteLength > largest.byteLength) largest = data;
	}
	return largest;
}
/** Parse a complete zipped `.fig` file into its Figma protocol payload and binary resources. */
function parseFigBuffer(buffer) {
	const archive = unzipSync(new Uint8Array(buffer));
	const canvasData = findCanvasData(archive);
	if (!canvasData) throw new Error(`No canvas data found in .fig file. Entries: ${Object.keys(archive).join(", ")}`);
	const decoded = decodeFigKiwiCanvas(canvasData);
	const metaBytes = archive["meta.json"];
	const images = Object.entries(archive).filter(([name]) => name.startsWith("images/") && name !== "images/").map(([name, data]) => [name.slice(7), data]);
	return {
		...decoded,
		images,
		thumbnailPNG: archive["thumbnail.png"] ?? null,
		metaJSON: Object.hasOwn(archive, "meta.json") ? new TextDecoder().decode(metaBytes) : null
	};
}
/** Assemble a complete zipped `.fig` archive from an encoded Kiwi message and resources. */
function writeFigArchive(input) {
	const entries = {
		"canvas.fig": [buildFigKiwi(input.schemaDeflated, input.kiwiData, input.figKiwiVersion), { level: 0 }],
		"thumbnail.png": [input.thumbnailPNG, { level: 0 }],
		"meta.json": new TextEncoder().encode(input.metaJSON)
	};
	for (const image of input.images ?? []) entries[image.name] = [image.data, { level: 0 }];
	return zipSync(entries);
}
/** Compatibility signature used by core while archive assembly migrates to this package. */
function compressFigDataSync(schemaDeflated, kiwiData, thumbnailPNG, metaJSON, imageEntries, figKiwiVersion) {
	return writeFigArchive({
		schemaDeflated,
		kiwiData,
		thumbnailPNG,
		metaJSON,
		images: imageEntries,
		figKiwiVersion
	});
}
//#endregion
//#region src/thumbnail.ts
const EOCD_SIGNATURE = 101010256;
const CENTRAL_SIGNATURE = 33639248;
const LOCAL_SIGNATURE = 67324752;
const EOCD_MIN_SIZE = 22;
const DEFAULT_MAX_TAIL = 4 * 1024 * 1024;
const DEFAULT_MAX_COMPRESSED = 8 * 1024 * 1024;
const DEFAULT_MAX_OUTPUT = 16 * 1024 * 1024;
const THUMBNAIL_NAME = "thumbnail.png";
const PNG_SIGNATURE = new Uint8Array([
	137,
	80,
	78,
	71,
	13,
	10,
	26,
	10
]);
function view(bytes) {
	return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}
function findEOCD(bytes) {
	const data = view(bytes);
	for (let offset = bytes.byteLength - EOCD_MIN_SIZE; offset >= 0; offset--) if (data.getUint32(offset, true) === EOCD_SIGNATURE) return offset;
	return -1;
}
function boundedLimit(value, fallback) {
	return Number.isFinite(value) && value && value > 0 ? value : fallback;
}
function hasPNGSignature(bytes) {
	return PNG_SIGNATURE.every((byte, index) => bytes[index] === byte);
}
function findThumbnailEntry(central, maxCompressed, maxOutput) {
	const data = view(central);
	const decoder = new TextDecoder();
	for (let offset = 0; offset + 46 <= central.byteLength;) {
		if (data.getUint32(offset, true) !== CENTRAL_SIGNATURE) return null;
		const method = data.getUint16(offset + 10, true);
		const compressedSize = data.getUint32(offset + 20, true);
		const outputSize = data.getUint32(offset + 24, true);
		const nameLength = data.getUint16(offset + 28, true);
		const next = offset + 46 + nameLength + data.getUint16(offset + 30, true) + data.getUint16(offset + 32, true);
		if (next > central.byteLength) return null;
		if (decoder.decode(central.subarray(offset + 46, offset + 46 + nameLength)) === THUMBNAIL_NAME) {
			if (compressedSize > maxCompressed || outputSize > maxOutput) return null;
			return {
				method,
				compressedSize,
				outputSize,
				localOffset: data.getUint32(offset + 42, true)
			};
		}
		offset = next;
	}
	return null;
}
async function readEntryPayload(reader, entry, maxOutput) {
	const header = await reader.read(entry.localOffset, Math.min(reader.size, entry.localOffset + 30));
	if (header.byteLength < 30 || view(header).getUint32(0, true) !== LOCAL_SIGNATURE) return null;
	const headerView = view(header);
	const dataStart = entry.localOffset + 30 + headerView.getUint16(26, true) + headerView.getUint16(28, true);
	if (dataStart + entry.compressedSize > reader.size) return null;
	const compressed = await reader.read(dataStart, dataStart + entry.compressedSize);
	if (entry.method === 0) return compressed.byteLength === entry.outputSize && hasPNGSignature(compressed) ? compressed : null;
	if (entry.method !== 8) return null;
	const output = (() => {
		try {
			return inflateSync(compressed, { out: new Uint8Array(maxOutput + 1) });
		} catch {
			return null;
		}
	})();
	return output?.byteLength === entry.outputSize && hasPNGSignature(output) ? output : null;
}
/**
* Extract Figma's canonical `thumbnail.png` from a remote `.fig` ZIP through
* bounded range reads. The complete document is never requested.
*/
async function extractFigThumbnailFromReader(reader, limits = {}) {
	if (!Number.isSafeInteger(reader.size) || reader.size < EOCD_MIN_SIZE) return null;
	const maxCentral = boundedLimit(limits.maxTailBytes, DEFAULT_MAX_TAIL);
	const maxCompressed = boundedLimit(limits.maxCompressedBytes, DEFAULT_MAX_COMPRESSED);
	const maxOutput = boundedLimit(limits.maxOutputBytes, DEFAULT_MAX_OUTPUT);
	const tailSize = Math.min(reader.size, 65557);
	const tailStart = reader.size - tailSize;
	const tail = await reader.read(tailStart, reader.size);
	const eocd = findEOCD(tail);
	if (eocd < 0) return null;
	const tailView = view(tail);
	const centralSize = tailView.getUint32(eocd + 12, true);
	const centralOffset = tailView.getUint32(eocd + 16, true);
	if (centralSize > maxCentral || centralOffset + centralSize > reader.size) return null;
	const entry = findThumbnailEntry(centralOffset >= tailStart && centralOffset + centralSize <= reader.size ? tail.subarray(centralOffset - tailStart, centralOffset - tailStart + centralSize) : await reader.read(centralOffset, centralOffset + centralSize), maxCompressed, maxOutput);
	return entry ? readEntryPayload(reader, entry, maxOutput) : null;
}
//#endregion
//#region src/index.ts
const FIG_PACKAGE_STATUS = "archive-api";
function readFigContainer(bytes, options = {}) {
	const chunks = parseFigKiwiChunks(bytes);
	if (!chunks) throw new Error("Invalid fig-kiwi container");
	const [schemaDeflated, dataDeflated] = chunks;
	return {
		schemaDeflated,
		dataRaw: decompressFigKiwiData(dataDeflated),
		source: {
			bytes,
			fileName: options.fileName
		}
	};
}
function writeFigContainer(document, options = {}) {
	return buildFigKiwi(document.schemaDeflated, document.dataRaw, options.version ?? FIG_KIWI_DEFAULT_VERSION);
}
function assertFigPackageReady() {
	throw new Error("@open-pencil/fig currently exposes archive/container APIs; use @open-pencil/core for SceneGraph .fig read/write APIs for now.");
}
//#endregion
export { FIG_PACKAGE_STATUS, assertFigPackageReady, compressFigDataSync, effectiveFigmaRawNodeFields, effectiveFigmaSourcePayload, extractFigThumbnailFromReader, parseFigBuffer, readEffectiveFigmaRawField, readFigContainer, staleFigmaRawFields, writeFigArchive, writeFigContainer };

//# sourceMappingURL=index.js.map
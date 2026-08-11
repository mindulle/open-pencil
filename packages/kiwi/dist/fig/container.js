import { deflateSync, inflateSync } from "fflate";
//#region src/fig/container.ts
const FIG_KIWI_DEFAULT_VERSION = 101;
function parseFigKiwiChunks(binary) {
	if (new TextDecoder().decode(binary.slice(0, 8)) !== "fig-kiwi") return null;
	const view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
	let offset = 12;
	const chunks = [];
	while (offset < binary.length) {
		const chunkLen = view.getUint32(offset, true);
		offset += 4;
		chunks.push(binary.slice(offset, offset + chunkLen));
		offset += chunkLen;
	}
	return chunks.length >= 2 ? chunks : null;
}
function decompressFigKiwiData(compressed) {
	try {
		return inflateSync(compressed);
	} catch {
		throw new Error("Failed to decompress fig-kiwi data");
	}
}
async function decompressFigKiwiDataAsync(compressed) {
	try {
		return inflateSync(compressed);
	} catch {
		return (await import("fzstd")).decompress(compressed);
	}
}
function buildFigKiwi(schemaDeflated, dataRaw, version = 101) {
	const dataDeflated = deflateSync(dataRaw);
	const total = 16 + schemaDeflated.length + 4 + dataDeflated.length;
	const out = new Uint8Array(total);
	const view = new DataView(out.buffer);
	out.set(new TextEncoder().encode("fig-kiwi"), 0);
	view.setUint32(8, version, true);
	let offset = 12;
	view.setUint32(offset, schemaDeflated.length, true);
	offset += 4;
	out.set(schemaDeflated, offset);
	offset += schemaDeflated.length;
	view.setUint32(offset, dataDeflated.length, true);
	offset += 4;
	out.set(dataDeflated, offset);
	return out;
}
//#endregion
export { FIG_KIWI_DEFAULT_VERSION, buildFigKiwi, decompressFigKiwiData, decompressFigKiwiDataAsync, parseFigKiwiChunks };

//# sourceMappingURL=container.js.map
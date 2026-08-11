import { compressFigDataSync } from "@open-pencil/fig";
//#region src/io/formats/fig/export-worker.ts
self.onmessage = (e) => {
	const { schemaDeflated, kiwiData, thumbnailPNG, metaJSON, images, figKiwiVersion } = e.data;
	const result = compressFigDataSync(schemaDeflated, kiwiData, thumbnailPNG, metaJSON, images, figKiwiVersion);
	self.postMessage(result, { transfer: [result.buffer] });
};
//#endregion

//# sourceMappingURL=export-worker.js.map
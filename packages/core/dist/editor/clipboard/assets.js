import { TRANSPARENT } from "../../constants.js";
import { computeAllLayouts } from "../../layout.js";
import { resolvePasteTarget } from "./paste-target.js";
import { computeImageHash } from "../../figma-api/index.js";
import { createSVGNodesFromImport, prepareSVGImport } from "../../io/formats/svg/import.js";
import { getWorldMatrix } from "@open-pencil/scene-graph/coordinate";
import Matrix from "@open-pencil/scene-graph/matrix";
//#region src/editor/clipboard/assets.ts
const IMAGE_MAX_DIMENSION = 4096;
const ASSET_GAP = 20;
const RASTER_IMAGE_TYPES = /* @__PURE__ */ new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
	"image/avif"
]);
function isSVGFile(file) {
	return file.type === "image/svg+xml" || file.type === "" && file.name.toLowerCase().endsWith(".svg");
}
function createClipboardAssetActions(ctx, pushCreatedNodesUndo) {
	function storeImage(bytes) {
		const hash = computeImageHash(bytes);
		ctx.graph.images.set(hash, bytes);
		return hash;
	}
	function decodeImageDimensions(bytes) {
		const ck = ctx.getCk();
		if (!ck) return null;
		const skImg = ck.MakeImageFromEncoded(bytes);
		if (!skImg) return null;
		let width = skImg.width();
		let height = skImg.height();
		skImg.delete();
		if (width > IMAGE_MAX_DIMENSION || height > IMAGE_MAX_DIMENSION) {
			const ratio = Math.min(IMAGE_MAX_DIMENSION / width, IMAGE_MAX_DIMENSION / height);
			width = Math.round(width * ratio);
			height = Math.round(height * ratio);
		}
		return {
			width,
			height
		};
	}
	async function prepareAsset(file) {
		if (isSVGFile(file)) {
			const data = prepareSVGImport(await file.text());
			return data ? {
				kind: "svg",
				data,
				name: file.name.replace(/\.svg$/i, "") || "SVG",
				width: data.width,
				height: data.height
			} : null;
		}
		if (!RASTER_IMAGE_TYPES.has(file.type)) return null;
		const bytes = new Uint8Array(await file.arrayBuffer());
		const dimensions = decodeImageDimensions(bytes);
		return dimensions ? {
			kind: "raster",
			bytes,
			name: file.name,
			...dimensions
		} : null;
	}
	function parentLocalPoint(parentId, x, y) {
		const parent = ctx.graph.getNode(parentId);
		if (!parent) return {
			x,
			y
		};
		const inverse = Matrix.invert(getWorldMatrix(parent, ctx.graph));
		return inverse ? Matrix.mapPoint(inverse, {
			x,
			y
		}) : {
			x,
			y
		};
	}
	function createRasterNode(asset, parentId, x, y) {
		const fill = {
			type: "IMAGE",
			imageHash: storeImage(asset.bytes),
			imageScaleMode: "FILL",
			color: TRANSPARENT,
			opacity: 1,
			visible: true
		};
		return ctx.graph.createNode("RECTANGLE", parentId, {
			name: asset.name.replace(/\.[^.]+$/, ""),
			x,
			y,
			width: asset.width,
			height: asset.height,
			fills: [fill]
		}).id;
	}
	async function placeFiles(files, cx, cy) {
		const prepared = (await Promise.all(files.map(prepareAsset))).filter((asset) => asset !== null);
		if (prepared.length === 0) return;
		const previousSelection = new Set(ctx.state.selectedIds);
		const parentId = resolvePasteTarget(ctx);
		const center = parentLocalPoint(parentId, cx, cy);
		const totalWidth = prepared.reduce((total, asset) => total + asset.width, 0) + ASSET_GAP * (prepared.length - 1);
		const maxHeight = Math.max(...prepared.map((asset) => asset.height));
		let x = center.x - totalWidth / 2;
		const y = center.y - maxHeight / 2;
		const created = [];
		try {
			for (const asset of prepared) {
				const id = asset.kind === "raster" ? createRasterNode(asset, parentId, x, y) : createSVGNodesFromImport(ctx.graph, parentId, asset.data, {
					name: asset.name,
					x,
					y
				})?.id;
				if (id) created.push(id);
				x += asset.width + ASSET_GAP;
			}
		} catch (error) {
			for (const id of created.reverse()) ctx.graph.deleteNode(id);
			throw error;
		}
		if (created.length === 0) return;
		computeAllLayouts(ctx.graph, ctx.state.currentPageId);
		ctx.setSelectedIds(new Set(created));
		pushCreatedNodesUndo(created, previousSelection, "Place files");
		ctx.requestRender();
	}
	function placeImageFiles(files, cx, cy) {
		return placeFiles(files.filter((file) => RASTER_IMAGE_TYPES.has(file.type)), cx, cy);
	}
	return {
		storeImage,
		placeFiles,
		placeImageFiles
	};
}
//#endregion
export { createClipboardAssetActions };

//# sourceMappingURL=assets.js.map
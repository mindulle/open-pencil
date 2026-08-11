//#region src/vector/vectorize/preprocess.ts
const MIN_DIMENSION = 256;
const MAX_DIMENSION = 4096;
const MAX_MEGAPIXELS = 16e6;
const MAX_BYTES = 5 * 1024 * 1024;
function clampDimensions(width, height) {
	let w = width;
	let h = height;
	const minDim = Math.min(w, h);
	if (minDim > 0 && minDim < MIN_DIMENSION) {
		const scale = MIN_DIMENSION / minDim;
		w = Math.round(w * scale);
		h = Math.round(h * scale);
	}
	const maxDim = Math.max(w, h);
	if (maxDim > MAX_DIMENSION) {
		const scale = MAX_DIMENSION / maxDim;
		w = Math.round(w * scale);
		h = Math.round(h * scale);
	}
	if (w * h > MAX_MEGAPIXELS) {
		const scale = Math.sqrt(MAX_MEGAPIXELS / (w * h));
		w = Math.max(1, Math.round(w * scale));
		h = Math.max(1, Math.round(h * scale));
	}
	return {
		width: w,
		height: h
	};
}
function encodePNG(ck, image) {
	if (!image) return null;
	const encoded = image.encodeToBytes(ck.ImageFormat.PNG, 100);
	return encoded ? new Uint8Array(encoded) : null;
}
function resizeImage(ck, source, width, height) {
	const pixels = ck.Malloc(Uint8Array, width * height * 4);
	const surface = ck.MakeRasterDirectSurface({
		alphaType: ck.AlphaType.Unpremul,
		colorType: ck.ColorType.RGBA_8888,
		colorSpace: ck.ColorSpace.SRGB,
		width,
		height
	}, pixels, width * 4);
	if (!surface) {
		ck.Free(pixels);
		return null;
	}
	const canvas = surface.getCanvas();
	canvas.clear(ck.TRANSPARENT);
	const srcW = source.width();
	const srcH = source.height();
	canvas.drawImageRectOptions(source, ck.LTRBRect(0, 0, srcW, srcH), ck.LTRBRect(0, 0, width, height), ck.FilterMode.Linear, ck.MipmapMode.None, null);
	surface.flush();
	const snapshot = surface.makeImageSnapshot();
	const encoded = encodePNG(ck, snapshot);
	snapshot.delete();
	surface.delete();
	ck.Free(pixels);
	return encoded;
}
function preprocessForVectorize(bytes, getCk) {
	const ck = getCk();
	if (!ck) return null;
	const source = ck.MakeImageFromEncoded(bytes);
	if (!source) return null;
	const originalWidth = source.width();
	const originalHeight = source.height();
	if (originalWidth <= 0 || originalHeight <= 0) {
		source.delete();
		return null;
	}
	const target = clampDimensions(originalWidth, originalHeight);
	let pngBytes;
	if (target.width === originalWidth && target.height === originalHeight) pngBytes = encodePNG(ck, source);
	else pngBytes = resizeImage(ck, source, target.width, target.height);
	source.delete();
	if (!pngBytes || pngBytes.length === 0) return null;
	if (pngBytes.length > MAX_BYTES) return null;
	return {
		pngBytes,
		originalWidth,
		originalHeight,
		width: target.width,
		height: target.height
	};
}
//#endregion
export { preprocessForVectorize };

//# sourceMappingURL=preprocess.js.map
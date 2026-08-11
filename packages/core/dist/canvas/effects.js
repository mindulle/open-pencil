//#region src/canvas/effects.ts
function getCachedDropShadow(r, dx, dy, sigma, color) {
	const key = `ds:${dx},${dy},${sigma},${color[0]},${color[1]},${color[2]},${color[3]}`;
	let filter = r.imageFilterCache.get(key);
	if (!filter) {
		filter = r.ck.ImageFilter.MakeDropShadowOnly(dx, dy, sigma, sigma, color, null);
		r.imageFilterCache.set(key, filter);
	}
	return filter;
}
function getCachedBlur(r, sigma) {
	const key = `blur:${sigma}`;
	let filter = r.imageFilterCache.get(key);
	if (!filter) {
		filter = r.ck.ImageFilter.MakeBlur(sigma, sigma, r.ck.TileMode.Clamp, null);
		r.imageFilterCache.set(key, filter);
	}
	return filter;
}
function getCachedDecalBlur(r, sigma) {
	const key = `dblur:${sigma}`;
	let filter = r.imageFilterCache.get(key);
	if (!filter) {
		filter = r.ck.ImageFilter.MakeBlur(sigma, sigma, r.ck.TileMode.Decal, null);
		r.imageFilterCache.set(key, filter);
	}
	return filter;
}
function getCachedMaskBlur(r, sigma) {
	let filter = r.maskFilterCache.get(sigma);
	if (!filter) {
		filter = r.ck.MaskFilter.MakeBlur(r.ck.BlurStyle.Normal, sigma, true);
		r.maskFilterCache.set(sigma, filter);
	}
	return filter;
}
function applyClippedBlur(r, canvas, node, rect, hasRadius, sigma) {
	r.effectLayerPaint.setImageFilter(null);
	r.effectLayerPaint.setColorFilter(null);
	r.effectLayerPaint.setBlendMode(r.ck.BlendMode.SrcOver);
	canvas.save();
	r.clipNodeShape(canvas, node, rect, hasRadius);
	canvas.saveLayer(void 0, rect, r.getCachedBlur(sigma), void 0, r.ck.TileMode.Clamp);
	canvas.restore();
	r.effectLayerPaint.setImageFilter(null);
	r.effectLayerPaint.setColorFilter(null);
	r.effectLayerPaint.setBlendMode(r.ck.BlendMode.SrcOver);
	canvas.restore();
}
//#endregion
export { applyClippedBlur, getCachedBlur, getCachedDecalBlur, getCachedDropShadow, getCachedMaskBlur };

//# sourceMappingURL=effects.js.map
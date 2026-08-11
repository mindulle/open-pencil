import { DEFAULT_FONT_FAMILY } from "../../constants.js";
import { collectGraphFontRequirements } from "../../text/requirements.js";
import { fontManager } from "../../text/fonts.js";
import { missingGraphFontScripts } from "../../text/resolved-requirements.js";
//#region src/canvas/renderer/fonts.ts
function syncFontGeneration(r) {
	r.fontGeneration = fontManager.generation();
}
function trackFontDemand(r, node, key) {
	const pending = r.pendingFontNodes.get(node.id) ?? {
		node,
		keys: /* @__PURE__ */ new Set()
	};
	pending.node = node;
	pending.keys.add(key);
	r.pendingFontNodes.set(node.id, pending);
}
function isTextPictureCurrent(r, node) {
	const data = node.textPicture;
	if (!data) {
		r.textPictureGenerations.delete(node.id);
		return false;
	}
	const cached = r.textPictureGenerations.get(node.id);
	if (!cached || cached.data !== data) {
		r.textPictureGenerations.set(node.id, {
			data,
			generation: r.fontGeneration
		});
		return true;
	}
	return cached.generation === r.fontGeneration;
}
function settleFontDemand(r, snapshot, nodeIds) {
	syncFontGeneration(r);
	for (const nodeId of nodeIds) {
		const pending = r.pendingFontNodes.get(nodeId);
		if (pending) {
			pending.node.textPicture = null;
			pending.keys.delete(snapshot.key);
			if (pending.keys.size === 0) r.pendingFontNodes.delete(nodeId);
		}
		r.textPictureGenerations.delete(nodeId);
		r.invalidateNodePicture(nodeId);
	}
}
function getFontProvider(r) {
	return r.isDestroyed() || !r.fontProvider ? null : r.fontProvider;
}
async function loadFonts(r, onFallbackFontsLoaded) {
	if (r.isDestroyed()) return;
	r.onFontResolutionSettled = (snapshot, nodeIds) => {
		if (r.isDestroyed()) return;
		settleFontDemand(r, snapshot, nodeIds);
		onFallbackFontsLoaded?.();
	};
	r.fontProvider?.delete();
	r.fontProvider = r.ck.TypefaceFontProvider.Make();
	fontManager.attachProvider(r.ck, r.fontProvider);
	syncFontGeneration(r);
	const fontData = await fontManager.loadFont(DEFAULT_FONT_FAMILY, "Regular");
	if (r.isDestroyed()) return;
	if (fontData) {
		const typeface = r.ck.Typeface.MakeFreeTypeFaceFromData(fontData);
		if (typeface) {
			r.textFont?.delete();
			r.labelFont?.delete();
			r.sizeFont?.delete();
			r.sectionTitleFont?.delete();
			r.componentLabelFont?.delete();
			r.textFont = new r.ck.Font(typeface, 14);
			r.labelFont = new r.ck.Font(typeface, 11);
			r.sizeFont = new r.ck.Font(typeface, 10);
			r.sectionTitleFont = new r.ck.Font(typeface, 12);
			r.componentLabelFont = new r.ck.Font(typeface, 11);
			r.profiler.setTypeface(typeface);
		}
		r.fontMgr = r.ck.FontMgr.FromData(fontData) ?? null;
	}
	r.fontsLoaded = true;
	syncFontGeneration(r);
	r.invalidateAllPictures();
}
async function prepareForExport(r, graph, pageId, nodeIds) {
	const { getTextMeasurer, setTextMeasurer, computeAllLayouts } = await import("../../layout.js");
	const previousTextMeasurer = getTextMeasurer();
	setTextMeasurer((node, maxWidth) => r.measureTextNode(node, maxWidth));
	const fontKeys = fontManager.collectFontKeys(graph, nodeIds);
	const requirements = collectGraphFontRequirements(graph, nodeIds);
	await Promise.all(fontKeys.map(([family, style]) => fontManager.loadFont(family, style, requirements.characters)));
	await fontManager.ensureFallbackPack(missingGraphFontScripts(requirements), requirements.characters);
	syncFontGeneration(r);
	computeAllLayouts(graph, pageId);
	return () => setTextMeasurer(previousTextMeasurer);
}
//#endregion
export { getFontProvider, isTextPictureCurrent, loadFonts, prepareForExport, syncFontGeneration, trackFontDemand };

//# sourceMappingURL=fonts.js.map
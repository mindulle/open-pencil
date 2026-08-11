import { collectGraphFontRequirements } from "../../text/requirements.js";
import { fontManager } from "../../text/fonts.js";
import { computeAllLayouts } from "../../layout.js";
import { missingGraphFontScripts } from "../../text/resolved-requirements.js";
//#region src/editor/clipboard/fonts.ts
function createClipboardFontActions(ctx) {
	async function loadFontsForNodes(nodeIds) {
		fontManager.blockNodesUntilFontsResolve(nodeIds);
		try {
			const requirements = collectGraphFontRequirements(ctx.graph, nodeIds);
			const toLoad = fontManager.collectFontKeys(ctx.graph, nodeIds);
			const results = await Promise.all(toLoad.map(([family, style]) => ctx.loadFont(family, style, requirements.characters)));
			const failed = toLoad.filter((_, index) => results[index] === null);
			const requiredFallbacks = missingGraphFontScripts(requirements);
			const fallbacks = await fontManager.ensureFallbackPack(requiredFallbacks, requirements.characters);
			const missingFallback = requiredFallbacks.some((script) => (fallbacks[script]?.length ?? 0) === 0);
			if (failed.length === 0 && !missingFallback) {
				for (const node of requirements.nodes) if (node.type === "TEXT") node.textPicture = null;
			}
			computeAllLayouts(ctx.graph, ctx.state.currentPageId);
			return failed;
		} finally {
			fontManager.unblockNodes(nodeIds);
			ctx.getRenderer()?.invalidateAllPictures();
			ctx.requestRender();
		}
	}
	return { loadFontsForNodes };
}
//#endregion
export { createClipboardFontActions };

//# sourceMappingURL=fonts.js.map
import { collectGraphFontRequirements } from "../text/requirements.js";
import { fontManager } from "../text/fonts.js";
import { computeAllLayouts } from "../layout.js";
import { missingGraphFontScripts } from "../text/resolved-requirements.js";
import { populateLazyFigImportRoots } from "../kiwi/fig/lazy-import.js";
import { canUseFigPopulationWorker, createFigPopulationWorker } from "../kiwi/fig/population/client.js";
import { createPageViewportStore } from "./page-viewports.js";
//#region src/editor/pages.ts
function createPageActions(ctx) {
	const pageViewportStore = createPageViewportStore(ctx);
	let populationWorkerInstance;
	let populationWorkerGeneration = 0;
	let pageSwitchGeneration = 0;
	function populationWorker() {
		if (!canUseFigPopulationWorker(ctx.graph)) return null;
		populationWorkerInstance ??= createFigPopulationWorker(ctx.graph);
		return populationWorkerInstance;
	}
	async function switchPage(pageId) {
		if (ctx.graph.getNode(pageId)?.type !== "CANVAS") return;
		const switchGeneration = ++pageSwitchGeneration;
		pageViewportStore.saveCurrentPageViewport();
		const previousPageId = ctx.state.currentPageId;
		ctx.state.currentPageId = pageId;
		ctx.state.enteredContainerId = null;
		ctx.setSelectedIds(/* @__PURE__ */ new Set());
		if (previousPageId !== pageId) ctx.emitEditorEvent("page:changed", pageId, previousPageId);
		pageViewportStore.restorePageViewport(pageId);
		ctx.state.loading = true;
		let populated;
		try {
			const worker = populationWorker();
			const workerGeneration = populationWorkerGeneration;
			const workerResult = worker ? await worker.populate(pageId) : null;
			if (workerGeneration !== populationWorkerGeneration) return;
			if (workerResult === null) {
				worker?.terminate();
				populationWorkerInstance = void 0;
				populated = populateLazyFigImportRoots(ctx.graph, [pageId]);
			} else populated = workerResult;
		} finally {
			if (switchGeneration === pageSwitchGeneration) ctx.state.loading = false;
		}
		if (switchGeneration !== pageSwitchGeneration) return;
		const childIds = ctx.graph.getChildren(pageId).map((node) => node.id);
		const toLoad = fontManager.collectFontKeys(ctx.graph, childIds);
		const requirements = collectGraphFontRequirements(ctx.graph, childIds);
		fontManager.blockNodesUntilFontsResolve(childIds);
		try {
			const results = await Promise.all(toLoad.map(([family, style]) => ctx.loadFont(family, style, requirements.characters)));
			const requiredFallbacks = missingGraphFontScripts(requirements);
			const fallbacks = await fontManager.ensureFallbackPack(requiredFallbacks, requirements.characters);
			const facesReady = results.every((result) => result !== null);
			const fallbacksReady = requiredFallbacks.every((script) => (fallbacks[script]?.length ?? 0) > 0);
			if (facesReady && fallbacksReady) {
				for (const node of requirements.nodes) if (node.type === "TEXT") node.textPicture = null;
			}
		} finally {
			fontManager.unblockNodes(childIds);
			ctx.getRenderer()?.invalidateAllPictures();
		}
		if (ctx.getRenderer() || populated) computeAllLayouts(ctx.graph, pageId);
		ctx.requestRender();
	}
	function clearPageViewports() {
		populationWorkerGeneration++;
		pageSwitchGeneration++;
		ctx.state.loading = false;
		populationWorkerInstance?.terminate();
		populationWorkerInstance = void 0;
		pageViewportStore.clearPageViewports();
	}
	function addPage(name) {
		const pages = ctx.graph.getPages();
		const pageName = name ?? `Page ${pages.length + 1}`;
		const page = ctx.graph.addPage(pageName);
		switchPage(page.id);
		return page.id;
	}
	function deletePage(pageId) {
		const pages = ctx.graph.getPages();
		if (pages.length <= 1) return;
		const idx = pages.findIndex((p) => p.id === pageId);
		ctx.graph.deleteNode(pageId);
		pageViewportStore.deletePageViewport(pageId);
		if (ctx.state.currentPageId === pageId) {
			const newIdx = Math.min(idx, pages.length - 2);
			switchPage(ctx.graph.getPages()[newIdx].id);
		}
	}
	function movePage(pageId, index) {
		const pages = ctx.graph.getPages();
		const currentIndex = pages.findIndex((page) => page.id === pageId);
		if (currentIndex === -1) return;
		const nextIndex = Math.max(0, Math.min(index, pages.length - 1));
		if (nextIndex === currentIndex) return;
		ctx.graph.insertChildAt(pageId, ctx.graph.rootId, nextIndex);
	}
	function renamePage(pageId, name) {
		ctx.graph.updateNode(pageId, { name });
	}
	function setPageColor(color) {
		ctx.state.pageColor = color;
		ctx.requestRender();
	}
	return {
		switchPage,
		addPage,
		deletePage,
		movePage,
		renamePage,
		setPageColor,
		clearPageViewports
	};
}
//#endregion
export { createPageActions };

//# sourceMappingURL=pages.js.map
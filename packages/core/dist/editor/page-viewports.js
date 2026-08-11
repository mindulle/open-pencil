import { CANVAS_BG_COLOR } from "../constants.js";
//#region src/editor/page-viewports.ts
function createPageViewportStore(ctx) {
	const pageViewports = /* @__PURE__ */ new Map();
	function saveCurrentPageViewport() {
		pageViewports.set(ctx.state.currentPageId, {
			panX: ctx.state.panX,
			panY: ctx.state.panY,
			zoom: ctx.state.zoom,
			pageColor: { ...ctx.state.pageColor }
		});
	}
	function restorePageViewport(pageId) {
		const viewport = pageViewports.get(pageId);
		if (viewport) {
			ctx.state.panX = viewport.panX;
			ctx.state.panY = viewport.panY;
			ctx.state.zoom = viewport.zoom;
			ctx.state.pageColor = { ...viewport.pageColor };
			return;
		}
		ctx.state.panX = 0;
		ctx.state.panY = 0;
		ctx.state.zoom = 1;
		ctx.state.pageColor = { ...CANVAS_BG_COLOR };
	}
	function deletePageViewport(pageId) {
		pageViewports.delete(pageId);
	}
	function clearPageViewports() {
		pageViewports.clear();
	}
	return {
		saveCurrentPageViewport,
		restorePageViewport,
		deletePageViewport,
		clearPageViewports
	};
}
//#endregion
export { createPageViewportStore };

//# sourceMappingURL=page-viewports.js.map
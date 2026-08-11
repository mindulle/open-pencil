import { renderNodesToSVG } from "../../io/formats/svg/export.js";
import { selectionToJSX } from "../../io/formats/jsx/export.js";
//#region src/editor/clipboard/export.ts
function createClipboardExportActions(ctx) {
	function copySelectionAsText(ids) {
		return ids.map((id) => ctx.graph.getNode(id)?.name ?? id).join("\n");
	}
	function copySelectionAsSVG(ids) {
		const nodeIds = ids.length > 0 ? ids : ctx.graph.getChildren(ctx.state.currentPageId).map((n) => n.id);
		return renderNodesToSVG(ctx.graph, ctx.state.currentPageId, nodeIds);
	}
	function copySelectionAsJSX(ids) {
		return ids.length > 0 ? selectionToJSX(ids, ctx.graph) : null;
	}
	return {
		copySelectionAsText,
		copySelectionAsSVG,
		copySelectionAsJSX
	};
}
//#endregion
export { createClipboardExportActions };

//# sourceMappingURL=export.js.map
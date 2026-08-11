import { toggleBoldInRange, toggleDecorationInRange, toggleItalicInRange } from "@open-pencil/core/text";
//#region src/canvas/text-edit/formatting.ts
function createTextFormattingActions(store) {
	function applyFormatting(nodeId, changes, label) {
		store.updateNodeWithUndo(nodeId, changes, label);
		const updated = store.graph.getNode(nodeId);
		if (updated) store.textEditor?.rebuildParagraph(updated);
		store.requestRender();
	}
	function toggleBold(node) {
		const range = store.textEditor?.getSelectionRange();
		if (range) {
			const { runs } = toggleBoldInRange(node.styleRuns, range[0], range[1], node.fontWeight, node.text.length);
			applyFormatting(node.id, { styleRuns: runs }, "Toggle bold");
		} else applyFormatting(node.id, { fontWeight: node.fontWeight >= 700 ? 400 : 700 }, "Toggle bold");
	}
	function toggleItalic(node) {
		const range = store.textEditor?.getSelectionRange();
		if (range) {
			const { runs } = toggleItalicInRange(node.styleRuns, range[0], range[1], node.italic, node.text.length);
			applyFormatting(node.id, { styleRuns: runs }, "Toggle italic");
		} else applyFormatting(node.id, { italic: !node.italic }, "Toggle italic");
	}
	function toggleUnderline(node) {
		const range = store.textEditor?.getSelectionRange();
		if (range) {
			const { runs } = toggleDecorationInRange(node.styleRuns, range[0], range[1], "UNDERLINE", node.textDecoration, node.text.length);
			applyFormatting(node.id, { styleRuns: runs }, "Toggle underline");
		} else applyFormatting(node.id, { textDecoration: node.textDecoration === "UNDERLINE" ? "NONE" : "UNDERLINE" }, "Toggle underline");
	}
	return {
		toggleBold,
		toggleItalic,
		toggleUnderline
	};
}
//#endregion
export { createTextFormattingActions };

//# sourceMappingURL=formatting.js.map
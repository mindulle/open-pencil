//#region src/editor/bridges/clipboard.ts
function createClipboardBridge(clipboard, selection) {
	return {
		duplicateSelected: () => clipboard.duplicateSelected(selection.getSelectedNodes()),
		writeCopyData: (data) => clipboard.writeCopyData(data, selection.getSelectedNodes()),
		pasteFromHTML: clipboard.pasteFromHTML,
		deleteSelected: clipboard.deleteSelected,
		storeImage: clipboard.storeImage,
		placeFiles: clipboard.placeFiles,
		placeImageFiles: clipboard.placeImageFiles,
		loadFontsForNodes: clipboard.loadFontsForNodes,
		copySelectionAsText: clipboard.copySelectionAsText,
		copySelectionAsSVG: clipboard.copySelectionAsSVG,
		copySelectionAsJSX: clipboard.copySelectionAsJSX
	};
}
//#endregion
export { createClipboardBridge };

//# sourceMappingURL=clipboard.js.map
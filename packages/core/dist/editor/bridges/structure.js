//#region src/editor/bridges/structure.ts
function createStructureBridge(structure, selection) {
	return {
		wrapInAutoLayout: () => structure.wrapInAutoLayout(selection.getSelectedNodes()),
		groupSelected: () => structure.groupSelected(selection.getSelectedNodes()),
		frameSelection: () => structure.frameSelection(selection.getSelectedNodes()),
		booleanOperationSelected: (operation) => structure.booleanOperationSelected(selection.getSelectedNodes(), operation),
		flattenSelected: () => structure.flattenSelected(selection.getSelectedNodes()),
		outlineTextSelected: () => structure.outlineTextSelected(selection.getSelectedNodes()),
		outlineStrokeSelected: () => structure.outlineStrokeSelected(selection.getSelectedNodes()),
		ungroupSelected: () => structure.ungroupSelected(selection.getSelectedNode())
	};
}
//#endregion
export { createStructureBridge };

//# sourceMappingURL=structure.js.map
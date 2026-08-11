//#region src/editor/bridges/undo.ts
function createUndoBridge(undoActions, selection) {
	return {
		commitMove: undoActions.commitMove,
		commitMoveWithReparent: undoActions.commitMoveWithReparent,
		commitDuplicateMove: undoActions.commitDuplicateMove,
		commitResize: undoActions.commitResize,
		commitGroupResize: undoActions.commitGroupResize,
		commitRotation: undoActions.commitRotation,
		commitNodeUpdate: undoActions.commitNodeUpdate,
		undoAction: () => undoActions.undoAction(selection.validateEnteredContainer),
		redoAction: () => undoActions.redoAction(selection.validateEnteredContainer),
		snapshotPage: undoActions.snapshotPage,
		restorePageFromSnapshot: undoActions.restorePageFromSnapshot,
		pushUndoEntry: undoActions.pushUndoEntry
	};
}
//#endregion
export { createUndoBridge };

//# sourceMappingURL=undo.js.map
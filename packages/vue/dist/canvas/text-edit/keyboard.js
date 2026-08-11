//#region src/canvas/text-edit/navigation.ts
function handleHorizontalArrow(event, editor) {
	const select = event.shiftKey;
	const isMeta = event.metaKey || event.ctrlKey;
	if (event.code === "ArrowLeft") if (isMeta) editor.moveToLineStart(select);
	else if (event.altKey) editor.moveWordLeft(select);
	else editor.moveLeft(select);
	else if (event.code === "ArrowRight") if (isMeta) editor.moveToLineEnd(select);
	else if (event.altKey) editor.moveWordRight(select);
	else editor.moveRight(select);
}
function extendSelectionForDeletion(event, editor) {
	const isMeta = event.metaKey || event.ctrlKey;
	if (event.code === "Delete") {
		if (isMeta) editor.moveToLineEnd(true);
		else if (event.altKey) editor.moveWordRight(true);
	} else if (isMeta) editor.moveToLineStart(true);
	else if (event.altKey) editor.moveWordLeft(true);
}
function handleNavigationKey(event, editor) {
	switch (event.code) {
		case "ArrowLeft":
		case "ArrowRight":
			handleHorizontalArrow(event, editor);
			return true;
		case "ArrowUp":
			editor.moveUp(event.shiftKey);
			return true;
		case "ArrowDown":
			editor.moveDown(event.shiftKey);
			return true;
		case "Home":
			editor.moveToLineStart(event.shiftKey);
			return true;
		case "End":
			editor.moveToLineEnd(event.shiftKey);
			return true;
		default: return false;
	}
}
//#endregion
//#region src/canvas/text-edit/keyboard.ts
function createTextKeyDownHandler(options) {
	const metaKeyActions = {
		KeyA: () => options.store.textEditor?.selectAll(),
		KeyC: () => options.handleCopy(),
		KeyX: (node) => options.handleCut(node),
		KeyV: (node) => void options.handlePaste(node),
		KeyB: (node) => options.toggleBold(node),
		KeyI: (node) => options.toggleItalic(node),
		KeyU: (node) => options.toggleUnderline(node)
	};
	function handleMetaKey(e, node) {
		const action = metaKeyActions[e.code];
		if (!action) return false;
		action(node);
		e.preventDefault();
		return true;
	}
	return function onKeyDown(e) {
		if (options.isComposing()) return;
		const editor = options.store.textEditor;
		const node = options.getEditingNode();
		if (!editor || !node) return;
		const isMeta = e.metaKey || e.ctrlKey;
		let textChanged = false;
		if (e.code === "Escape") {
			options.store.commitTextEdit();
			options.canvasRef.value?.focus();
			e.preventDefault();
			return;
		}
		if (e.code === "Enter") {
			options.insertText("\n", node);
			textChanged = true;
		} else if (e.code === "Backspace" || e.code === "Delete") {
			extendSelectionForDeletion(e, editor);
			options.deleteText(node, e.code === "Delete");
			textChanged = true;
		} else if (!handleNavigationKey(e, editor)) {
			if (!isMeta || !handleMetaKey(e, node)) return;
			return;
		}
		if (!textChanged) options.store.requestRender();
		options.resetBlink();
		e.preventDefault();
	};
}
//#endregion
export { createTextKeyDownHandler };

//# sourceMappingURL=keyboard.js.map
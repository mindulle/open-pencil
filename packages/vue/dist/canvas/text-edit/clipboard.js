//#region src/canvas/text-edit/clipboard.ts
function createTextClipboardActions({ store, insertText, deleteText, resetBlink }) {
	function handleCopy() {
		const editor = store.textEditor;
		if (!editor) return;
		const text = editor.getSelectedText();
		if (text) navigator.clipboard.writeText(text);
	}
	function handleCut(node) {
		const editor = store.textEditor;
		if (!editor || !node) return;
		const text = editor.getSelectedText();
		if (text) {
			navigator.clipboard.writeText(text);
			deleteText(node, false);
			resetBlink();
		}
	}
	async function handlePaste(node) {
		if (!store.textEditor || !node) return;
		try {
			const text = await navigator.clipboard.readText();
			if (text) {
				insertText(text, node);
				resetBlink();
			}
		} catch (error) {
			console.warn("Clipboard access denied:", error);
		}
	}
	return {
		handleCopy,
		handleCut,
		handlePaste
	};
}
//#endregion
export { createTextClipboardActions };

//# sourceMappingURL=clipboard.js.map
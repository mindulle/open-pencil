import { watch } from "vue";
//#region src/canvas/text-edit/textarea.ts
function createHiddenTextArea() {
	const textarea = document.createElement("textarea");
	textarea.setAttribute("aria-hidden", "true");
	textarea.tabIndex = -1;
	textarea.className = "fixed left-0 top-0 h-px w-px opacity-0";
	document.body.appendChild(textarea);
	return textarea;
}
function focusTextAreaOnCanvasPointerDown(textareaRef, store) {
	if (store.state.editingTextId && textareaRef.value) requestAnimationFrame(() => textareaRef.value?.focus());
}
function useTextEditingSession({ store, textareaRef, resetBlink, stopBlink, resetComposition }) {
	watch(() => store.state.editingTextId, (id, _, onCleanup) => {
		if (id) {
			const el = createHiddenTextArea();
			textareaRef.value = el;
			el.focus();
			resetBlink();
			onCleanup(() => {
				stopBlink();
				el.remove();
				textareaRef.value = null;
				resetComposition();
			});
		}
	});
}
//#endregion
export { focusTextAreaOnCanvasPointerDown, useTextEditingSession };

//# sourceMappingURL=textarea.js.map
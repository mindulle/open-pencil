import { createTextClipboardActions } from "./clipboard.js";
import { createCaretBlink, createTextCompositionHandlers, createTextEditActions } from "./editing.js";
import { createTextFormattingActions } from "./formatting.js";
import { createTextKeyDownHandler } from "./keyboard.js";
import { focusTextAreaOnCanvasPointerDown, useTextEditingSession } from "./textarea.js";
import { shallowRef } from "vue";
import { useEventListener } from "@vueuse/core";
//#region src/canvas/text-edit/use.ts
/**
* Bridges DOM text input and the editor's canvas text-editing model.
*
* This composable manages textarea-backed input, IME composition, caret
* blinking, keyboard editing behavior, text formatting shortcuts, and syncing
* text/style-run updates back into the scene graph.
*/
function useTextEdit(canvasRef, store) {
	const textareaRef = shallowRef(null);
	const { resetBlink, stopBlink } = createCaretBlink(store);
	const { getEditingNode, insertText, replaceComposedText, restoreComposition, finishComposition, deleteText } = createTextEditActions(store);
	const { toggleBold, toggleItalic, toggleUnderline } = createTextFormattingActions(store);
	const { handleCopy, handleCut, handlePaste } = createTextClipboardActions({
		store,
		insertText,
		deleteText,
		resetBlink
	});
	const { isComposing, onCompositionStart, onCompositionUpdate, onCompositionEnd, onInput, resetComposition } = createTextCompositionHandlers({
		textareaRef,
		getEditingNode,
		insertText,
		replaceComposedText,
		restoreComposition,
		finishComposition,
		resetBlink
	});
	const onKeyDown = createTextKeyDownHandler({
		store,
		canvasRef,
		getEditingNode,
		isComposing,
		insertText,
		deleteText,
		resetBlink,
		handleCopy,
		handleCut,
		handlePaste,
		toggleBold,
		toggleItalic,
		toggleUnderline
	});
	useEventListener(textareaRef, "input", onInput);
	useEventListener(textareaRef, "compositionstart", onCompositionStart);
	useEventListener(textareaRef, "compositionupdate", onCompositionUpdate);
	useEventListener(textareaRef, "compositionend", onCompositionEnd);
	useEventListener(textareaRef, "keydown", onKeyDown);
	useEventListener(canvasRef, "mousedown", () => focusTextAreaOnCanvasPointerDown(textareaRef, store));
	useTextEditingSession({
		store,
		textareaRef,
		resetBlink,
		stopBlink,
		resetComposition
	});
}
//#endregion
export { useTextEdit };

//# sourceMappingURL=use.js.map
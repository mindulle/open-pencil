import { useIntervalFn } from "@vueuse/core";
import { adjustRunsForDelete, adjustRunsForInsert } from "@open-pencil/core/text";
//#region src/canvas/text-edit/editing.ts
const CARET_BLINK_MS = 530;
function createCaretBlink(store) {
	const { pause, resume } = useIntervalFn(() => {
		if (!store.textEditor) return;
		store.textEditor.caretVisible = !store.textEditor.caretVisible;
		store.requestRepaint();
	}, CARET_BLINK_MS, { immediate: false });
	function resetBlink() {
		if (store.textEditor) store.textEditor.caretVisible = true;
		pause();
		resume();
		store.requestRepaint();
	}
	return {
		resetBlink,
		stopBlink: pause
	};
}
function createTextCompositionHandlers({ textareaRef, getEditingNode, insertText, replaceComposedText, restoreComposition, finishComposition, resetBlink }) {
	let isComposing = false;
	let skipCommittedInput = null;
	function onCompositionStart() {
		isComposing = true;
		skipCommittedInput = null;
	}
	function updateComposition(text) {
		const node = getEditingNode();
		if (!node) return;
		replaceComposedText(text, node);
		resetBlink();
	}
	function onCompositionUpdate(e) {
		if (!isComposing) return;
		updateComposition(e.data);
	}
	function onCompositionEnd(e) {
		const finalText = textareaRef.value?.value || e.data || "";
		isComposing = false;
		const node = getEditingNode();
		if (!node) {
			finishComposition();
			return;
		}
		if (finalText) {
			replaceComposedText(finalText, node);
			finishComposition();
			skipCommittedInput = {
				text: finalText,
				until: Date.now() + 250
			};
		} else {
			restoreComposition(node);
			finishComposition();
		}
		if (textareaRef.value) textareaRef.value.value = "";
		resetBlink();
	}
	function onInput() {
		const el = textareaRef.value;
		if (!el) return;
		if (isComposing) {
			updateComposition(el.value);
			return;
		}
		const text = el.value;
		if (!text) return;
		if (skipCommittedInput && text === skipCommittedInput.text && Date.now() <= skipCommittedInput.until) {
			el.value = "";
			skipCommittedInput = null;
			return;
		}
		skipCommittedInput = null;
		el.value = "";
		const node = getEditingNode();
		if (!node) return;
		insertText(text, node);
		resetBlink();
	}
	function resetComposition() {
		isComposing = false;
		skipCommittedInput = null;
		finishComposition();
	}
	return {
		isComposing: () => isComposing,
		onCompositionStart,
		onCompositionUpdate,
		onCompositionEnd,
		onInput,
		resetComposition
	};
}
function createTextEditActions(store) {
	function getEditingNode() {
		const id = store.state.editingTextId;
		if (!id) return null;
		return store.graph.getNode(id) ?? null;
	}
	function syncText(nodeId, text, runs) {
		const changes = { text };
		if (runs !== void 0) changes.styleRuns = runs;
		store.graph.updateNode(nodeId, changes);
		const updated = store.graph.getNode(nodeId);
		if (updated) store.textEditor?.rebuildParagraph(updated);
		store.requestRender();
	}
	function insertText(text, node) {
		const editor = store.textEditor;
		if (!editor) return;
		const range = editor.getSelectionRange();
		let runs = node.styleRuns;
		if (range) {
			runs = adjustRunsForDelete(runs, range[0], range[1] - range[0]);
			runs = adjustRunsForInsert(runs, range[0], text.length);
		} else runs = adjustRunsForInsert(runs, editor.state?.cursor ?? 0, text.length);
		editor.insert(text, node);
		syncText(node.id, editor.state?.text ?? "", runs);
	}
	let compositionDraft = null;
	function ensureCompositionDraft(node) {
		const editor = store.textEditor;
		const state = editor?.state;
		if (!editor || !state) return null;
		if (compositionDraft) return compositionDraft;
		const range = editor.getSelectionRange();
		const start = range?.[0] ?? state.cursor;
		const end = range?.[1] ?? state.cursor;
		compositionDraft = {
			baseText: state.text,
			baseRuns: node.styleRuns,
			cursor: state.cursor,
			end,
			selectionAnchor: state.selectionAnchor,
			start
		};
		return compositionDraft;
	}
	function replaceComposedText(text, node) {
		const editor = store.textEditor;
		const state = editor?.state;
		const draft = ensureCompositionDraft(node);
		if (!editor || !state || !draft) return;
		state.text = draft.baseText.slice(0, draft.start) + text + draft.baseText.slice(draft.end);
		state.cursor = draft.start + text.length;
		state.selectionAnchor = null;
		let runs = adjustRunsForDelete(draft.baseRuns, draft.start, draft.end - draft.start);
		runs = adjustRunsForInsert(runs, draft.start, text.length);
		syncText(node.id, state.text, runs);
	}
	function restoreComposition(node) {
		const state = store.textEditor?.state;
		if (!state || !compositionDraft) return;
		state.text = compositionDraft.baseText;
		state.cursor = compositionDraft.cursor;
		state.selectionAnchor = compositionDraft.selectionAnchor;
		syncText(node.id, compositionDraft.baseText, compositionDraft.baseRuns);
		compositionDraft = null;
	}
	function finishComposition() {
		compositionDraft = null;
	}
	function deleteText(node, forward) {
		const editor = store.textEditor;
		if (!editor) return;
		const range = editor.getSelectionRange();
		let runs = node.styleRuns;
		if (range) runs = adjustRunsForDelete(runs, range[0], range[1] - range[0]);
		else if (forward && editor.state && editor.state.cursor < node.text.length) runs = adjustRunsForDelete(runs, editor.state.cursor, 1);
		else if (!forward && editor.state && editor.state.cursor > 0) runs = adjustRunsForDelete(runs, editor.state.cursor - 1, 1);
		if (forward) editor.delete(node);
		else editor.backspace(node);
		syncText(node.id, editor.state?.text ?? "", runs);
	}
	return {
		getEditingNode,
		insertText,
		replaceComposedText,
		restoreComposition,
		finishComposition,
		deleteText
	};
}
//#endregion
export { createCaretBlink, createTextCompositionHandlers, createTextEditActions };

//# sourceMappingURL=editing.js.map
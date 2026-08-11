import { nextTick, ref } from "vue";
import { onClickOutside } from "@vueuse/core";
//#region src/shared/dom-events.ts
function inputValue(e) {
	return e.target instanceof HTMLInputElement ? e.target.value : "";
}
function inputNumberValue(e) {
	return +inputValue(e);
}
function blurTarget(e) {
	if (e.target instanceof HTMLElement) e.target.blur();
}
function selectTarget(e) {
	if (e.target instanceof HTMLInputElement) e.target.select();
}
//#endregion
//#region src/editor/inline-rename/use.ts
function useInlineRename(onCommit) {
	const editingId = ref(null);
	const inputRef = ref(null);
	let originalName = "";
	let cleanupOutsideClick;
	function start(id, currentName) {
		editingId.value = id;
		originalName = currentName;
	}
	async function focusInput(input) {
		if (input === inputRef.value) return;
		inputRef.value = input;
		cleanupOutsideClick?.();
		if (input) cleanupOutsideClick = onClickOutside(inputRef, () => input.blur());
		await nextTick();
		input?.focus();
		input?.select();
	}
	function commit(id, eventOrInput) {
		if (editingId.value !== id) return;
		let input;
		if (eventOrInput instanceof HTMLInputElement) input = eventOrInput;
		else input = eventOrInput.target instanceof HTMLInputElement ? eventOrInput.target : null;
		if (!input) return;
		const value = input.value.trim();
		if (value && value !== originalName) onCommit(id, value);
		editingId.value = null;
		inputRef.value = null;
		cleanupOutsideClick?.();
		cleanupOutsideClick = void 0;
	}
	function cancel() {
		editingId.value = null;
		inputRef.value = null;
		cleanupOutsideClick?.();
		cleanupOutsideClick = void 0;
	}
	function onKeydown(e) {
		if (e.code === "Enter") {
			blurTarget(e);
			return;
		}
		if (e.code === "Escape") cancel();
	}
	return {
		editingId,
		start,
		focusInput,
		commit,
		cancel,
		onKeydown
	};
}
//#endregion
export { blurTarget, inputNumberValue, inputValue, selectTarget, useInlineRename };

//# sourceMappingURL=use.js.map
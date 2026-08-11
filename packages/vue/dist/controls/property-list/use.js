import { useEditor } from "../../canvas/CanvasRoot.js";
import { useNodeProps, useSceneComputed } from "../appearance/helpers.js";
import { computed } from "vue";
import { tryOnScopeDispose, useTimeoutFn } from "@vueuse/core";
//#region src/controls/undo-batch/use.ts
const BATCH_IDLE_MS = 300;
function useUndoBatch(undo) {
	let batchKey = null;
	function commitActiveBatch() {
		if (batchKey !== null) {
			undo.commitBatch();
			batchKey = null;
		}
	}
	const { start: scheduleFlush, stop: cancelFlush } = useTimeoutFn(commitActiveBatch, BATCH_IDLE_MS, { immediate: false });
	function flush() {
		cancelFlush();
		commitActiveBatch();
	}
	function ensure(key, label) {
		if (batchKey === null && undo.isBatching) return;
		if (batchKey !== key) {
			flush();
			undo.beginBatch(label);
			batchKey = key;
		}
		scheduleFlush();
	}
	tryOnScopeDispose(flush);
	return {
		ensure,
		flush
	};
}
//#endregion
//#region src/controls/property-list/use.ts
function moveItem(items, fromIndex, toIndex) {
	if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= items.length) return items;
	const next = [...items];
	const moved = next.splice(fromIndex, 1)[0];
	if (moved === void 0) return items;
	next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, moved);
	return next;
}
function useEditorPropertyList(propKey) {
	const editor = useEditor();
	const { isArrayMixed } = useNodeProps();
	const batch = useUndoBatch(editor.undo);
	const selectedNodes = useSceneComputed(() => {
		editor.state.sceneVersion;
		return editor.getSelectedNodes();
	});
	const activeNode = useSceneComputed(() => {
		editor.state.sceneVersion;
		return selectedNodes.value[0] ?? null;
	});
	const selectedNodeIds = computed(() => selectedNodes.value.map((node) => node.id));
	const isMulti = computed(() => selectedNodes.value.length > 1);
	const active = computed(() => selectedNodes.value.length > 0);
	const isMixed = computed(() => isArrayMixed(propKey));
	const items = useSceneComputed(() => {
		editor.state.sceneVersion;
		if (isMixed.value) return [];
		return activeNode.value?.[propKey] ?? [];
	});
	function targetNodes() {
		if (isMulti.value) return selectedNodes.value;
		return activeNode.value ? [activeNode.value] : [];
	}
	function propArray(node) {
		return node[propKey];
	}
	function updateArray(node, value, label) {
		editor.updateNodeWithUndo(node.id, { [propKey]: value }, label);
	}
	function add(item) {
		batch.flush();
		const nodes = targetNodes();
		const label = isMulti.value ? `Set ${propKey}` : `Add ${propKey}`;
		const apply = () => {
			for (const node of nodes) {
				const nextItem = structuredClone(item);
				updateArray(node, isMulti.value ? [nextItem] : [...propArray(node), nextItem], label);
			}
		};
		if (nodes.length > 1) editor.undo.runBatch(label, apply);
		else apply();
	}
	function remove(index) {
		batch.flush();
		const nodes = targetNodes();
		const label = `Remove ${propKey}`;
		const apply = () => {
			for (const node of nodes) updateArray(node, propArray(node).filter((_, itemIndex) => itemIndex !== index), label);
		};
		if (nodes.length > 1) editor.undo.runBatch(label, apply);
		else apply();
	}
	function update(index, item) {
		const nodes = targetNodes();
		if (nodes.length === 0) return;
		batch.ensure(`update:${propKey}:${index}:${nodes.map((node) => node.id).join(",")}`, `Change ${propKey}`);
		for (const node of nodes) {
			const next = [...propArray(node)];
			next[index] = structuredClone(item);
			updateArray(node, next, `Change ${propKey}`);
		}
	}
	function patch(index, changes) {
		const nodes = targetNodes();
		if (nodes.length === 0) return;
		batch.ensure(`patch:${propKey}:${index}:${nodes.map((node) => node.id).join(",")}`, `Change ${propKey}`);
		for (const node of nodes) {
			const current = propArray(node)[index];
			if (!current) continue;
			const next = [...propArray(node)];
			next[index] = {
				...current,
				...structuredClone(changes)
			};
			updateArray(node, next, `Change ${propKey}`);
		}
	}
	function toggleVisibility(index) {
		batch.flush();
		const nodes = targetNodes();
		if (nodes.length === 0) return;
		const apply = () => {
			for (const node of nodes) {
				const liveNode = editor.getNode(node.id);
				if (!liveNode) continue;
				const current = propArray(liveNode)[index];
				if (!current) continue;
				const next = [...propArray(liveNode)];
				next[index] = {
					...current,
					visible: !current.visible
				};
				updateArray(liveNode, next, `Toggle ${propKey} visibility`);
			}
		};
		if (nodes.length > 1) editor.undo.runBatch(`Toggle ${propKey} visibility`, apply);
		else apply();
	}
	function reorder(fromIndex, toIndex) {
		batch.flush();
		const nodes = targetNodes();
		if (nodes.length === 0 || fromIndex === toIndex) return;
		const apply = () => {
			for (const node of nodes) updateArray(node, moveItem(propArray(node), fromIndex, toIndex), `Reorder ${propKey}`);
		};
		if (nodes.length > 1) editor.undo.runBatch(`Reorder ${propKey}`, apply);
		else apply();
	}
	const actions = {
		add,
		remove,
		update,
		patch,
		toggleVisibility,
		reorder
	};
	return {
		items,
		isMixed,
		isMulti,
		active,
		activeNode,
		selectedNodeIds,
		flush: batch.flush,
		actions
	};
}
//#endregion
export { useEditorPropertyList };

//# sourceMappingURL=use.js.map
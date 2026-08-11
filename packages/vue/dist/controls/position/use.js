import { useEditor } from "../../canvas/CanvasRoot.js";
import { useSceneComputed } from "../appearance/helpers.js";
import { computed } from "vue";
//#region src/controls/prop-scrub/use.ts
function usePropScrub(editor) {
	const previousValues = /* @__PURE__ */ new Map();
	function storePreviousValues(nodes, key) {
		for (const n of nodes) {
			let rec = previousValues.get(n.id);
			if (!rec) {
				rec = {};
				previousValues.set(n.id, rec);
			}
			if (!(key in rec)) rec[key] = n[key];
		}
	}
	function updateProp(nodes, key, value) {
		if (nodes.length > 1) storePreviousValues(nodes, key);
		for (const n of nodes) editor.updateNode(n.id, { [key]: value });
	}
	function commitProp(nodes, key, _value, previous) {
		if (nodes.length > 1) {
			for (const n of nodes) {
				const prev = previousValues.get(n.id)?.[key] ?? previous;
				editor.commitNodeUpdate(n.id, { [key]: prev }, `Change ${key}`);
			}
			previousValues.clear();
		} else {
			const n = nodes[0];
			editor.commitNodeUpdate(n.id, { [key]: previous }, `Change ${key}`);
		}
	}
	return {
		updateProp,
		commitProp
	};
}
//#endregion
//#region src/controls/position/use.ts
/**
* Returns position-related state and actions for the current selection.
*
* This composable is designed for property panels that edit x/y, size,
* rotation, alignment, flipping, and multi-node transforms.
*/
function usePosition() {
	const editor = useEditor();
	const nodes = useSceneComputed(() => editor.getSelectedNodes());
	const node = useSceneComputed(() => editor.getSelectedNode() ?? null);
	const active = computed(() => nodes.value.length > 0);
	const isMulti = computed(() => nodes.value.length > 1);
	const ids = computed(() => nodes.value.map((n) => n.id));
	const x = computed(() => Math.round(node.value?.x ?? 0));
	const y = computed(() => Math.round(node.value?.y ?? 0));
	const width = computed(() => node.value?.width ?? 0);
	const height = computed(() => node.value?.height ?? 0);
	const rotation = computed(() => Math.round(node.value?.rotation ?? 0));
	const { updateProp: _updateProp, commitProp: _commitProp } = usePropScrub(editor);
	function updateProp(key, value) {
		_updateProp(nodes.value, key, value);
	}
	function commitProp(key, value, previous) {
		_commitProp(nodes.value, key, value, previous);
	}
	function align(axis, pos) {
		editor.alignNodes(ids.value, axis, pos);
	}
	function flip(axis) {
		editor.flipNodes(ids.value, axis);
	}
	function rotate(degrees) {
		editor.rotateNodes(ids.value, degrees);
	}
	return {
		editor,
		nodes,
		node,
		active,
		isMulti,
		ids,
		x,
		y,
		width,
		height,
		rotation,
		updateProp,
		commitProp,
		align,
		flip,
		rotate
	};
}
//#endregion
export { usePosition, usePropScrub };

//# sourceMappingURL=use.js.map
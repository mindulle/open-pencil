import { useEditor } from "../../canvas/CanvasRoot.js";
import { useSceneComputed } from "../appearance/helpers.js";
import { computed } from "vue";
//#region src/editor/selection-state/use.ts
/**
* Returns reactive selection-derived state for the current editor.
*
* Use this composable to drive UI from the current selection without manually
* reading graph state in every component.
*/
function useSelectionState() {
	const editor = useEditor();
	const selectedIds = useSceneComputed(() => editor.state.selectedIds);
	const hasSelection = computed(() => selectedIds.value.size > 0);
	const selectedNode = useSceneComputed(() => editor.getSelectedNode() ?? null);
	const selectedCount = computed(() => selectedIds.value.size);
	const selectedNodeType = computed(() => selectedNode.value?.type ?? null);
	return {
		editor,
		selectedIds,
		hasSelection,
		selectedNode,
		selectedCount,
		selectedNodeType,
		isInstance: computed(() => selectedNodeType.value === "INSTANCE"),
		isComponent: computed(() => selectedNodeType.value === "COMPONENT"),
		isGroup: computed(() => selectedNodeType.value === "GROUP"),
		canCreateComponentSet: useSceneComputed(() => {
			if (selectedIds.value.size < 2) return false;
			for (const id of selectedIds.value) if (editor.graph.getNode(id)?.type !== "COMPONENT") return false;
			return true;
		})
	};
}
//#endregion
//#region src/controls/mask/use.ts
/** Headless state and actions for the selected mask node. */
function useMask() {
	const editor = useEditor();
	const { selectedNode } = useSelectionState();
	const active = computed(() => selectedNode.value?.isMask === true);
	const maskType = computed(() => selectedNode.value?.maskType ?? "ALPHA");
	function setMaskType(value) {
		const node = selectedNode.value;
		if (!node?.isMask || node.maskType === value) return;
		editor.updateNodeWithUndo(node.id, { maskType: value }, "Change mask type");
	}
	return {
		active,
		maskType,
		setMaskType
	};
}
//#endregion
export { useMask, useSelectionState };

//# sourceMappingURL=use.js.map
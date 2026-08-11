import { useEditor } from "../../canvas/CanvasRoot.js";
import { commandMessages } from "../../canvas/tool-input/use.js";
import { useSceneComputed } from "../../controls/appearance/helpers.js";
import { useSelectionState } from "../../controls/mask/use.js";
import { createEditorCommandActions } from "./actions.js";
import { createEditorCommandMap } from "./definitions.js";
import { computed } from "vue";
import { canMakeBooleanSourceNode, hasVisibleStrokeSourceNode } from "@open-pencil/core/canvas";
import { useStore } from "@nanostores/vue";
//#region src/editor/selection-capabilities/use.ts
/**
* Returns reactive booleans describing which selection-dependent actions are
* currently available.
*
* This is useful for menus, toolbars, shortcuts, and action buttons that need
* command-friendly capability checks.
*/
function useSelectionCapabilities() {
	const selection = useSelectionState();
	const { editor, selectedIds, selectedNode, selectedCount, hasSelection } = selection;
	const selectedNodesCanFlatten = useSceneComputed(() => {
		const nodes = editor.getSelectedNodes();
		return nodes.length > 0 && nodes.every((node) => canMakeBooleanSourceNode(node, editor.graph));
	});
	return {
		selectedIds,
		selectedNode,
		canCopy: computed(() => hasSelection.value),
		canCut: computed(() => hasSelection.value),
		canPaste: computed(() => true),
		canDelete: computed(() => hasSelection.value),
		canDuplicate: computed(() => hasSelection.value),
		canExportSelection: computed(() => hasSelection.value),
		canGroup: computed(() => selectedCount.value >= 2),
		canFrameSelection: computed(() => hasSelection.value),
		canUngroup: computed(() => selection.isGroup.value),
		canCreateComponent: computed(() => hasSelection.value),
		canCreateComponentSet: selection.canCreateComponentSet,
		canDetachInstance: computed(() => selection.isInstance.value),
		canWrapInAutoLayout: computed(() => hasSelection.value),
		canToggleMask: computed(() => hasSelection.value),
		canBringToFront: computed(() => hasSelection.value),
		canSendToBack: computed(() => hasSelection.value),
		canToggleVisibility: computed(() => hasSelection.value),
		canToggleLock: computed(() => hasSelection.value),
		canFlip: computed(() => hasSelection.value),
		canDistribute: useSceneComputed(() => editor.canDistributeNodes([...editor.state.selectedIds])),
		canBooleanOperation: computed(() => selectedCount.value >= 2 && selectedNodesCanFlatten.value),
		canFlatten: computed(() => selectedNodesCanFlatten.value),
		canOutlineText: useSceneComputed(() => {
			const nodes = editor.getSelectedNodes();
			return nodes.length > 0 && nodes.every((node) => node.type === "TEXT" && canMakeBooleanSourceNode(node, editor.graph));
		}),
		canOutlineStroke: useSceneComputed(() => {
			const nodes = editor.getSelectedNodes();
			return nodes.length > 0 && nodes.every((node) => hasVisibleStrokeSourceNode(node, editor.graph) && canMakeBooleanSourceNode(node, editor.graph));
		}),
		canGoToMainComponent: computed(() => selection.isInstance.value),
		canCreateInstance: computed(() => selectedNode.value?.type === "COMPONENT"),
		canMoveToPage: useSceneComputed(() => hasSelection.value && editor.graph.getPages().length > 1),
		canSetOpacity: computed(() => hasSelection.value),
		canSelectAll: useSceneComputed(() => editor.graph.getChildren(editor.state.currentPageId).length > 0),
		canUndo: useSceneComputed(() => editor.state.nodeEditState != null || editor.undo.canUndo),
		canRedo: useSceneComputed(() => editor.state.nodeEditState != null || editor.undo.canRedo),
		canZoomToSelection: computed(() => hasSelection.value)
	};
}
//#endregion
//#region src/primitives/PageList/usePageList.ts
/**
* Returns reactive page state and page-management actions.
*
* Use this composable to build page switchers, page lists, or navigation
* panels without manually reading the graph in each component.
*/
function usePageList() {
	const editor = useEditor();
	return {
		editor,
		pages: useSceneComputed(() => editor.graph.getPages()),
		currentPageId: computed(() => editor.state.currentPageId),
		switchPage: editor.switchPage,
		addPage: editor.addPage,
		deletePage: editor.deletePage,
		movePage: editor.movePage,
		renamePage: editor.renamePage
	};
}
//#endregion
//#region src/editor/commands/use.ts
/**
* Builds a command-oriented interface on top of the current editor.
*
* Use this composable when building menus, toolbars, keyboard handlers, or
* any other UI that should talk in terms of commands instead of raw editor
* method calls.
*/
function useEditorCommands() {
	const editor = useEditor();
	const selection = useSelectionState();
	const capabilities = useSelectionCapabilities();
	const { pages } = usePageList();
	const t = useStore(commandMessages);
	const otherPages = computed(() => pages.value.filter((page) => page.id !== editor.state.currentPageId));
	function moveSelectionToPage(pageId) {
		if (!capabilities.canMoveToPage.value) return;
		editor.moveToPage(pageId);
	}
	let opacityTarget = { value: 1 };
	function setOpacityTarget(value, coalesceKey) {
		opacityTarget = coalesceKey ? {
			value,
			coalesceKey
		} : { value };
	}
	const commands = createEditorCommandMap({
		editor,
		selection,
		capabilities,
		messages: t,
		otherPages,
		moveSelectionToPage,
		getOpacityTarget: () => opacityTarget
	});
	return {
		commands,
		otherPages,
		moveSelectionToPage,
		setOpacityTarget,
		...createEditorCommandActions(commands)
	};
}
//#endregion
export { useEditorCommands, usePageList, useSelectionCapabilities };

//# sourceMappingURL=use.js.map
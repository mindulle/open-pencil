import { useEditor } from "../../canvas/CanvasRoot.js";
import { menuMessages } from "../../canvas/tool-input/use.js";
import { useSelectionState } from "../../controls/mask/use.js";
import { useEditorCommands } from "../commands/use.js";
import { buildEditMenu, buildObjectMenu, buildViewMenu } from "./builders.js";
import { buildCanvasContextMenu } from "./canvas.js";
import { computed } from "vue";
import { useStore } from "@nanostores/vue";
//#region src/editor/menu-model/use.ts
/**
* Returns ready-to-render menu models derived from the current editor state.
*
* This is a higher-level API than {@link useEditorCommands}: it groups
* commands into app and canvas menu structures and computes context-sensitive
* labels like Hide/Show and Lock/Unlock.
*/
function useMenuModel() {
	const editor = useEditor();
	const { menuItem: commandMenuItem, otherPages, moveSelectionToPage } = useEditorCommands();
	const selection = useSelectionState();
	const t = useStore(menuMessages);
	const editMenu = computed(() => buildEditMenu(commandMenuItem));
	const viewMenu = computed(() => buildViewMenu(commandMenuItem));
	const objectMenu = computed(() => buildObjectMenu(commandMenuItem));
	const arrangeMenu = computed(() => [commandMenuItem("selection.wrapInAutoLayout")]);
	return {
		appMenu: computed(() => [
			{
				label: t.value.edit,
				items: editMenu.value
			},
			{
				label: t.value.view,
				items: viewMenu.value
			},
			{
				label: t.value.object,
				items: objectMenu.value
			},
			{
				label: t.value.arrange,
				items: arrangeMenu.value
			}
		]),
		canvasMenu: computed(() => buildCanvasContextMenu({
			commandMenuItem,
			otherPages: otherPages.value,
			moveSelectionToPage,
			selection,
			t: t.value
		})),
		selectionLabelMenu: computed(() => ({
			visibility: editor.getSelectedNode()?.visible ?? true ? t.value.hide : t.value.show,
			lock: editor.getSelectedNode()?.locked ?? false ? t.value.unlock : t.value.lock
		}))
	};
}
//#endregion
export { useMenuModel };

//# sourceMappingURL=use.js.map
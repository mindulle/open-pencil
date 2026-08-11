import { useEditor } from "../../canvas/CanvasRoot.js";
import { createAppearanceActions, createAppearanceState, useNodeProps } from "./helpers.js";
//#region src/controls/appearance/use.ts
/**
* Returns appearance-related state and actions for the current selection.
*
* Use this composable for visibility, opacity, and corner-radius controls in
* property panels.
*/
function useAppearance() {
	const editor = useEditor();
	const { nodes, node, active, isMulti, merged, updateProp, commitProp } = useNodeProps();
	const appearanceState = createAppearanceState({
		node,
		nodes,
		isMulti,
		merged
	});
	const appearanceActions = createAppearanceActions({
		editor,
		node,
		nodes,
		isMulti,
		merged
	});
	return {
		editor,
		nodes,
		node,
		active,
		isMulti,
		...appearanceState,
		updateProp,
		commitProp,
		...appearanceActions
	};
}
//#endregion
export { useAppearance };

//# sourceMappingURL=use.js.map
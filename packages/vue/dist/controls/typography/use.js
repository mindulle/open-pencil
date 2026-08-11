import { useEditor } from "../../canvas/CanvasRoot.js";
import { TYPOGRAPHY_WEIGHTS, createTypographyActions, createTypographyState } from "./actions.js";
//#region src/controls/typography/use.ts
/**
* Returns typography-related state and actions for the current text selection.
*
* This composable is designed for text property panels and formatting controls.
*/
function useTypography(options = {}) {
	const editor = useEditor();
	const typographyState = createTypographyState(editor);
	const actions = createTypographyActions({
		editor,
		...typographyState,
		options
	});
	return {
		editor,
		...typographyState,
		weights: TYPOGRAPHY_WEIGHTS,
		...actions
	};
}
//#endregion
export { useTypography };

//# sourceMappingURL=use.js.map
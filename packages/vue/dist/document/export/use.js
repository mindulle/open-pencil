import { useEditor } from "../../canvas/CanvasRoot.js";
import { useSceneComputed } from "../../controls/appearance/helpers.js";
import { EXPORT_FORMATS, EXPORT_SCALES, MAX_EXPORT_SCALE, MIN_EXPORT_SCALE, clampExportScale, createExportSettingActions, createExportTargetState, formatSupportsScale } from "./helpers.js";
//#region src/document/export/use.ts
function useExport() {
	const editor = useEditor();
	const selectedIds = useSceneComputed(() => [...editor.state.selectedIds]);
	const targetState = createExportTargetState(editor, selectedIds);
	const settingActions = createExportSettingActions(editor, targetState.targetIds);
	return {
		editor,
		selectedIds,
		scales: EXPORT_SCALES,
		maxScale: MAX_EXPORT_SCALE,
		minScale: MIN_EXPORT_SCALE,
		clampExportScale,
		formats: EXPORT_FORMATS,
		formatSupportsScale,
		...targetState,
		...settingActions
	};
}
//#endregion
export { useExport };

//# sourceMappingURL=use.js.map
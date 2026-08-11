import { useEditor } from "../../canvas/CanvasRoot.js";
import { useI18n } from "../../canvas/tool-input/use.js";
import { createGridTrackActions, createLayoutActions, createLayoutSelectionState, createPaddingActions, createTrackSizingOptions, trackLabel } from "./helpers.js";
//#region src/controls/layout/use.ts
/**
* Returns layout-related state and actions for the current selection.
*
* Use this composable to build auto-layout and grid panels that need sizing,
* padding, alignment, and track editing behavior.
*/
function useLayout() {
	const editor = useEditor();
	const { panels } = useI18n();
	const { node, layoutDirection, gapAuto, alignGrid, isInAutoLayout, isGrid, isFlex, widthSizing, heightSizing, widthSizingOptions, heightSizingOptions } = createLayoutSelectionState(editor, panels);
	const { showIndividualPadding, hasUniformPadding, hasSymmetricPadding, setHorizontalPadding, commitHorizontalPadding, setVerticalPadding, commitVerticalPadding, toggleIndividualPadding } = createPaddingActions(editor, node);
	const layoutActions = createLayoutActions({
		editor,
		node,
		isInAutoLayout
	});
	const { updateGridTrack, addTrack, removeTrack } = createGridTrackActions(editor, node);
	return {
		editor,
		node,
		layoutDirection,
		gapAuto,
		isInAutoLayout,
		isGrid,
		isFlex,
		widthSizing,
		heightSizing,
		widthSizingOptions,
		heightSizingOptions,
		alignGrid,
		showIndividualPadding,
		hasUniformPadding,
		hasSymmetricPadding,
		trackSizingOptions: createTrackSizingOptions(panels.value),
		updateProp: layoutActions.updateProp,
		updateSizeLimit: layoutActions.updateSizeLimit,
		setSizeLimitToCurrent: layoutActions.setSizeLimitToCurrent,
		commitSizeLimit: layoutActions.commitSizeLimit,
		addSizeLimit: layoutActions.addSizeLimit,
		removeSizeLimit: layoutActions.removeSizeLimit,
		commitProp: layoutActions.commitProp,
		setAxisSizing: layoutActions.setAxisSizing,
		updateAxisSize: layoutActions.updateAxisSize,
		commitAxisSize: layoutActions.commitAxisSize,
		setHorizontalPadding,
		commitHorizontalPadding,
		setVerticalPadding,
		commitVerticalPadding,
		setAlignment: layoutActions.setAlignment,
		setGapAuto: layoutActions.setGapAuto,
		setLayoutDirection: layoutActions.setLayoutDirection,
		updateGridTrack,
		addTrack,
		removeTrack,
		trackLabel,
		toggleIndividualPadding
	};
}
//#endregion
export { useLayout };

//# sourceMappingURL=use.js.map
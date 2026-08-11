import { useEditor } from "../../canvas/CanvasRoot.js";
import { useI18n } from "../../canvas/tool-input/use.js";
import { useNodeProps } from "../appearance/helpers.js";
import { BORDER_SIDES, DEFAULT_STROKE, SIDE_OPTIONS, borderWeight, createStrokeGeometryActions, createStrokeGeometryState, createStrokeSideActions, currentAlign, currentSides, dashState, setDash, setGap, toggleDash, updateAlign } from "./helpers.js";
import { ref } from "vue";
//#region src/controls/stroke/use.ts
/**
* Returns stroke-related helpers for property panels.
*
* This composable provides alignment and side helpers plus mixed-selection
* state and undo-aware actions for caps, joins, and miter limits.
*/
function useStrokeControls() {
	const store = useEditor();
	const { nodes, merged } = useNodeProps();
	const { panels } = useI18n();
	const sideMenuOpen = ref(false);
	const alignOptions = [
		{
			value: "INSIDE",
			label: panels.value.strokeAlignInside
		},
		{
			value: "CENTER",
			label: panels.value.strokeAlignCenter
		},
		{
			value: "OUTSIDE",
			label: panels.value.strokeAlignOutside
		}
	];
	const capOptions = [
		{
			value: "NONE",
			label: panels.value.strokeCapButt
		},
		{
			value: "ROUND",
			label: panels.value.strokeCapRound
		},
		{
			value: "SQUARE",
			label: panels.value.strokeCapSquare
		}
	];
	const joinOptions = [
		{
			value: "MITER",
			label: panels.value.strokeJoinMiter
		},
		{
			value: "BEVEL",
			label: panels.value.strokeJoinBevel
		},
		{
			value: "ROUND",
			label: panels.value.strokeJoinRound
		}
	];
	const geometryState = createStrokeGeometryState({
		nodes,
		merged
	});
	const geometryActions = createStrokeGeometryActions(store, nodes);
	const { selectSide, updateBorderWeight } = createStrokeSideActions(store, sideMenuOpen);
	return {
		alignOptions,
		capOptions,
		joinOptions,
		...geometryState,
		...geometryActions,
		sideOptions: SIDE_OPTIONS,
		borderSides: BORDER_SIDES,
		sideMenuOpen,
		defaultStroke: DEFAULT_STROKE,
		updateAlign: updateAlign.bind(null, store),
		currentAlign,
		currentSides,
		dashState,
		toggleDash,
		setDash,
		setGap,
		borderWeight,
		selectSide,
		updateBorderWeight
	};
}
//#endregion
export { useStrokeControls };

//# sourceMappingURL=use.js.map
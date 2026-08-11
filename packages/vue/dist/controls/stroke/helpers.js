import { computed } from "vue";
import { BLACK } from "@open-pencil/core/constants";
//#region src/controls/stroke/helpers.ts
const SIDE_OPTIONS = [
	{
		value: "ALL",
		label: "All"
	},
	{
		value: "TOP",
		label: "Top"
	},
	{
		value: "BOTTOM",
		label: "Bottom"
	},
	{
		value: "LEFT",
		label: "Left"
	},
	{
		value: "RIGHT",
		label: "Right"
	},
	{
		value: "CUSTOM",
		label: "Custom"
	}
];
const BORDER_SIDES = [
	"top",
	"right",
	"bottom",
	"left"
];
const DEFAULT_STROKE = {
	color: BLACK,
	weight: 1,
	opacity: 1,
	visible: true,
	align: "CENTER"
};
function createStrokeGeometryState({ nodes, merged }) {
	return {
		advancedActive: computed(() => nodes.value.length > 0 && nodes.value.every((node) => node.strokes.length > 0)),
		cap: computed(() => merged("strokeCap")),
		join: computed(() => merged("strokeJoin")),
		miterLimit: computed(() => merged("strokeMiterLimit"))
	};
}
function createStrokeGeometryActions(editor, nodes) {
	const originalMiterLimits = /* @__PURE__ */ new Map();
	function runForSelection(label, action) {
		const selected = nodes.value;
		const run = () => selected.forEach(action);
		if (selected.length > 1) editor.undo.runBatch(label, run);
		else run();
	}
	function setCap(value) {
		runForSelection("Change stroke cap", (node) => {
			editor.updateNodeWithUndo(node.id, {
				strokeCap: value,
				strokes: node.strokes.map((stroke) => ({
					...stroke,
					cap: value
				}))
			}, "Change stroke cap");
		});
	}
	function setJoin(value) {
		runForSelection("Change stroke join", (node) => {
			editor.updateNodeWithUndo(node.id, {
				strokeJoin: value,
				strokes: node.strokes.map((stroke) => ({
					...stroke,
					join: value
				}))
			}, "Change stroke join");
		});
	}
	function updateMiterLimit(value) {
		for (const node of nodes.value) {
			if (!originalMiterLimits.has(node.id)) originalMiterLimits.set(node.id, node.strokeMiterLimit);
			editor.updateNode(node.id, { strokeMiterLimit: Math.max(1, value) });
		}
	}
	function commitMiterLimit(value) {
		if (originalMiterLimits.size === 0) updateMiterLimit(value);
		runForSelection("Change stroke miter limit", (node) => {
			const previous = originalMiterLimits.get(node.id);
			if (previous === void 0) return;
			editor.commitNodeUpdate(node.id, { strokeMiterLimit: previous }, "Change stroke miter limit");
		});
		originalMiterLimits.clear();
	}
	return {
		setCap,
		setJoin,
		updateMiterLimit,
		commitMiterLimit
	};
}
function updateAlign(editor, align, activeNode) {
	if (!activeNode) return;
	const strokes = activeNode.strokes.map((s) => ({
		...s,
		align
	}));
	editor.updateNodeWithUndo(activeNode.id, { strokes }, "Change stroke align");
}
function currentAlign(activeNode) {
	if (!activeNode || activeNode.strokes.length === 0) return "CENTER";
	return activeNode.strokes[0].align;
}
function currentSides(activeNode) {
	if (!activeNode?.independentStrokeWeights) return "ALL";
	const { borderTopWeight: t, borderRightWeight: r, borderBottomWeight: b, borderLeftWeight: l } = activeNode;
	const count = [
		t > 0,
		r > 0,
		b > 0,
		l > 0
	].filter(Boolean).length;
	if (count === 4 && t === r && r === b && b === l) return "ALL";
	if (count === 1) {
		if (t > 0) return "TOP";
		if (b > 0) return "BOTTOM";
		if (l > 0) return "LEFT";
		if (r > 0) return "RIGHT";
	}
	return "CUSTOM";
}
function dashState(stroke) {
	const pattern = stroke?.dashPattern;
	if (!pattern || pattern.length === 0) return {
		dash: 6,
		gap: 6,
		on: false
	};
	const dash = pattern[0];
	return {
		dash,
		gap: pattern[1] ?? dash,
		on: true
	};
}
function toggleDash(stroke) {
	const { dash, gap, on } = dashState(stroke);
	return { dashPattern: on ? [] : [Math.max(dash, 1), Math.max(gap, 1)] };
}
function setDash(stroke, value) {
	const { gap } = dashState(stroke);
	return { dashPattern: [Math.max(1, value), gap] };
}
function setGap(stroke, value) {
	const { dash } = dashState(stroke);
	return { dashPattern: [dash, Math.max(1, value)] };
}
function borderWeight(activeNode, side) {
	if (!activeNode) return 0;
	const value = activeNode[`border${side[0].toUpperCase()}${side.slice(1)}Weight`];
	return typeof value === "number" ? value : 0;
}
function createStrokeSideActions(editor, sideMenuOpen) {
	function selectSide(side, activeNode) {
		if (!activeNode) return;
		const weight = activeNode.strokes.length > 0 ? activeNode.strokes[0].weight : 1;
		if (side === "ALL") editor.updateNodeWithUndo(activeNode.id, {
			independentStrokeWeights: false,
			borderTopWeight: 0,
			borderRightWeight: 0,
			borderBottomWeight: 0,
			borderLeftWeight: 0
		}, "Stroke all sides");
		else if (side === "CUSTOM") {
			const w = activeNode.independentStrokeWeights ? {
				top: activeNode.borderTopWeight,
				right: activeNode.borderRightWeight,
				bottom: activeNode.borderBottomWeight,
				left: activeNode.borderLeftWeight
			} : {
				top: weight,
				right: weight,
				bottom: weight,
				left: weight
			};
			editor.updateNodeWithUndo(activeNode.id, {
				independentStrokeWeights: true,
				borderTopWeight: w.top,
				borderRightWeight: w.right,
				borderBottomWeight: w.bottom,
				borderLeftWeight: w.left
			}, "Custom stroke sides");
		} else editor.updateNodeWithUndo(activeNode.id, {
			independentStrokeWeights: true,
			borderTopWeight: side === "TOP" ? weight : 0,
			borderRightWeight: side === "RIGHT" ? weight : 0,
			borderBottomWeight: side === "BOTTOM" ? weight : 0,
			borderLeftWeight: side === "LEFT" ? weight : 0
		}, `Stroke ${side.toLowerCase()} only`);
		sideMenuOpen.value = false;
	}
	function updateBorderWeight(side, value, activeNode) {
		if (!activeNode) return;
		const key = `border${side[0].toUpperCase()}${side.slice(1)}Weight`;
		editor.updateNodeWithUndo(activeNode.id, { [key]: value }, "Change stroke weight");
	}
	return {
		selectSide,
		updateBorderWeight
	};
}
//#endregion
export { BORDER_SIDES, DEFAULT_STROKE, SIDE_OPTIONS, borderWeight, createStrokeGeometryActions, createStrokeGeometryState, createStrokeSideActions, currentAlign, currentSides, dashState, setDash, setGap, toggleDash, updateAlign };

//# sourceMappingURL=helpers.js.map
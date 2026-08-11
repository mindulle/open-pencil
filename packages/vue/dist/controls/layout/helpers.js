import { useSceneComputed } from "../appearance/helpers.js";
import { computed, ref } from "vue";
//#region src/controls/layout/helpers.ts
const ALIGN_HORIZONTAL = [
	{
		primary: "MIN",
		counter: "MIN"
	},
	{
		primary: "CENTER",
		counter: "MIN"
	},
	{
		primary: "MAX",
		counter: "MIN"
	},
	{
		primary: "MIN",
		counter: "CENTER"
	},
	{
		primary: "CENTER",
		counter: "CENTER"
	},
	{
		primary: "MAX",
		counter: "CENTER"
	},
	{
		primary: "MIN",
		counter: "MAX"
	},
	{
		primary: "CENTER",
		counter: "MAX"
	},
	{
		primary: "MAX",
		counter: "MAX"
	}
];
const ALIGN_VERTICAL = [
	{
		primary: "MIN",
		counter: "MIN"
	},
	{
		primary: "MIN",
		counter: "CENTER"
	},
	{
		primary: "MIN",
		counter: "MAX"
	},
	{
		primary: "CENTER",
		counter: "MIN"
	},
	{
		primary: "CENTER",
		counter: "CENTER"
	},
	{
		primary: "CENTER",
		counter: "MAX"
	},
	{
		primary: "MAX",
		counter: "MIN"
	},
	{
		primary: "MAX",
		counter: "CENTER"
	},
	{
		primary: "MAX",
		counter: "MAX"
	}
];
function createLayoutSelectionState(editor, panels) {
	const node = useSceneComputed(() => editor.getSelectedNode() ?? null);
	const layoutDirection = computed(() => node.value?.layoutDirection ?? "AUTO");
	const sizingState = createLayoutSizingState(editor, node, panels);
	return {
		node,
		layoutDirection,
		gapAuto: computed(() => node.value?.primaryAxisAlign === "SPACE_BETWEEN"),
		alignGrid: computed(() => node.value?.layoutMode === "VERTICAL" ? ALIGN_VERTICAL : ALIGN_HORIZONTAL),
		...sizingState
	};
}
function createTrackSizingOptions(panels) {
	return [
		{
			value: "FR",
			label: panels.sizingFillFr
		},
		{
			value: "FIXED",
			label: panels.sizingFixedPx
		},
		{
			value: "AUTO",
			label: panels.auto
		}
	];
}
function trackLabel(track) {
	if (track.sizing === "FR") return `${track.value}fr`;
	if (track.sizing === "FIXED") return `${track.value}px`;
	return "Auto";
}
function createGridTrackActions(editor, node) {
	function updateGridTrack(prop, index, updates) {
		if (!node.value) return;
		const tracks = [...node.value[prop]];
		tracks[index] = {
			...tracks[index],
			...updates
		};
		editor.updateNodeWithUndo(node.value.id, { [prop]: tracks }, "Change grid track");
	}
	function addTrack(prop) {
		if (!node.value) return;
		editor.updateNodeWithUndo(node.value.id, { [prop]: [...node.value[prop], {
			sizing: "FR",
			value: 1
		}] }, "Add grid track");
	}
	function removeTrack(prop, index) {
		if (!node.value) return;
		editor.updateNodeWithUndo(node.value.id, { [prop]: node.value[prop].filter((_, i) => i !== index) }, "Remove grid track");
	}
	return {
		updateGridTrack,
		addTrack,
		removeTrack
	};
}
function createPaddingActions(editor, node) {
	const showIndividualPadding = ref(false);
	const hasUniformPadding = computed(() => {
		const n = node.value;
		if (!n) return true;
		return n.paddingTop === n.paddingRight && n.paddingRight === n.paddingBottom && n.paddingBottom === n.paddingLeft;
	});
	const hasSymmetricPadding = computed(() => {
		const n = node.value;
		if (!n) return true;
		return n.paddingLeft === n.paddingRight && n.paddingTop === n.paddingBottom;
	});
	function setHorizontalPadding(v) {
		if (!node.value) return;
		editor.updateNode(node.value.id, {
			paddingLeft: v,
			paddingRight: v
		});
	}
	function commitHorizontalPadding(_value, previous) {
		if (!node.value) return;
		editor.commitNodeUpdate(node.value.id, {
			paddingLeft: previous,
			paddingRight: previous
		}, "Change horizontal padding");
	}
	function setVerticalPadding(v) {
		if (!node.value) return;
		editor.updateNode(node.value.id, {
			paddingTop: v,
			paddingBottom: v
		});
	}
	function commitVerticalPadding(_value, previous) {
		if (!node.value) return;
		editor.commitNodeUpdate(node.value.id, {
			paddingTop: previous,
			paddingBottom: previous
		}, "Change vertical padding");
	}
	function toggleIndividualPadding() {
		showIndividualPadding.value = !showIndividualPadding.value;
	}
	return {
		showIndividualPadding,
		hasUniformPadding,
		hasSymmetricPadding,
		setHorizontalPadding,
		commitHorizontalPadding,
		setVerticalPadding,
		commitVerticalPadding,
		toggleIndividualPadding
	};
}
function axisSizingPatchForNode(node, axis, sizing, isInAutoLayout) {
	const patch = {};
	if (node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL") {
		const primary = axis === "width" && node.layoutMode === "HORIZONTAL" || axis === "height" && node.layoutMode === "VERTICAL";
		patch[primary ? "primaryAxisSizing" : "counterAxisSizing"] = sizing;
	} else if (sizing === "HUG" && node.childIds.length > 0) {
		patch[axis === "width" ? "counterAxisSizing" : "primaryAxisSizing"] = "HUG";
		if (isInAutoLayout) if (axis === "width") patch.layoutGrow = 0;
		else patch.layoutAlignSelf = "AUTO";
	} else if (axis === "width") {
		if (node.counterAxisSizing === "HUG") patch.counterAxisSizing = "FIXED";
		if (isInAutoLayout) patch.layoutGrow = sizing === "FILL" ? 1 : 0;
	} else {
		if (node.primaryAxisSizing === "HUG") patch.primaryAxisSizing = "FIXED";
		if (isInAutoLayout) patch.layoutAlignSelf = sizing === "FILL" ? "STRETCH" : "AUTO";
	}
	return patch;
}
function createLayoutActions({ editor, node, isInAutoLayout }) {
	function updateProp(key, value) {
		if (node.value) editor.updateNode(node.value.id, { [key]: value });
	}
	function updateSizeLimit(prop, value) {
		if (!node.value) return;
		editor.updateNode(node.value.id, { [prop]: value });
	}
	function setSizeLimitToCurrent(prop) {
		const n = node.value;
		if (!n) return;
		const value = prop === "minWidth" || prop === "maxWidth" ? n.width : n.height;
		editor.updateNodeWithUndo(n.id, { [prop]: Math.round(value) }, `Set ${prop}`);
	}
	function commitSizeLimit(prop, _value, previous) {
		if (!node.value) return;
		editor.commitNodeUpdate(node.value.id, { [prop]: previous }, `Change ${prop}`);
	}
	function addSizeLimit(prop) {
		const n = node.value;
		if (!n) return;
		const fallback = prop === "minWidth" || prop === "maxWidth" ? n.width : n.height;
		editor.updateNodeWithUndo(n.id, { [prop]: Math.round(fallback) }, `Add ${prop}`);
	}
	function removeSizeLimit(prop) {
		if (!node.value) return;
		editor.updateNodeWithUndo(node.value.id, { [prop]: null }, `Remove ${prop}`);
	}
	function commitProp(key, _value, previous) {
		if (node.value) editor.commitNodeUpdate(node.value.id, { [key]: previous }, `Change ${key}`);
	}
	function setAxisSizing(axis, sizing) {
		const n = node.value;
		if (!n) return;
		editor.updateNodeWithUndo(n.id, axisSizingPatchForNode(n, axis, sizing, isInAutoLayout.value), `Set ${axis} sizing`);
	}
	function updateAxisSize(axis, value) {
		const n = node.value;
		if (!n) return;
		if ((axis === "width" ? widthSizingForNode(n, isInAutoLayout.value) : heightSizingForNode(n, isInAutoLayout.value)) !== "FIXED") setAxisSizing(axis, "FIXED");
		editor.updateNode(n.id, { [axis]: value });
	}
	function commitAxisSize(axis, _value, previous) {
		const n = node.value;
		if (n) editor.commitNodeUpdate(n.id, { [axis]: previous }, `Change ${axis}`);
	}
	function setAlignment(primary, counter) {
		if (!node.value) return;
		editor.updateNodeWithUndo(node.value.id, {
			primaryAxisAlign: primary,
			counterAxisAlign: counter
		}, "Change alignment");
	}
	function setGapAuto(enabled) {
		const n = node.value;
		if (!n) return;
		editor.updateNodeWithUndo(n.id, { primaryAxisAlign: enabled ? "SPACE_BETWEEN" : "MIN" }, enabled ? "Set gap to auto" : "Set gap to fixed");
	}
	function setLayoutDirection(direction) {
		if (!node.value) return;
		editor.updateNodeWithUndo(node.value.id, { layoutDirection: direction }, "Change layout direction");
	}
	return {
		updateProp,
		updateSizeLimit,
		setSizeLimitToCurrent,
		commitSizeLimit,
		addSizeLimit,
		removeSizeLimit,
		commitProp,
		setAxisSizing,
		updateAxisSize,
		commitAxisSize,
		setAlignment,
		setGapAuto,
		setLayoutDirection
	};
}
function canNodeHugContents(node) {
	return !!node && node.childIds.length > 0;
}
function widthSizingForNode(node, isInAutoLayout) {
	if (!node) return "FIXED";
	if (node.layoutMode === "HORIZONTAL") return node.primaryAxisSizing;
	if (node.layoutMode === "VERTICAL") return node.counterAxisSizing;
	if (canNodeHugContents(node) && node.counterAxisSizing === "HUG") return "HUG";
	if (isInAutoLayout && node.layoutGrow > 0) return "FILL";
	return "FIXED";
}
function heightSizingForNode(node, isInAutoLayout) {
	if (!node) return "FIXED";
	if (node.layoutMode === "VERTICAL") return node.primaryAxisSizing;
	if (node.layoutMode === "HORIZONTAL") return node.counterAxisSizing;
	if (canNodeHugContents(node) && node.primaryAxisSizing === "HUG") return "HUG";
	if (isInAutoLayout && node.layoutAlignSelf === "STRETCH") return "FILL";
	return "FIXED";
}
function sizingOptionsForNode(node, isInAutoLayout, labels = {}) {
	const isFlex = node?.layoutMode === "HORIZONTAL" || node?.layoutMode === "VERTICAL";
	const options = [{
		value: "FIXED",
		label: labels.FIXED ?? "Fixed"
	}];
	if (isFlex || canNodeHugContents(node)) options.push({
		value: "HUG",
		label: labels.HUG ?? "Hug"
	});
	if (isInAutoLayout || isFlex) options.push({
		value: "FILL",
		label: labels.FILL ?? "Fill"
	});
	return options;
}
function createLayoutSizingState(editor, node, panels) {
	const isInAutoLayout = computed(() => {
		const n = node.value;
		if (!n?.parentId) return false;
		const parent = editor.getNode(n.parentId);
		return parent ? parent.layoutMode !== "NONE" : false;
	});
	const isGrid = computed(() => node.value?.layoutMode === "GRID");
	const isFlex = computed(() => node.value?.layoutMode === "HORIZONTAL" || node.value?.layoutMode === "VERTICAL");
	const widthSizing = computed(() => widthSizingForNode(node.value, isInAutoLayout.value));
	const heightSizing = computed(() => heightSizingForNode(node.value, isInAutoLayout.value));
	function sizingOptions() {
		return sizingOptionsForNode(node.value, isInAutoLayout.value, {
			FIXED: panels.value.sizingFixed,
			HUG: panels.value.sizingHug,
			FILL: panels.value.sizingFill
		});
	}
	return {
		isInAutoLayout,
		isGrid,
		isFlex,
		widthSizing,
		heightSizing,
		widthSizingOptions: computed(sizingOptions),
		heightSizingOptions: computed(sizingOptions)
	};
}
//#endregion
export { createGridTrackActions, createLayoutActions, createLayoutSelectionState, createPaddingActions, createTrackSizingOptions, trackLabel };

//# sourceMappingURL=helpers.js.map
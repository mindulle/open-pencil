import { useEditor } from "../../canvas/CanvasRoot.js";
import { computed } from "vue";
//#region src/internal/scene-computed/use.ts
/**
* Convenience wrapper for scene-derived computed state.
*
* Use this for values that should clearly read as editor/scene-backed derived
* state in higher-level composables.
*/
function useSceneComputed(fn) {
	const editor = useEditor();
	return computed(() => {
		editor.state.sceneVersion;
		editor.state.selectedIds;
		editor.state.currentPageId;
		return fn();
	});
}
//#endregion
//#region src/controls/node-props/helpers.ts
const MIXED = Symbol("mixed");
function areArrayItemsEqual(a, b) {
	if (a === b) return true;
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) return false;
	for (const key of aKeys) {
		const aValue = a[key];
		const bValue = b[key];
		if (Array.isArray(aValue) && Array.isArray(bValue)) {
			if (aValue.length !== bValue.length) return false;
			for (let i = 0; i < aValue.length; i++) {
				const left = aValue[i];
				const right = bValue[i];
				if (typeof left === "object" && left != null && typeof right === "object" && right != null) {
					if (!areArrayItemsEqual(left, right)) return false;
				} else if (left !== right) return false;
			}
			continue;
		}
		if (typeof aValue === "object" && aValue != null && typeof bValue === "object" && bValue != null) {
			if (!areArrayItemsEqual(aValue, bValue)) return false;
			continue;
		}
		if (aValue !== bValue) return false;
	}
	return true;
}
function createNodePropSelectionState(store) {
	const node = useSceneComputed(() => {
		store.state.sceneVersion;
		return store.getSelectedNode() ?? null;
	});
	const nodes = useSceneComputed(() => {
		store.state.sceneVersion;
		return store.getSelectedNodes();
	});
	const isMulti = computed(() => nodes.value.length > 1);
	const active = computed(() => node.value !== null || isMulti.value);
	const activeNode = computed(() => node.value ?? nodes.value[0] ?? null);
	function merged(key) {
		const all = nodes.value;
		if (all.length === 0) return MIXED;
		const first = all[0][key];
		for (let i = 1; i < all.length; i++) if (all[i][key] !== first) return MIXED;
		return first;
	}
	function prop(key) {
		return computed(() => merged(key));
	}
	function updateAllWithUndo(patch, label) {
		for (const n of nodes.value) store.updateNodeWithUndo(n.id, patch, label);
	}
	return {
		node,
		nodes,
		isMulti,
		active,
		activeNode,
		merged,
		prop,
		updateAllWithUndo
	};
}
function isNodeArrayMixed(nodes, key) {
	if (nodes.length <= 1) return false;
	const first = nodes[0][key];
	if (!Array.isArray(first)) return nodes.some((n) => n[key] !== first);
	for (let i = 1; i < nodes.length; i++) {
		const current = nodes[i][key];
		if (!Array.isArray(current) || current.length !== first.length) return true;
		for (let j = 0; j < first.length; j++) {
			const left = first[j];
			const right = current[j];
			if (typeof left === "object" && typeof right === "object") {
				if (!areArrayItemsEqual(left, right)) return true;
			} else if (left !== right) return true;
		}
	}
	return false;
}
function createNodePropArrayActions({ store, nodes, activeNode, isMulti }) {
	function targetNodes() {
		if (isMulti.value) return nodes.value;
		return activeNode.value ? [activeNode.value] : [];
	}
	function updateArrayItem(key, index, patch, label) {
		for (const n of targetNodes()) {
			const arr = [...n[key]];
			arr[index] = {
				...arr[index],
				...patch
			};
			store.updateNodeWithUndo(n.id, { [key]: arr }, label);
		}
	}
	function removeArrayItem(key, index, label) {
		for (const n of targetNodes()) store.updateNodeWithUndo(n.id, { [key]: n[key].filter((_, i) => i !== index) }, label);
	}
	function toggleArrayVisibility(key, index) {
		for (const n of targetNodes()) {
			const items = n[key];
			if (!items[index]) continue;
			const arr = [...n[key]];
			arr[index] = {
				...arr[index],
				visible: !items[index].visible
			};
			store.updateNodeWithUndo(n.id, { [key]: arr }, `Toggle ${key} visibility`);
		}
	}
	return {
		targetNodes,
		updateArrayItem,
		removeArrayItem,
		toggleArrayVisibility
	};
}
function createNodePropScrubActions(store) {
	const previousValues = /* @__PURE__ */ new Map();
	function storePreviousValues(key) {
		for (const n of store.getSelectedNodes()) {
			let rec = previousValues.get(n.id);
			if (!rec) {
				rec = {};
				previousValues.set(n.id, rec);
			}
			if (!(key in rec)) rec[key] = n[key];
		}
	}
	function updateProp(key, value) {
		if (store.getSelectedNodes().length > 1) {
			storePreviousValues(key);
			for (const n of store.getSelectedNodes()) store.updateNode(n.id, { [key]: value });
		} else {
			const node = store.getSelectedNode();
			if (node) store.updateNode(node.id, { [key]: value });
		}
	}
	function commitProp(key, _value, previous) {
		if (store.getSelectedNodes().length > 1) {
			for (const n of store.getSelectedNodes()) {
				const prev = previousValues.get(n.id)?.[key] ?? previous;
				store.commitNodeUpdate(n.id, { [key]: prev }, `Change ${key}`);
			}
			previousValues.clear();
		} else {
			const node = store.getSelectedNode();
			if (node) store.commitNodeUpdate(node.id, { [key]: previous }, `Change ${key}`);
		}
	}
	return {
		updateProp,
		commitProp
	};
}
//#endregion
//#region src/controls/node-props/use.ts
/**
* Returns shared property-panel helpers for the current selection.
*
* This composable centralizes mixed-value detection, multi-selection updates,
* array-item editing, and commit semantics used by higher-level controls.
*/
function useNodeProps() {
	const store = useEditor();
	const { node, nodes, isMulti, active, activeNode, prop, merged, updateAllWithUndo } = createNodePropSelectionState(store);
	function isArrayMixed(key) {
		return isNodeArrayMixed(nodes.value, key);
	}
	const { targetNodes, updateArrayItem, removeArrayItem, toggleArrayVisibility } = createNodePropArrayActions({
		store,
		nodes,
		activeNode,
		isMulti
	});
	const { updateProp, commitProp } = createNodePropScrubActions(store);
	return {
		store,
		node,
		nodes,
		isMulti,
		active,
		activeNode,
		targetNodes,
		prop,
		merged,
		updateAllWithUndo,
		updateArrayItem,
		removeArrayItem,
		toggleArrayVisibility,
		isArrayMixed,
		updateProp,
		commitProp
	};
}
//#endregion
//#region src/controls/appearance/helpers.ts
const CORNER_RADIUS_TYPES = /* @__PURE__ */ new Set([
	"RECTANGLE",
	"ROUNDED_RECTANGLE",
	"FRAME",
	"COMPONENT",
	"INSTANCE"
]);
function hasUnequalCorners(node) {
	return !(node.topLeftRadius === node.topRightRadius && node.topLeftRadius === node.bottomRightRadius && node.topLeftRadius === node.bottomLeftRadius);
}
function createAppearanceState({ node, nodes, isMulti, merged }) {
	return {
		hasCornerRadius: computed(() => {
			if (isMulti.value) return nodes.value.every((n) => CORNER_RADIUS_TYPES.has(n.type));
			return node.value ? CORNER_RADIUS_TYPES.has(node.value.type) : false;
		}),
		independentCorners: computed(() => {
			if (isMulti.value) return merged("independentCorners");
			return node.value?.independentCorners ?? false;
		}),
		showIndependentCorners: computed(() => {
			if (isMulti.value) return false;
			const selected = node.value;
			return selected ? selected.independentCorners || hasUnequalCorners(selected) : false;
		}),
		cornerRadiusValue: computed(() => {
			if (isMulti.value) return merged("cornerRadius");
			return node.value?.cornerRadius ?? 0;
		}),
		cornerSmoothingPercent: computed(() => {
			const value = merged("cornerSmoothing");
			return value === MIXED ? MIXED : Math.round(Math.max(0, Math.min(value, 1)) * 100);
		}),
		opacityPercent: computed(() => {
			const v = merged("opacity");
			return v === MIXED ? MIXED : Math.round(v * 100);
		}),
		blendModeValue: computed(() => {
			const v = merged("blendMode");
			return v === MIXED ? MIXED : v;
		}),
		visibilityState: computed(() => {
			const v = merged("visible");
			if (v === MIXED) return "mixed";
			return v ? "visible" : "hidden";
		})
	};
}
function createAppearanceActions({ editor, node, nodes, isMulti }) {
	const previousCornerValues = /* @__PURE__ */ new Map();
	function setBlendMode(value) {
		const selected = node.value;
		const targets = isMulti.value ? nodes.value : [];
		if (!isMulti.value && selected) targets.push(selected);
		const changed = targets.filter((target) => target.blendMode !== value);
		if (changed.length === 0) return;
		editor.undo.runBatch("Change blend mode", () => {
			for (const target of changed) editor.updateNodeWithUndo(target.id, { blendMode: value }, "Change blend mode");
		});
	}
	function toggleVisibility() {
		if (isMulti.value) {
			const liveNodes = nodes.value.map((n) => editor.getNode(n.id)).filter((n) => n != null);
			if (liveNodes.length === 0) return;
			const allVisible = liveNodes.every((n) => n.visible);
			editor.undo.runBatch("Toggle visibility", () => {
				for (const n of liveNodes) editor.updateNodeWithUndo(n.id, { visible: !allVisible }, "Toggle visibility");
			});
			return;
		}
		const selected = node.value;
		if (!selected) return;
		const liveNode = editor.getNode(selected.id);
		if (!liveNode) return;
		editor.updateNodeWithUndo(liveNode.id, { visible: !liveNode.visible }, "Toggle visibility");
	}
	function toggleIndependentCorners() {
		const selected = node.value;
		const targets = isMulti.value ? [...nodes.value] : [];
		if (!isMulti.value && selected) targets.push(selected);
		if (targets.length === 0) return;
		const makeIndependent = !targets.every((target) => target.independentCorners || hasUnequalCorners(target));
		editor.undo.runBatch(makeIndependent ? "Independent corner radii" : "Uniform corner radius", () => {
			for (const target of targets) if (makeIndependent) {
				if (target.independentCorners) continue;
				editor.updateNodeWithUndo(target.id, {
					independentCorners: true,
					topLeftRadius: target.cornerRadius,
					topRightRadius: target.cornerRadius,
					bottomRightRadius: target.cornerRadius,
					bottomLeftRadius: target.cornerRadius
				}, "Independent corner radii");
			} else {
				const uniform = target.topLeftRadius;
				editor.updateNodeWithUndo(target.id, {
					independentCorners: false,
					cornerRadius: uniform,
					topLeftRadius: uniform,
					topRightRadius: uniform,
					bottomRightRadius: uniform,
					bottomLeftRadius: uniform
				}, "Uniform corner radius");
			}
		});
	}
	function cornerTargets() {
		if (isMulti.value) return nodes.value;
		const selected = node.value;
		return selected ? [selected] : [];
	}
	function updateCornerProp(key, value) {
		let snapshots = previousCornerValues.get(key);
		if (!snapshots) {
			snapshots = /* @__PURE__ */ new Map();
			previousCornerValues.set(key, snapshots);
		}
		const normalized = key === "cornerSmoothing" ? Math.max(0, Math.min(value, 1)) : value;
		for (const target of cornerTargets()) {
			if (!snapshots.has(target.id)) snapshots.set(target.id, target[key]);
			editor.updateNode(target.id, { [key]: normalized });
		}
	}
	function commitCornerProp(key, _value, previous) {
		const targets = cornerTargets();
		const snapshots = previousCornerValues.get(key);
		const commit = () => {
			for (const target of targets) editor.commitNodeUpdate(target.id, { [key]: snapshots?.get(target.id) ?? previous }, `Change ${key}`);
		};
		if (targets.length > 1) editor.undo.runBatch(`Change ${key}`, commit);
		else commit();
		previousCornerValues.delete(key);
	}
	return {
		setBlendMode,
		toggleVisibility,
		toggleIndependentCorners,
		updateCornerProp,
		commitCornerProp
	};
}
//#endregion
export { MIXED, createAppearanceActions, createAppearanceState, useNodeProps, useSceneComputed };

//# sourceMappingURL=helpers.js.map
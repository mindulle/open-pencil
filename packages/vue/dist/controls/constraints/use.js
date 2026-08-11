import { MIXED, useNodeProps } from "../appearance/helpers.js";
import { isConstraintEligible, toggleConstraintPin } from "./model.js";
import { computed } from "vue";
//#region src/controls/constraints/use.ts
function mergedConstraint(nodes, key) {
	if (nodes.length === 0) return MIXED;
	const first = nodes[0][key];
	return nodes.some((node) => node[key] !== first) ? MIXED : first;
}
function useConstraints() {
	const { store, nodes, isMulti } = useNodeProps();
	const active = computed(() => nodes.value.length > 0 && nodes.value.every((node) => isConstraintEligible(store.graph, node)));
	const horizontal = computed(() => mergedConstraint(nodes.value, "horizontalConstraint"));
	const vertical = computed(() => mergedConstraint(nodes.value, "verticalConstraint"));
	function setAxis(axis, value) {
		if (!active.value) return;
		const key = axis === "horizontal" ? "horizontalConstraint" : "verticalConstraint";
		const apply = () => {
			for (const node of nodes.value) store.updateNodeWithUndo(node.id, { [key]: value }, `Change ${axis} constraint`);
		};
		if (nodes.value.length > 1) store.undo.runBatch(`Change ${axis} constraint`, apply);
		else apply();
	}
	function togglePin(axis, edge, additive) {
		setAxis(axis, toggleConstraintPin(axis === "horizontal" ? horizontal.value : vertical.value, edge, additive));
	}
	return {
		active,
		isMulti,
		horizontal,
		vertical,
		setAxis,
		togglePin
	};
}
//#endregion
export { useConstraints };

//# sourceMappingURL=use.js.map
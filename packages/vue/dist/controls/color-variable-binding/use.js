import { useEditor } from "../../canvas/CanvasRoot.js";
import { useSceneComputed } from "../appearance/helpers.js";
import { computed, ref } from "vue";
import { randomHex } from "@open-pencil/core/random";
import { useFilter } from "reka-ui";
//#region src/controls/variable-binding/use.ts
function useVariableBinding(options) {
	const store = useEditor();
	const searchTerm = ref("");
	const variables = useSceneComputed(() => store.getVariablesByType(options.type));
	const { contains } = useFilter({ sensitivity: "base" });
	const filteredVariables = computed(() => {
		if (!searchTerm.value) return variables.value;
		return variables.value.filter((variable) => contains(variable.name, searchTerm.value));
	});
	function bindingPath(index) {
		if (typeof options.path === "string") return options.path;
		return options.path(index ?? 0);
	}
	function getBoundVariable(nodeId, index) {
		const node = store.getNode(nodeId);
		if (!node) return void 0;
		const variableId = node.boundVariables[bindingPath(index)];
		return variableId ? store.getVariable(variableId) : void 0;
	}
	function getBindingState(nodeIds, index) {
		const variableIds = /* @__PURE__ */ new Set();
		for (const nodeId of nodeIds) {
			const node = store.getNode(nodeId);
			variableIds.add(node?.boundVariables[bindingPath(index)]);
		}
		if (variableIds.size > 1) return "mixed";
		return variableIds.has(void 0) ? "unbound" : "bound";
	}
	function bindVariable(nodeId, variableId, index) {
		store.bindVariable(nodeId, bindingPath(index), variableId);
	}
	function unbindVariable(nodeId, index) {
		store.unbindVariable(nodeId, bindingPath(index));
	}
	return {
		store,
		searchTerm,
		variables,
		filteredVariables,
		bindingPath,
		getBoundVariable,
		getBindingState,
		bindVariable,
		unbindVariable
	};
}
//#endregion
//#region src/controls/color-variable-binding/use.ts
const FALLBACK_COLOR_VARIABLE_NAME = "New color";
function useColorVariableBinding(kind) {
	const binding = useVariableBinding({
		type: "COLOR",
		path: (index) => `${kind}/${index}/color`
	});
	function colorCollection() {
		const existing = binding.store.getCollections().find((collection) => collection.variableIds.some((variableId) => binding.store.getVariable(variableId)?.type === "COLOR"));
		if (existing) return existing;
		const collection = {
			id: `col:${randomHex(8)}`,
			name: "Colors",
			modes: [{
				modeId: "default",
				name: "Mode 1"
			}],
			defaultModeId: "default",
			variableIds: []
		};
		binding.store.addCollection(collection);
		return collection;
	}
	function createAndBindVariable(nodeId, index, color, name = FALLBACK_COLOR_VARIABLE_NAME) {
		const collection = colorCollection();
		const id = `var:${randomHex(8)}`;
		binding.store.addVariable({
			id,
			name: name.trim() || FALLBACK_COLOR_VARIABLE_NAME,
			type: "COLOR",
			collectionId: collection.id,
			valuesByMode: Object.fromEntries(collection.modes.map((mode) => [mode.modeId, color])),
			description: "",
			hiddenFromPublishing: false
		});
		binding.bindVariable(nodeId, id, index);
	}
	return {
		...binding,
		colorVariables: binding.variables,
		bindVariable: (nodeId, index, variableId) => binding.bindVariable(nodeId, variableId, index),
		unbindVariable: (nodeId, index) => binding.unbindVariable(nodeId, index),
		createAndBindVariable
	};
}
//#endregion
export { useColorVariableBinding, useVariableBinding };

//# sourceMappingURL=use.js.map
import { useVariableBinding } from "../color-variable-binding/use.js";
import { createAndBindNumberVariable } from "../binding-provider/number.js";
//#region src/controls/number-variable-binding/use.ts
function useNumberVariableBinding(path) {
	const binding = useVariableBinding({
		type: "FLOAT",
		path
	});
	function createAndBindVariable(nodeId, value, name) {
		createAndBindNumberVariable(binding.store, {
			nodeId,
			path: binding.bindingPath()
		}, value, name);
	}
	return {
		...binding,
		numberVariables: binding.variables,
		createAndBindVariable
	};
}
//#endregion
export { useNumberVariableBinding };

//# sourceMappingURL=use.js.map
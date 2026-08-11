import { useOpenPencilBindingProvider } from "./color.js";
import { randomHex } from "@open-pencil/core/random";
//#region src/controls/binding-provider/number.ts
const FALLBACK_NUMBER_VARIABLE_NAME = "New number";
function numberCollection(editor) {
	const existing = editor.getCollections().find((collection) => collection.variableIds.some((variableId) => editor.getVariable(variableId)?.type === "FLOAT"));
	if (existing) return existing;
	const collection = {
		id: `col:${randomHex(8)}`,
		name: "Numbers",
		modes: [{
			modeId: "default",
			name: "Mode 1"
		}],
		defaultModeId: "default",
		variableIds: []
	};
	editor.addCollection(collection);
	return collection;
}
function createAndBindNumberVariable(editor, target, value, name = FALLBACK_NUMBER_VARIABLE_NAME) {
	const collection = numberCollection(editor);
	const id = `var:${randomHex(8)}`;
	editor.addVariable({
		id,
		name: name.trim() || FALLBACK_NUMBER_VARIABLE_NAME,
		type: "FLOAT",
		collectionId: collection.id,
		valuesByMode: Object.fromEntries(collection.modes.map((mode) => [mode.modeId, value])),
		description: "",
		hiddenFromPublishing: false
	});
	editor.bindVariable(target.nodeId, target.path, id);
}
function setNumberVariableValue(editor, variableId, value) {
	const variable = editor.getVariable(variableId);
	if (!variable) return;
	const collection = editor.getCollection(variable.collectionId);
	if (!collection) return;
	for (const mode of collection.modes) editor.updateVariableValue(variableId, mode.modeId, value);
}
function useNumberBindingProvider() {
	return useOpenPencilBindingProvider({
		type: "FLOAT",
		resolve: (editor, variableId) => editor.resolveNumberVariable(variableId),
		create: createAndBindNumberVariable,
		setValue: setNumberVariableValue
	});
}
//#endregion
export { createAndBindNumberVariable, useNumberBindingProvider };

//# sourceMappingURL=number.js.map
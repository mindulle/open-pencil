import { useEditor } from "../../canvas/CanvasRoot.js";
import { useSceneComputed } from "../appearance/helpers.js";
import { randomHex } from "@open-pencil/core/random";
import { useFilter } from "reka-ui";
//#region src/controls/binding-provider/open-pencil.ts
function useOpenPencilBindingProvider(options) {
	const editor = useEditor();
	const revision = useSceneComputed(() => editor.state.sceneVersion);
	const variables = useSceneComputed(() => editor.getVariablesByType(options.type));
	const { contains } = useFilter({ sensitivity: "base" });
	function listVariables() {
		return variables.value;
	}
	function filterVariables(term) {
		if (!term) return variables.value;
		return variables.value.filter((variable) => contains(variable.name, term));
	}
	function getBound(target) {
		revision.value;
		const variableId = editor.getNode(target.nodeId)?.boundVariables[target.path];
		return variableId ? editor.getVariable(variableId) : void 0;
	}
	function getState(targets) {
		if (targets.length === 0) return "unbound";
		const variableIds = new Set(targets.map((target) => editor.getNode(target.nodeId)?.boundVariables[target.path] ?? void 0));
		if (variableIds.size > 1) return "mixed";
		return variableIds.has(void 0) ? "unbound" : "bound";
	}
	return {
		revision,
		listVariables,
		filterVariables,
		getBound,
		getState,
		resolve: (variableId) => options.resolve(editor, variableId),
		bind: (target, variableId) => editor.bindVariable(target.nodeId, target.path, variableId),
		unbind: (target) => editor.unbindVariable(target.nodeId, target.path),
		create: options.create ? (target, value, name) => options.create?.(editor, target, value, name) : void 0,
		setValue: options.setValue ? (variableId, value) => options.setValue?.(editor, variableId, value) : void 0,
		runBatch: (label, action) => editor.undo.runBatch(label, action),
		beginBatch: (label) => editor.undo.beginBatch(label),
		commitBatch: () => editor.undo.commitBatch(),
		rollbackBatch: () => editor.undo.rollbackBatch()
	};
}
//#endregion
//#region src/controls/binding-provider/color.ts
const FALLBACK_COLOR_VARIABLE_NAME = "New color";
function colorCollection(editor) {
	const existing = editor.getCollections().find((collection) => collection.variableIds.some((variableId) => editor.getVariable(variableId)?.type === "COLOR"));
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
	editor.addCollection(collection);
	return collection;
}
function createAndBindColorVariable(editor, target, value, name = FALLBACK_COLOR_VARIABLE_NAME) {
	const collection = colorCollection(editor);
	const id = `var:${randomHex(8)}`;
	editor.addVariable({
		id,
		name: name.trim() || FALLBACK_COLOR_VARIABLE_NAME,
		type: "COLOR",
		collectionId: collection.id,
		valuesByMode: Object.fromEntries(collection.modes.map((mode) => [mode.modeId, structuredClone(value)])),
		description: "",
		hiddenFromPublishing: false
	});
	editor.bindVariable(target.nodeId, target.path, id);
}
function setColorVariableValue(editor, variableId, value) {
	const variable = editor.getVariable(variableId);
	if (!variable) return;
	const collection = editor.getCollection(variable.collectionId);
	if (!collection) return;
	for (const mode of collection.modes) editor.updateVariableValue(variableId, mode.modeId, structuredClone(value));
}
function useColorBindingProvider() {
	return useOpenPencilBindingProvider({
		type: "COLOR",
		resolve: (editor, variableId) => editor.resolveColorVariable(variableId),
		create: createAndBindColorVariable,
		setValue: setColorVariableValue
	});
}
//#endregion
export { useColorBindingProvider, useOpenPencilBindingProvider };

//# sourceMappingURL=color.js.map
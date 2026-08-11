import { useEditor } from "../../canvas/CanvasRoot.js";
import { MIXED, useSceneComputed } from "../appearance/helpers.js";
import { compatibleComponentPropertyDefinitions, instanceSwapOptions, mergedComponentPropertyValue } from "./model.js";
import { computed } from "vue";
//#region src/controls/component-props/use.ts
function variantOptions(editor, instance, name) {
	const component = instance.componentId ? editor.graph.getNode(instance.componentId) : null;
	const parent = component?.parentId ? editor.graph.getNode(component.parentId) : null;
	return [...(parent?.type === "COMPONENT_SET" ? editor.collectVariantOptions(parent.id).get(name) : null) ?? []].map((value) => ({
		value,
		label: value
	}));
}
function useComponentProperties() {
	const editor = useEditor();
	const instances = useSceneComputed(() => {
		editor.state.sceneVersion;
		return editor.getSelectedNodes().filter((node) => node.type === "INSTANCE");
	});
	const selectedCount = computed(() => editor.state.selectedIds.size);
	const definitionSets = useSceneComputed(() => {
		editor.state.sceneVersion;
		return instances.value.map((instance) => editor.getInstanceComponentPropertyDefinitions(instance.id));
	});
	const definitions = computed(() => compatibleComponentPropertyDefinitions(definitionSets.value));
	const active = computed(() => instances.value.length > 0 && instances.value.length === selectedCount.value && definitions.value.length > 0);
	const controls = useSceneComputed(() => {
		editor.state.sceneVersion;
		if (!active.value || instances.value.length === 0) return [];
		const firstInstance = instances.value[0];
		return definitions.value.map((definition) => {
			const value = mergedComponentPropertyValue(instances.value.map((instance) => editor.getInstanceComponentPropertyValue(instance.id, definition)));
			let options = [];
			if (definition.type === "VARIANT") options = variantOptions(editor, firstInstance, definition.name);
			else if (definition.type === "INSTANCE_SWAP") options = instanceSwapOptions([...editor.graph.getAllNodes()], definition, value === MIXED ? "" : value);
			return {
				id: definition.id,
				name: definition.name,
				type: definition.type,
				value,
				options
			};
		});
	});
	function setValue(propertyId, value) {
		if (!active.value) return;
		const targets = [...instances.value];
		const definition = definitions.value.find((item) => item.id === propertyId);
		if (!definition) return;
		const label = `Change ${definition.name}`;
		const run = () => {
			for (const instance of targets) editor.setInstanceComponentProperty(instance.id, propertyId, value);
		};
		if (targets.length > 1) editor.undo.runBatch(label, run);
		else run();
	}
	return {
		active,
		controls,
		setValue
	};
}
//#endregion
export { useComponentProperties };

//# sourceMappingURL=use.js.map
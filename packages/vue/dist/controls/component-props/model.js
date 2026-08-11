import { MIXED } from "../appearance/helpers.js";
//#region src/controls/component-props/model.ts
function compatibleComponentPropertyDefinitions(definitions) {
	if (definitions.length === 0) return [];
	const first = definitions[0];
	const signature = (items) => items.map((item) => `${item.id}:${item.type}`).join("\0");
	const expected = signature(first);
	return definitions.every((items) => signature(items) === expected) ? first : [];
}
function mergedComponentPropertyValue(values) {
	const first = values[0] ?? "";
	return values.every((value) => value === first) ? first : MIXED;
}
function instanceSwapOptions(components, definition, value) {
	const preferred = new Set(definition.preferredValues);
	const options = components.filter((node) => node.type === "COMPONENT").map((node) => ({
		value: node.id,
		label: node.name,
		preferred: preferred.has(node.componentKey ?? "") || preferred.has(node.sourceLibraryKey ?? "")
	})).sort((left, right) => Number(right.preferred) - Number(left.preferred) || left.label.localeCompare(right.label)).map(({ value: optionValue, label }) => ({
		value: optionValue,
		label
	}));
	if (value && !options.some((option) => option.value === value)) options.push({
		value,
		label: value,
		missing: true
	});
	return options;
}
//#endregion
export { compatibleComponentPropertyDefinitions, instanceSwapOptions, mergedComponentPropertyValue };

//# sourceMappingURL=model.js.map
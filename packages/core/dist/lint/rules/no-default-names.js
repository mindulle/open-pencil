import { defineRule } from "../rule.js";
import { isDefaultName } from "../utils.js";
//#region src/lint/rules/no-default-names.ts
var no_default_names_default = defineRule({
	meta: {
		id: "no-default-names",
		category: "naming",
		description: "Layers should have descriptive names"
	},
	check(node, context) {
		if (!isDefaultName(node.name)) return;
		if ([
			"RECTANGLE",
			"ELLIPSE",
			"LINE"
		].includes(node.type) && node.width < 24 && node.height < 24) return;
		context.report({
			node,
			message: `Default layer name "${node.name}" is not descriptive`,
			suggest: "Rename to describe the layer purpose"
		});
	}
});
//#endregion
export { no_default_names_default as default };

//# sourceMappingURL=no-default-names.js.map
import { defineRule } from "../rule.js";
//#region src/lint/rules/no-hidden-layers.ts
var no_hidden_layers_default = defineRule({
	meta: {
		id: "no-hidden-layers",
		category: "structure",
		description: "Hidden layers may indicate unused elements"
	},
	check(node, context) {
		if (!node.visible) context.report({
			node,
			message: "Hidden layer detected",
			suggest: "Delete if unused or keep only if required for component states"
		});
	}
});
//#endregion
export { no_hidden_layers_default as default };

//# sourceMappingURL=no-hidden-layers.js.map
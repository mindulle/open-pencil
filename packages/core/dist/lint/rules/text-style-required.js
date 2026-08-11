import { defineRule } from "../rule.js";
//#region src/lint/rules/text-style-required.ts
var text_style_required_default = defineRule({
	meta: {
		id: "text-style-required",
		category: "typography",
		description: "Text layers should use shared typography tokens or styles"
	},
	match: ["TEXT"],
	check(node, context) {
		if (node.text.length <= 2) return;
		if (node.boundVariables.fontSize || node.boundVariables.fontFamily) return;
		context.report({
			node,
			message: "Text layer without typography variable bindings",
			suggest: "Bind font size or font family to a shared text token when possible"
		});
	}
});
//#endregion
export { text_style_required_default as default };

//# sourceMappingURL=text-style-required.js.map
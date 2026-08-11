import { defineRule } from "../rule.js";
//#region src/lint/rules/min-text-size.ts
var min_text_size_default = defineRule({
	meta: {
		id: "min-text-size",
		category: "accessibility",
		description: "Text should be large enough to be readable (minimum 12px)"
	},
	match: ["TEXT"],
	check(node, context) {
		const minSize = context.getConfig()?.minSize ?? 12;
		if (node.fontSize < minSize) context.report({
			node,
			message: `Text size ${node.fontSize}px is below minimum ${minSize}px`,
			suggest: `Increase to at least ${minSize}px for readability`
		});
	}
});
//#endregion
export { min_text_size_default as default };

//# sourceMappingURL=min-text-size.js.map
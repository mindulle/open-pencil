import { defineRule } from "../rule.js";
//#region src/lint/rules/no-deeply-nested.ts
var no_deeply_nested_default = defineRule({
	meta: {
		id: "no-deeply-nested",
		category: "structure",
		description: "Avoid deeply nested layers"
	},
	check(node, context) {
		const maxDepth = context.getConfig()?.maxDepth ?? 6;
		let depth = 0;
		let current = context.getParent(node);
		while (current) {
			depth++;
			current = context.getParent(current);
		}
		if (depth > maxDepth) context.report({
			node,
			message: `Layer nested ${depth} levels deep (max ${maxDepth})`,
			suggest: "Flatten structure or extract a component"
		});
	}
});
//#endregion
export { no_deeply_nested_default as default };

//# sourceMappingURL=no-deeply-nested.js.map
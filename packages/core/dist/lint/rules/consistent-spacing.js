import { defineRule } from "../rule.js";
import { SPACING_SCALE, isMultipleOf } from "../utils.js";
//#region src/lint/rules/consistent-spacing.ts
var consistent_spacing_default = defineRule({
	meta: {
		id: "consistent-spacing",
		category: "layout",
		description: "Spacing should follow the spacing scale"
	},
	match: ["FRAME", "COMPONENT"],
	check(node, context) {
		if (node.layoutMode === "NONE") return;
		const base = context.getConfig()?.base ?? 8;
		const valid = (value) => SPACING_SCALE.includes(value) || isMultipleOf(value, base);
		const values = [
			["gap", node.itemSpacing],
			["paddingTop", node.paddingTop],
			["paddingRight", node.paddingRight],
			["paddingBottom", node.paddingBottom],
			["paddingLeft", node.paddingLeft]
		];
		for (const [name, value] of values) if (value > 0 && !valid(value)) context.report({
			node,
			message: `${name} ${value}px is not in spacing scale`,
			suggest: "Use a spacing token or 8pt-grid multiple"
		});
	}
});
//#endregion
export { consistent_spacing_default as default };

//# sourceMappingURL=consistent-spacing.js.map
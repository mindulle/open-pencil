import { defineRule } from "../rule.js";
//#region src/lint/rules/prefer-auto-layout.ts
var prefer_auto_layout_default = defineRule({
	meta: {
		id: "prefer-auto-layout",
		category: "layout",
		description: "Frames with multiple children should use auto layout"
	},
	match: ["FRAME", "COMPONENT"],
	check(node, context) {
		const minChildren = context.getConfig()?.minChildren ?? 2;
		if (node.layoutMode !== "NONE" || context.getChildren(node).length < minChildren) return;
		context.report({
			node,
			message: `Frame with ${context.getChildren(node).length} children doesn't use auto layout`,
			suggest: "Add horizontal or vertical auto layout"
		});
	}
});
//#endregion
export { prefer_auto_layout_default as default };

//# sourceMappingURL=prefer-auto-layout.js.map
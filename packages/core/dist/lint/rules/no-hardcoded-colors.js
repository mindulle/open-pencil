import { defineRule } from "../rule.js";
//#region src/lint/rules/no-hardcoded-colors.ts
var no_hardcoded_colors_default = defineRule({
	meta: {
		id: "no-hardcoded-colors",
		category: "design-tokens",
		description: "Colors should use variables instead of hardcoded values"
	},
	match: [
		"RECTANGLE",
		"ELLIPSE",
		"FRAME",
		"TEXT",
		"VECTOR",
		"LINE",
		"POLYGON",
		"STAR",
		"COMPONENT",
		"INSTANCE"
	],
	check(node, context) {
		const checkPaints = (paints, field) => {
			for (let i = 0; i < paints.length; i++) {
				const paint = paints[i];
				if (paint.type !== "SOLID" || !paint.visible || !paint.color) continue;
				if (node.boundVariables[`${field}/${i}/color`]) continue;
				context.report({
					node,
					message: `Hardcoded ${field === "fills" ? "fill" : "stroke"} color detected`,
					suggest: "Bind this color to a design variable for consistency"
				});
			}
		};
		checkPaints(node.fills, "fills");
		checkPaints(node.strokes, "strokes");
	}
});
//#endregion
export { no_hardcoded_colors_default as default };

//# sourceMappingURL=no-hardcoded-colors.js.map
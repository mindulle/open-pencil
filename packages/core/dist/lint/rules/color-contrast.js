import { defineRule } from "../rule.js";
import { contrastRatio } from "../utils.js";
//#region src/lint/rules/color-contrast.ts
var color_contrast_default = defineRule({
	meta: {
		id: "color-contrast",
		category: "accessibility",
		severity: "error",
		description: "Text must have sufficient contrast against its background"
	},
	match: ["TEXT"],
	check(node, context) {
		const textFillIndex = node.fills.findIndex((f) => f.type === "SOLID" && f.visible && f.color);
		const textColor = node.fills[textFillIndex]?.color;
		if (textColor == null) return;
		if (node.boundVariables[`fills/${textFillIndex}/color`]) return;
		let parent = context.getParent(node);
		while (parent) {
			const bg = parent.fills.find((f) => f.type === "SOLID" && f.visible && f.color)?.color;
			if (bg) {
				const ratio = contrastRatio(textColor, bg);
				if (ratio < 4.5) context.report({
					node,
					message: `Contrast ratio ${ratio.toFixed(2)}:1 is below WCAG AA`,
					suggest: "Increase contrast between text and background"
				});
				return;
			}
			parent = context.getParent(parent);
		}
	}
});
//#endregion
export { color_contrast_default as default };

//# sourceMappingURL=color-contrast.js.map
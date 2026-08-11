import { defineRule } from "../rule.js";
//#region src/lint/rules/pixel-perfect.ts
var pixel_perfect_default = defineRule({
	meta: {
		id: "pixel-perfect",
		category: "layout",
		description: "Elements should align to whole pixels"
	},
	check(node, context) {
		const subpixel = [
			["x", node.x],
			["y", node.y],
			["width", node.width],
			["height", node.height]
		].filter(([, value]) => Math.abs(value - Math.round(value)) >= .01);
		if (subpixel.length === 0) return;
		context.report({
			node,
			message: `Subpixel values: ${subpixel.map(([k, v]) => `${k}: ${v}`).join(", ")}`,
			suggest: "Round to whole pixels for crisp rendering"
		});
	}
});
//#endregion
export { pixel_perfect_default as default };

//# sourceMappingURL=pixel-perfect.js.map
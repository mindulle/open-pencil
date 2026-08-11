import { defineRule } from "../rule.js";
//#region src/lint/rules/consistent-radius.ts
const SCALE = /* @__PURE__ */ new Set([
	0,
	2,
	4,
	6,
	8,
	12,
	16,
	20,
	24,
	32,
	9999
]);
var consistent_radius_default = defineRule({
	meta: {
		id: "consistent-radius",
		category: "layout",
		description: "Corner radius should follow the radius scale"
	},
	match: [
		"RECTANGLE",
		"FRAME",
		"COMPONENT",
		"INSTANCE"
	],
	check(node, context) {
		if (node.cornerRadius > 0 && !SCALE.has(node.cornerRadius)) context.report({
			node,
			message: `Corner radius ${node.cornerRadius}px is not in scale`,
			suggest: "Use a radius token or a scale value"
		});
	}
});
//#endregion
export { consistent_radius_default as default };

//# sourceMappingURL=consistent-radius.js.map
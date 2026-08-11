import { defineRule } from "../rule.js";
//#region src/lint/rules/effect-style-required.ts
var effect_style_required_default = defineRule({
	meta: {
		id: "effect-style-required",
		category: "design-tokens",
		description: "Effects should use shared effect presets or tokens"
	},
	check(node, context) {
		const visibleEffects = node.effects.filter((effect) => effect.visible);
		if (visibleEffects.length === 0) return;
		context.report({
			node,
			message: `Effect without shared style: ${visibleEffects.map((effect) => `${effect.type} ${effect.radius}px`).join(", ")}`,
			suggest: "Extract reusable shadows and blurs into shared presets or variables"
		});
	}
});
//#endregion
export { effect_style_required_default as default };

//# sourceMappingURL=effect-style-required.js.map
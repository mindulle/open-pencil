import { defineRule } from "../rule.js";
//#region src/lint/rules/no-detached-instances.ts
const PATTERNS = [
	/^(button|btn)/i,
	/^(input|field|text-?field)/i,
	/^(card|modal|dialog)/i,
	/^(icon|avatar|badge)/i,
	/^(nav|menu|tab)/i,
	/^(header|footer|sidebar)/i,
	/^(list|item|row)/i,
	/^(chip|tag|label)/i,
	/^(tooltip|popover|dropdown)/i
];
var no_detached_instances_default = defineRule({
	meta: {
		id: "no-detached-instances",
		category: "components",
		description: "Frames that look like components should be instances, not detached copies"
	},
	match: ["FRAME"],
	check(node, context) {
		if (node.componentId || !PATTERNS.some((p) => p.test(node.name)) || context.getChildren(node).length === 0 || node.layoutMode === "NONE") return;
		context.report({
			node,
			message: `Frame "${node.name}" looks like a component but isn't an instance`,
			suggest: "Use a component instance instead of a detached frame"
		});
	}
});
//#endregion
export { no_detached_instances_default as default };

//# sourceMappingURL=no-detached-instances.js.map
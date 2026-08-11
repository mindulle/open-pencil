import { defineRule } from "../rule.js";
//#region src/lint/rules/no-empty-frames.ts
var no_empty_frames_default = defineRule({
	meta: {
		id: "no-empty-frames",
		category: "structure",
		description: "Frames should not be empty unless used as spacers"
	},
	match: ["FRAME"],
	check(node, context) {
		if (context.getChildren(node).length > 0) return;
		const isSpacer = node.name.toLowerCase().includes("spacer") || node.width <= 1 || node.height <= 1;
		const hasFill = node.fills.some((f) => f.visible && f.type === "SOLID");
		if (!isSpacer && !hasFill) context.report({
			node,
			message: "Empty frame with no fill",
			suggest: "Delete if unused, or add content/fill"
		});
	}
});
//#endregion
export { no_empty_frames_default as default };

//# sourceMappingURL=no-empty-frames.js.map
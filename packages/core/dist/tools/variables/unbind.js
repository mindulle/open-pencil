import { defineTool } from "../schema.js";
//#region src/tools/variables/unbind.ts
const unbindVariable = defineTool({
	name: "unbind_variable",
	mutates: true,
	description: "Remove a variable binding from a node property.",
	params: {
		node_id: {
			type: "string",
			description: "Node ID",
			required: true
		},
		field: {
			type: "string",
			description: "Property field path to unbind. For fills/strokes use indexed format: \"fills/0/color\", \"strokes/0/color\". For FLOAT scalars: \"opacity\", \"width\", \"height\", \"cornerRadius\", \"fontSize\", \"letterSpacing\", \"lineHeight\", \"itemSpacing\", \"strokeWeight\", \"paddingLeft/Right/Top/Bottom\", \"counterAxisSpacing\", \"rotation\", \"x\", \"y\", \"minWidth\", \"maxWidth\", \"minHeight\", \"maxHeight\", \"topLeftRadius\", \"topRightRadius\", \"bottomLeftRadius\", \"bottomRightRadius\", \"borderTopWeight\", \"borderBottomWeight\", \"borderLeftWeight\", \"borderRightWeight\", \"gridRowGap\", \"gridColumnGap\". For STRING: \"fontFamily\". For BOOLEAN: \"visible\".",
			required: true
		}
	},
	execute: (figma, args) => {
		const rawNode = figma.graph.getNode(args.node_id);
		if (!rawNode) return { error: `Node "${args.node_id}" not found` };
		if (!rawNode.boundVariables[args.field]) return { error: `No binding found for field "${args.field}" on node "${args.node_id}"` };
		figma.unbindVariable(args.node_id, args.field);
		return {
			unbound: true,
			node_id: args.node_id,
			field: args.field
		};
	}
});
//#endregion
export { unbindVariable };

//# sourceMappingURL=unbind.js.map
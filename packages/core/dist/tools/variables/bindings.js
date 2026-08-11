import { defineTool } from "../schema.js";
//#region src/tools/variables/bindings.ts
const bindVariable = defineTool({
	name: "bind_variable",
	mutates: true,
	description: "Bind a variable to a node property. For fills/strokes color bindings use indexed format like \"fills/0/color\".",
	params: {
		node_id: {
			type: "string",
			description: "Node ID",
			required: true
		},
		field: {
			type: "string",
			description: "Property field path. For fills/strokes use indexed format: \"fills/0/color\", \"strokes/0/color\". For FLOAT scalars: \"opacity\", \"width\", \"height\", \"cornerRadius\", \"fontSize\", \"letterSpacing\", \"lineHeight\", \"itemSpacing\", \"strokeWeight\", \"paddingLeft/Right/Top/Bottom\", \"counterAxisSpacing\", \"rotation\", \"x\", \"y\", \"minWidth\", \"maxWidth\", \"minHeight\", \"maxHeight\", \"topLeftRadius\", \"topRightRadius\", \"bottomLeftRadius\", \"bottomRightRadius\", \"borderTopWeight\", \"borderBottomWeight\", \"borderLeftWeight\", \"borderRightWeight\", \"gridRowGap\", \"gridColumnGap\". For STRING: \"fontFamily\". For BOOLEAN: \"visible\".",
			required: true
		},
		variable_id: {
			type: "string",
			description: "Variable ID",
			required: true
		}
	},
	execute: (figma, args) => {
		if (!figma.getNodeById(args.node_id)) return { error: `Node "${args.node_id}" not found` };
		if (!figma.getVariableById(args.variable_id)) return { error: `Variable "${args.variable_id}" not found` };
		try {
			figma.bindVariable(args.node_id, args.field, args.variable_id);
		} catch (err) {
			return { error: err instanceof Error ? err.message : String(err) };
		}
		return {
			node_id: args.node_id,
			field: args.field,
			variable_id: args.variable_id
		};
	}
});
//#endregion
export { bindVariable };

//# sourceMappingURL=bindings.js.map
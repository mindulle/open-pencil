import { parseColor } from "../../color/index.js";
import { defineTool } from "../schema.js";
//#region src/tools/variables/values.ts
function parseVariableValue(type, value) {
	if (type === "COLOR") return parseColor(value);
	if (type === "FLOAT") return Number(value);
	if (type === "BOOLEAN") return value === "true";
	return value;
}
const createVariable = defineTool({
	name: "create_variable",
	mutates: true,
	description: "Create a new variable in a collection.",
	params: {
		name: {
			type: "string",
			description: "Variable name",
			required: true
		},
		type: {
			type: "string",
			description: "Variable type",
			required: true,
			enum: [
				"COLOR",
				"FLOAT",
				"STRING",
				"BOOLEAN"
			]
		},
		collection_id: {
			type: "string",
			description: "Collection ID",
			required: true
		},
		value: {
			type: "string",
			description: "Initial value (hex for COLOR, number for FLOAT, etc.)"
		}
	},
	execute: (figma, args) => {
		const type = args.type;
		const parsedValue = args.value === void 0 ? void 0 : parseVariableValue(type, args.value);
		return figma.createVariable(args.name, type, args.collection_id, parsedValue);
	}
});
const setVariable = defineTool({
	name: "set_variable",
	mutates: true,
	description: "Set the value of a variable for a specific mode.",
	params: {
		id: {
			type: "string",
			description: "Variable ID",
			required: true
		},
		mode: {
			type: "string",
			description: "Mode ID",
			required: true
		},
		value: {
			type: "string",
			description: "Value (hex for COLOR, number for FLOAT, etc.)",
			required: true
		}
	},
	execute: (figma, args) => {
		const variable = figma.getVariableById(args.id);
		if (!variable) return { error: `Variable "${args.id}" not found` };
		const parsedValue = parseVariableValue(variable.type, args.value);
		figma.setVariableValue(args.id, args.mode, parsedValue);
		return {
			id: args.id,
			mode: args.mode,
			value: parsedValue
		};
	}
});
const deleteVariable = defineTool({
	name: "delete_variable",
	mutates: true,
	description: "Delete a variable.",
	params: { id: {
		type: "string",
		description: "Variable ID",
		required: true
	} },
	execute: (figma, { id }) => {
		figma.deleteVariable(id);
		return { deleted: id };
	}
});
//#endregion
export { createVariable, deleteVariable, setVariable };

//# sourceMappingURL=values.js.map
import { defineTool, nodeToResult } from "../schema.js";
//#region src/tools/read/selection.ts
const getSelection = defineTool({
	name: "get_selection",
	description: "Get details about currently selected nodes.",
	params: {},
	execute: (figma) => {
		return { selection: figma.currentPage.selection.map(nodeToResult) };
	}
});
const selectNodes = defineTool({
	name: "select_nodes",
	mutates: true,
	description: "Select one or more nodes by ID.",
	params: { ids: {
		type: "string[]",
		description: "Node IDs to select",
		required: true
	} },
	execute: (figma, { ids }) => {
		figma.currentPage.selection = ids.map((id) => figma.getNodeById(id)).filter((node) => node !== null);
		return { selected: ids };
	}
});
//#endregion
export { getSelection, selectNodes };

//# sourceMappingURL=selection.js.map
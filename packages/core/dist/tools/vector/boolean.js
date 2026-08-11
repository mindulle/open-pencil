import { defineTool, nodeSummary } from "../schema.js";
//#region src/tools/vector/boolean.ts
const booleanUnion = defineTool({
	name: "boolean_union",
	mutates: true,
	description: "Union (combine) multiple nodes.",
	params: { ids: {
		type: "string[]",
		description: "Node IDs to union",
		required: true
	} },
	execute: (figma, { ids }) => {
		return nodeSummary(figma.booleanOperation("UNION", ids));
	}
});
const booleanSubtract = defineTool({
	name: "boolean_subtract",
	mutates: true,
	description: "Subtract the second node from the first.",
	params: { ids: {
		type: "string[]",
		description: "Node IDs (first minus rest)",
		required: true
	} },
	execute: (figma, { ids }) => {
		return nodeSummary(figma.booleanOperation("SUBTRACT", ids));
	}
});
const booleanIntersect = defineTool({
	name: "boolean_intersect",
	mutates: true,
	description: "Intersect multiple nodes.",
	params: { ids: {
		type: "string[]",
		description: "Node IDs to intersect",
		required: true
	} },
	execute: (figma, { ids }) => {
		return nodeSummary(figma.booleanOperation("INTERSECT", ids));
	}
});
const booleanExclude = defineTool({
	name: "boolean_exclude",
	mutates: true,
	description: "Exclude (XOR) multiple nodes.",
	params: { ids: {
		type: "string[]",
		description: "Node IDs to exclude",
		required: true
	} },
	execute: (figma, { ids }) => {
		return nodeSummary(figma.booleanOperation("EXCLUDE", ids));
	}
});
//#endregion
export { booleanExclude, booleanIntersect, booleanSubtract, booleanUnion };

//# sourceMappingURL=boolean.js.map
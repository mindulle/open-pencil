import { defineTool, nodeSummary } from "../schema.js";
//#region src/tools/structure/hierarchy.ts
const reparentNode = defineTool({
	name: "reparent_node",
	mutates: true,
	description: "Move a node into a different parent.",
	params: {
		id: {
			type: "string",
			description: "Node ID to move",
			required: true
		},
		parent_id: {
			type: "string",
			description: "New parent node ID",
			required: true
		}
	},
	execute: (figma, { id, parent_id }) => {
		const node = figma.getNodeById(id);
		const parent = figma.getNodeById(parent_id);
		if (!node) return { error: `Node "${id}" not found` };
		if (!parent) return { error: `Parent "${parent_id}" not found` };
		parent.appendChild(node);
		return {
			id,
			parent_id
		};
	}
});
const groupNodes = defineTool({
	name: "group_nodes",
	mutates: true,
	description: "Group selected nodes.",
	params: { ids: {
		type: "string[]",
		description: "Node IDs to group",
		required: true
	} },
	execute: (figma, { ids }) => {
		const nodes = ids.map((id) => figma.getNodeById(id)).filter((node) => node !== null);
		if (nodes.length < 2) return { error: "Need at least 2 nodes to group" };
		const parent = nodes[0].parent ?? figma.currentPage;
		return nodeSummary(figma.group(nodes, parent));
	}
});
const ungroupNode = defineTool({
	name: "ungroup_node",
	mutates: true,
	description: "Ungroup a group node.",
	params: { id: {
		type: "string",
		description: "Group node ID",
		required: true
	} },
	execute: (figma, { id }) => {
		const node = figma.getNodeById(id);
		if (!node) return { error: `Node "${id}" not found` };
		figma.ungroup(node);
		return { ungrouped: id };
	}
});
const flattenNodes = defineTool({
	name: "flatten_nodes",
	mutates: true,
	description: "Flatten nodes into a single vector.",
	params: { ids: {
		type: "string[]",
		description: "Node IDs to flatten",
		required: true
	} },
	execute: (figma, { ids }) => {
		return nodeSummary(figma.flattenNode(ids));
	}
});
const nodeToComponent = defineTool({
	name: "node_to_component",
	mutates: true,
	description: "Convert one or more frames/groups into components.",
	params: { ids: {
		type: "string[]",
		description: "Node IDs to convert",
		required: true
	} },
	execute: (figma, { ids }) => {
		const results = [];
		for (const id of ids) {
			const node = figma.getNodeById(id);
			if (!node) continue;
			const comp = figma.createComponentFromNode(node);
			results.push({
				id: comp.id,
				name: comp.name,
				originalId: id
			});
		}
		return { converted: results };
	}
});
//#endregion
export { flattenNodes, groupNodes, nodeToComponent, reparentNode, ungroupNode };

//# sourceMappingURL=hierarchy.js.map
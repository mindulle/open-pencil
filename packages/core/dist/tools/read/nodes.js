import { defineTool, nodeSummary, nodeToResult } from "../schema.js";
//#region src/tools/read/nodes.ts
function nodeToTreeEntry(node, level, maxDepth, typeFilter) {
	const children = [];
	if ((maxDepth === void 0 || level < maxDepth) && node.children.length > 0) for (const child of node.children) {
		const entry = nodeToTreeEntry(child, level + 1, maxDepth, typeFilter);
		if (entry) children.push(entry);
	}
	if (!(!typeFilter || typeFilter.has(node.type)) && children.length === 0) return null;
	const entry = {
		id: node.id,
		type: node.type,
		name: node.name,
		w: node.width,
		h: node.height
	};
	if (children.length > 0) entry.children = children;
	return entry;
}
const getPageTree = defineTool({
	name: "get_page_tree",
	description: "Get the node tree of the current page. Returns lightweight hierarchy: id, type, name, size. Use depth, root_id, or node_types to keep large pages small. Use get_node for full properties of a specific node.",
	params: {
		depth: {
			type: "number",
			description: "Max nesting depth to return (1 = returned root nodes only). Default: unlimited",
			min: 1
		},
		root_id: {
			type: "string",
			description: "Return only this node subtree instead of the whole current page"
		},
		node_types: {
			type: "string[]",
			description: "Keep only these node types and their ancestors, for example FRAME or TEXT"
		}
	},
	execute: (figma, { depth, root_id, node_types }) => {
		const typeFilter = node_types && node_types.length > 0 ? new Set(node_types) : void 0;
		if (root_id !== void 0) {
			const root = figma.getNodeById(root_id);
			if (!root) return { error: `Node "${root_id}" not found` };
			return {
				root: root.id,
				tree: nodeToTreeEntry(root, 1, depth, typeFilter)
			};
		}
		const page = figma.currentPage;
		const children = [];
		for (const child of page.children) {
			const entry = nodeToTreeEntry(child, 1, depth, typeFilter);
			if (entry) children.push(entry);
		}
		return {
			page: page.name,
			children
		};
	}
});
const getNode = defineTool({
	name: "get_node",
	description: "Get detailed properties of a node by ID. Use depth to limit child recursion (0 = node only, 1 = direct children, etc). Default: unlimited.",
	params: {
		id: {
			type: "string",
			description: "Node ID",
			required: true
		},
		depth: {
			type: "number",
			description: "Max depth of children to include (0 = no children). Default: unlimited"
		}
	},
	execute: (figma, { id, depth }) => {
		const node = figma.getNodeById(id);
		if (!node) return { error: `Node "${id}" not found` };
		return nodeToResult(node, depth);
	}
});
const findNodes = defineTool({
	name: "find_nodes",
	description: "Find nodes by name pattern and/or type.",
	params: {
		name: {
			type: "string",
			description: "Name substring to match (case-insensitive)"
		},
		type: {
			type: "string",
			description: "Node type filter",
			enum: [
				"FRAME",
				"RECTANGLE",
				"ELLIPSE",
				"TEXT",
				"LINE",
				"STAR",
				"POLYGON",
				"SECTION",
				"GROUP",
				"COMPONENT",
				"INSTANCE",
				"VECTOR"
			]
		}
	},
	execute: (figma, args) => {
		const matches = figma.currentPage.findAll((node) => {
			if (args.type && node.type !== args.type) return false;
			if (args.name && !node.name.toLowerCase().includes(args.name.toLowerCase())) return false;
			return true;
		});
		return {
			count: matches.length,
			nodes: matches.map(nodeSummary)
		};
	}
});
//#endregion
export { findNodes, getNode, getPageTree };

//# sourceMappingURL=nodes.js.map
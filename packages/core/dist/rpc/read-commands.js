import { queryByXPath } from "../xpath.js";
//#region src/rpc/read-commands.ts
/** Walk descendants. Callback returns `false` to stop traversal. */
function walkNodes(graph, rootId, fn) {
	const node = graph.getNode(rootId);
	if (!node) return true;
	if (!fn(node)) return false;
	for (const childId of node.childIds) if (!walkNodes(graph, childId, fn)) return false;
	return true;
}
function countDescendants(graph, rootId) {
	let count = 0;
	walkNodes(graph, rootId, () => {
		count++;
		return true;
	});
	return count;
}
function countNodes(graph, pageId) {
	return graph.getNode(pageId)?.childIds.reduce((count, id) => count + countDescendants(graph, id), 0) ?? 0;
}
function nodeFrame(node) {
	return {
		x: Math.round(node.x),
		y: Math.round(node.y),
		width: Math.round(node.width),
		height: Math.round(node.height)
	};
}
const infoCommand = {
	name: "info",
	execute: (graph) => {
		const pages = graph.getPages();
		let totalNodes = 0;
		const types = {};
		const fonts = /* @__PURE__ */ new Set();
		const pageCounts = {};
		const countNode = (node) => {
			totalNodes++;
			types[node.type] = (types[node.type] ?? 0) + 1;
			if (node.fontFamily) fonts.add(node.fontFamily);
			return true;
		};
		for (const page of pages) {
			const beforePage = totalNodes;
			for (const cid of page.childIds) walkNodes(graph, cid, countNode);
			pageCounts[page.name] = totalNodes - beforePage;
		}
		return {
			pages: pages.length,
			totalNodes,
			types,
			fonts: [...fonts].sort(),
			pageCounts
		};
	}
};
const pagesCommand = {
	name: "pages",
	execute: (graph) => {
		return graph.getPages().map((p) => ({
			id: p.id,
			name: p.name,
			nodes: countNodes(graph, p.id)
		}));
	}
};
function buildTreeNode(graph, id, depth, maxDepth) {
	const node = graph.getNode(id);
	if (!node) return null;
	const result = {
		id: node.id,
		name: node.name,
		type: node.type,
		...nodeFrame(node)
	};
	if (node.childIds.length > 0 && depth < maxDepth) result.children = node.childIds.map((cid) => buildTreeNode(graph, cid, depth + 1, maxDepth)).filter((n) => n !== null);
	return result;
}
const treeCommand = {
	name: "tree",
	execute: (graph, args) => {
		const pages = graph.getPages();
		const maxDepth = args.depth ?? Infinity;
		const page = args.page ? pages.find((p) => p.name === args.page) : pages[0];
		if (!page) return { error: `Page "${args.page}" not found. Available: ${pages.map((p) => p.name).join(", ")}` };
		return {
			page: {
				id: page.id,
				name: page.name,
				type: page.type
			},
			children: page.childIds.map((cid) => buildTreeNode(graph, cid, 0, maxDepth)).filter((n) => n !== null)
		};
	}
};
const findCommand = {
	name: "find",
	execute: (graph, args) => {
		const pages = graph.getPages();
		const max = args.limit ?? 100;
		const namePattern = args.name?.toLowerCase();
		const typeFilter = args.type?.toUpperCase();
		const results = [];
		const searchPage = (page) => {
			for (const cid of page.childIds) if (!walkNodes(graph, cid, (node) => {
				if (results.length >= max) return false;
				const matchesName = !namePattern || node.name.toLowerCase().includes(namePattern);
				const matchesType = !typeFilter || node.type === typeFilter;
				if (matchesName && matchesType) results.push({
					id: node.id,
					name: node.name,
					type: node.type,
					width: Math.round(node.width),
					height: Math.round(node.height)
				});
				return true;
			})) break;
		};
		if (args.page) {
			const page = pages.find((p) => p.name === args.page);
			if (page) searchPage(page);
		} else for (const page of pages) searchPage(page);
		return results;
	}
};
const queryCommand = {
	name: "query",
	execute: async (graph, args) => {
		try {
			return (await queryByXPath(graph, args.selector, {
				page: args.page,
				limit: args.limit
			})).map((n) => ({
				id: n.id,
				name: n.name,
				type: n.type,
				x: Math.round(n.x),
				y: Math.round(n.y),
				width: Math.round(n.width),
				height: Math.round(n.height)
			}));
		} catch (err) {
			return { error: `XPath error: ${err instanceof Error ? err.message : String(err)}` };
		}
	}
};
const nodeCommand = {
	name: "node",
	execute: (graph, args) => {
		const node = graph.getNode(args.id);
		if (!node) return { error: `Node "${args.id}" not found` };
		const parent = node.parentId ? graph.getNode(node.parentId) : void 0;
		const boundVars = {};
		for (const [field, varId] of Object.entries(node.boundVariables)) boundVars[field] = graph.variables.get(varId)?.name ?? varId;
		return {
			id: node.id,
			name: node.name,
			type: node.type,
			...nodeFrame(node),
			visible: node.visible,
			locked: node.locked,
			opacity: node.opacity,
			rotation: node.rotation,
			fills: node.fills,
			strokes: node.strokes,
			effects: node.effects,
			cornerRadius: node.cornerRadius,
			blendMode: node.blendMode,
			layoutMode: node.layoutMode,
			layoutDirection: node.layoutDirection,
			fontFamily: node.fontFamily,
			fontSize: node.fontSize,
			fontWeight: node.fontWeight,
			textDirection: node.textDirection,
			text: (() => {
				if (!node.text.length) return null;
				if (node.text.length > 200) return node.text.slice(0, 200) + "…";
				return node.text;
			})(),
			parent: parent ? {
				id: parent.id,
				name: parent.name,
				type: parent.type
			} : null,
			children: node.childIds.length,
			boundVariables: boundVars
		};
	}
};
//#endregion
export { findCommand, infoCommand, nodeCommand, pagesCommand, queryCommand, treeCommand };

//# sourceMappingURL=read-commands.js.map
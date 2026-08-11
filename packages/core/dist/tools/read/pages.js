import { defineTool } from "../schema.js";
import { computeBounds } from "@open-pencil/scene-graph/geometry";
//#region src/tools/read/pages.ts
const listPages = defineTool({
	name: "list_pages",
	description: "List all pages in the document.",
	params: {},
	execute: (figma) => {
		const pages = figma.root.children;
		return {
			current: figma.currentPage.name,
			pages: pages.map((page) => ({
				id: page.id,
				name: page.name
			}))
		};
	}
});
const switchPage = defineTool({
	name: "switch_page",
	mutates: true,
	description: "Switch to a different page by name or ID.",
	params: { page: {
		type: "string",
		description: "Page name or ID",
		required: true
	} },
	execute: (figma, { page }) => {
		const target = figma.root.children.find((candidate) => candidate.name === page) ?? figma.getNodeById(page);
		if (!target) return { error: `Page "${page}" not found` };
		figma.currentPage = target;
		return {
			page: target.name,
			id: target.id
		};
	}
});
const getCurrentPage = defineTool({
	name: "get_current_page",
	description: "Get the current page name and ID.",
	params: {},
	execute: (figma) => {
		return {
			id: figma.currentPage.id,
			name: figma.currentPage.name
		};
	}
});
const pageBounds = defineTool({
	name: "page_bounds",
	description: "Get bounding box of all objects on the current page.",
	params: {},
	execute: (figma) => {
		return computeBounds(figma.currentPage.children.map((child) => child.absoluteBoundingBox));
	}
});
//#endregion
export { getCurrentPage, listPages, pageBounds, switchPage };

//# sourceMappingURL=pages.js.map
import { parseColor } from "../../color/index.js";
import { fetchIcons, searchIconsBatch } from "../../icons/index.js";
import { createIconFromPaths } from "../../icons/render.js";
import { defineTool } from "../schema.js";
//#region src/tools/create/icons.ts
const fetchIconsTool = defineTool({
	name: "fetch_icons",
	description: "Pre-fetch icons from Iconify into cache. Batches by prefix (one HTTP request per set). Call this once with all needed icons, then use insert_icon to place them instantly. Popular sets: lucide (outline), mdi (filled), heroicons, tabler, solar, mingcute, ri (remix).",
	params: {
		names: {
			type: "string[]",
			description: "Icon names as prefix:name (e.g. [\"lucide:heart\", \"lucide:home\", \"mdi:star\"])",
			required: true
		},
		size: {
			type: "number",
			description: "Icon size in pixels (default: 24)"
		}
	},
	execute: async (_figma, args) => {
		const size = args.size ?? 24;
		try {
			const icons = await fetchIcons(args.names, size);
			const fetched = [...icons.keys()];
			const notFound = args.names.filter((name) => !icons.has(name));
			const result = {
				fetched,
				count: fetched.length
			};
			if (notFound.length > 0) result.not_found = notFound;
			return result;
		} catch (e) {
			return { error: e.message };
		}
	}
});
const insertIcon = defineTool({
	name: "insert_icon",
	mutates: true,
	description: "Insert one or more vector icons onto the canvas. Pass a single name or multiple names to batch-insert into the same parent. If already cached by fetch_icons — instant, no network request.",
	params: {
		names: {
			type: "string[]",
			description: "Icon names as prefix:name (e.g. [\"lucide:heart\"] or [\"lucide:heart\",\"lucide:home\",\"lucide:star\"])"
		},
		name: {
			type: "string",
			description: "Single icon name (shorthand for names with one icon)"
		},
		size: {
			type: "number",
			description: "Icon size in pixels (default: 24)"
		},
		color: {
			type: "color",
			description: "Icon color hex (replaces currentColor). Default: #000000"
		},
		parent_id: {
			type: "string",
			description: "Parent node ID for all icons"
		}
	},
	execute: async (figma, args) => {
		const names = args.names ?? (args.name ? [args.name] : []);
		if (names.length === 0) return { error: "Provide \"names\" (array) or \"name\" (string)" };
		const size = args.size ?? 24;
		const parsedColor = parseColor(args.color ?? "#000000");
		let icons;
		try {
			icons = await fetchIcons(names, size);
		} catch (e) {
			return { error: e.message };
		}
		const inserted = [];
		const notFound = [];
		for (const name of names) {
			const icon = icons.get(name);
			if (!icon || icon.paths.length === 0) {
				notFound.push(name);
				continue;
			}
			const parentId = args.parent_id ?? figma.currentPage.id;
			const frame = createIconFromPaths(figma.graph, icon, name, size, parsedColor, parentId);
			inserted.push({
				id: frame.id,
				name: frame.name,
				icon: name
			});
		}
		if (args.name && inserted.length === 1) return {
			id: inserted[0].id,
			name: inserted[0].name,
			type: "FRAME"
		};
		const result = { inserted };
		if (notFound.length > 0) result.not_found = notFound;
		return result;
	}
});
const searchIconsTool = defineTool({
	name: "search_icons",
	description: "Search Iconify for icons by keyword. Accepts multiple queries — all searched in parallel. Returns results keyed by query.",
	params: {
		queries: {
			type: "string[]",
			description: "Search keywords (e.g. [\"heart\", \"arrow\", \"settings\"])",
			required: true
		},
		limit: {
			type: "number",
			description: "Max results per query (default: 5)"
		},
		prefix: {
			type: "string",
			description: "Filter by icon set prefix (e.g. \"lucide\", \"mdi\")"
		}
	},
	execute: async (_figma, args) => {
		try {
			const results = await searchIconsBatch(args.queries, {
				limit: args.limit ?? 5,
				prefix: args.prefix
			});
			const output = {};
			for (const [query, result] of results) output[query] = {
				icons: result.icons,
				total: result.total
			};
			return output;
		} catch (e) {
			return { error: e.message };
		}
	}
});
//#endregion
export { fetchIconsTool, insertIcon, searchIconsTool };

//# sourceMappingURL=icons.js.map
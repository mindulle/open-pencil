import { defineTool } from "../schema.js";
import { uniq } from "es-toolkit/array";
//#region src/tools/read/fonts.ts
const listFonts = defineTool({
	name: "list_fonts",
	description: "List fonts used in the current page.",
	params: { family: {
		type: "string",
		description: "Filter by family name (substring)"
	} },
	execute: (figma, args) => {
		const fonts = /* @__PURE__ */ new Map();
		figma.currentPage.findAll((node) => {
			if (node.type === "TEXT") {
				const raw = figma.graph.getNode(node.id);
				if (raw) {
					const key = raw.fontFamily;
					if (!fonts.has(key)) fonts.set(key, /* @__PURE__ */ new Set());
					fonts.get(key)?.add(raw.fontWeight);
				}
			}
			return false;
		});
		let result = [...fonts.entries()].map(([family, weights]) => ({
			family,
			weights: [...weights].sort((a, b) => a - b)
		}));
		if (args.family) {
			const q = args.family.toLowerCase();
			result = result.filter((font) => font.family.toLowerCase().includes(q));
		}
		return {
			count: result.length,
			fonts: result
		};
	}
});
const listAvailableFonts = defineTool({
	name: "list_available_fonts",
	description: "List font families the host can render (system fonts on desktop plus any bundled fonts). Use this to discover what fonts are available to set on a text node — distinct from list_fonts which only reports families currently used in the page.",
	params: { family: {
		type: "string",
		description: "Filter by family name (substring, case-insensitive)"
	} },
	execute: async (figma, args) => {
		let families = uniq((await figma.listAvailableFontsAsync()).map((font) => font.fontName.family));
		if (args.family) {
			const q = args.family.toLowerCase();
			families = families.filter((family) => family.toLowerCase().includes(q));
		}
		families.sort((a, b) => a.localeCompare(b));
		return {
			count: families.length,
			fonts: families
		};
	}
});
//#endregion
export { listAvailableFonts, listFonts };

//# sourceMappingURL=fonts.js.map
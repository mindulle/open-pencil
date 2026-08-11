import { colorDistance, colorToHex } from "../../color/index.js";
import { defineTool } from "../schema.js";
import { orderBy } from "es-toolkit/array";
import { sumBy } from "es-toolkit/math";
//#region src/tools/analyze/colors.ts
function trackColor(colorMap, color, variableName) {
	const hex = colorToHex(color);
	const entry = colorMap.get(hex);
	if (entry) {
		entry.count++;
		if (!entry.variableName && variableName) entry.variableName = variableName;
	} else colorMap.set(hex, {
		hex,
		color,
		count: 1,
		variableName
	});
}
const analyzeColors = defineTool({
	name: "analyze_colors",
	description: "Analyze color palette usage across the current page. Shows frequency, variable bindings, and optionally clusters similar colors.",
	params: {
		limit: {
			type: "number",
			description: "Max colors to return (default: 30)"
		},
		show_similar: {
			type: "boolean",
			description: "Include similar-color clusters for potential merging"
		},
		threshold: {
			type: "number",
			description: "Distance threshold for clustering (0-50, default: 15)"
		}
	},
	execute: (figma, args) => {
		const limit = args.limit ?? 30;
		const threshold = args.threshold ?? 15;
		const page = figma.currentPage;
		const colorMap = /* @__PURE__ */ new Map();
		let totalNodes = 0;
		page.findAll((node) => {
			totalNodes++;
			const raw = figma.graph.getNode(node.id);
			if (!raw) return false;
			const boundVars = raw.boundVariables;
			for (let i = 0; i < raw.fills.length; i++) {
				const fill = raw.fills[i];
				if (fill.type === "SOLID" && fill.visible) {
					const varId = boundVars[`fills/${i}/color`];
					const variable = varId ? figma.graph.variables.get(varId) : void 0;
					trackColor(colorMap, fill.color, variable?.name ?? null);
				}
			}
			for (let i = 0; i < raw.strokes.length; i++) {
				const stroke = raw.strokes[i];
				if (stroke.visible) {
					const varId = boundVars[`strokes/${i}/color`];
					const variable = varId ? figma.graph.variables.get(varId) : void 0;
					trackColor(colorMap, stroke.color, variable?.name ?? null);
				}
			}
			return false;
		});
		const colors = orderBy([...colorMap.values()], ["count"], ["desc"]).slice(0, limit);
		const result = {
			totalNodes,
			uniqueColors: colorMap.size,
			colors: colors.map((c) => ({
				hex: c.hex,
				count: c.count,
				variableName: c.variableName
			}))
		};
		if (args.show_similar) {
			const hardcoded = orderBy([...colorMap.values()].filter((c) => !c.variableName), ["count"], ["desc"]);
			const used = /* @__PURE__ */ new Set();
			const clusters = [];
			for (const color of hardcoded) {
				if (used.has(color.hex)) continue;
				const cluster = [color];
				used.add(color.hex);
				for (const other of hardcoded) {
					if (used.has(other.hex)) continue;
					if (colorDistance(color.color, other.color) <= threshold) {
						cluster.push(other);
						used.add(other.hex);
					}
				}
				if (cluster.length > 1) clusters.push({
					colors: cluster.map((c) => c.hex),
					totalCount: sumBy(cluster, (color) => color.count),
					suggestedHex: color.hex
				});
			}
			result.similarClusters = orderBy(clusters, [(cluster) => cluster.colors.length], ["desc"]);
		}
		return result;
	}
});
//#endregion
export { analyzeColors };

//# sourceMappingURL=colors.js.map
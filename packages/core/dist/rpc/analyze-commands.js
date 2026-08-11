import { colorDistance, colorToHex } from "../color/index.js";
import { computeOverlaps } from "../tools/analyze/overlaps/index.js";
import { orderBy, sortBy } from "es-toolkit/array";
//#region src/rpc/analyze-commands.ts
function clusterColors(colors, threshold) {
	const clusters = [];
	const used = /* @__PURE__ */ new Set();
	const sorted = orderBy(colors, ["count"], ["desc"]);
	for (const color of sorted) {
		if (used.has(color.hex)) continue;
		const cluster = {
			colors: [color],
			suggestedHex: color.hex,
			totalCount: color.count
		};
		used.add(color.hex);
		for (const other of sorted) {
			if (used.has(other.hex)) continue;
			if (colorDistance(color.color, other.color) <= threshold) {
				cluster.colors.push(other);
				cluster.totalCount += other.count;
				used.add(other.hex);
			}
		}
		if (cluster.colors.length > 1) clusters.push(cluster);
	}
	return orderBy(clusters, [(cluster) => cluster.colors.length], ["desc"]);
}
function collectColors(graph) {
	const colorMap = /* @__PURE__ */ new Map();
	let totalNodes = 0;
	const addColor = (c, variableName) => {
		const hex = colorToHex(c).toLowerCase();
		const existing = colorMap.get(hex);
		if (existing) {
			existing.count++;
			if (variableName && !existing.variableName) existing.variableName = variableName;
		} else colorMap.set(hex, {
			hex,
			color: c,
			count: 1,
			variableName
		});
	};
	for (const node of graph.getAllNodes()) {
		if (node.type === "CANVAS") continue;
		totalNodes++;
		for (const fill of node.fills) {
			if (!fill.visible || fill.type !== "SOLID") continue;
			addColor(fill.color, null);
		}
		for (const stroke of node.strokes) {
			if (!stroke.visible) continue;
			addColor(stroke.color, null);
		}
		for (const effect of node.effects) {
			if (!effect.visible) continue;
			addColor(effect.color, null);
		}
		for (const [field, varId] of Object.entries(node.boundVariables)) {
			if (!field.includes("fill") && !field.includes("stroke") && !field.includes("color")) continue;
			const variable = graph.variables.get(varId);
			if (variable) {
				const resolvedColor = graph.resolveColorVariable(varId);
				if (resolvedColor) {
					const hex = colorToHex(resolvedColor).toLowerCase();
					const existing = colorMap.get(hex);
					if (existing) existing.variableName = variable.name;
				}
			}
		}
	}
	return {
		colors: [...colorMap.values()],
		totalNodes
	};
}
const analyzeColorsCommand = {
	name: "analyze_colors",
	execute: (graph, args) => {
		const { colors, totalNodes } = collectColors(graph);
		const clusters = args.similar ? clusterColors(colors.filter((c) => !c.variableName), args.threshold ?? 15) : [];
		return {
			colors: orderBy(colors, ["count"], ["desc"]),
			totalNodes,
			clusters
		};
	}
};
const analyzeTypographyCommand = {
	name: "analyze_typography",
	execute: (graph) => {
		const styleMap = /* @__PURE__ */ new Map();
		let totalTextNodes = 0;
		for (const node of graph.getAllNodes()) {
			if (node.type !== "TEXT") continue;
			totalTextNodes++;
			const lh = node.lineHeight === null ? "auto" : `${node.lineHeight}px`;
			const key = `${node.fontFamily}|${node.fontSize}|${node.fontWeight}|${lh}`;
			const existing = styleMap.get(key);
			if (existing) existing.count++;
			else styleMap.set(key, {
				family: node.fontFamily,
				size: node.fontSize,
				weight: node.fontWeight,
				lineHeight: lh,
				count: 1
			});
		}
		return {
			styles: orderBy([...styleMap.values()], ["count"], ["desc"]),
			totalTextNodes
		};
	}
};
const analyzeSpacingCommand = {
	name: "analyze_spacing",
	execute: (graph) => {
		const gapMap = /* @__PURE__ */ new Map();
		const paddingMap = /* @__PURE__ */ new Map();
		let totalNodes = 0;
		for (const node of graph.getAllNodes()) {
			if (node.type === "CANVAS" || node.layoutMode === "NONE") continue;
			totalNodes++;
			if (node.itemSpacing > 0) gapMap.set(node.itemSpacing, (gapMap.get(node.itemSpacing) ?? 0) + 1);
			if (node.counterAxisSpacing > 0) gapMap.set(node.counterAxisSpacing, (gapMap.get(node.counterAxisSpacing) ?? 0) + 1);
			for (const pad of [
				node.paddingTop,
				node.paddingRight,
				node.paddingBottom,
				node.paddingLeft
			]) if (pad > 0) paddingMap.set(pad, (paddingMap.get(pad) ?? 0) + 1);
		}
		const toValues = (map) => orderBy([...map.entries()].map(([value, count]) => ({
			value,
			count
		})), ["count"], ["desc"]);
		return {
			gaps: toValues(gapMap),
			paddings: toValues(paddingMap),
			totalNodes
		};
	}
};
function buildSignature(graph, node) {
	const childTypes = /* @__PURE__ */ new Map();
	for (const childId of node.childIds) {
		const child = graph.getNode(childId);
		if (!child) continue;
		childTypes.set(child.type, (childTypes.get(child.type) ?? 0) + 1);
	}
	const childPart = sortBy([...childTypes.entries()], [([type]) => type]).map(([type, count]) => `${type}:${count}`).join(",");
	const w = Math.round(node.width / 10) * 10;
	const h = Math.round(node.height / 10) * 10;
	return `${node.type}:${w}x${h}|${childPart}`;
}
const analyzeClustersCommand = {
	name: "analyze_clusters",
	execute: (graph, args) => {
		const minSize = args.minSize ?? 30;
		const minCount = args.minCount ?? 2;
		const limit = args.limit ?? 20;
		const sigMap = /* @__PURE__ */ new Map();
		let totalNodes = 0;
		for (const node of graph.getAllNodes()) {
			if (node.type === "CANVAS") continue;
			totalNodes++;
			if (node.width < minSize || node.height < minSize) continue;
			if (node.childIds.length === 0) continue;
			const sig = buildSignature(graph, node);
			const arr = sigMap.get(sig) ?? [];
			arr.push({
				id: node.id,
				name: node.name,
				type: node.type,
				width: Math.round(node.width),
				height: Math.round(node.height),
				childCount: node.childIds.length
			});
			sigMap.set(sig, arr);
		}
		return {
			clusters: orderBy([...sigMap.entries()].filter(([, nodes]) => nodes.length >= minCount).map(([signature, nodes]) => ({
				signature,
				nodes
			})), [(cluster) => cluster.nodes.length], ["desc"]).slice(0, limit),
			totalNodes
		};
	}
};
const analyzeOverlapsCommand = {
	name: "analyze_overlaps",
	execute: (graph, args) => computeOverlaps(graph, args)
};
//#endregion
export { analyzeClustersCommand, analyzeColorsCommand, analyzeOverlapsCommand, analyzeSpacingCommand, analyzeTypographyCommand };

//# sourceMappingURL=analyze-commands.js.map
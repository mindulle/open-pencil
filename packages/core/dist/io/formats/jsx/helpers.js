import { colorToHex8 } from "../../../color/index.js";
//#region src/io/formats/jsx/helpers.ts
function formatColor(color, opacity = 1) {
	return colorToHex8(color, opacity);
}
function solidFillColor(fills) {
	const visible = fills.filter((f) => f.visible && f.type === "SOLID");
	if (visible.length !== 1) return null;
	return formatColor(visible[0].color, visible[0].opacity);
}
function solidStroke(strokes) {
	const visible = strokes.filter((s) => s.visible);
	if (visible.length !== 1) return null;
	const s = visible[0];
	return {
		color: formatColor(s.color, s.opacity),
		weight: s.weight,
		dash: s.dashPattern && s.dashPattern.length > 0 ? [...s.dashPattern] : null
	};
}
function formatShadow(e) {
	if (e.type !== "DROP_SHADOW" && e.type !== "INNER_SHADOW") return null;
	return `${e.offset.x} ${e.offset.y} ${e.radius} ${formatColor(e.color, e.color.a)}`;
}
const JSX_ENTITY = {
	"{": "&#123;",
	"}": "&#125;",
	"<": "&lt;",
	">": "&gt;",
	"&": "&amp;"
};
function escapeJSXText(text) {
	return text.replace(/[{}<>&]/g, (c) => JSX_ENTITY[c]);
}
function formatProp(key, value) {
	if (typeof value === "string") return `${key}="${value}"`;
	if (typeof value === "number") return `${key}={${value}}`;
	if (typeof value === "boolean") return value ? key : `${key}={false}`;
	return `${key}={${JSON.stringify(value)}}`;
}
function getNodeContext(node, graph) {
	const parent = node.parentId ? graph.getNode(node.parentId) : null;
	return {
		isAutoLayout: node.layoutMode !== "NONE",
		isGrid: node.layoutMode === "GRID",
		isFlex: node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL",
		parentIsAutoLayout: parent ? parent.layoutMode !== "NONE" : false,
		parentIsGrid: parent ? parent.layoutMode === "GRID" : false
	};
}
function collectPadding(node) {
	const { paddingTop: pt, paddingRight: pr, paddingBottom: pb, paddingLeft: pl } = node;
	if (pt === 0 && pr === 0 && pb === 0 && pl === 0) return null;
	return {
		pt,
		pr,
		pb,
		pl
	};
}
function emitPadding(edges, uniform, symmetric, individual) {
	const { pt, pr, pb, pl } = edges;
	if (pt === pr && pr === pb && pb === pl) return [uniform(pt)];
	if (pt === pb && pl === pr) return symmetric(pt, pl);
	return individual(edges);
}
function collectCornerRadii(node) {
	if (node.cornerRadius <= 0) return null;
	if (node.independentCorners) return {
		tl: node.topLeftRadius,
		tr: node.topRightRadius,
		br: node.bottomRightRadius,
		bl: node.bottomLeftRadius
	};
	const r = node.cornerRadius;
	return {
		tl: r,
		tr: r,
		br: r,
		bl: r
	};
}
function formatTrack(t) {
	if (t.sizing === "FR") return `${t.value}fr`;
	if (t.sizing === "FIXED") return `${t.value}px`;
	return "auto";
}
function formatTracks(tracks) {
	return tracks.map(formatTrack).join(" ");
}
//#endregion
export { collectCornerRadii, collectPadding, emitPadding, escapeJSXText, formatColor, formatProp, formatShadow, formatTrack, formatTracks, getNodeContext, solidFillColor, solidStroke };

//# sourceMappingURL=helpers.js.map
//#region src/io/formats/svg/node.ts
function svg(tag, attrs, ...children) {
	const cleaned = {};
	for (const [k, v] of Object.entries(attrs)) if (v != null) cleaned[k] = v;
	return {
		tag,
		attrs: cleaned,
		children: children.filter((c) => c != null && c !== false)
	};
}
function escapeAttr(value) {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
function escapeText(value) {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function renderAttrs(attrs) {
	const parts = [];
	for (const [k, v] of Object.entries(attrs)) parts.push(`${k}="${escapeAttr(String(v))}"`);
	return parts.length > 0 ? " " + parts.join(" ") : "";
}
function renderSVGNode(node, indent = 0) {
	const pad = "  ".repeat(indent);
	const attrsStr = renderAttrs(node.attrs);
	if (node.children.length === 0) return `${pad}<${node.tag}${attrsStr}/>`;
	if (node.children.length === 1 && typeof node.children[0] === "string") return `${pad}<${node.tag}${attrsStr}>${escapeText(node.children[0])}</${node.tag}>`;
	const lines = [`${pad}<${node.tag}${attrsStr}>`];
	for (const child of node.children) if (typeof child === "string") lines.push(`${"  ".repeat(indent + 1)}${escapeText(child)}`);
	else lines.push(renderSVGNode(child, indent + 1));
	lines.push(`${pad}</${node.tag}>`);
	return lines.join("\n");
}
//#endregion
export { renderSVGNode, svg };

//# sourceMappingURL=node.js.map
import { styleNameToWeight, weightToStyleName } from "./fonts.js";
//#region src/figma-api/text.ts
function getFontName(node) {
	return {
		family: node.fontFamily,
		style: weightToStyleName(node.fontWeight, node.italic)
	};
}
function setFontName(graph, nodeId, fontName) {
	const { weight, italic } = styleNameToWeight(fontName.style);
	graph.updateNode(nodeId, {
		fontFamily: fontName.family,
		fontWeight: weight,
		italic
	});
}
function insertCharacters(graph, node, start, characters) {
	const text = node.text.slice(0, start) + characters + node.text.slice(start);
	graph.updateNode(node.id, { text });
}
function deleteCharacters(graph, node, start, end) {
	const text = node.text.slice(0, start) + node.text.slice(end);
	graph.updateNode(node.id, { text });
}
//#endregion
export { deleteCharacters, getFontName, insertCharacters, setFontName };

//# sourceMappingURL=text.js.map
//#region src/text/direction.ts
const RTL_CHAR_RE = /\p{Script=Arabic}|\p{Script=Hebrew}|\p{Script=Syriac}|\p{Script=Thaana}|\p{Script=Nko}|\p{Script=Adlam}/u;
const LTR_CHAR_RE = /\p{Script=Latin}|\p{Script=Cyrillic}|\p{Script=Greek}/u;
function detectTextDirection(text) {
	for (const char of text) {
		if (RTL_CHAR_RE.test(char)) return "RTL";
		if (LTR_CHAR_RE.test(char)) return "LTR";
	}
	return "LTR";
}
function resolveTextDirection(direction, text) {
	return direction === "AUTO" ? detectTextDirection(text) : direction;
}
function resolveNodeTextDirection(node) {
	return resolveTextDirection(node.textDirection, node.text);
}
function resolveNodeLayoutDirection(node, inheritedDirection = "LTR") {
	return !node.layoutDirection || node.layoutDirection === "AUTO" ? inheritedDirection : node.layoutDirection;
}
function isLogicalTextAlignStart(node) {
	const direction = resolveNodeTextDirection(node);
	return direction === "LTR" && node.textAlignHorizontal === "LEFT" || direction === "RTL" && node.textAlignHorizontal === "RIGHT";
}
function isLogicalTextAlignEnd(node) {
	const direction = resolveNodeTextDirection(node);
	return direction === "LTR" && node.textAlignHorizontal === "RIGHT" || direction === "RTL" && node.textAlignHorizontal === "LEFT";
}
//#endregion
export { detectTextDirection, isLogicalTextAlignEnd, isLogicalTextAlignStart, resolveNodeLayoutDirection, resolveNodeTextDirection, resolveTextDirection };

//# sourceMappingURL=direction.js.map
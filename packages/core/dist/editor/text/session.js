import { copyStyleRuns } from "@open-pencil/scene-graph/copy";
import { isEqual } from "es-toolkit/predicate";
//#region src/editor/text/session.ts
function createTextEditSession(node) {
	return {
		nodeId: node.id,
		before: {
			text: node.text,
			styleRuns: copyStyleRuns(node.styleRuns),
			size: {
				width: node.width,
				height: node.height
			}
		}
	};
}
function snapshotTextNode(node, fallbackText = "") {
	return {
		text: node?.text ?? fallbackText,
		styleRuns: node ? copyStyleRuns(node.styleRuns) : [],
		size: node ? {
			width: node.width,
			height: node.height
		} : void 0
	};
}
function resizeTextNodeForEdit(node, paragraph) {
	if (!node || !paragraph) return {};
	const changes = {};
	if (node.textAutoResize === "WIDTH_AND_HEIGHT") {
		const width = Math.ceil(paragraph.getLongestLine());
		if (width > 0 && width !== node.width) changes.width = width;
	}
	if (node.textAutoResize === "HEIGHT" || node.textAutoResize === "WIDTH_AND_HEIGHT") {
		const height = Math.ceil(paragraph.getHeight());
		if (height > 0 && height !== node.height) changes.height = height;
	}
	return changes;
}
function textSnapshotChanged(before, after) {
	return before.text !== after.text || !styleRunsEqual(before.styleRuns, after.styleRuns) || after.size !== void 0 && !sizeEqual(before.size ?? {}, after.size);
}
function sizeEqual(a, b) {
	return a.width === b.width && a.height === b.height;
}
function styleRunsEqual(a, b) {
	if (a.length !== b.length) return false;
	return a.every((run, index) => styleRunEqual(run, b[index]));
}
function styleRunEqual(a, b) {
	return a.start === b.start && a.length === b.length && styleEqual(a.style, b.style);
}
function styleEqual(a, b) {
	return a.fontWeight === b.fontWeight && a.italic === b.italic && a.textDecoration === b.textDecoration && a.fontSize === b.fontSize && a.fontFamily === b.fontFamily && a.letterSpacing === b.letterSpacing && a.lineHeight === b.lineHeight && fillsEqual(a.fills ?? [], b.fills ?? []);
}
function fillsEqual(a, b) {
	if (a.length !== b.length) return false;
	return a.every((fill, index) => isEqual(fill, b[index]));
}
//#endregion
export { createTextEditSession, resizeTextNodeForEdit, snapshotTextNode, textSnapshotChanged };

//# sourceMappingURL=session.js.map
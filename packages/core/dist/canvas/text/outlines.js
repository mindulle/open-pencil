import { textNodeToOutlineLayout } from "../../text/outlines.js";
//#region src/canvas/text/outlines.ts
function appendOutlineCommand(path, command, xOffset, yOffset) {
	switch (command.type) {
		case "M":
			path.moveTo((command.x ?? 0) + xOffset, (command.y ?? 0) + yOffset);
			break;
		case "L":
			path.lineTo((command.x ?? 0) + xOffset, (command.y ?? 0) + yOffset);
			break;
		case "C":
			path.cubicTo((command.x1 ?? 0) + xOffset, (command.y1 ?? 0) + yOffset, (command.x2 ?? 0) + xOffset, (command.y2 ?? 0) + yOffset, (command.x ?? 0) + xOffset, (command.y ?? 0) + yOffset);
			break;
		case "Q":
			path.quadTo((command.x1 ?? 0) + xOffset, (command.y1 ?? 0) + yOffset, (command.x ?? 0) + xOffset, (command.y ?? 0) + yOffset);
			break;
		case "Z":
			path.close();
			break;
	}
}
function textNodeToOutlinePath(r, node) {
	const layout = textNodeToOutlineLayout(node);
	if (!layout) return null;
	const path = new r.ck.Path();
	for (const glyph of layout.glyphs) for (const command of glyph.commands) appendOutlineCommand(path, command, glyph.x, glyph.y);
	return path;
}
//#endregion
export { textNodeToOutlinePath };

//# sourceMappingURL=outlines.js.map
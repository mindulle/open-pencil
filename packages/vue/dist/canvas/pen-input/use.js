import { handlePenNodeEditDown } from "../node-edit-input/use.js";
import { createPenDrag } from "./drag.js";
import { PEN_CLOSE_THRESHOLD } from "@open-pencil/core/constants";
//#region src/canvas/pen-input/use.ts
function startPenInput(e, cx, cy, editor, setDrag, cursorOverride) {
	editor.state.penCursorX = null;
	editor.state.penCursorY = null;
	if (editor.state.nodeEditState) {
		handlePenNodeEditDown(e, cx, cy, editor);
		return true;
	}
	const penState = editor.state.penState;
	if (penState && penState.vertices.length > 2) {
		const first = penState.vertices[0];
		if (Math.hypot(cx - first.x, cy - first.y) < PEN_CLOSE_THRESHOLD) {
			editor.penSetPendingClose(true);
			editor.penSetClosingToFirst(true);
			setDrag(createPenDrag(first.x, first.y));
			cursorOverride.value = "crosshair";
			return true;
		}
	}
	editor.penSetPendingClose(false);
	editor.penAddVertex(cx, cy);
	setDrag(createPenDrag(cx, cy));
	cursorOverride.value = "crosshair";
	return true;
}
function updatePenHover(cx, cy, editor) {
	if (editor.state.activeTool !== "PEN" || !editor.state.penState) return false;
	editor.state.penCursorX = cx;
	editor.state.penCursorY = cy;
	const first = editor.state.penState.vertices[0];
	if (editor.state.penState.vertices.length > 2) {
		const dist = Math.hypot(cx - first.x, cy - first.y);
		editor.penSetClosingToFirst(dist < PEN_CLOSE_THRESHOLD);
	}
	editor.requestRepaint();
	return true;
}
//#endregion
export { startPenInput, updatePenHover };

//# sourceMappingURL=use.js.map
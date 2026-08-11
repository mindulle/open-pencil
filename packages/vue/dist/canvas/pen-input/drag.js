//#region src/canvas/pen-input/drag.ts
function createPenDrag(startX, startY) {
	return {
		type: "pen-drag",
		startX,
		startY,
		modifierMode: "default",
		frozenOppositeTangent: null,
		spaceDown: false,
		spaceStartX: 0,
		spaceStartY: 0,
		knotStartX: startX,
		knotStartY: startY
	};
}
function getPenAnchor(penState) {
	const anchorIndex = !!penState.pendingClose && penState.vertices.length > 2 ? 0 : penState.vertices.length - 1;
	return penState.vertices[anchorIndex];
}
function handleSpaceDrag(d, cx, cy, isSpace, anchor, editor) {
	if (!isSpace) return false;
	if (!d.spaceDown) {
		d.spaceDown = true;
		d.spaceStartX = cx;
		d.spaceStartY = cy;
		d.knotStartX = anchor.x;
		d.knotStartY = anchor.y;
	}
	const dx = cx - d.spaceStartX;
	const dy = cy - d.spaceStartY;
	editor.penSetKnotPosition(d.knotStartX + dx, d.knotStartY + dy);
	return true;
}
function applySpaceDragOffset(d, anchor) {
	if (!d.spaceDown) return;
	d.spaceDown = false;
	d.startX += anchor.x - d.knotStartX;
	d.startY += anchor.y - d.knotStartY;
}
function getClosingOpposite(penState) {
	const firstSeg = penState.segments[0];
	if (!penState.pendingClose) return null;
	if (firstSeg.start === 0) return firstSeg.tangentStart;
	if (firstSeg.end === 0) return firstSeg.tangentEnd;
	return null;
}
function getModifierMode(event) {
	if (event.metaKey || event.ctrlKey) return "continuous";
	if (event.altKey) return "independent";
	return "default";
}
function freezeOppositeTangent(penState, closingOpposite) {
	const lastSeg = penState.segments[penState.segments.length - 1];
	if (closingOpposite) return { ...closingOpposite };
	return { ...lastSeg.tangentEnd };
}
function updateModifierMode(d, mode, penState) {
	if (mode === d.modifierMode) return;
	if (mode === "default") d.frozenOppositeTangent = null;
	else if (!d.frozenOppositeTangent) d.frozenOppositeTangent = freezeOppositeTangent(penState, getClosingOpposite(penState));
	d.modifierMode = mode;
}
function applyPenDragTangent(editor, penState, d, tx, ty, mode, closingOpposite) {
	if (mode === "continuous") {
		editor.penSetDragTangent(tx, ty, {
			keepOpposite: true,
			constrainToOpposite: true,
			oppositeTangent: d.frozenOppositeTangent
		});
		return;
	}
	if (mode === "independent") {
		editor.penSetDragTangent(tx, ty, {
			keepOpposite: true,
			oppositeTangent: d.frozenOppositeTangent
		});
		return;
	}
	const options = penState.pendingClose ? {
		keepOpposite: true,
		oppositeTangent: closingOpposite
	} : void 0;
	editor.penSetDragTangent(tx, ty, options);
}
function handlePenDragMove(d, cx, cy, isSpace, event, editor) {
	const penState = editor.state.penState;
	if (!penState) return;
	const anchor = getPenAnchor(penState);
	if (handleSpaceDrag(d, cx, cy, isSpace, anchor, editor)) return;
	applySpaceDragOffset(d, anchor);
	const tx = cx - d.startX;
	const ty = cy - d.startY;
	if (Math.hypot(tx, ty) <= 2) return;
	const mode = getModifierMode(event);
	updateModifierMode(d, mode, penState);
	applyPenDragTangent(editor, penState, d, tx, ty, mode, getClosingOpposite(penState));
}
//#endregion
export { createPenDrag, handlePenDragMove };

//# sourceMappingURL=drag.js.map
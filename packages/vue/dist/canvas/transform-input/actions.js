import { hitTestCornerRotationByMatrix, hitTestTopRotationHandleByMatrix } from "../pointer/use.js";
import { ROTATION_SNAP_DEGREES } from "@open-pencil/core/constants";
import { getAbsolutePositionFull } from "@open-pencil/scene-graph/coordinate";
//#region src/canvas/transform-input/marquee.ts
function handleMarqueeMove(editor, canvasToLocal, d, cx, cy) {
	const minX = Math.min(d.startX, cx);
	const minY = Math.min(d.startY, cy);
	const maxX = Math.max(d.startX, cx);
	const maxY = Math.max(d.startY, cy);
	const scopeId = editor.state.enteredContainerId;
	const parentId = scopeId ?? editor.state.currentPageId;
	const localMin = scopeId ? canvasToLocal(minX, minY, scopeId) : {
		lx: minX,
		ly: minY
	};
	const localMax = scopeId ? canvasToLocal(maxX, maxY, scopeId) : {
		lx: maxX,
		ly: maxY
	};
	const localMinX = Math.min(localMin.lx, localMax.lx);
	const localMinY = Math.min(localMin.ly, localMax.ly);
	const localMaxX = Math.max(localMin.lx, localMax.lx);
	const localMaxY = Math.max(localMin.ly, localMax.ly);
	const hits = [];
	for (const node of editor.graph.getChildren(parentId)) {
		if (!node.visible || node.locked) continue;
		if (node.x + node.width > localMinX && node.x < localMaxX && node.y + node.height > localMinY && node.y < localMaxY) hits.push(node.id);
	}
	editor.select(hits);
	editor.setMarquee({
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY
	});
}
//#endregion
//#region src/canvas/transform-input/pan.ts
function handlePanMove(editor, d, event) {
	const dx = event.clientX - d.startScreenX;
	const dy = event.clientY - d.startScreenY;
	editor.state.panX = d.startPanX + dx;
	editor.state.panY = d.startPanY + dy;
	editor.requestRepaint();
}
//#endregion
//#region src/canvas/transform-input/rotation.ts
function normalizeRotation(angle) {
	return ((angle + 180) % 360 + 360) % 360 - 180;
}
function tryStartRotation(editor, setDrag, cx, cy) {
	if (editor.state.selectedIds.size !== 1) return false;
	const id = [...editor.state.selectedIds][0];
	const node = editor.graph.getNode(id);
	if (!node || node.locked) return false;
	const abs = getAbsolutePositionFull(node, editor.graph);
	const zoom = editor.renderer?.zoom ?? 1;
	if (!(hitTestTopRotationHandleByMatrix(cx, cy, node, editor.graph, zoom) || hitTestCornerRotationByMatrix(cx, cy, node, editor.graph, zoom))) return false;
	const startAngle = Math.atan2(cy - abs.centerY, cx - abs.centerX) * (180 / Math.PI);
	setDrag({
		type: "rotate",
		nodeId: id,
		centerX: abs.centerX,
		centerY: abs.centerY,
		startAngle,
		origRotation: node.rotation
	});
	return true;
}
function handleRotateMove(editor, d, sx, sy, shiftKey) {
	const delta = normalizeRotation(Math.atan2(sy - d.centerY, sx - d.centerX) * (180 / Math.PI) - d.startAngle);
	let rotation = d.origRotation + delta;
	if (shiftKey) rotation = Math.round(rotation / ROTATION_SNAP_DEGREES) * ROTATION_SNAP_DEGREES;
	editor.setRotationPreview({
		nodeId: d.nodeId,
		angle: normalizeRotation(rotation)
	});
}
//#endregion
//#region src/canvas/transform-input/text-selection.ts
function handleTextSelectMove(editor, cx, cy) {
	const textEditor = editor.textEditor;
	const editNode = editor.state.editingTextId ? editor.graph.getNode(editor.state.editingTextId) : null;
	if (textEditor && editNode) {
		const abs = editor.graph.getAbsolutePosition(editNode.id);
		textEditor.setCursorAt(cx - abs.x, cy - abs.y, true);
		editor.requestRender();
	}
}
//#endregion
//#region src/canvas/transform-input/actions.ts
function createTransformInputActions(editor, canvasToLocal, setDrag) {
	function tryStartRotation$1(cx, cy) {
		return tryStartRotation(editor, setDrag, cx, cy);
	}
	function handlePanMove$1(d, e) {
		handlePanMove(editor, d, e);
	}
	function handleRotateMove$1(d, sx, sy, shiftKey) {
		handleRotateMove(editor, d, sx, sy, shiftKey);
	}
	function handleTextSelectMove$1(cx, cy) {
		handleTextSelectMove(editor, cx, cy);
	}
	function handleMarqueeMove$1(d, cx, cy) {
		handleMarqueeMove(editor, canvasToLocal, d, cx, cy);
	}
	return {
		tryStartRotation: tryStartRotation$1,
		handlePanMove: handlePanMove$1,
		handleRotateMove: handleRotateMove$1,
		handleTextSelectMove: handleTextSelectMove$1,
		handleMarqueeMove: handleMarqueeMove$1
	};
}
//#endregion
export { createTransformInputActions };

//# sourceMappingURL=actions.js.map
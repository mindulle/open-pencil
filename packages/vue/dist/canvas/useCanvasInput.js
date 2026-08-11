import { handleBendHandleMove } from "./node-edit-input/bend.js";
import { handleNodeEditMouseUp, handleNodeEditMove, updateNodeEditHover } from "./node-edit-input/use.js";
import { handlePenDragMove } from "./pen-input/drag.js";
import { updatePenHover } from "./pen-input/use.js";
import { createCanvasPointer } from "./pointer/use.js";
import { createTextEditInput } from "./text-edit/input.js";
import { applyResize, commitResizePreview, handleDrawMove, handleDrawUp, handleToolMouseDown, updateHoverCursor } from "./tool-input/use.js";
import { createTransformInputActions } from "./transform-input/actions.js";
import { findMoveDropTarget, reparentOutsideNodes } from "./drop/use.js";
import { ref } from "vue";
import { useEventListener } from "@vueuse/core";
import { AUTO_LAYOUT_BREAK_THRESHOLD, AUTO_LAYOUT_HOVER_GAP_REGION_TOLERANCE, AUTO_LAYOUT_HOVER_PADDING_REGION_TOLERANCE, AUTO_LAYOUT_HOVER_TICK_HIT_TOLERANCE } from "@open-pencil/core/constants";
import { computeSelectionBounds, computeSnap } from "@open-pencil/scene-graph";
import { resolveNodeLayoutDirection } from "@open-pencil/core/text";
//#region src/shared/input/auto-layout-hover.ts
function visibleLayoutChildren(node, editor) {
	return node.childIds.map((id) => editor.graph.getNode(id)).filter((child) => !!child && child.visible && child.layoutPositioning !== "ABSOLUTE");
}
function isNear(value, target, tolerance = AUTO_LAYOUT_HOVER_TICK_HIT_TOLERANCE) {
	return Math.abs(value - target) <= tolerance;
}
function resolvePaddingHover(node, localX, localY) {
	const centerX = node.width / 2;
	const centerY = node.height / 2;
	if (node.paddingTop > 0) {
		const tickY = node.paddingTop / 2;
		if (isNear(localX, centerX) && isNear(localY, tickY)) return {
			nodeId: node.id,
			kind: "padding-value",
			side: "top"
		};
		if (localY <= Math.min(node.paddingTop, AUTO_LAYOUT_HOVER_PADDING_REGION_TOLERANCE)) return {
			nodeId: node.id,
			kind: "padding",
			side: "top"
		};
	}
	if (node.paddingBottom > 0) {
		const tickY = node.height - node.paddingBottom / 2;
		if (isNear(localX, centerX) && isNear(localY, tickY)) return {
			nodeId: node.id,
			kind: "padding-value",
			side: "bottom"
		};
		if (localY >= node.height - Math.min(node.paddingBottom, AUTO_LAYOUT_HOVER_PADDING_REGION_TOLERANCE)) return {
			nodeId: node.id,
			kind: "padding",
			side: "bottom"
		};
	}
	if (node.paddingLeft > 0) {
		if (isNear(localX, node.paddingLeft / 2) && isNear(localY, centerY)) return {
			nodeId: node.id,
			kind: "padding-value",
			side: "left"
		};
		if (localX <= Math.min(node.paddingLeft, AUTO_LAYOUT_HOVER_PADDING_REGION_TOLERANCE)) return {
			nodeId: node.id,
			kind: "padding",
			side: "left"
		};
	}
	if (node.paddingRight > 0) {
		if (isNear(localX, node.width - node.paddingRight / 2) && isNear(localY, centerY)) return {
			nodeId: node.id,
			kind: "padding-value",
			side: "right"
		};
		if (localX >= node.width - Math.min(node.paddingRight, AUTO_LAYOUT_HOVER_PADDING_REGION_TOLERANCE)) return {
			nodeId: node.id,
			kind: "padding",
			side: "right"
		};
	}
	return null;
}
function resolveSpacingHover(node, children, localX, localY) {
	if (children.length < 2 || node.itemSpacing <= 0) return null;
	const isRow = node.layoutMode === "HORIZONTAL";
	const contentCrossStart = isRow ? node.paddingTop : node.paddingLeft;
	const contentCrossEnd = isRow ? node.height - node.paddingBottom : node.width - node.paddingRight;
	const cross = isRow ? localY : localX;
	if (cross < contentCrossStart || cross > contentCrossEnd) return null;
	for (let i = 0; i < children.length - 1; i++) {
		const prev = children[i];
		const next = children[i + 1];
		const gapStart = isRow ? prev.x + prev.width : prev.y + prev.height;
		const gapEnd = isRow ? next.x : next.y;
		if (gapEnd < gapStart) continue;
		const cursor = isRow ? localX : localY;
		const tickMain = (gapStart + gapEnd) / 2;
		const tickCross = (contentCrossStart + contentCrossEnd) / 2;
		if (isNear(cursor, tickMain) && isNear(cross, tickCross)) return {
			nodeId: node.id,
			kind: "spacing-value",
			index: i
		};
		if (cursor >= gapStart - AUTO_LAYOUT_HOVER_GAP_REGION_TOLERANCE && cursor <= gapEnd + AUTO_LAYOUT_HOVER_GAP_REGION_TOLERANCE) return {
			nodeId: node.id,
			kind: "spacing",
			index: i
		};
	}
	return null;
}
function resolveChildrenHover(node, children, localX, localY) {
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (localX >= child.x && localX <= child.x + child.width && localY >= child.y && localY <= child.y + child.height) return {
			nodeId: node.id,
			kind: "children",
			index: i
		};
	}
	return null;
}
function resolveAutoLayoutHover(cx, cy, editor) {
	if (editor.state.selectedIds.size !== 1) return null;
	const nodeId = [...editor.state.selectedIds][0];
	const node = editor.graph.getNode(nodeId);
	if (!node || node.layoutMode !== "HORIZONTAL" && node.layoutMode !== "VERTICAL") return null;
	const abs = editor.graph.getAbsolutePosition(node.id);
	const localX = cx - abs.x;
	const localY = cy - abs.y;
	if (localX < 0 || localY < 0 || localX > node.width || localY > node.height) return null;
	const children = visibleLayoutChildren(node, editor);
	return resolveSpacingHover(node, children, localX, localY) ?? resolvePaddingHover(node, localX, localY) ?? resolveChildrenHover(node, children, localX, localY) ?? {
		nodeId: node.id,
		kind: "frame"
	};
}
//#endregion
//#region src/shared/input/click-count.ts
const MULTI_CLICK_DELAY = 500;
const MULTI_CLICK_RADIUS = 5;
function createClickCounter() {
	let lastClickTime = 0;
	let lastClickX = 0;
	let lastClickY = 0;
	let clickCount = 0;
	function recordClick(sx, sy) {
		const now = performance.now();
		if (now - lastClickTime < MULTI_CLICK_DELAY && Math.abs(sx - lastClickX) < MULTI_CLICK_RADIUS && Math.abs(sy - lastClickY) < MULTI_CLICK_RADIUS) clickCount++;
		else clickCount = 1;
		lastClickTime = now;
		lastClickX = sx;
		lastClickY = sy;
		return clickCount;
	}
	function getClickCount() {
		return clickCount;
	}
	return {
		recordClick,
		getClickCount
	};
}
//#endregion
//#region src/shared/input/auto-layout.ts
function resolveLayoutDirection(parent, editor) {
	const ancestor = parent.parentId ? editor.graph.getNode(parent.parentId) : null;
	return resolveNodeLayoutDirection(parent, ancestor ? resolveLayoutDirection(ancestor, editor) : "LTR");
}
function isRTLRow(parent, isRow, editor) {
	return isRow && resolveLayoutDirection(parent, editor) === "RTL";
}
function computeIndicatorPosition(children, insertIndex, parent, parentAbs, isRow, editor) {
	const rtlRow = isRTLRow(parent, isRow, editor);
	if (children.length === 0) {
		if (isRow) return rtlRow ? parentAbs.x + parent.width - parent.paddingRight : parentAbs.x + parent.paddingLeft;
		return parentAbs.y + parent.paddingTop;
	}
	if (insertIndex === 0) {
		const firstAbs = editor.graph.getAbsolutePosition(children[0].id);
		if (isRow) return rtlRow ? firstAbs.x + children[0].width + parent.itemSpacing / 2 : firstAbs.x - parent.itemSpacing / 2;
		return firstAbs.y - parent.itemSpacing / 2;
	}
	if (insertIndex >= children.length) {
		const last = children[children.length - 1];
		const lastAbs = editor.graph.getAbsolutePosition(last.id);
		if (isRow) return rtlRow ? lastAbs.x - parent.itemSpacing / 2 : lastAbs.x + last.width + parent.itemSpacing / 2;
		return lastAbs.y + last.height + parent.itemSpacing / 2;
	}
	const prev = children[insertIndex - 1];
	const next = children[insertIndex];
	const prevAbs = editor.graph.getAbsolutePosition(prev.id);
	const nextAbs = editor.graph.getAbsolutePosition(next.id);
	if (isRow) return rtlRow ? (prevAbs.x + nextAbs.x + next.width) / 2 : (prevAbs.x + prev.width + nextAbs.x) / 2;
	return (prevAbs.y + prev.height + nextAbs.y) / 2;
}
function filteredToRealIndex(parentId, insertIndex, editor, movingIds = editor.state.selectedIds) {
	const allChildren = editor.graph.getChildren(parentId);
	let realIndex = 0;
	let filteredCount = 0;
	for (const child of allChildren) {
		if (movingIds.has(child.id)) continue;
		if (child.layoutPositioning === "ABSOLUTE") {
			realIndex++;
			continue;
		}
		if (filteredCount === insertIndex) break;
		filteredCount++;
		realIndex++;
	}
	return realIndex;
}
function computeAutoLayoutIndicatorForFrame(parent, cx, cy, editor, movingIds = editor.state.selectedIds) {
	const children = editor.graph.getChildren(parent.id).filter((c) => c.layoutPositioning !== "ABSOLUTE" && !movingIds.has(c.id));
	const parentAbs = editor.graph.getAbsolutePosition(parent.id);
	const isRow = parent.layoutMode === "HORIZONTAL";
	const rtlRow = isRTLRow(parent, isRow, editor);
	let insertIndex = children.length;
	for (let i = 0; i < children.length; i++) {
		const childAbs = editor.graph.getAbsolutePosition(children[i].id);
		const mid = isRow ? childAbs.x + children[i].width / 2 : childAbs.y + children[i].height / 2;
		const cursor = isRow ? cx : cy;
		if (rtlRow ? cursor > mid : cursor < mid) {
			insertIndex = i;
			break;
		}
	}
	const realIndex = filteredToRealIndex(parent.id, insertIndex, editor, movingIds);
	if (movingIds.size === 1) {
		const movingId = [...movingIds][0];
		const movingNode = editor.graph.getNode(movingId);
		const currentIndex = parent.childIds.indexOf(movingId);
		if (movingNode?.parentId === parent.id && realIndex === currentIndex) {
			editor.setLayoutInsertIndicator(null);
			return;
		}
	}
	const indicatorPos = computeIndicatorPosition(children, insertIndex, parent, parentAbs, isRow, editor);
	const crossStart = isRow ? parentAbs.y + parent.paddingTop : parentAbs.x + parent.paddingLeft;
	const crossLength = isRow ? parent.height - parent.paddingTop - parent.paddingBottom : parent.width - parent.paddingLeft - parent.paddingRight;
	editor.setLayoutInsertIndicator({
		parentId: parent.id,
		index: realIndex,
		x: isRow ? indicatorPos : crossStart,
		y: isRow ? crossStart : indicatorPos,
		length: crossLength,
		direction: isRow ? "VERTICAL" : "HORIZONTAL"
	});
}
function computeAutoLayoutIndicator(d, cx, cy, editor) {
	if (!d.autoLayoutParentId) return;
	const parent = editor.graph.getNode(d.autoLayoutParentId);
	if (!parent || parent.layoutMode === "NONE") return;
	computeAutoLayoutIndicatorForFrame(parent, cx, cy, editor, new Set(d.originals.keys()));
}
//#endregion
//#region src/shared/input/move-snap.ts
function applyMoveSnap(d, dx, dy, editor) {
	const selectedNodes = [];
	for (const [id, orig] of d.originals) {
		const node = editor.graph.getNode(id);
		if (node) {
			const abs = editor.graph.getAbsolutePosition(id);
			const parentAbs = node.parentId ? editor.graph.getAbsolutePosition(node.parentId) : {
				x: 0,
				y: 0
			};
			selectedNodes.push({
				...node,
				x: abs.x - parentAbs.x - node.x + orig.x + dx,
				y: abs.y - parentAbs.y - node.y + orig.y + dy
			});
		}
	}
	const bounds = computeSelectionBounds(selectedNodes);
	if (!bounds) return {
		dx,
		dy
	};
	const firstId = [...d.originals.keys()][0];
	const parentId = editor.graph.getNode(firstId)?.parentId ?? editor.state.currentPageId;
	const siblings = editor.graph.getChildren(parentId);
	const parentAbs = !editor.isTopLevel(parentId) ? editor.graph.getAbsolutePosition(parentId) : {
		x: 0,
		y: 0
	};
	const absTargets = siblings.map((node) => ({
		...node,
		x: node.x + parentAbs.x,
		y: node.y + parentAbs.y
	}));
	const absBounds = {
		x: bounds.x + parentAbs.x,
		y: bounds.y + parentAbs.y,
		width: bounds.width,
		height: bounds.height
	};
	const snap = computeSnap(editor.state.selectedIds, absBounds, absTargets);
	editor.setSnapGuides(snap.guides);
	return {
		dx: dx + snap.dx,
		dy: dy + snap.dy
	};
}
//#endregion
//#region src/shared/input/move.ts
const AUTO_LAYOUT_REORDER_CLICK_SLOP = 3;
const AUTO_LAYOUT_CROSS_AXIS_DRAG_TOLERANCE = 96;
function isInsideAutoLayoutDragBounds(parentId, cx, cy, editor) {
	const parent = editor.graph.getNode(parentId);
	if (!parent) return false;
	const abs = editor.graph.getAbsolutePosition(parentId);
	const isRow = parent.layoutMode === "HORIZONTAL";
	const mainStart = isRow ? abs.x : abs.y;
	const mainSize = isRow ? parent.width : parent.height;
	const crossStart = isRow ? abs.y : abs.x;
	const crossSize = isRow ? parent.height : parent.width;
	const main = isRow ? cx : cy;
	const cross = isRow ? cy : cx;
	return main >= mainStart - AUTO_LAYOUT_BREAK_THRESHOLD && main <= mainStart + mainSize + AUTO_LAYOUT_BREAK_THRESHOLD && cross >= crossStart - AUTO_LAYOUT_CROSS_AXIS_DRAG_TOLERANCE && cross <= crossStart + crossSize + AUTO_LAYOUT_CROSS_AXIS_DRAG_TOLERANCE;
}
function isPastDragStartThreshold(d, sx, sy) {
	const dx = sx - d.startScreenX;
	const dy = sy - d.startScreenY;
	return dx * dx + dy * dy >= 9;
}
function handleMoveMove(d, cx, cy, sx, sy, editor) {
	d.currentX = cx;
	d.currentY = cy;
	if (!d.dragStarted) {
		if (!isPastDragStartThreshold(d, sx, sy)) return;
		d.dragStarted = true;
	}
	let dx = cx - d.startX;
	let dy = cy - d.startY;
	if (d.autoLayoutParentId && !d.brokeFromAutoLayout) {
		if (isInsideAutoLayoutDragBounds(d.autoLayoutParentId, cx, cy, editor)) {
			computeAutoLayoutIndicator(d, cx, cy, editor);
			return;
		}
		d.brokeFromAutoLayout = true;
		editor.setLayoutInsertIndicator(null);
	}
	const dropTarget = findMoveDropTarget(cx, cy, editor);
	const dropParent = dropTarget ? editor.graph.getNode(dropTarget.id) : null;
	if (dropParent && dropParent.layoutMode !== "NONE") {
		computeAutoLayoutIndicatorForFrame(dropParent, cx, cy, editor);
		editor.setDropTarget(dropParent.id);
		for (const [id, orig] of d.originals) editor.graph.updateNodePositionPreview(id, Math.round(orig.x + dx), Math.round(orig.y + dy));
		editor.requestRepaint();
		return;
	}
	editor.setLayoutInsertIndicator(null);
	const snapped = applyMoveSnap(d, dx, dy, editor);
	dx = snapped.dx;
	dy = snapped.dy;
	for (const [id, orig] of d.originals) editor.graph.updateNodePositionPreview(id, Math.round(orig.x + dx), Math.round(orig.y + dy));
	editor.setDropTarget(dropTarget?.id ?? null);
	editor.requestRepaint();
}
function getMoveDistance(d) {
	return Math.hypot(d.currentX - d.startX, d.currentY - d.startY);
}
function hasMoved(d, editor) {
	return [...d.originals].some(([id, orig]) => {
		const node = editor.graph.getNode(id);
		return node && (node.x !== orig.x || node.y !== orig.y);
	});
}
function restoreOriginalPositions(d, editor) {
	for (const [id, orig] of d.originals) editor.graph.updateNodePositionPreview(id, orig.x, orig.y);
}
function applyFinalPositions(d, editor) {
	const dx = d.currentX - d.startX;
	const dy = d.currentY - d.startY;
	for (const [id, orig] of d.originals) editor.updateNode(id, {
		x: Math.round(orig.x + dx),
		y: Math.round(orig.y + dy)
	});
}
function handleMoveUp(d, editor) {
	if (!d.dragStarted) {
		editor.setLayoutInsertIndicator(null);
		editor.setSnapGuides([]);
		editor.setDropTarget(null);
		return;
	}
	const indicator = editor.state.layoutInsertIndicator;
	editor.setLayoutInsertIndicator(null);
	editor.setSnapGuides([]);
	if (indicator) {
		if (getMoveDistance(d) < AUTO_LAYOUT_REORDER_CLICK_SLOP) {
			editor.setDropTarget(null);
			return;
		}
		for (const id of d.originals.keys()) editor.reorderInAutoLayout(id, indicator.parentId, indicator.index);
		editor.setDropTarget(null);
		return;
	}
	const moved = hasMoved(d, editor);
	if (moved) {
		restoreOriginalPositions(d, editor);
		applyFinalPositions(d, editor);
		const dropId = editor.state.dropTargetId;
		if (dropId) editor.reparentNodes([...editor.state.selectedIds], dropId);
		else reparentOutsideNodes(editor);
	}
	if (d.duplicated) {
		const previousSelection = d.duplicatedPreviousSelection ?? /* @__PURE__ */ new Set();
		if (!moved) {
			for (const id of [...d.originals.keys()].toReversed()) editor.graph.deleteNode(id);
			editor.select([...previousSelection]);
			editor.requestRender();
			editor.setDropTarget(null);
			return;
		}
		editor.commitDuplicateMove([...d.originals.keys()], previousSelection);
	} else if (moved) editor.commitMoveWithReparent(d.originals);
	editor.setDropTarget(null);
}
//#endregion
//#region src/shared/input/raf-scheduler.ts
function createRafScheduler(flush) {
	let rafId = 0;
	function schedule() {
		if (rafId) return;
		rafId = requestAnimationFrame(() => {
			rafId = 0;
			flush();
		});
	}
	function cancel() {
		if (!rafId) return;
		cancelAnimationFrame(rafId);
		rafId = 0;
	}
	return {
		schedule,
		cancel
	};
}
//#endregion
//#region src/shared/input/gesture.ts
function setupSafariGestureZoom(canvasRef, editor) {
	let gestureStartZoom = 1;
	let pendingGesture = null;
	function flushGesture() {
		if (!pendingGesture) return;
		editor.setHoveredNode(null);
		const { scale, sx, sy } = pendingGesture;
		pendingGesture = null;
		editor.setZoomAroundPoint(gestureStartZoom * scale, sx, sy);
	}
	const gestureScheduler = createRafScheduler(flushGesture);
	useEventListener(canvasRef, "gesturestart", (e) => {
		e.preventDefault();
		gestureStartZoom = editor.state.zoom;
	}, { passive: false });
	useEventListener(canvasRef, "gesturechange", (e) => {
		e.preventDefault();
		const ge = e;
		const canvas = canvasRef.value;
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		pendingGesture = {
			scale: ge.scale,
			sx: ge.clientX - rect.left,
			sy: ge.clientY - rect.top
		};
		gestureScheduler.schedule();
	}, { passive: false });
	useEventListener(canvasRef, "gestureend", (e) => {
		e.preventDefault();
	}, { passive: false });
}
//#endregion
//#region src/shared/input/wheel.ts
function isMacOs() {
	return typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}
function normalizeWheelDelta(e) {
	let { deltaX, deltaY } = e;
	if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
		deltaX *= 40;
		deltaY *= 40;
	} else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
		deltaX *= 800;
		deltaY *= 800;
	}
	return {
		dx: deltaX,
		dy: deltaY
	};
}
const WHEEL_ZOOM_SPEED = 1.25;
function wheelDeltaModeScale(event) {
	if (event.deltaMode === 1) return .05;
	return event.deltaMode ? 1 : .002;
}
function wheelZoomDelta(event) {
	const factor = event.ctrlKey && isMacOs() ? 10 : 1;
	return -event.deltaY * wheelDeltaModeScale(event) * factor * WHEEL_ZOOM_SPEED;
}
function setupWheelPanZoom(canvasRef, editor) {
	const wheelAccum = {
		deltaX: 0,
		deltaY: 0,
		zoomScale: 1,
		zoomCenterX: 0,
		zoomCenterY: 0,
		hasZoom: false
	};
	function flushWheel() {
		editor.setHoveredNode(null);
		if (wheelAccum.hasZoom) editor.setZoomAroundPoint(editor.state.zoom * wheelAccum.zoomScale, wheelAccum.zoomCenterX, wheelAccum.zoomCenterY);
		else editor.pan(wheelAccum.deltaX, wheelAccum.deltaY);
		wheelAccum.deltaX = 0;
		wheelAccum.deltaY = 0;
		wheelAccum.zoomScale = 1;
		wheelAccum.hasZoom = false;
	}
	const wheelScheduler = createRafScheduler(flushWheel);
	function onWheel(e) {
		const canvas = canvasRef.value;
		if (!canvas) return;
		const { dx, dy } = normalizeWheelDelta(e);
		if (e.ctrlKey || e.metaKey) {
			const rect = canvas.getBoundingClientRect();
			wheelAccum.zoomCenterX = e.clientX - rect.left;
			wheelAccum.zoomCenterY = e.clientY - rect.top;
			wheelAccum.zoomScale *= 2 ** wheelZoomDelta(e);
			wheelAccum.hasZoom = true;
		} else {
			wheelAccum.deltaX -= dx;
			wheelAccum.deltaY -= dy;
		}
		wheelScheduler.schedule();
	}
	useEventListener(canvasRef, "wheel", (event) => {
		event.preventDefault();
		onWheel(event);
	}, { passive: false });
}
//#endregion
//#region src/shared/input/pan-zoom.ts
function setupPanZoom(canvasRef, editor, drag, onMouseDown, onMouseMove, onMouseUp) {
	let activeTouches = [];
	let pinchStartDist = 0;
	let pinchStartZoom = 0;
	let pinchMidX = 0;
	let pinchMidY = 0;
	function touchDist(a, b) {
		return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
	}
	let touchAsMouse = false;
	function syntheticMouse(type, t) {
		return new MouseEvent(type, {
			clientX: t.clientX,
			clientY: t.clientY,
			screenX: t.screenX,
			screenY: t.screenY,
			button: 0,
			buttons: 1,
			bubbles: true
		});
	}
	function onTouchStart(e) {
		e.preventDefault();
		activeTouches = Array.from(e.touches);
		const canvas = canvasRef.value;
		if (!canvas) return;
		if (activeTouches.length === 2) {
			if (touchAsMouse) {
				onMouseUp();
				touchAsMouse = false;
			}
			drag.value = null;
			const [a, b] = activeTouches;
			pinchStartDist = touchDist(a, b);
			pinchStartZoom = editor.state.zoom;
			const rect = canvas.getBoundingClientRect();
			pinchMidX = (a.clientX + b.clientX) / 2 - rect.left;
			pinchMidY = (a.clientY + b.clientY) / 2 - rect.top;
		} else if (activeTouches.length === 1) {
			const t = activeTouches[0];
			if (editor.state.activeTool === "HAND") {
				touchAsMouse = false;
				drag.value = {
					type: "pan",
					startScreenX: t.clientX,
					startScreenY: t.clientY,
					startPanX: editor.state.panX,
					startPanY: editor.state.panY
				};
			} else {
				touchAsMouse = true;
				onMouseDown(syntheticMouse("mousedown", t));
			}
		}
	}
	function onTouchMove(e) {
		e.preventDefault();
		activeTouches = Array.from(e.touches);
		const canvas = canvasRef.value;
		if (!canvas) return;
		if (activeTouches.length === 2) {
			const [a, b] = activeTouches;
			const rect = canvas.getBoundingClientRect();
			const newMidX = (a.clientX + b.clientX) / 2 - rect.left;
			const newMidY = (a.clientY + b.clientY) / 2 - rect.top;
			editor.setHoveredNode(null);
			const newDist = touchDist(a, b);
			if (pinchStartDist > 0) {
				const scale = newDist / pinchStartDist;
				const newZoom = pinchStartZoom * scale;
				const panDx = newMidX - pinchMidX;
				const panDy = newMidY - pinchMidY;
				editor.setZoomAroundPoint(newZoom, pinchMidX, pinchMidY);
				editor.pan(panDx, panDy);
			}
			pinchMidX = newMidX;
			pinchMidY = newMidY;
			editor.requestRepaint();
		} else if (activeTouches.length === 1) {
			const t = activeTouches[0];
			if (touchAsMouse) onMouseMove(syntheticMouse("mousemove", t));
			else if (drag.value?.type === "pan") {
				const d = drag.value;
				editor.state.panX = d.startPanX + (t.clientX - d.startScreenX);
				editor.state.panY = d.startPanY + (t.clientY - d.startScreenY);
				editor.requestRepaint();
			}
		}
	}
	function onTouchEnd(e) {
		e.preventDefault();
		activeTouches = Array.from(e.touches);
		if (activeTouches.length === 0) {
			if (touchAsMouse) {
				onMouseUp();
				touchAsMouse = false;
			} else drag.value = null;
			pinchStartDist = 0;
		} else if (activeTouches.length === 1) {
			const t = activeTouches[0];
			if (!touchAsMouse) drag.value = {
				type: "pan",
				startScreenX: t.clientX,
				startScreenY: t.clientY,
				startPanX: editor.state.panX,
				startPanY: editor.state.panY
			};
			pinchStartDist = 0;
		}
	}
	setupWheelPanZoom(canvasRef, editor);
	useEventListener(canvasRef, "touchstart", onTouchStart, { passive: false });
	useEventListener(canvasRef, "touchmove", onTouchMove, { passive: false });
	useEventListener(canvasRef, "touchend", onTouchEnd, { passive: false });
	useEventListener(canvasRef, "touchcancel", onTouchEnd, { passive: false });
	setupSafariGestureZoom(canvasRef, editor);
}
//#endregion
//#region src/shared/input/space-key.ts
function useSpaceHeld() {
	const spaceHeld = ref(false);
	useEventListener(window, "keydown", (event) => {
		if (event.code === "Space") spaceHeld.value = true;
	});
	useEventListener(window, "keyup", (event) => {
		if (event.code === "Space") spaceHeld.value = false;
	});
	return spaceHeld;
}
//#endregion
//#region src/canvas/useCanvasInput.ts
/**
* Wires pointer and mouse interaction to an OpenPencil canvas.
*
* This composable coordinates selection, dragging, resizing, rotation,
* panning, drawing tools, scoped hit testing, and text-edit interaction.
* It is primarily intended for editor shell components that own the canvas.
*/
function useCanvasInput(canvasRef, editor, hitTestSectionTitle, hitTestComponentLabel, hitTestFrameTitle, onCursorMove) {
	const drag = ref(null);
	const cursorOverride = ref(null);
	const autoLayoutPaddingEdit = ref(null);
	const selectedIdsBeforeClickSequence = ref(/* @__PURE__ */ new Set());
	const spaceHeld = useSpaceHeld();
	const { recordClick, getClickCount } = createClickCounter();
	const { getCoords, canvasToLocal, hitTestInScope, hitFns } = createCanvasPointer(canvasRef, editor, hitTestSectionTitle, hitTestComponentLabel, hitTestFrameTitle);
	function setDrag(d) {
		drag.value = d;
	}
	const { handleTextEditClick, onDblClick: onTextDblClick } = createTextEditInput({
		editor,
		getCoords,
		hitTestInScope,
		hitTestSectionTitle,
		hitTestComponentLabel,
		getClickCount,
		wasSelectedBeforeClickSequence: (id) => selectedIdsBeforeClickSequence.value.has(id),
		setDrag
	});
	const { tryStartRotation, handlePanMove, handleRotateMove, handleTextSelectMove, handleMarqueeMove } = createTransformInputActions(editor, canvasToLocal, setDrag);
	function paddingValue(node, side) {
		if (side === "top") return node.paddingTop;
		if (side === "right") return node.paddingRight;
		if (side === "bottom") return node.paddingBottom;
		return node.paddingLeft;
	}
	function paddingKey(side) {
		if (side === "top") return "paddingTop";
		if (side === "right") return "paddingRight";
		if (side === "bottom") return "paddingBottom";
		return "paddingLeft";
	}
	function startAutoLayoutPaddingEdit(e) {
		const { cx, cy } = getCoords(e);
		const hover = resolveAutoLayoutHover(cx, cy, editor);
		if (hover?.kind !== "padding" && hover?.kind !== "padding-value") return false;
		if (!hover.side) return false;
		const node = editor.graph.getNode(hover.nodeId);
		if (!node) return false;
		const value = paddingValue(node, hover.side);
		autoLayoutPaddingEdit.value = {
			nodeId: node.id,
			side: hover.side,
			value,
			previous: value
		};
		e.preventDefault();
		e.stopPropagation();
		return true;
	}
	function updateAutoLayoutPaddingEdit(value) {
		const edit = autoLayoutPaddingEdit.value;
		if (!edit || !Number.isFinite(value)) return;
		const next = Math.max(0, value);
		autoLayoutPaddingEdit.value = {
			...edit,
			value: next
		};
		editor.updateNode(edit.nodeId, { [paddingKey(edit.side)]: next });
	}
	function commitAutoLayoutPaddingEdit(value) {
		const edit = autoLayoutPaddingEdit.value;
		if (!edit || !Number.isFinite(value)) {
			autoLayoutPaddingEdit.value = null;
			return;
		}
		const next = Math.max(0, value);
		editor.updateNode(edit.nodeId, { [paddingKey(edit.side)]: edit.previous });
		editor.updateNodeWithUndo(edit.nodeId, { [paddingKey(edit.side)]: next }, "Update padding");
		autoLayoutPaddingEdit.value = null;
	}
	function cancelAutoLayoutPaddingEdit() {
		const edit = autoLayoutPaddingEdit.value;
		if (edit) editor.updateNode(edit.nodeId, { [paddingKey(edit.side)]: edit.previous });
		autoLayoutPaddingEdit.value = null;
	}
	function onDblClick(e) {
		if (startAutoLayoutPaddingEdit(e)) return;
		onTextDblClick(e);
	}
	function onMouseDown(e) {
		const paddingEdit = autoLayoutPaddingEdit.value;
		if (paddingEdit) commitAutoLayoutPaddingEdit(paddingEdit.value);
		if (!editor.state.editingTextId) canvasRef.value?.focus();
		editor.setHoveredNode(null);
		const { sx, sy, cx, cy } = getCoords(e);
		const selectedIdsBeforeMouseDown = new Set(editor.state.selectedIds);
		if (recordClick(sx, sy) === 1) selectedIdsBeforeClickSequence.value = selectedIdsBeforeMouseDown;
		handleToolMouseDown({
			event: e,
			cx,
			cy,
			sx,
			sy,
			editor,
			hitFns,
			cursorOverride,
			setDrag,
			tryStartRotation,
			handleTextEditClick
		});
	}
	function onMouseMove(e) {
		if (onCursorMove) {
			const { cx, cy } = getCoords(e);
			onCursorMove(cx, cy);
		}
		if (!drag.value) {
			const { cx, cy } = getCoords(e);
			updatePenHover(cx, cy, editor);
		}
		if (!drag.value) {
			const { cx, cy } = getCoords(e);
			updateNodeEditHover(editor, cx, cy);
		}
		if (!drag.value && editor.state.activeTool === "SELECT") {
			const { cx, cy } = getCoords(e);
			cursorOverride.value = updateHoverCursor(cx, cy, editor, hitFns);
			editor.setAutoLayoutHover(resolveAutoLayoutHover(cx, cy, editor));
		}
		if (!drag.value) return;
		const d = drag.value;
		if (d.type === "pan") {
			handlePanMove(d, e);
			return;
		}
		const { sx, sy, cx, cy } = getCoords(e);
		if (d.type === "rotate") {
			handleRotateMove(d, cx, cy, e.shiftKey);
			return;
		}
		if (d.type === "move") {
			handleMoveMove(d, cx, cy, sx, sy, editor);
			return;
		}
		if (d.type === "text-select") {
			handleTextSelectMove(cx, cy);
			return;
		}
		if (d.type === "resize") {
			applyResize(d, cx, cy, e.shiftKey, editor);
			return;
		}
		if (d.type === "pen-drag") {
			handlePenDragMove(d, cx, cy, spaceHeld.value, e, editor);
			return;
		}
		if (d.type === "edit-node" || d.type === "edit-handle") {
			handleNodeEditMove(d, cx, cy, editor, e.altKey, e.metaKey || e.ctrlKey, e.shiftKey);
			return;
		}
		if (d.type === "bend-handle") {
			handleBendHandleMove(d, cx, cy, e, editor);
			return;
		}
		if (d.type === "draw") {
			handleDrawMove(d, cx, cy, e.shiftKey, editor);
			return;
		}
		handleMarqueeMove(d, cx, cy);
	}
	function onMouseUp() {
		if (!drag.value) return;
		const d = drag.value;
		if (handleNodeEditMouseUp(drag, editor)) return;
		if (d.type === "move") handleMoveUp(d, editor);
		else if (d.type === "text-select") {
			drag.value = null;
			return;
		} else if (d.type === "resize") commitResizePreview(d, editor);
		else if (d.type === "pen-drag") {
			if (editor.state.penState?.pendingClose) editor.penCommit(true);
			drag.value = null;
			return;
		} else if (d.type === "rotate") {
			const preview = editor.state.rotationPreview;
			if (preview) {
				editor.updateNode(d.nodeId, { rotation: preview.angle });
				editor.commitRotation(d.nodeId, d.origRotation);
			}
			editor.setRotationPreview(null);
		} else if (d.type === "draw") handleDrawUp(d, editor);
		else if (d.type === "marquee") editor.setMarquee(null);
		drag.value = null;
		cursorOverride.value = null;
	}
	useEventListener(canvasRef, "dblclick", onDblClick);
	useEventListener(canvasRef, "mousedown", onMouseDown);
	useEventListener(canvasRef, "mousemove", onMouseMove);
	useEventListener(canvasRef, "mouseup", onMouseUp);
	useEventListener(canvasRef, "mouseleave", () => {
		if (!drag.value) editor.setHoveredNode(null);
	});
	useEventListener(window, "mouseup", () => {
		if (drag.value) onMouseUp();
	});
	setupPanZoom(canvasRef, editor, drag, onMouseDown, onMouseMove, onMouseUp);
	return {
		drag,
		cursorOverride,
		autoLayoutPaddingEdit,
		updateAutoLayoutPaddingEdit,
		commitAutoLayoutPaddingEdit,
		cancelAutoLayoutPaddingEdit
	};
}
//#endregion
export { useCanvasInput };

//# sourceMappingURL=useCanvasInput.js.map
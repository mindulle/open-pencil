import { CORNER_ROTATE_ZONE, HANDLE_HIT_RADIUS } from "@open-pencil/core/constants";
import { getAbsoluteRotation, getWorldHandles } from "@open-pencil/scene-graph/coordinate";
import { degToRad } from "@open-pencil/scene-graph/geometry";
//#region src/shared/assets/resize-cursor.svg?raw
var resize_cursor_default = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 1024 1024\">\n    <path d=\"M781.33 239.94 781.33 381.12 600.77 381.12 600.77 381.12 238.68 381.12 239.94 242.00 58.93 422.94 239.94 603.94 239.94 462.75 758.89 462.75 783.77 462.75 783.77 604.80 964.77 423.80Z\" fill=\"black\" stroke=\"white\" stroke-width=\"33.33\"/>\n</svg>\n\n";
//#endregion
//#region src/shared/assets/rotate-cursor.svg?raw
var rotate_cursor_default = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"680 1800 640 620\">\n  <path d=\"M1113.142,1956.331C1008.608,1982.71 887.611,2049.487 836.035,2213.487L891.955,2219.403L779,2396L705.496,2199.678L772.745,2206.792C832.051,1999.958 984.143,1921.272 1110.63,1892.641L1107.952,1824.711L1299,1911L1115.34,2012.065L1113.142,1956.331Z\" fill=\"black\" stroke=\"white\" stroke-width=\"33.33\"/>\n</svg>\n";
//#endregion
//#region src/shared/input/geometry.ts
function getPointerCoords(e, canvas, editor) {
	if (!canvas) return {
		sx: 0,
		sy: 0,
		cx: 0,
		cy: 0
	};
	const rect = canvas.getBoundingClientRect();
	const sx = e.clientX - rect.left;
	const sy = e.clientY - rect.top;
	const { x: cx, y: cy } = editor.screenToCanvas(sx, sy);
	return {
		sx,
		sy,
		cx,
		cy
	};
}
function canvasToLocalPoint(cx, cy, scopeId, editor) {
	const node = editor.graph.getNode(scopeId);
	if (!node) return {
		lx: cx,
		ly: cy
	};
	const abs = editor.graph.getAbsolutePosition(scopeId);
	let dx = cx - abs.x;
	let dy = cy - abs.y;
	if (node.rotation !== 0) {
		const hw = node.width / 2;
		const hh = node.height / 2;
		const rad = degToRad(-node.rotation);
		const cos = Math.cos(rad);
		const sin = Math.sin(rad);
		const rx = dx - hw;
		const ry = dy - hh;
		dx = rx * cos - ry * sin + hw;
		dy = rx * sin + ry * cos + hh;
	}
	return {
		lx: dx,
		ly: dy
	};
}
function hitTestInEditorScope(cx, cy, deep, editor) {
	const scopeId = editor.state.enteredContainerId;
	if (!editor.renderer) return null;
	if (scopeId) if (!editor.graph.getNode(scopeId)) editor.state.enteredContainerId = null;
	else return deep ? editor.graph.hitTestDeep(cx, cy, scopeId) : editor.graph.hitTest(cx, cy, scopeId);
	return deep ? editor.graph.hitTestDeep(cx, cy, editor.state.currentPageId) : editor.graph.hitTest(cx, cy, editor.state.currentPageId);
}
function isInsideEditorContainerBounds(cx, cy, containerId, editor, canvasToLocal) {
	const container = editor.graph.getNode(containerId);
	if (!container) return false;
	const { lx, ly } = canvasToLocal(cx, cy, containerId);
	return lx >= 0 && lx <= container.width && ly >= 0 && ly <= container.height;
}
function getCursorAngleFromHandle(handle, rotation) {
	const [bx, by] = {
		nw: [1, 1],
		ne: [-1, 1],
		se: [-1, -1],
		sw: [1, -1],
		n: [0, 1],
		e: [1, 0],
		s: [0, -1],
		w: [-1, 0]
	}[handle];
	return (Math.atan2(by, bx) * 180 / Math.PI - rotation + 360) % 360;
}
function getHitHandleByMatrix(cx, cy, node, graph, zoom = 1) {
	const handles = getWorldHandles(node, graph);
	const CORNER_R = HANDLE_HIT_RADIUS / zoom;
	const rotation = getAbsoluteRotation(node, graph);
	for (const [key, p] of Object.entries(handles)) {
		const handleKey = key;
		const dx = cx - p.x;
		const dy = cy - p.y;
		if (dx * dx + dy * dy <= CORNER_R * CORNER_R) return {
			handle: handleKey,
			rotation: getCursorAngleFromHandle(handleKey, rotation)
		};
	}
	return null;
}
function hitTestTopRotationHandleByMatrix(cx, cy, node, graph, zoom = 1) {
	const handles = getWorldHandles(node, graph);
	const rotation = getAbsoluteRotation(node, graph);
	const topMidX = (handles.nw.x + handles.ne.x) / 2;
	const topMidY = (handles.nw.y + handles.ne.y) / 2;
	const distance = 24 / zoom;
	const rad = degToRad(rotation - 90);
	const handle = {
		x: topMidX + Math.cos(rad) * distance,
		y: topMidY + Math.sin(rad) * distance
	};
	const radius = HANDLE_HIT_RADIUS / zoom;
	const dx = cx - handle.x;
	const dy = cy - handle.y;
	return dx * dx + dy * dy <= radius * radius;
}
function hitTestCornerRotationByMatrix(cx, cy, node, graph, zoom = 1) {
	const handles = getWorldHandles(node, graph);
	const HANDLE_R = HANDLE_HIT_RADIUS / zoom;
	const ROTATE_R = CORNER_ROTATE_ZONE / zoom;
	const corners = [
		{
			key: "nw",
			p: handles.nw
		},
		{
			key: "ne",
			p: handles.ne
		},
		{
			key: "se",
			p: handles.se
		},
		{
			key: "sw",
			p: handles.sw
		}
	];
	for (const { key, p } of corners) {
		const dx = cx - p.x;
		const dy = cy - p.y;
		const d = Math.hypot(dx, dy);
		if (d > HANDLE_R && d <= ROTATE_R) switch (key) {
			case "nw":
				if (dx < 0 && dy < 0) return key;
				break;
			case "ne":
				if (dx > 0 && dy < 0) return key;
				break;
			case "se":
				if (dx > 0 && dy > 0) return key;
				break;
			case "sw":
				if (dx < 0 && dy > 0) return key;
				break;
		}
	}
	return null;
}
const CORNER_BASE_ANGLES = {
	nw: 0,
	ne: 90,
	se: 180,
	sw: 270
};
const rotationCursorCache = /* @__PURE__ */ new Map();
function buildRotationCursor(angleDeg) {
	const key = Math.round(angleDeg) % 360;
	let cached = rotationCursorCache.get(key);
	if (cached) return cached;
	let svg;
	if (key === 0) svg = rotate_cursor_default;
	else svg = rotate_cursor_default.replace("<path", `<g transform='translate(1002 2110) rotate(${key}) translate(-1002 -2110)'><path`).replace("</svg>", "</g></svg>");
	cached = `url("data:image/svg+xml,${encodeURIComponent(svg)}") 12 12, auto`;
	rotationCursorCache.set(key, cached);
	return cached;
}
function cornerRotationCursor(corner, nodeRotation = 0) {
	return buildRotationCursor(CORNER_BASE_ANGLES[corner] - nodeRotation);
}
function buildResizeCursor(angleDeg) {
	const normalized = (Math.round(angleDeg) % 360 + 360) % 360;
	const svg = resize_cursor_default.replace("<path", `<g transform='translate(512 512) rotate(${normalized}) translate(-512 -512)'><path`).replace("</svg>", "</g></svg>");
	return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 12 12, auto`;
}
//#endregion
//#region src/canvas/pointer/use.ts
function createCanvasPointer(canvasRef, editor, hitTestSectionTitle, hitTestComponentLabel, hitTestFrameTitle) {
	const canvasToLocal = (cx, cy, scopeId) => canvasToLocalPoint(cx, cy, scopeId, editor);
	const hitTestInScope = (cx, cy, deep) => hitTestInEditorScope(cx, cy, deep, editor);
	const isInsideContainerBounds = (cx, cy, containerId) => isInsideEditorContainerBounds(cx, cy, containerId, editor, canvasToLocal);
	return {
		getCoords: (e) => getPointerCoords(e, canvasRef.value, editor),
		canvasToLocal,
		hitTestInScope,
		isInsideContainerBounds,
		hitFns: {
			hitTestInScope,
			isInsideContainerBounds,
			hitTestSectionTitle,
			hitTestComponentLabel,
			hitTestFrameTitle
		}
	};
}
//#endregion
export { buildResizeCursor, cornerRotationCursor, createCanvasPointer, getHitHandleByMatrix, hitTestCornerRotationByMatrix, hitTestTopRotationHandleByMatrix };

//# sourceMappingURL=use.js.map
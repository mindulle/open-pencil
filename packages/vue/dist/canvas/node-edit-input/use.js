import { getCanvasNodeEditState } from "./bend.js";
//#region src/shared/input/node-edit/hit-test.ts
function getNodeEditState(editor) {
	return editor.state.nodeEditState ?? null;
}
const HANDLE_HIT_THRESHOLD_NE = 6;
function isEndpoint(vertexIndex, segments) {
	let count = 0;
	for (const seg of segments) if (seg.start === vertexIndex || seg.end === vertexIndex) count++;
	return count === 1;
}
function hitTestEditVertex(editor, cx, cy) {
	const es = getNodeEditState(editor);
	if (!es) return null;
	const iz = 1 / editor.state.zoom;
	for (let i = 0; i < es.vertices.length; i++) {
		const v = es.vertices[i];
		if (Math.hypot(cx - v.x, cy - v.y) < 8 * iz) return i;
	}
	return null;
}
function getHandleVisibleVertices(editor) {
	const es = getNodeEditState(editor);
	if (!es) return /* @__PURE__ */ new Set();
	const seed = new Set(es.selectedVertexIndices);
	for (const key of es.selectedHandles) {
		const [siStr, tf] = key.split(":");
		const seg = es.segments[Number(siStr)];
		seed.add(tf === "tangentStart" ? seg.start : seg.end);
	}
	const visible = new Set(seed);
	for (const seg of es.segments) {
		if (seed.has(seg.start)) visible.add(seg.end);
		if (seed.has(seg.end)) visible.add(seg.start);
	}
	return visible;
}
function hitTestEditHandle(editor, cx, cy) {
	const es = getNodeEditState(editor);
	if (!es) return null;
	const iz = 1 / editor.state.zoom;
	const visible = getHandleVisibleVertices(editor);
	for (let si = 0; si < es.segments.length; si++) {
		const seg = es.segments[si];
		if (visible.has(seg.start)) {
			const ts = seg.tangentStart;
			if (ts.x !== 0 || ts.y !== 0) {
				const hx = es.vertices[seg.start].x + ts.x;
				const hy = es.vertices[seg.start].y + ts.y;
				if (Math.hypot(cx - hx, cy - hy) < HANDLE_HIT_THRESHOLD_NE * iz) return {
					segmentIndex: si,
					tangentField: "tangentStart",
					vertexIndex: seg.start
				};
			}
		}
		if (visible.has(seg.end)) {
			const te = seg.tangentEnd;
			if (te.x !== 0 || te.y !== 0) {
				const hx = es.vertices[seg.end].x + te.x;
				const hy = es.vertices[seg.end].y + te.y;
				if (Math.hypot(cx - hx, cy - hy) < HANDLE_HIT_THRESHOLD_NE * iz) return {
					segmentIndex: si,
					tangentField: "tangentEnd",
					vertexIndex: seg.end
				};
			}
		}
	}
	return null;
}
//#endregion
//#region src/shared/input/node-edit/index.ts
function handleNodeEditDown(e, cx, cy, editor, setDrag) {
	const es = getNodeEditState(editor);
	if (!es) return;
	const nodeEditEditor = editor;
	const handleHit = hitTestEditHandle(editor, cx, cy);
	if (handleHit) {
		const key = `${handleHit.segmentIndex}:${handleHit.tangentField}`;
		if (e.shiftKey) {
			const next = new Set(es.selectedHandles);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			es.selectedHandles = next;
		} else {
			es.selectedVertexIndices = /* @__PURE__ */ new Set();
			es.selectedHandles = /* @__PURE__ */ new Set([key]);
		}
		nodeEditEditor.nodeEditPushHistory?.();
		setDrag({
			type: "edit-handle",
			segmentIndex: handleHit.segmentIndex,
			tangentField: handleHit.tangentField,
			vertexIndex: handleHit.vertexIndex,
			startX: cx,
			startY: cy,
			initialTangent: (() => {
				const seg = es.segments[handleHit.segmentIndex];
				const tangent = handleHit.tangentField === "tangentStart" ? seg.tangentStart : seg.tangentEnd;
				return {
					x: tangent.x,
					y: tangent.y
				};
			})()
		});
		return;
	}
	const vi = hitTestEditVertex(editor, cx, cy);
	if (vi !== null) {
		if (!e.shiftKey) es.selectedHandles = /* @__PURE__ */ new Set();
		if (e.metaKey || e.ctrlKey) {
			nodeEditEditor.nodeEditSelectVertex?.(vi, false);
			nodeEditEditor.nodeEditPushHistory?.();
			setDrag({
				type: "bend-handle",
				vertexIndex: vi,
				startX: es.vertices[vi].x,
				startY: es.vertices[vi].y,
				lockedMode: null,
				dragSamples: [],
				targetSegmentIndex: null,
				targetTangentField: null
			});
			return;
		}
		if (!(es.selectedVertexIndices.has(vi) && !e.shiftKey)) nodeEditEditor.nodeEditSelectVertex?.(vi, e.shiftKey);
		const origPositions = /* @__PURE__ */ new Map();
		for (const idx of es.selectedVertexIndices) origPositions.set(idx, {
			x: es.vertices[idx].x,
			y: es.vertices[idx].y
		});
		if (!origPositions.has(vi)) origPositions.set(vi, {
			x: es.vertices[vi].x,
			y: es.vertices[vi].y
		});
		nodeEditEditor.nodeEditPushHistory?.();
		setDrag({
			type: "edit-node",
			startX: cx,
			startY: cy,
			origPositions
		});
		return;
	}
	nodeEditEditor.exitNodeEditMode?.(true);
}
function handlePenNodeEditDown(e, cx, cy, editor) {
	const es = getNodeEditState(editor);
	if (!es) return;
	const nodeEditEditor = editor;
	const vi = hitTestEditVertex(editor, cx, cy);
	if (vi !== null) {
		if (e.altKey) {
			nodeEditEditor.nodeEditRemoveVertex?.(vi);
			return;
		}
		if (isEndpoint(vi, es.segments)) {
			const nodeId = es.nodeId;
			nodeEditEditor.exitNodeEditMode?.(true);
			nodeEditEditor.penResumeFromEndpoint?.(nodeId, vi);
		}
		return;
	}
	nodeEditEditor.nodeEditAddVertex?.(cx, cy);
}
function handleNodeEditMove(d, cx, cy, editor, breakMirroring, continuous, lockDirection) {
	const nodeEditEditor = editor;
	if (d.type === "edit-node") {
		const dx = cx - d.startX;
		const dy = cy - d.startY;
		const es = getNodeEditState(editor);
		if (!es) return;
		for (const [idx, orig] of d.origPositions) es.vertices[idx] = {
			...es.vertices[idx],
			x: orig.x + dx,
			y: orig.y + dy
		};
		editor.requestRepaint();
		return;
	}
	const es = getNodeEditState(editor);
	if (!es) return;
	const vertex = es.vertices[d.vertexIndex];
	let newTangent = {
		x: cx - vertex.x,
		y: cy - vertex.y
	};
	if (lockDirection && (vertex.handleMirroring === "ANGLE" || vertex.handleMirroring === "ANGLE_AND_LENGTH") && d.initialTangent) {
		const len = Math.hypot(d.initialTangent.x, d.initialTangent.y);
		if (len > 1e-6) {
			const dir = {
				x: d.initialTangent.x / len,
				y: d.initialTangent.y / len
			};
			const projectedLen = Math.max(0, newTangent.x * dir.x + newTangent.y * dir.y);
			newTangent = {
				x: dir.x * projectedLen,
				y: dir.y * projectedLen
			};
		}
	}
	nodeEditEditor.nodeEditSetHandle?.(d.segmentIndex, d.tangentField, newTangent, {
		breakMirroring,
		continuous,
		lockDirection
	});
}
//#endregion
//#region src/canvas/node-edit-input/use.ts
function updateNodeEditHover(editor, cx, cy) {
	const nodeEditState = getCanvasNodeEditState(editor);
	if (!nodeEditState) return false;
	const hit = hitTestEditHandle(editor, cx, cy);
	const prev = nodeEditState.hoveredHandleInfo;
	if (hit) {
		if (!prev || prev.segmentIndex !== hit.segmentIndex || prev.tangentField !== hit.tangentField) {
			nodeEditState.hoveredHandleInfo = {
				segmentIndex: hit.segmentIndex,
				tangentField: hit.tangentField
			};
			editor.requestRepaint();
		}
	} else if (prev) {
		nodeEditState.hoveredHandleInfo = null;
		editor.requestRepaint();
	}
	return true;
}
function handleNodeEditMouseUp(drag, editor) {
	const nodeEditEditor = editor;
	const d = drag.value;
	if (!d) return false;
	if (d.type === "bend-handle") {
		if (d.lockedMode === null) nodeEditEditor.nodeEditZeroVertexHandles?.(d.vertexIndex);
		drag.value = null;
		return true;
	}
	if (d.type === "edit-node") {
		const es = getCanvasNodeEditState(editor);
		if (es && d.origPositions.size === 1) {
			const [draggedIdx] = d.origPositions.keys();
			if (isEndpoint(draggedIdx, es.segments)) {
				const v = es.vertices[draggedIdx];
				const iz = 1 / editor.state.zoom;
				for (let i = 0; i < es.vertices.length; i++) {
					if (i === draggedIdx) continue;
					if (!isEndpoint(i, es.segments)) continue;
					const t = es.vertices[i];
					if (Math.hypot(v.x - t.x, v.y - t.y) < 8 * iz) {
						nodeEditEditor.nodeEditConnectEndpoints?.(draggedIdx, i);
						drag.value = null;
						return true;
					}
				}
			}
		}
		drag.value = null;
		return true;
	}
	if (d.type === "edit-handle") {
		drag.value = null;
		return true;
	}
	return false;
}
//#endregion
export { getNodeEditState, handleNodeEditDown, handleNodeEditMouseUp, handleNodeEditMove, handlePenNodeEditDown, updateNodeEditHover };

//# sourceMappingURL=use.js.map
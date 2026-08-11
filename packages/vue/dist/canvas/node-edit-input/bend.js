//#region src/canvas/node-edit-input/bend.ts
function getCanvasNodeEditState(editor) {
	return editor.state.nodeEditState;
}
function resolveBendTargetHandle(es, vertexIndex, samples) {
	if (!es || samples.length === 0) return null;
	const vertex = es.vertices.at(vertexIndex);
	if (!vertex) return null;
	const vx = vertex.x;
	const vy = vertex.y;
	const sampleVector = samples.reduce((acc, p) => ({
		x: acc.x + (p.x - vx),
		y: acc.y + (p.y - vy)
	}), {
		x: 0,
		y: 0
	});
	const sampleLen = Math.hypot(sampleVector.x, sampleVector.y);
	if (sampleLen < 1e-6) return null;
	const sampleDir = {
		x: sampleVector.x / sampleLen,
		y: sampleVector.y / sampleLen
	};
	let best = null;
	let bestDot = -Infinity;
	for (let i = 0; i < es.segments.length; i++) {
		const seg = es.segments[i];
		let tangentField;
		let neighborIndex;
		let tangent;
		if (seg.start === vertexIndex) {
			tangentField = "tangentStart";
			neighborIndex = seg.end;
			tangent = seg.tangentStart;
		} else if (seg.end === vertexIndex) {
			tangentField = "tangentEnd";
			neighborIndex = seg.start;
			tangent = seg.tangentEnd;
		} else continue;
		const neighbor = es.vertices[neighborIndex];
		const base = Math.hypot(tangent.x, tangent.y) > 1e-6 ? tangent : {
			x: neighbor.x - vx,
			y: neighbor.y - vy
		};
		const baseLen = Math.hypot(base.x, base.y);
		if (baseLen < 1e-6) continue;
		const dir = {
			x: base.x / baseLen,
			y: base.y / baseLen
		};
		const dot = dir.x * sampleDir.x + dir.y * sampleDir.y;
		if (dot > bestDot) {
			bestDot = dot;
			best = {
				segmentIndex: i,
				tangentField
			};
		}
	}
	return best;
}
function handleBendHandleMove(d, cx, cy, event, editor) {
	const nodeEditEditor = editor;
	const nodeEditState = getCanvasNodeEditState(editor);
	const dx = cx - d.startX;
	const dy = cy - d.startY;
	if (Math.hypot(dx, dy) < 2) return;
	if (d.lockedMode === null) d.lockedMode = event.altKey ? "independent" : "symmetric";
	if (d.dragSamples.length < 3) d.dragSamples.push({
		x: cx,
		y: cy
	});
	if (d.targetSegmentIndex === null && d.dragSamples.length >= 3) {
		const target = resolveBendTargetHandle(nodeEditState, d.vertexIndex, d.dragSamples);
		if (target) {
			d.targetSegmentIndex = target.segmentIndex;
			d.targetTangentField = target.tangentField;
		}
	}
	if (d.targetSegmentIndex === null || d.targetTangentField === null) return;
	nodeEditEditor.nodeEditBendHandle?.(d.vertexIndex, dx, dy, d.lockedMode === "independent", d.targetSegmentIndex, d.targetTangentField);
}
//#endregion
export { getCanvasNodeEditState, handleBendHandleMove };

//# sourceMappingURL=bend.js.map
import { BLACK } from "../../constants.js";
import { computeAccurateBounds } from "../../vector/curve-math.js";
//#region src/editor/shapes/pen.ts
const PEN_DEFAULT_STROKE = {
	color: BLACK,
	weight: 2,
	opacity: 1,
	visible: true,
	align: "CENTER"
};
function projectTangentToAxis(active, opposite) {
	const axis = {
		x: -opposite.x,
		y: -opposite.y
	};
	const axisLen = Math.hypot(axis.x, axis.y);
	if (axisLen <= 1e-6) return active;
	const dir = {
		x: axis.x / axisLen,
		y: axis.y / axisLen
	};
	const len = Math.max(0, active.x * dir.x + active.y * dir.y);
	return {
		x: dir.x * len,
		y: dir.y * len
	};
}
function applyAnchorTangent(tangent, isClosing, firstSeg, lastSeg) {
	if (isClosing) {
		if (!firstSeg) return;
		if (firstSeg.start === 0) firstSeg.tangentStart = {
			x: tangent.x,
			y: tangent.y
		};
		else if (firstSeg.end === 0) firstSeg.tangentEnd = {
			x: tangent.x,
			y: tangent.y
		};
		return;
	}
	if (lastSeg) lastSeg.tangentEnd = {
		x: tangent.x,
		y: tangent.y
	};
}
function createPenActions(ctx, createShape) {
	function penAddVertex(x, y) {
		if (!ctx.state.penState) {
			ctx.state.penState = {
				vertices: [{
					x,
					y
				}],
				segments: [],
				dragTangent: null,
				oppositeDragTangent: null,
				pendingClose: false,
				closingToFirst: false
			};
			ctx.requestRender();
			return;
		}
		const ps = ctx.state.penState;
		const prevIdx = ps.vertices.length - 1;
		ps.vertices.push({
			x,
			y
		});
		const newIdx = ps.vertices.length - 1;
		ps.segments.push({
			start: prevIdx,
			end: newIdx,
			tangentStart: ps.dragTangent ?? {
				x: 0,
				y: 0
			},
			tangentEnd: {
				x: 0,
				y: 0
			}
		});
		ps.dragTangent = null;
		ps.oppositeDragTangent = null;
		ps.pendingClose = false;
		ctx.requestRender();
	}
	function penSetDragTangent(tx, ty, options) {
		if (!ctx.state.penState) return;
		const ps = ctx.state.penState;
		let active = {
			x: tx,
			y: ty
		};
		const isClosing = !!ps.pendingClose && ps.vertices.length > 2;
		const anchorIndex = isClosing ? 0 : ps.vertices.length - 1;
		const lastSeg = ps.segments.length > 0 ? ps.segments[ps.segments.length - 1] : void 0;
		const firstSeg = ps.segments.length > 0 ? ps.segments[0] : void 0;
		const opposite = options?.oppositeTangent ?? ps.oppositeDragTangent ?? (lastSeg ? lastSeg.tangentEnd : {
			x: -tx,
			y: -ty
		});
		if (options?.constrainToOpposite) active = projectTangentToAxis(active, opposite);
		ps.dragTangent = active;
		if (options?.keepOpposite ?? isClosing) {
			ps.oppositeDragTangent = {
				x: opposite.x,
				y: opposite.y
			};
			applyAnchorTangent(opposite, isClosing, firstSeg, lastSeg);
			if (options?.constrainToOpposite) ps.vertices[anchorIndex].handleMirroring = "ANGLE";
			else ps.vertices[anchorIndex].handleMirroring = "NONE";
		} else {
			const symmetric = {
				x: -active.x,
				y: -active.y
			};
			ps.oppositeDragTangent = symmetric;
			applyAnchorTangent(symmetric, isClosing, firstSeg, lastSeg);
			ps.vertices[anchorIndex].handleMirroring = "ANGLE_AND_LENGTH";
		}
		ctx.requestRender();
	}
	function penSetClosingToFirst(closing) {
		if (!ctx.state.penState) return;
		ctx.state.penState.closingToFirst = closing;
		ctx.requestRender();
	}
	function penSetPendingClose(closing) {
		if (!ctx.state.penState) return;
		ctx.state.penState.pendingClose = closing;
		ctx.requestRepaint();
	}
	function penSetKnotPosition(x, y) {
		if (!ctx.state.penState) return;
		const ps = ctx.state.penState;
		const anchorIndex = !!ps.pendingClose && ps.vertices.length > 2 ? 0 : ps.vertices.length - 1;
		ps.vertices[anchorIndex].x = x;
		ps.vertices[anchorIndex].y = y;
		ctx.requestRender();
	}
	function penCommit(closed) {
		const ps = ctx.state.penState;
		if (!ps || ps.vertices.length < 2) {
			ctx.state.penState = null;
			ctx.state.penCursorX = null;
			ctx.state.penCursorY = null;
			return;
		}
		if (closed && ps.pendingClose && ps.vertices.length > 2) {
			const prevIdx = ps.vertices.length - 1;
			ps.segments.push({
				start: prevIdx,
				end: 0,
				tangentStart: {
					x: 0,
					y: 0
				},
				tangentEnd: ps.dragTangent ?? {
					x: 0,
					y: 0
				}
			});
		}
		const regions = closed ? [{
			windingRule: "NONZERO",
			loops: [ps.segments.map((_, i) => i)]
		}] : [];
		const network = {
			vertices: ps.vertices.map((v) => ({ ...v })),
			segments: ps.segments.map((s) => ({
				...s,
				tangentStart: { ...s.tangentStart },
				tangentEnd: { ...s.tangentEnd }
			})),
			regions
		};
		const bounds = computeAccurateBounds(network);
		const normalizedNetwork = {
			vertices: network.vertices.map((v) => ({
				...v,
				x: v.x - bounds.x,
				y: v.y - bounds.y
			})),
			segments: network.segments,
			regions: network.regions
		};
		const fills = ps.resumedFills ? ps.resumedFills.map((f) => ({ ...f })) : [];
		const strokes = ps.resumedStrokes ? ps.resumedStrokes.map((s) => ({ ...s })) : [{ ...PEN_DEFAULT_STROKE }];
		const nodeId = createShape("VECTOR", bounds.x, bounds.y, bounds.width, bounds.height);
		ctx.graph.updateNode(nodeId, {
			vectorNetwork: normalizedNetwork,
			name: "Vector",
			fills,
			strokes
		});
		ctx.setSelectedIds(/* @__PURE__ */ new Set([nodeId]));
		ctx.state.penState = null;
		ctx.state.penCursorX = null;
		ctx.state.penCursorY = null;
		ctx.setActiveTool("SELECT");
		ctx.requestRender();
	}
	function penCancel() {
		ctx.state.penState = null;
		ctx.state.penCursorX = null;
		ctx.state.penCursorY = null;
		ctx.setActiveTool("SELECT");
		ctx.requestRender();
	}
	return {
		penAddVertex,
		penSetDragTangent,
		penSetClosingToFirst,
		penSetPendingClose,
		penSetKnotPosition,
		penCommit,
		penCancel
	};
}
//#endregion
export { createPenActions };

//# sourceMappingURL=pen.js.map
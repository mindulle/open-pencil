import { collectNodePositions, pushPositionUndo } from "./history/position.js";
import { restoreSubtree, snapshotSubtree } from "./clipboard/subtree-history.js";
import { textAutoResizeChanges } from "./text/auto-resize.js";
import { restorePageFromSnapshot, snapshotPage } from "./history/snapshot.js";
import { copyGeometryPaths } from "@open-pencil/scene-graph/copy";
import { cloneVectorNetwork } from "@open-pencil/scene-graph";
import { pick } from "es-toolkit/object";
//#region src/editor/undo.ts
function createResizeSnapshot(node) {
	return {
		x: node.x,
		y: node.y,
		width: node.width,
		height: node.height,
		vectorNetwork: node.vectorNetwork ? cloneVectorNetwork(node.vectorNetwork) : null,
		fillGeometry: copyGeometryPaths(node.fillGeometry),
		strokeGeometry: copyGeometryPaths(node.strokeGeometry)
	};
}
function createUndoActions(ctx) {
	function commitMove(originals) {
		pushPositionUndo(ctx, "Move", originals, collectNodePositions(ctx, originals.keys()));
	}
	function commitMoveWithReparent(originals) {
		const finals = /* @__PURE__ */ new Map();
		for (const [id] of originals) {
			const n = ctx.graph.getNode(id);
			if (n) finals.set(id, {
				x: n.x,
				y: n.y,
				parentId: n.parentId ?? ctx.state.currentPageId
			});
		}
		ctx.undo.push({
			label: "Move",
			forward: () => {
				for (const [id, pos] of finals) {
					ctx.graph.reparentNode(id, pos.parentId);
					ctx.graph.updateNode(id, {
						x: pos.x,
						y: pos.y
					});
					ctx.runLayoutForNode(id);
				}
			},
			inverse: () => {
				for (const [id, pos] of originals) {
					ctx.graph.reparentNode(id, pos.parentId);
					ctx.graph.updateNode(id, {
						x: pos.x,
						y: pos.y
					});
					ctx.runLayoutForNode(id);
				}
			}
		});
	}
	function commitDuplicateMove(rootIds, previousSelection) {
		const snapshots = /* @__PURE__ */ new Map();
		for (const id of rootIds) {
			const subtree = snapshotSubtree(ctx.graph, id);
			for (const [nodeId, snapshot] of subtree) snapshots.set(nodeId, snapshot);
		}
		const nextSelection = new Set(rootIds);
		ctx.undo.push({
			label: "Duplicate",
			forward: () => {
				for (const id of rootIds) {
					if (ctx.graph.getNode(id)) continue;
					const snapshot = snapshots.get(id);
					if (!snapshot) continue;
					restoreSubtree(ctx.graph, snapshot, snapshot.parentId ?? ctx.state.currentPageId, snapshots);
					ctx.runLayoutForNode(id);
				}
				ctx.setSelectedIds(new Set(nextSelection));
			},
			inverse: () => {
				for (const id of rootIds.toReversed()) ctx.graph.deleteNode(id);
				ctx.setSelectedIds(new Set(previousSelection));
			}
		});
	}
	function commitResize(nodeId, original) {
		const node = ctx.graph.getNode(nodeId);
		if (!node) return;
		const final = "vectorNetwork" in original || "fillGeometry" in original || "strokeGeometry" in original ? createResizeSnapshot(node) : {
			x: node.x,
			y: node.y,
			width: node.width,
			height: node.height
		};
		ctx.undo.push({
			label: "Resize",
			forward: () => {
				ctx.graph.updateNode(nodeId, final);
				ctx.runLayoutForNode(nodeId);
			},
			inverse: () => {
				ctx.graph.updateNode(nodeId, original);
				ctx.runLayoutForNode(nodeId);
			}
		});
	}
	function commitGroupResize(nodeId, origRect, origChildren) {
		const node = ctx.graph.getNode(nodeId);
		if (!node) return;
		const finalRect = {
			x: node.x,
			y: node.y,
			width: node.width,
			height: node.height
		};
		const finalChildren = /* @__PURE__ */ new Map();
		for (const [childId] of origChildren) {
			const child = ctx.graph.getNode(childId);
			if (child) finalChildren.set(childId, createResizeSnapshot(child));
		}
		ctx.undo.push({
			label: "Resize",
			forward: () => {
				ctx.graph.updateNode(nodeId, finalRect);
				for (const [childId, final] of finalChildren) ctx.graph.updateNode(childId, final);
				ctx.runLayoutForNode(nodeId);
			},
			inverse: () => {
				ctx.graph.updateNode(nodeId, origRect);
				for (const [childId, orig] of origChildren) ctx.graph.updateNode(childId, orig);
				ctx.runLayoutForNode(nodeId);
			}
		});
	}
	function commitRotation(nodeId, origRotation) {
		const node = ctx.graph.getNode(nodeId);
		if (!node) return;
		const finalRotation = node.rotation;
		ctx.undo.push({
			label: "Rotate",
			forward: () => {
				ctx.graph.updateNode(nodeId, { rotation: finalRotation });
			},
			inverse: () => {
				ctx.graph.updateNode(nodeId, { rotation: origRotation });
			}
		});
	}
	function commitNodeUpdate(nodeId, previous, label = "Update") {
		const node = ctx.graph.getNode(nodeId);
		if (!node) return;
		const restoredPrevious = {
			...previous,
			...textAutoResizeChanges(node, previous)
		};
		const current = pick(node, Object.keys(restoredPrevious));
		ctx.undo.push({
			label,
			forward: () => {
				ctx.graph.updateNode(nodeId, current);
				ctx.runLayoutForNode(nodeId);
			},
			inverse: () => {
				ctx.graph.updateNode(nodeId, restoredPrevious);
				ctx.runLayoutForNode(nodeId);
			}
		});
	}
	function undoAction(validateEnteredContainer) {
		ctx.undo.undo();
		validateEnteredContainer();
		ctx.requestRender();
	}
	function redoAction(validateEnteredContainer) {
		ctx.undo.redo();
		validateEnteredContainer();
		ctx.requestRender();
	}
	function snapshotPage$1() {
		return snapshotPage(ctx.graph, ctx.state.currentPageId);
	}
	function restorePageFromSnapshot$1(snapshot) {
		restorePageFromSnapshot(ctx, snapshot);
	}
	function pushUndoEntry(entry) {
		ctx.undo.push(entry);
	}
	return {
		commitMove,
		commitMoveWithReparent,
		commitDuplicateMove,
		commitResize,
		commitGroupResize,
		commitRotation,
		commitNodeUpdate,
		undoAction,
		redoAction,
		snapshotPage: snapshotPage$1,
		restorePageFromSnapshot: restorePageFromSnapshot$1,
		pushUndoEntry
	};
}
//#endregion
export { createUndoActions };

//# sourceMappingURL=undo.js.map
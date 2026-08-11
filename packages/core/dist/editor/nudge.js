import { collectNodePositions, pushPositionUndo } from "./history/position.js";
//#region src/editor/nudge.ts
const NUDGE_COMMIT_DELAY = 300;
function createNudgeActions(ctx) {
	let nudgeOriginals = null;
	let nudgeCommitTimer = null;
	function commitNudge() {
		if (!nudgeOriginals) return;
		const originals = nudgeOriginals;
		nudgeOriginals = null;
		nudgeCommitTimer = null;
		pushPositionUndo(ctx, "Nudge", originals, collectNodePositions(ctx, originals.keys()));
	}
	function nudgeSelected(dx, dy) {
		const ids = [...ctx.state.selectedIds];
		if (ids.length === 0) return;
		const movable = [];
		for (const id of ids) {
			const node = ctx.graph.getNode(id);
			if (node && !node.locked) movable.push(id);
		}
		if (movable.length === 0) return;
		if (!nudgeOriginals) {
			nudgeOriginals = /* @__PURE__ */ new Map();
			for (const id of movable) {
				const node = ctx.graph.getNode(id);
				if (node) nudgeOriginals.set(id, {
					x: node.x,
					y: node.y
				});
			}
		}
		for (const id of movable) {
			const node = ctx.graph.getNode(id);
			if (!node) continue;
			ctx.graph.updateNode(id, {
				x: node.x + dx,
				y: node.y + dy
			});
			ctx.runLayoutForNode(id);
		}
		if (nudgeCommitTimer) clearTimeout(nudgeCommitTimer);
		nudgeCommitTimer = setTimeout(commitNudge, NUDGE_COMMIT_DELAY);
		ctx.requestRender();
	}
	function flushNudge() {
		if (nudgeCommitTimer) {
			clearTimeout(nudgeCommitTimer);
			commitNudge();
		}
	}
	return {
		nudgeSelected,
		flushNudge
	};
}
//#endregion
export { createNudgeActions };

//# sourceMappingURL=nudge.js.map
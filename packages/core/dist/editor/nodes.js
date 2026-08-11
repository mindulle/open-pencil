import { createLayoutModeActions } from "./layout-mode.js";
import { createNudgeActions } from "./nudge.js";
import { textAutoResizeChanges } from "./text/auto-resize.js";
import { createVariableBindingActions } from "./variable-bindings.js";
import { styleDetachmentChanges } from "@open-pencil/scene-graph";
import { pick } from "es-toolkit/object";
//#region src/editor/nodes.ts
function opacityFromBuffer(buffer) {
	if (buffer === "0") return 1;
	if (!/^\d+$/.test(buffer)) return 1;
	const n = Number.parseInt(buffer, 10);
	if (!Number.isFinite(n)) return 1;
	const percent = buffer.length === 1 ? n * 10 : n;
	return Math.min(100, Math.max(0, percent)) / 100;
}
function createNodeActions(ctx) {
	const layoutModeActions = createLayoutModeActions(ctx);
	const nudgeActions = createNudgeActions(ctx);
	const variableBindingActions = createVariableBindingActions(ctx);
	function updateNode(id, changes) {
		const node = ctx.graph.getNode(id);
		if (!node) return;
		const nextChanges = styleDetachmentChanges(node, {
			...changes,
			...textAutoResizeChanges(node, changes)
		});
		ctx.graph.updateNode(id, nextChanges);
		ctx.runLayoutForNode(id);
	}
	function updateNodeWithUndo(id, changes, label = "Update") {
		const node = ctx.graph.getNode(id);
		if (!node) return;
		const nextChanges = styleDetachmentChanges(node, {
			...changes,
			...textAutoResizeChanges(node, changes)
		});
		const previous = pick(node, Object.keys(nextChanges));
		ctx.graph.updateNode(id, nextChanges);
		ctx.runLayoutForNode(id);
		ctx.undo.push({
			label,
			forward: () => {
				ctx.graph.updateNode(id, nextChanges);
				ctx.runLayoutForNode(id);
			},
			inverse: () => {
				ctx.graph.updateNode(id, previous);
				ctx.runLayoutForNode(id);
			}
		});
		ctx.requestRender();
	}
	function setOpacity(opacity, coalesceKey) {
		if (!Number.isFinite(opacity)) return;
		const clamped = Math.max(0, Math.min(1, opacity));
		const ids = [...ctx.state.selectedIds];
		if (ids.length === 0) return;
		const changed = ids.map((id) => ctx.graph.getNode(id)).filter((n) => n != null).filter((t) => t.opacity !== clamped);
		if (changed.length === 0) return;
		ctx.undo.runBatch("Set opacity", () => {
			for (const target of changed) updateNodeWithUndo(target.id, { opacity: clamped }, "Set opacity");
		}, coalesceKey);
	}
	return {
		updateNode,
		updateNodeWithUndo,
		setOpacity,
		...layoutModeActions,
		...variableBindingActions,
		...nudgeActions
	};
}
//#endregion
export { createNodeActions, opacityFromBuffer };

//# sourceMappingURL=nodes.js.map
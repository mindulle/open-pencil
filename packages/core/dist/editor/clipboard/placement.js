import { computeBounds } from "@open-pencil/scene-graph/geometry";
import { isNotNil } from "es-toolkit/predicate";
//#region src/editor/clipboard/placement.ts
function createClipboardPlacementActions(ctx) {
	function centerNodesAt(nodeIds, cx, cy) {
		const items = nodeIds.map((id) => ctx.graph.getNode(id)).filter(isNotNil);
		const bounds = computeBounds(items);
		if (bounds.width === 0 && bounds.height === 0 && items.length === 0) return;
		const dx = cx - (bounds.x + bounds.width / 2);
		const dy = cy - (bounds.y + bounds.height / 2);
		for (const id of nodeIds) {
			const node = ctx.graph.getNode(id);
			if (node) ctx.graph.updateNode(id, {
				x: node.x + dx,
				y: node.y + dy
			});
		}
	}
	return { centerNodesAt };
}
//#endregion
export { createClipboardPlacementActions };

//# sourceMappingURL=placement.js.map
//#region src/editor/history/position.ts
function collectNodePositions(ctx, ids) {
	const positions = /* @__PURE__ */ new Map();
	for (const id of ids) {
		const node = ctx.graph.getNode(id);
		if (node) positions.set(id, {
			x: node.x,
			y: node.y
		});
	}
	return positions;
}
function pushPositionUndo(ctx, label, originals, finals) {
	ctx.undo.push({
		label,
		forward: () => applyPositions(ctx, finals),
		inverse: () => applyPositions(ctx, originals)
	});
}
function applyPositions(ctx, positions) {
	for (const [id, pos] of positions) {
		ctx.graph.updateNode(id, pos);
		ctx.runLayoutForNode(id);
	}
}
//#endregion
export { collectNodePositions, pushPositionUndo };

//# sourceMappingURL=position.js.map
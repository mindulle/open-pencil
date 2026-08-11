import { collectResizeDescendants, computeConstrainedResizeChanges } from "@open-pencil/scene-graph/resize";
//#region src/editor/shapes/frame-presets.ts
function fixedSizePatch(ctx, node, preset) {
	const parent = node.parentId ? ctx.graph.getNode(node.parentId) : void 0;
	const inheritsStretch = node.layoutPositioning !== "ABSOLUTE" && parent?.layoutMode !== "NONE" && (parent?.layoutMode === "GRID" || parent?.counterAxisAlign === "STRETCH");
	return {
		width: preset.width,
		height: preset.height,
		primaryAxisSizing: "FIXED",
		counterAxisSizing: "FIXED",
		layoutGrow: 0,
		layoutAlignSelf: node.layoutAlignSelf === "STRETCH" || node.layoutAlignSelf === "AUTO" && inheritsStretch ? "MIN" : node.layoutAlignSelf
	};
}
function createFramePresetActions(ctx, createShape) {
	function createFrameFromPreset(preset) {
		const { width: viewportWidth, height: viewportHeight } = ctx.getViewportSize();
		const centerX = (viewportWidth / 2 - ctx.state.panX) / ctx.state.zoom;
		const centerY = (viewportHeight / 2 - ctx.state.panY) / ctx.state.zoom;
		const previousSelection = new Set(ctx.state.selectedIds);
		const id = ctx.undo.runBatch("Create frame", () => {
			const createdId = createShape("FRAME", centerX - preset.width / 2, centerY - preset.height / 2, preset.width, preset.height, void 0, preset.name);
			const createdSelection = /* @__PURE__ */ new Set([createdId]);
			ctx.setSelectedIds(createdSelection);
			ctx.undo.push({
				label: "Select created frame",
				forward: () => ctx.setSelectedIds(new Set(createdSelection)),
				inverse: () => ctx.setSelectedIds(new Set(previousSelection))
			});
			return createdId;
		});
		ctx.setActiveTool("SELECT");
		ctx.requestRender();
		return id;
	}
	function applyResize(id, root, descendants) {
		ctx.graph.updateNode(id, root);
		for (const [childId, changes] of descendants) {
			ctx.graph.updateNode(childId, changes);
			if ("vectorNetwork" in changes) ctx.getRenderer()?.invalidateVectorPath(childId);
		}
		ctx.runLayoutForNode(id);
	}
	function applyLayoutAwareResize(id, previous, next, originals) {
		ctx.graph.updateNode(id, next);
		const provisional = computeConstrainedResizeChanges(ctx.graph, id, previous, next, originals);
		for (const [childId, changes] of provisional) ctx.graph.updateNode(childId, changes);
		ctx.runLayoutForNode(id);
		applyResize(id, next, computeConstrainedResizeChanges(ctx.graph, id, previous, next, originals));
	}
	function resizeFrameToPreset(id, preset) {
		const node = ctx.graph.getNode(id);
		if (node?.type !== "FRAME") return;
		const previous = {
			width: node.width,
			height: node.height,
			primaryAxisSizing: node.primaryAxisSizing,
			counterAxisSizing: node.counterAxisSizing,
			layoutGrow: node.layoutGrow,
			layoutAlignSelf: node.layoutAlignSelf
		};
		const next = fixedSizePatch(ctx, node, preset);
		if (previous.width === next.width && previous.height === next.height && previous.primaryAxisSizing === next.primaryAxisSizing && previous.counterAxisSizing === next.counterAxisSizing && previous.layoutGrow === next.layoutGrow && previous.layoutAlignSelf === next.layoutAlignSelf) return;
		const originalDescendants = collectResizeDescendants(ctx.graph, id) ?? /* @__PURE__ */ new Map();
		applyLayoutAwareResize(id, previous, next, originalDescendants);
		const resizedDescendants = collectResizeDescendants(ctx.graph, id) ?? /* @__PURE__ */ new Map();
		ctx.undo.push({
			label: "Resize frame to preset",
			forward: () => applyLayoutAwareResize(id, previous, next, originalDescendants),
			inverse: () => {
				applyLayoutAwareResize(id, next, previous, resizedDescendants);
				applyResize(id, previous, originalDescendants);
			}
		});
		ctx.requestRender();
	}
	return {
		createFrameFromPreset,
		resizeFrameToPreset
	};
}
//#endregion
export { createFramePresetActions };

//# sourceMappingURL=frame-presets.js.map
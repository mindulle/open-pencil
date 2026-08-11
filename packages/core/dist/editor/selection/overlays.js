//#region src/editor/selection/overlays.ts
function createSelectionOverlayActions(ctx) {
	function setMarquee(rect) {
		ctx.state.marquee = rect;
		ctx.requestRepaint();
	}
	function setSnapGuides(guides) {
		ctx.state.snapGuides = guides;
		ctx.requestRepaint();
	}
	function setRotationPreview(preview) {
		ctx.state.rotationPreview = preview;
		ctx.requestRepaint();
	}
	function setHoveredNode(id) {
		if (ctx.state.hoveredNodeId === id) return;
		ctx.state.hoveredNodeId = id;
		ctx.requestRepaint();
	}
	function setDropTarget(id) {
		if (ctx.state.dropTargetId === id) return;
		ctx.state.dropTargetId = id;
		ctx.requestRepaint();
	}
	function setLayoutInsertIndicator(indicator) {
		if (ctx.state.layoutInsertIndicator === indicator) return;
		ctx.state.layoutInsertIndicator = indicator;
		ctx.requestRepaint();
	}
	function setAutoLayoutHover(hover) {
		const current = ctx.state.autoLayoutHover;
		if (current?.nodeId === hover?.nodeId && current?.kind === hover?.kind && current?.index === hover?.index && current?.side === hover?.side) return;
		ctx.state.autoLayoutHover = hover;
		ctx.requestRepaint();
	}
	return {
		setMarquee,
		setSnapGuides,
		setRotationPreview,
		setHoveredNode,
		setDropTarget,
		setLayoutInsertIndicator,
		setAutoLayoutHover
	};
}
//#endregion
export { createSelectionOverlayActions };

//# sourceMappingURL=overlays.js.map
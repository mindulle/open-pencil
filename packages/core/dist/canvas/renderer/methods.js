import { clipNodeShape, getFillGeometry, getStrokeGeometry, getVectorPaths, makeNodeShapePath, makePolygonPath, makeRRect, makeRRectWithOffset, makeRRectWithSpread } from "../shapes.js";
import { applyFill, applyGradientFill, applyImageFill, drawArc, drawNodeFill } from "../fills.js";
import { applyClippedBlur, getCachedBlur, getCachedDecalBlur, getCachedDropShadow, getCachedMaskBlur } from "../effects.js";
import { drawComponentLabels, drawSectionTitles } from "../labels/draw.js";
import { drawNodeEditOverlay } from "../node-edit-overlay.js";
import { drawEnteredContainer, drawGroupBounds, drawHandle, drawHoverHighlight, drawNodeOutline, drawNodeSelection, drawParentFrameOutlines, drawSelection, getRotatedCorners } from "../overlays/selection.js";
import { drawAutoLayoutHover } from "../overlays/auto-layout-hover.js";
import { drawFlashes, drawLayoutInsertIndicator, drawMarquee, drawSnapGuides } from "../overlays/feedback.js";
import { drawTextEditOverlay } from "../overlays/text-edit.js";
import { drawSelectionLabels } from "../labels/selection.js";
import { drawPenOverlay, drawRemoteCursors } from "../pen-overlay.js";
import { drawAIOverlays } from "../overlays/ai.js";
import { drawRulers } from "../rulers.js";
import { drawIndividualSideStrokes, drawNodeStroke, drawRRectStrokeWithAlign, drawStrokeWithAlign, strokeNodeShape } from "../strokes.js";
import { renderComponentSet, renderNode, renderSection, renderShape, renderShapeUncached, renderText } from "../scene.js";
import { renderEffects } from "../shadows.js";
//#region src/canvas/renderer/methods.ts
const rendererMethods = {
	drawHoverHighlight(canvas, graph, hoveredNodeId) {
		drawHoverHighlight(this, canvas, graph, hoveredNodeId);
	},
	drawEnteredContainer(canvas, graph, enteredContainerId) {
		drawEnteredContainer(this, canvas, graph, enteredContainerId);
	},
	drawSelection(canvas, graph, selectedIds, overlays) {
		drawSelection(this, canvas, graph, selectedIds, overlays);
	},
	drawNodeSelection(canvas, node, rotation, graph) {
		drawNodeSelection(this, canvas, node, rotation, graph);
	},
	drawSelectionLabels(canvas, graph, selectedIds, overlays) {
		drawSelectionLabels(this, canvas, graph, selectedIds, overlays);
	},
	drawParentFrameOutlines(canvas, graph, selectedIds) {
		drawParentFrameOutlines(this, canvas, graph, selectedIds);
	},
	drawNodeOutline(canvas, node, rotation, graph) {
		drawNodeOutline(this, canvas, node, rotation, graph);
	},
	drawGroupBounds(canvas, nodes, graph) {
		drawGroupBounds(this, canvas, nodes, graph);
	},
	getRotatedCorners(n, abs) {
		return getRotatedCorners(this, n, abs);
	},
	drawHandle(canvas, x, y) {
		drawHandle(this, canvas, x, y);
	},
	drawSnapGuides(canvas, guides) {
		drawSnapGuides(this, canvas, guides);
	},
	drawMarquee(canvas, marquee) {
		drawMarquee(this, canvas, marquee);
	},
	drawFlashes(canvas, graph) {
		drawFlashes(this, canvas, graph);
		drawAIOverlays(this, canvas, graph);
	},
	drawLayoutInsertIndicator(canvas, indicator) {
		drawLayoutInsertIndicator(this, canvas, indicator);
	},
	drawAutoLayoutHover(canvas, graph, hover) {
		drawAutoLayoutHover(this, canvas, graph, hover);
	},
	drawTextEditOverlay(canvas, node, editor) {
		drawTextEditOverlay(this, canvas, node, editor);
	},
	drawNodeEditOverlay(canvas, graph, editState) {
		drawNodeEditOverlay(this, canvas, graph, editState);
	},
	drawPenOverlay(canvas, penState) {
		drawPenOverlay(this, canvas, penState);
	},
	drawRemoteCursors(canvas, graph, cursors) {
		drawRemoteCursors(this, canvas, graph, cursors);
	},
	drawRulers(canvas, graph, selectedIds) {
		drawRulers(this, canvas, graph, selectedIds);
	},
	drawSectionTitles(canvas, graph) {
		drawSectionTitles(this, canvas, graph);
	},
	drawComponentLabels(canvas, graph) {
		drawComponentLabels(this, canvas, graph);
	},
	renderNode(canvas, graph, nodeId, overlays, parentAbsX, parentAbsY, hasTransformedAncestor) {
		renderNode(this, canvas, graph, nodeId, overlays, parentAbsX, parentAbsY, hasTransformedAncestor);
	},
	renderSection(canvas, node, graph) {
		renderSection(this, canvas, node, graph);
	},
	renderComponentSet(canvas, node, graph) {
		renderComponentSet(this, canvas, node, graph);
	},
	renderShape(canvas, node, graph) {
		renderShape(this, canvas, node, graph);
	},
	renderShapeUncached(canvas, node, graph) {
		renderShapeUncached(this, canvas, node, graph);
	},
	renderEffects(canvas, node, rect, hasRadius, pass, shadowShapeChild) {
		renderEffects(this, canvas, node, rect, hasRadius, pass, shadowShapeChild);
	},
	renderText(canvas, node, fill) {
		renderText(this, canvas, node, fill);
	},
	drawNodeFill(canvas, node, rect, hasRadius, fill) {
		drawNodeFill(this, canvas, node, rect, hasRadius, fill);
	},
	applyFill(fill, node, graph, fillIndex = 0) {
		return applyFill(this, fill, node, graph, fillIndex);
	},
	applyGradientFill(fill, node, graph) {
		applyGradientFill(this, fill, node, graph);
	},
	applyImageFill(fill, node, graph) {
		return applyImageFill(this, fill, node, graph);
	},
	drawArc(canvas, node, paint) {
		drawArc(this, canvas, node, paint);
	},
	drawNodeStroke(canvas, node, rect, hasRadius) {
		drawNodeStroke(this, canvas, node, rect, hasRadius);
	},
	drawStrokeWithAlign(canvas, node, rect, hasRadius, align) {
		drawStrokeWithAlign(this, canvas, node, rect, hasRadius, align);
	},
	drawRRectStrokeWithAlign(canvas, rrect, node, stroke) {
		drawRRectStrokeWithAlign(this, canvas, rrect, node, stroke);
	},
	drawIndividualSideStrokes(canvas, node, align) {
		drawIndividualSideStrokes(this, canvas, node, align);
	},
	strokeNodeShape(canvas, node, paint) {
		strokeNodeShape(this, canvas, node, paint);
	},
	makeNodeShapePath(node, rect, hasRadius) {
		return makeNodeShapePath(this, node, rect, hasRadius);
	},
	makePolygonPath(node) {
		return makePolygonPath(this, node);
	},
	makeRRect(node) {
		return makeRRect(this, node);
	},
	makeRRectWithSpread(node, spread) {
		return makeRRectWithSpread(this, node, spread);
	},
	makeRRectWithOffset(node, ox, oy, spread) {
		return makeRRectWithOffset(this, node, ox, oy, spread);
	},
	clipNodeShape(canvas, node, rect, hasRadius) {
		clipNodeShape(this, canvas, node, rect, hasRadius);
	},
	getVectorPaths(node) {
		return getVectorPaths(this, node);
	},
	getFillGeometry(node) {
		return getFillGeometry(this, node);
	},
	getStrokeGeometry(node) {
		return getStrokeGeometry(this, node);
	},
	getCachedDropShadow(dx, dy, sigma, color) {
		return getCachedDropShadow(this, dx, dy, sigma, color);
	},
	getCachedBlur(sigma) {
		return getCachedBlur(this, sigma);
	},
	getCachedDecalBlur(sigma) {
		return getCachedDecalBlur(this, sigma);
	},
	getCachedMaskBlur(sigma) {
		return getCachedMaskBlur(this, sigma);
	},
	applyClippedBlur(canvas, node, rect, hasRadius, sigma) {
		applyClippedBlur(this, canvas, node, rect, hasRadius, sigma);
	}
};
function installRendererDomainMethods(prototype) {
	Object.assign(prototype, rendererMethods);
}
//#endregion
export { installRendererDomainMethods };

//# sourceMappingURL=methods.js.map
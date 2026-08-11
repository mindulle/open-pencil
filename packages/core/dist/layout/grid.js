import { resolveNodeLayoutDirection } from "../text/direction.js";
import { configureAbsoluteChild, createYogaNode, mapGridTrack } from "./yoga-helpers.js";
import { Direction, Display, Edge, Gutter } from "yoga-layout";
//#region src/layout/grid.ts
function configureAsGrid(yogaNode, node, direction) {
	yogaNode.setDisplay(Display.Grid);
	yogaNode.setDirection(direction === "RTL" ? Direction.RTL : Direction.LTR);
	yogaNode.setWidth(node.width);
	if (node.gridTemplateRows.length > 0 || node.height > 0) yogaNode.setHeight(node.height);
	if (node.gridTemplateColumns.length > 0) yogaNode.setGridTemplateColumns(node.gridTemplateColumns.map(mapGridTrack));
	if (node.gridTemplateRows.length > 0) yogaNode.setGridTemplateRows(node.gridTemplateRows.map(mapGridTrack));
	yogaNode.setGap(Gutter.Column, node.gridColumnGap);
	yogaNode.setGap(Gutter.Row, node.gridRowGap);
	yogaNode.setPadding(Edge.Top, node.paddingTop);
	yogaNode.setPadding(Edge.Right, node.paddingRight);
	yogaNode.setPadding(Edge.Bottom, node.paddingBottom);
	yogaNode.setPadding(Edge.Left, node.paddingLeft);
}
function createGridChildNode(child) {
	const yogaChild = createYogaNode();
	if (!child.visible) yogaChild.setDisplay(Display.None);
	else {
		const pos = child.gridPosition;
		if (pos) {
			yogaChild.setGridColumnStart(pos.column);
			yogaChild.setGridColumnEndSpan(pos.columnSpan);
			yogaChild.setGridRowStart(pos.row);
			yogaChild.setGridRowEndSpan(pos.rowSpan);
		}
		const hasLayout = child.layoutMode !== "NONE";
		const explicitStretch = child.layoutGrow > 0 || child.layoutAlignSelf === "STRETCH";
		const inheritsContainerStretch = hasLayout && child.layoutAlignSelf === "AUTO";
		if (explicitStretch || inheritsContainerStretch) yogaChild.setWidthStretch();
		else yogaChild.setWidth(child.width);
		if (explicitStretch) yogaChild.setHeightStretch();
		else yogaChild.setHeight(child.height);
	}
	return yogaChild;
}
function buildGridTree(graph, frame, inheritedDirection) {
	const root = createYogaNode();
	const direction = resolveNodeLayoutDirection(frame, inheritedDirection);
	configureAsGrid(root, frame, direction);
	const children = graph.getChildren(frame.id);
	for (const child of children) if (child.layoutPositioning === "ABSOLUTE") {
		const yogaChild = createYogaNode();
		configureAbsoluteChild(yogaChild, child);
		root.insertChild(yogaChild, root.getChildCount());
	} else {
		const yogaChild = createGridChildNode(child);
		if (child.layoutMode === "GRID" || child.layoutMode === "HORIZONTAL" || child.layoutMode === "VERTICAL") {
			const childDirection = resolveNodeLayoutDirection(child, direction);
			yogaChild.setDirection(childDirection === "RTL" ? Direction.RTL : Direction.LTR);
		}
		root.insertChild(yogaChild, root.getChildCount());
	}
	return root;
}
//#endregion
export { buildGridTree, createGridChildNode };

//# sourceMappingURL=grid.js.map
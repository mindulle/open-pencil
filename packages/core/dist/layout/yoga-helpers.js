import Yoga, { Align, Edge, GridTrackType, Justify, PositionType } from "yoga-layout";
//#region src/layout/yoga-helpers.ts
const yogaConfig = Yoga.Config.create();
yogaConfig.setPointScaleFactor(0);
function createYogaNode() {
	return Yoga.Node.create(yogaConfig);
}
function configureAbsoluteChild(yogaChild, child) {
	yogaChild.setPositionType(PositionType.Absolute);
	yogaChild.setPosition(Edge.Left, child.x);
	yogaChild.setPosition(Edge.Top, child.y);
	yogaChild.setWidth(child.width);
	yogaChild.setHeight(child.height);
}
function applyMinMaxConstraints(yogaNode, node) {
	if (node.minWidth != null) yogaNode.setMinWidth(node.minWidth);
	if (node.maxWidth != null) yogaNode.setMaxWidth(node.maxWidth);
	if (node.minHeight != null) yogaNode.setMinHeight(node.minHeight);
	if (node.maxHeight != null) yogaNode.setMaxHeight(node.maxHeight);
}
function mapGridTrack(track) {
	switch (track.sizing) {
		case "FR": return {
			type: GridTrackType.Fr,
			value: track.value
		};
		case "FIXED": return {
			type: GridTrackType.Points,
			value: track.value
		};
		default: return {
			type: GridTrackType.Auto,
			value: 0
		};
	}
}
function freeYogaTree(node) {
	for (let i = node.getChildCount() - 1; i >= 0; i--) freeYogaTree(node.getChild(i));
	if ("free" in node) node.free();
}
function mapJustify(align) {
	switch (align) {
		case "CENTER": return Justify.Center;
		case "MAX": return Justify.FlexEnd;
		case "SPACE_BETWEEN": return Justify.SpaceBetween;
		default: return Justify.FlexStart;
	}
}
function mapAlign(align) {
	switch (align) {
		case "CENTER": return Align.Center;
		case "MAX": return Align.FlexEnd;
		case "STRETCH": return Align.Stretch;
		case "BASELINE": return Align.Baseline;
		default: return Align.FlexStart;
	}
}
function mapAlignSelf(alignSelf) {
	switch (alignSelf) {
		case "MIN": return Align.FlexStart;
		case "CENTER": return Align.Center;
		case "MAX": return Align.FlexEnd;
		case "STRETCH": return Align.Stretch;
		case "BASELINE": return Align.Baseline;
		default: return null;
	}
}
//#endregion
export { applyMinMaxConstraints, configureAbsoluteChild, createYogaNode, freeYogaTree, mapAlign, mapAlignSelf, mapGridTrack, mapJustify };

//# sourceMappingURL=yoga-helpers.js.map
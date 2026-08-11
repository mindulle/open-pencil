import { BLACK, DEFAULT_FRAME_FILL, DEFAULT_SHAPE_FILL, SECTION_DEFAULT_FILL, SECTION_DEFAULT_STROKE } from "../constants.js";
import { createFramePresetActions } from "./shapes/frame-presets.js";
import { createPenActions } from "./shapes/pen.js";
import { adoptNodesIntoSection } from "./shapes/section-adopt.js";
//#region src/editor/shapes.ts
const BLACK_FILL = {
	type: "SOLID",
	color: BLACK,
	opacity: 1,
	visible: true
};
const DEFAULT_FILLS = {
	FRAME: DEFAULT_FRAME_FILL,
	SECTION: SECTION_DEFAULT_FILL,
	RECTANGLE: DEFAULT_SHAPE_FILL,
	ELLIPSE: DEFAULT_SHAPE_FILL,
	POLYGON: DEFAULT_SHAPE_FILL,
	STAR: DEFAULT_SHAPE_FILL,
	LINE: BLACK_FILL,
	TEXT: BLACK_FILL
};
function createShapeActions(ctx) {
	function createShape(type, x, y, w, h, parentId, name) {
		const fill = DEFAULT_FILLS[type] ?? DEFAULT_FILLS.RECTANGLE;
		const pid = parentId ?? ctx.state.currentPageId;
		const overrides = {
			x,
			y,
			width: w,
			height: h,
			fills: [{ ...fill }],
			...name ? { name } : {}
		};
		if (type === "SECTION") {
			overrides.strokes = [{ ...SECTION_DEFAULT_STROKE }];
			overrides.cornerRadius = 5;
		}
		if (type === "POLYGON") overrides.pointCount = 3;
		if (type === "STAR") {
			overrides.pointCount = 5;
			overrides.starInnerRadius = .38;
		}
		const node = ctx.graph.createNode(type, pid, overrides);
		const id = node.id;
		const snapshot = { ...node };
		ctx.undo.push({
			label: `Create ${type.toLowerCase()}`,
			forward: () => {
				ctx.graph.createNode(snapshot.type, pid, snapshot);
			},
			inverse: () => {
				ctx.graph.deleteNode(id);
				const next = new Set(ctx.state.selectedIds);
				next.delete(id);
				ctx.setSelectedIds(next);
			}
		});
		return id;
	}
	const penActions = createPenActions(ctx, createShape);
	const framePresetActions = createFramePresetActions(ctx, createShape);
	function setTool(tool) {
		ctx.setActiveTool(tool);
	}
	return {
		createShape,
		...penActions,
		...framePresetActions,
		adoptNodesIntoSection: (sectionId) => adoptNodesIntoSection(ctx, sectionId),
		setTool
	};
}
//#endregion
export { createShapeActions };

//# sourceMappingURL=shapes.js.map
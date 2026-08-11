import { SELECTION_COLOR } from "../constants.js";
//#region src/canvas/page-guides.ts
function rawGuides(graph, pageId) {
	const guides = graph.getNode(pageId ?? graph.rootId)?.source.fig.rawNodeFields.guides;
	if (!Array.isArray(guides)) return [];
	return guides.filter((guide) => guide !== null && typeof guide === "object");
}
function drawPageGuides(r, canvas, graph) {
	const guides = rawGuides(graph, r.pageId);
	if (guides.length === 0) return;
	r.auxStroke.setStrokeWidth(1);
	r.auxStroke.setColor(r.ck.Color4f(SELECTION_COLOR.r, SELECTION_COLOR.g, SELECTION_COLOR.b, .65));
	for (const guide of guides) {
		if (typeof guide.offset !== "number") continue;
		if (guide.axis === "X") {
			const x = guide.offset * r.zoom + r.panX;
			canvas.drawRect(r.ck.LTRBRect(x, 0, x + 1, r.viewportHeight), r.auxStroke);
		} else if (guide.axis === "Y") {
			const y = guide.offset * r.zoom + r.panY;
			canvas.drawRect(r.ck.LTRBRect(0, y, r.viewportWidth, y + 1), r.auxStroke);
		}
	}
}
//#endregion
export { drawPageGuides };

//# sourceMappingURL=page-guides.js.map
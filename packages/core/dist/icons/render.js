import { parseColor } from "../color/index.js";
import { createPathStroke } from "./path-style.js";
//#region src/icons/render.ts
function createIconFromPaths(graph, icon, name, size, color, parentId, overrides) {
	const frame = graph.createNode("FRAME", parentId, {
		name: `Icon / ${name}`,
		width: size,
		height: size,
		fills: [],
		...overrides
	});
	for (const path of icon.paths) {
		const vector = graph.createNode("VECTOR", frame.id, {
			name: "path",
			width: size,
			height: size,
			vectorNetwork: path.vectorNetwork
		});
		vector.x = 0;
		vector.y = 0;
		if (path.fill) {
			const fillColor = path.fill === "currentColor" ? color : parseColor(path.fill);
			graph.updateNode(vector.id, { fills: [{
				type: "SOLID",
				color: fillColor,
				opacity: 1,
				visible: true
			}] });
		} else graph.updateNode(vector.id, { fills: [] });
		if (path.stroke) {
			const strokeColor = path.stroke === "currentColor" ? color : parseColor(path.stroke);
			graph.updateNode(vector.id, { strokes: [createPathStroke(strokeColor, path.strokeWidth, path.strokeCap, path.strokeJoin)] });
		}
	}
	return frame;
}
//#endregion
export { createIconFromPaths };

//# sourceMappingURL=render.js.map
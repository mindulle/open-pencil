import { SELECTION_COLOR } from "../constants.js";
import { readEffectiveFigmaRawField } from "@open-pencil/fig";
//#region src/canvas/layout-grids.ts
function rawLayoutGrids(node) {
	const modeledGrids = node.layoutGrids ?? [];
	if (modeledGrids.length > 0) return modeledGrids;
	const grids = node.source ? readEffectiveFigmaRawField(node, "layoutGrids") : void 0;
	if (!Array.isArray(grids)) return [];
	return grids.filter((grid) => grid !== null && typeof grid === "object");
}
function rawGridPattern(grid) {
	if (grid.pattern === "GRID") return "GRID";
	if (grid.pattern === "ROWS") return "ROWS";
	if (grid.pattern === "COLUMNS") return "COLUMNS";
	if (grid.axis === "Y") return "ROWS";
	return "COLUMNS";
}
function rawGridAlignment(grid) {
	const value = grid.alignment ?? grid.type;
	if (value === "CENTER" || value === "MAX" || value === "STRETCH") return value;
	return "MIN";
}
function gridGeometry(grid) {
	if (grid.visible === false) return null;
	const count = grid.count ?? grid.numSections ?? 1;
	const sectionSize = grid.sectionSize ?? 0;
	const alignment = rawGridAlignment(grid);
	if (!Number.isFinite(count) || count <= 0) return null;
	if (rawGridPattern(grid) === "GRID" && sectionSize <= 0) return null;
	if (alignment !== "STRETCH" && sectionSize <= 0) return null;
	return {
		pattern: rawGridPattern(grid),
		alignment,
		count,
		offset: grid.offset ?? 0,
		sectionSize,
		gutterSize: grid.gutterSize ?? 0,
		color: grid.color ?? {
			...SELECTION_COLOR,
			a: .1
		}
	};
}
function gridSectionSize(nodeSize, grid) {
	if (grid.alignment !== "STRETCH") return grid.sectionSize;
	return (nodeSize - grid.offset * 2 - Math.max(0, grid.count - 1) * grid.gutterSize) / grid.count;
}
function gridStart(nodeSize, grid) {
	const sectionSize = gridSectionSize(nodeSize, grid);
	const span = grid.count * sectionSize + Math.max(0, grid.count - 1) * grid.gutterSize;
	if (grid.alignment === "CENTER") return (nodeSize - span) / 2 + grid.offset;
	if (grid.alignment === "MAX") return nodeSize - span - grid.offset;
	return grid.offset;
}
function drawColumnGrid(r, canvas, node, grid) {
	const sectionSize = gridSectionSize(node.width, grid);
	if (sectionSize <= 0) return;
	const x0 = gridStart(node.width, grid);
	for (let index = 0; index < grid.count; index++) {
		const x = x0 + index * (sectionSize + grid.gutterSize);
		canvas.drawRect(r.ck.LTRBRect(x, 0, x + sectionSize, node.height), r.auxFill);
	}
}
function drawRowGrid(r, canvas, node, grid) {
	const sectionSize = gridSectionSize(node.height, grid);
	if (sectionSize <= 0) return;
	const y0 = gridStart(node.height, grid);
	for (let index = 0; index < grid.count; index++) {
		const y = y0 + index * (sectionSize + grid.gutterSize);
		canvas.drawRect(r.ck.LTRBRect(0, y, node.width, y + sectionSize), r.auxFill);
	}
}
function drawSquareGrid(r, canvas, node, grid) {
	for (let x = grid.offset; x < node.width; x += grid.sectionSize) canvas.drawRect(r.ck.LTRBRect(x, 0, x + 1, node.height), r.auxFill);
	for (let y = grid.offset; y < node.height; y += grid.sectionSize) canvas.drawRect(r.ck.LTRBRect(0, y, node.width, y + 1), r.auxFill);
}
function drawLayoutGrids(r, canvas, node) {
	for (const rawGrid of rawLayoutGrids(node)) {
		const grid = gridGeometry(rawGrid);
		if (!grid) continue;
		r.auxFill.setColor(r.ck.Color4f(grid.color.r, grid.color.g, grid.color.b, grid.color.a));
		if (grid.pattern === "GRID") drawSquareGrid(r, canvas, node, grid);
		else if (grid.pattern === "ROWS") drawRowGrid(r, canvas, node, grid);
		else drawColumnGrid(r, canvas, node, grid);
	}
}
//#endregion
export { drawLayoutGrids };

//# sourceMappingURL=layout-grids.js.map
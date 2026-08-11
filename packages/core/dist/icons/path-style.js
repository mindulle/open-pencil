//#region src/icons/path-style.ts
const STROKE_CAP_MAP = {
	butt: "NONE",
	round: "ROUND",
	square: "SQUARE"
};
const STROKE_JOIN_MAP = {
	miter: "MITER",
	round: "ROUND",
	bevel: "BEVEL"
};
function createPathStroke(color, weight, strokeCap, strokeJoin) {
	return {
		color,
		weight,
		opacity: 1,
		visible: true,
		align: "CENTER",
		cap: STROKE_CAP_MAP[strokeCap] ?? "NONE",
		join: STROKE_JOIN_MAP[strokeJoin] ?? "MITER"
	};
}
//#endregion
export { createPathStroke };

//# sourceMappingURL=path-style.js.map
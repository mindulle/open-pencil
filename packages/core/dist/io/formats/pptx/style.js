import { colorToHex } from "../../../color/index.js";
//#region src/io/formats/pptx/style.ts
/** Scene paint/effect/text style → PPT property mapping (no slide geometry). */
function firstVisibleFill(node) {
	return node.fills.find((f) => f.visible) ?? null;
}
function firstVisibleStroke(node) {
	return node.strokes.find((s) => s.visible) ?? null;
}
function isRounded(node) {
	return effectiveRadius(node) > 0;
}
function hasAsymmetricCorners(node) {
	if (!node.independentCorners) return false;
	const radii = [
		node.topLeftRadius,
		node.topRightRadius,
		node.bottomRightRadius,
		node.bottomLeftRadius
	];
	return radii.some((radius) => Math.abs(radius - radii[0]) > 1e-6);
}
function effectiveRadius(node) {
	return node.independentCorners ? node.topLeftRadius : node.cornerRadius;
}
/** DROP_SHADOW without blur (design-system solid offset shadow) — drawn as a separate shape. */
function getSolidOffsetShadow(node) {
	const e = node.effects.find((fx) => fx.visible && fx.type === "DROP_SHADOW");
	if (!e) return null;
	if (e.radius > 1) return null;
	if (Math.abs(e.offset.x) < .5 && Math.abs(e.offset.y) < .5 && e.spread <= 0) return null;
	return e;
}
function mapShadow(node, opacity) {
	const e = node.effects.find((fx) => fx.visible && (fx.type === "DROP_SHADOW" || fx.type === "INNER_SHADOW"));
	if (!e) return void 0;
	const angleRaw = Math.atan2(e.offset.y, e.offset.x) * 180 / Math.PI;
	return {
		type: e.type === "INNER_SHADOW" ? "inner" : "outer",
		color: hex(e.color),
		opacity: clamp01(e.color.a * opacity),
		blur: Math.min(Math.max(e.radius, 0), 100),
		offset: Math.min(Math.hypot(e.offset.x, e.offset.y), 200),
		angle: angleRaw < 0 ? angleRaw + 360 : angleRaw
	};
}
function mapHAlign(a) {
	if (a === "CENTER") return "center";
	if (a === "RIGHT") return "right";
	if (a === "JUSTIFIED") return "justify";
	return "left";
}
function mapVAlign(a) {
	if (a === "CENTER") return "middle";
	if (a === "BOTTOM") return "bottom";
	return "top";
}
function applyTextCase(text, textCase) {
	if (textCase === "UPPER") return text.toUpperCase();
	if (textCase === "LOWER") return text.toLowerCase();
	if (textCase === "TITLE") return text.replace(/\b\w/g, (c) => c.toUpperCase());
	return text;
}
function hex(color) {
	return colorToHex(color).replace("#", "").slice(0, 6);
}
function transparency(alpha) {
	return Math.min(Math.max(Math.round((1 - clamp01(alpha)) * 100), 0), 100);
}
function clamp01(v) {
	return Math.min(Math.max(v, 0), 1);
}
function clampRot(deg) {
	return Math.min(Math.max(deg, -360), 360);
}
function round2(v) {
	return Math.round(v * 100) / 100;
}
//#endregion
export { applyTextCase, clamp01, clampRot, effectiveRadius, firstVisibleFill, firstVisibleStroke, getSolidOffsetShadow, hasAsymmetricCorners, hex, isRounded, mapHAlign, mapShadow, mapVAlign, round2, transparency };

//# sourceMappingURL=style.js.map
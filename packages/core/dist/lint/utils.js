//#region src/lint/utils.ts
function isDefaultName(name) {
	return /^(Frame|Rectangle|Ellipse|Line|Text|Group|Vector|Polygon|Star|Section|Component|Instance|Slice)\s*\d*$/i.test(name);
}
function isMultipleOf(value, base, tolerance = .01) {
	if (base === 0) return false;
	const remainder = value % base;
	return remainder < tolerance || base - remainder < tolerance;
}
function getNodePath(node) {
	const path = [];
	let current = node;
	while (current) {
		path.unshift(current.name);
		current = current.parent;
	}
	return path;
}
function relativeLuminance(rgb) {
	const [r, g, b] = [
		rgb.r,
		rgb.g,
		rgb.b
	].map((c) => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
	return .2126 * r + .7152 * g + .0722 * b;
}
function contrastRatio(a, b) {
	const l1 = relativeLuminance(a);
	const l2 = relativeLuminance(b);
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + .05) / (darker + .05);
}
const SPACING_SCALE = [
	0,
	1,
	2,
	4,
	8,
	12,
	16,
	20,
	24,
	32,
	40,
	48,
	56,
	64,
	80,
	96,
	128
];
//#endregion
export { SPACING_SCALE, contrastRatio, getNodePath, isDefaultName, isMultipleOf, relativeLuminance };

//# sourceMappingURL=utils.js.map
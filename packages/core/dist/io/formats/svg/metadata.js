import { parseSVGDocument } from "./document.js";
//#region src/io/formats/svg/metadata.ts
function rootElement(svg) {
	return parseSVGDocument(svg)?.documentElement ?? null;
}
function parseViewBoxValue(value) {
	if (!value) return null;
	const values = value.trim().split(/[\s,]+/).map(Number);
	if (values.length !== 4 || values.some((entry) => !Number.isFinite(entry))) return null;
	const [x = 0, y = 0, width = 0, height = 0] = values;
	if (width <= 0 || height <= 0) return null;
	return {
		x,
		y,
		width,
		height
	};
}
function parseSVGViewBox(svg) {
	return parseViewBoxValue(rootElement(svg)?.getAttribute("viewBox") ?? null);
}
function parseSVGDimension(root, attribute) {
	const value = root?.getAttribute(attribute);
	if (!value) return null;
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
function parseSVGSize(svg, fallback = {
	width: 24,
	height: 24
}) {
	const root = rootElement(svg);
	const viewBox = parseViewBoxValue(root?.getAttribute("viewBox") ?? null);
	const width = parseSVGDimension(root, "width");
	const height = parseSVGDimension(root, "height");
	if (width && height) return {
		width,
		height
	};
	if (viewBox) return {
		width: viewBox.width,
		height: viewBox.height
	};
	return fallback;
}
//#endregion
export { parseSVGSize, parseSVGViewBox };

//# sourceMappingURL=metadata.js.map
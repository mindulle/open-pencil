import { parseSVGDocument } from "../../../io/formats/svg/document.js";
import svgpath from "svgpath";
//#region src/vector/vectorize/svg/transform.ts
function alignmentOffset(align, remaining, axis) {
	const token = axis === "x" ? align.slice(0, 4) : align.slice(4);
	if (token.endsWith("Mid")) return remaining / 2;
	if (token.endsWith("Max")) return remaining;
	return 0;
}
function resolveSVGViewportMapping(svg, space, bounds, preserveAspectRatio) {
	const scaleX = bounds.width / space.width;
	const scaleY = bounds.height / space.height;
	if (!preserveAspectRatio) return {
		space,
		scaleX,
		scaleY,
		offsetX: 0,
		offsetY: 0
	};
	const tokens = (parseSVGDocument(svg)?.documentElement?.getAttribute("preserveAspectRatio")?.trim() ?? "").split(/\s+/).filter(Boolean);
	if (tokens.includes("none")) return {
		space,
		scaleX,
		scaleY,
		offsetX: 0,
		offsetY: 0
	};
	const align = tokens.find((token) => token.startsWith("x")) ?? "xMidYMid";
	const uniformScale = tokens.includes("slice") ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
	const remainingX = bounds.width - space.width * uniformScale;
	const remainingY = bounds.height - space.height * uniformScale;
	return {
		space,
		scaleX: uniformScale,
		scaleY: uniformScale,
		offsetX: alignmentOffset(align, remainingX, "x"),
		offsetY: alignmentOffset(align, remainingY, "y")
	};
}
function mapSVGPathToViewport(d, mapping) {
	return svgpath(d).translate(-mapping.space.x, -mapping.space.y).scale(mapping.scaleX, mapping.scaleY).translate(mapping.offsetX, mapping.offsetY).toString();
}
function mapSVGPointToViewport(x, y, elementTransform, gradientTransform, mapping) {
	let path = svgpath(`M${x} ${y}`);
	if (gradientTransform) path = path.transform(gradientTransform);
	if (elementTransform) path = path.transform(elementTransform);
	path = path.translate(-mapping.space.x, -mapping.space.y).scale(mapping.scaleX, mapping.scaleY).translate(mapping.offsetX, mapping.offsetY);
	const points = [];
	path.abs().iterate((segment) => {
		if (points.length === 0 && segment[0] === "M") points.push({
			x: segment[1],
			y: segment[2]
		});
	});
	return points[0] ?? {
		x,
		y
	};
}
/** Apply the complete SVG transform grammar through svgpath. */
function applySVGTransformToPath(d, transform) {
	if (!transform || transform === "none") return d;
	try {
		return svgpath(d).transform(transform).toString();
	} catch (error) {
		console.warn("Ignoring unsupported SVG transform:", transform, error);
		return d;
	}
}
//#endregion
export { applySVGTransformToPath, mapSVGPathToViewport, mapSVGPointToViewport, resolveSVGViewportMapping };

//# sourceMappingURL=transform.js.map
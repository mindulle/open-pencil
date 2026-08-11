import { computeAccurateBounds } from "../../curve-math.js";
import { parseColor } from "../../../color/index.js";
import { createPathStroke } from "../../../icons/path-style.js";
import { extractPaths } from "../../../icons/svg.js";
import { parseSVGSize, parseSVGViewBox } from "../../../io/formats/svg/metadata.js";
import { applySVGTransformToPath, mapSVGPathToViewport, resolveSVGViewportMapping } from "./transform.js";
import { parseSVGGradients, resolveGradientFill } from "./gradients.js";
import { computeBounds } from "@open-pencil/scene-graph/geometry";
import { parseSVGPath } from "@open-pencil/scene-graph/parse-path";
//#region src/vector/vectorize/svg/to-vectors.ts
function parseSVGCoordinateSpace(svg) {
	const viewBox = parseSVGViewBox(svg);
	if (viewBox && viewBox.width > 0 && viewBox.height > 0) return viewBox;
	const size = parseSVGSize(svg);
	return {
		x: 0,
		y: 0,
		width: size.width,
		height: size.height
	};
}
function unionPathBounds(paths) {
	return computeBounds(paths.map((path) => computeAccurateBounds(path.vectorNetwork)).filter((bounds) => bounds.width > 0 && bounds.height > 0));
}
function resolveFill(path, defaultColor) {
	if (path.fill && path.fill !== "none") return [{
		type: "SOLID",
		color: path.fill === "currentColor" ? parseColor(defaultColor) : parseColor(path.fill),
		opacity: 1,
		visible: true
	}];
	if (path.fill === null && !path.stroke) return [{
		type: "SOLID",
		color: parseColor(defaultColor),
		opacity: 1,
		visible: true
	}];
	return [];
}
function resolveStrokes(path, defaultColor, strokeScale = 1) {
	if (!path.stroke || path.stroke === "none") return [];
	return [createPathStroke(path.stroke === "currentColor" ? parseColor(defaultColor) : parseColor(path.stroke), path.strokeWidth * strokeScale, path.strokeCap, path.strokeJoin)];
}
function svgToVectorPaths(svgText, bounds, options) {
	const paths = extractPaths(svgText);
	if (paths.length === 0) return null;
	const space = parseSVGCoordinateSpace(svgText);
	if (space.width <= 0 || space.height <= 0) return null;
	const defaultColor = options?.defaultColor ?? "#000000";
	const gradients = parseSVGGradients(svgText);
	const viewport = resolveSVGViewportMapping(svgText, space, bounds, options?.preserveAspectRatio ?? false);
	const strokeScale = Math.min(viewport.scaleX, viewport.scaleY);
	const vectorized = [];
	for (const path of paths) {
		const fillRule = path.fillRule;
		const transform = path.transform ?? null;
		const network = parseSVGPath(mapSVGPathToViewport(applySVGTransformToPath(path.d, transform), viewport), fillRule);
		const gradientFill = gradients.size > 0 ? resolveGradientFill(path.fill, gradients, transform, viewport, computeAccurateBounds(network)) : null;
		vectorized.push({
			vectorNetwork: network,
			fills: gradientFill ? [gradientFill] : resolveFill(path, defaultColor),
			strokes: resolveStrokes(path, defaultColor, strokeScale)
		});
	}
	return {
		paths: vectorized,
		contentBounds: unionPathBounds(vectorized)
	};
}
//#endregion
export { svgToVectorPaths };

//# sourceMappingURL=to-vectors.js.map
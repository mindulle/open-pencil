import { encodeBase64 } from "../../../bytes/base64.js";
import { colorToDisplayCSS, getDefaultRenderColorSpace } from "../../../color/management.js";
import { colorToHex } from "../../../color/index.js";
import { round } from "./paths.js";
import { svg } from "./node.js";
//#region src/io/formats/svg/defs.ts
function nextDefId(ctx, prefix) {
	return `${prefix}${ctx.defIdCounter++}`;
}
function formatColor(color, opacity = 1, colorSpace = getDefaultRenderColorSpace()) {
	const alphaColor = {
		...color,
		a: color.a * opacity
	};
	if (colorSpace === "display-p3") return colorToDisplayCSS(alphaColor, { colorSpace });
	return colorToHex(alphaColor);
}
function createGradientDef(fill, node, ctx) {
	const stops = fill.gradientStops;
	const t = fill.gradientTransform;
	if (!stops || !t) return null;
	const stopNodes = stops.map((s) => svg("stop", {
		offset: `${round(s.position * 100)}%`,
		"stop-color": formatColor(s.color, 1, ctx.colorSpace),
		"stop-opacity": s.color.a < 1 ? round(s.color.a) : void 0
	}));
	const id = nextDefId(ctx, "grad");
	if (fill.type === "GRADIENT_LINEAR") {
		const startX = round(t.m02 * 100);
		const startY = round(t.m12 * 100);
		const endX = round((t.m00 + t.m02) * 100);
		const endY = round((t.m10 + t.m12) * 100);
		return {
			id,
			node: svg("linearGradient", {
				id,
				x1: `${startX}%`,
				y1: `${startY}%`,
				x2: `${endX}%`,
				y2: `${endY}%`,
				gradientUnits: "objectBoundingBox"
			}, ...stopNodes)
		};
	}
	if (fill.type === "GRADIENT_RADIAL" || fill.type === "GRADIENT_DIAMOND") {
		const cx = round(t.m02 * 100);
		const cy = round(t.m12 * 100);
		const r = round(Math.hypot(t.m00, t.m10) * 100);
		return {
			id,
			node: svg("radialGradient", {
				id,
				cx: `${cx}%`,
				cy: `${cy}%`,
				r: `${r}%`,
				gradientUnits: "objectBoundingBox"
			}, ...stopNodes)
		};
	}
	if (fill.type === "GRADIENT_ANGULAR") return {
		id,
		node: svg("radialGradient", {
			id,
			cx: round(t.m02 * node.width),
			cy: round(t.m12 * node.height),
			r: Math.max(node.width, node.height),
			gradientUnits: "userSpaceOnUse"
		}, ...stopNodes)
	};
	return null;
}
function createImagePattern(fill, node, ctx) {
	if (!fill.imageHash) return null;
	const data = ctx.graph.images.get(fill.imageHash);
	if (!data) return null;
	const id = nextDefId(ctx, "img");
	const base64 = encodeBase64(data);
	const mime = detectImageMime(data);
	return {
		id,
		node: svg("pattern", {
			id,
			patternUnits: "objectBoundingBox",
			width: 1,
			height: 1
		}, svg("image", {
			href: `data:${mime};base64,${base64}`,
			width: node.width,
			height: node.height,
			preserveAspectRatio: fill.imageScaleMode === "FIT" ? "xMidYMid meet" : "xMidYMid slice"
		}))
	};
}
function detectImageMime(data) {
	if (data[0] === 137 && data[1] === 80) return "image/png";
	if (data[0] === 255 && data[1] === 216) return "image/jpeg";
	if (data[0] === 82 && data[1] === 73) return "image/webp";
	return "image/png";
}
function createFilterDef(effects, ctx) {
	const visible = effects.filter((e) => e.visible);
	if (visible.length === 0) return null;
	const id = nextDefId(ctx, "fx");
	const primitives = [];
	for (const effect of visible) if (effect.type === "DROP_SHADOW") {
		const stdDev = round(effect.radius / 2);
		primitives.push(svg("feDropShadow", {
			dx: round(effect.offset.x),
			dy: round(effect.offset.y),
			stdDeviation: stdDev,
			"flood-color": formatColor(effect.color, 1, ctx.colorSpace),
			"flood-opacity": round(effect.color.a)
		}));
	} else if (effect.type === "INNER_SHADOW") {
		const sid = `${id}_is`;
		const stdDev = round(effect.radius / 2);
		primitives.push(svg("feGaussianBlur", {
			in: "SourceAlpha",
			stdDeviation: stdDev,
			result: `${sid}_blur`
		}), svg("feOffset", {
			dx: round(effect.offset.x),
			dy: round(effect.offset.y),
			result: `${sid}_off`
		}), svg("feComposite", {
			in: "SourceAlpha",
			in2: `${sid}_off`,
			operator: "out",
			result: `${sid}_inv`
		}), svg("feFlood", {
			"flood-color": formatColor(effect.color, 1, ctx.colorSpace),
			"flood-opacity": round(effect.color.a)
		}), svg("feComposite", {
			in2: `${sid}_inv`,
			operator: "in",
			result: `${sid}_shadow`
		}), svg("feComposite", {
			in: `${sid}_shadow`,
			in2: "SourceGraphic",
			operator: "over"
		}));
	} else {
		const stdDev = round(effect.radius / 2);
		primitives.push(svg("feGaussianBlur", { stdDeviation: stdDev }));
	}
	if (primitives.length === 0) return null;
	return {
		id,
		node: svg("filter", { id }, ...primitives)
	};
}
function resolveFill(fill, node, ctx) {
	if (!fill.visible) return null;
	if (fill.type === "SOLID") return formatColor(fill.color, fill.opacity, ctx.colorSpace);
	if (fill.type.startsWith("GRADIENT")) {
		const grad = createGradientDef(fill, node, ctx);
		if (grad) {
			ctx.defs.push(grad.node);
			return `url(#${grad.id})`;
		}
	}
	if (fill.type === "IMAGE") {
		const pattern = createImagePattern(fill, node, ctx);
		if (pattern) {
			ctx.defs.push(pattern.node);
			return `url(#${pattern.id})`;
		}
	}
	return null;
}
const SVG_STROKE_CAP = {
	NONE: "butt",
	ROUND: "round",
	SQUARE: "square"
};
const SVG_STROKE_JOIN = {
	MITER: "miter",
	ROUND: "round",
	BEVEL: "bevel"
};
const SVG_BLEND_MODE = {
	NORMAL: "normal",
	DARKEN: "darken",
	MULTIPLY: "multiply",
	COLOR_BURN: "color-burn",
	LIGHTEN: "lighten",
	SCREEN: "screen",
	COLOR_DODGE: "color-dodge",
	OVERLAY: "overlay",
	SOFT_LIGHT: "soft-light",
	HARD_LIGHT: "hard-light",
	DIFFERENCE: "difference",
	EXCLUSION: "exclusion",
	HUE: "hue",
	SATURATION: "saturation",
	COLOR: "color",
	LUMINOSITY: "luminosity"
};
//#endregion
export { SVG_BLEND_MODE, SVG_STROKE_CAP, SVG_STROKE_JOIN, createFilterDef, formatColor, nextDefId, resolveFill };

//# sourceMappingURL=defs.js.map
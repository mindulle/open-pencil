import { resolveNodeTextDirection } from "../../../text/direction.js";
import { arcPath, geometryBlobToSVGPath, hasRadius, makePolygonPoints, round, roundedRectPath, vectorNetworkToSVGPaths } from "./paths.js";
import { computeContentBounds } from "../raster/render.js";
import { renderSVGNode, svg } from "./node.js";
import { SVG_BLEND_MODE, SVG_STROKE_CAP, SVG_STROKE_JOIN, createFilterDef, formatColor, nextDefId, resolveFill } from "./defs.js";
//#region src/io/formats/svg/export.ts
function vectorShapeElements(node, common, strokeAttrs, ctx, fallbackFills) {
	const elements = [];
	if (node.fillGeometry.length > 0) for (const geo of node.fillGeometry) {
		const d = geometryBlobToSVGPath(geo.commandsBlob);
		if (!d) continue;
		const attrs = {
			d,
			"fill-rule": geo.windingRule === "EVENODD" ? "evenodd" : void 0,
			...common
		};
		const pathFills = geo.fills?.length ? geo.fills : fallbackFills;
		if (!pathFills) {
			elements.push(svg("path", attrs));
			continue;
		}
		const visibleFills = pathFills.filter((fill) => fill.visible);
		if (visibleFills.length === 0) {
			elements.push(svg("path", {
				...attrs,
				fill: "none"
			}));
			continue;
		}
		for (const [index, fill] of visibleFills.entries()) {
			const fillAttr = resolveFill(fill, node, ctx);
			if (!fillAttr) continue;
			elements.push(svg("path", {
				...attrs,
				fill: fillAttr,
				stroke: index === visibleFills.length - 1 ? common.stroke : "none"
			}));
		}
	}
	else if (node.vectorNetwork) {
		const paths = vectorNetworkToSVGPaths(node.vectorNetwork);
		for (const d of paths) elements.push(svg("path", {
			d,
			...common
		}));
	}
	if (node.strokeGeometry.length > 0 && strokeAttrs.stroke && strokeAttrs.stroke !== "none") for (const geo of node.strokeGeometry) {
		const d = geometryBlobToSVGPath(geo.commandsBlob);
		if (d) elements.push(svg("path", {
			d,
			fill: strokeAttrs.stroke,
			"fill-opacity": strokeAttrs["stroke-opacity"],
			stroke: "none"
		}));
	}
	return elements.length > 0 ? elements : [svg("rect", {
		width: round(node.width),
		height: round(node.height),
		...common
	})];
}
function nodeShapeElements(node, fillAttr, strokeAttrs, ctx) {
	const common = {
		fill: fillAttr ?? "none",
		...strokeAttrs
	};
	switch (node.type) {
		case "ELLIPSE":
			if (node.arcData) return [svg("path", {
				d: arcPath(node),
				...common
			})];
			return [svg("ellipse", {
				cx: round(node.width / 2),
				cy: round(node.height / 2),
				rx: round(node.width / 2),
				ry: round(node.height / 2),
				...common
			})];
		case "LINE": return [svg("line", {
			x1: 0,
			y1: 0,
			x2: round(node.width),
			y2: round(node.height),
			fill: "none",
			...strokeAttrs
		})];
		case "STAR":
		case "POLYGON": return [svg("polygon", {
			points: makePolygonPoints(node),
			...common
		})];
		case "VECTOR": return vectorShapeElements(node, common, strokeAttrs, ctx);
		default:
			if (hasRadius(node)) {
				if (node.independentCorners) return [svg("path", {
					d: roundedRectPath(node),
					...common
				})];
				return [svg("rect", {
					width: round(node.width),
					height: round(node.height),
					rx: round(node.cornerRadius),
					ry: round(node.cornerRadius),
					...common
				})];
			}
			return [svg("rect", {
				width: round(node.width),
				height: round(node.height),
				...common
			})];
	}
}
function styleOverrideToTspanAttrs(style, colorSpace) {
	const attrs = {};
	if (style.fontFamily) attrs["font-family"] = style.fontFamily;
	if (style.fontSize) attrs["font-size"] = style.fontSize;
	if (style.fontWeight) attrs["font-weight"] = style.fontWeight;
	if (style.italic) attrs["font-style"] = "italic";
	if (style.letterSpacing) attrs["letter-spacing"] = round(style.letterSpacing);
	if (style.textDecoration === "UNDERLINE") attrs["text-decoration"] = "underline";
	if (style.textDecoration === "STRIKETHROUGH") attrs["text-decoration"] = "line-through";
	if (style.fills) {
		const visibleFill = style.fills.find((f) => f.visible && f.type === "SOLID");
		if (visibleFill) attrs.fill = formatColor(visibleFill.color, visibleFill.opacity, colorSpace);
	}
	return attrs;
}
function isLogicalTextEnd(node, direction) {
	return direction === "LTR" && node.textAlignHorizontal === "RIGHT" || direction === "RTL" && node.textAlignHorizontal === "LEFT";
}
function textAnchorForNode(node, direction) {
	if (node.textAlignHorizontal === "CENTER") return "middle";
	if (isLogicalTextEnd(node, direction)) return "end";
}
function textXForNode(node, direction) {
	if (node.textAlignHorizontal === "CENTER") return round(node.width / 2);
	if (isLogicalTextEnd(node, direction)) return round(node.width);
	return 0;
}
function renderTextNode(node, fillAttr, colorSpace) {
	const direction = resolveNodeTextDirection(node);
	const textAnchor = textAnchorForNode(node, direction);
	let textDecoration;
	if (node.textDecoration === "UNDERLINE") textDecoration = "underline";
	else if (node.textDecoration === "STRIKETHROUGH") textDecoration = "line-through";
	const attrs = {
		"font-family": node.fontFamily || void 0,
		"font-size": node.fontSize || void 0,
		"font-weight": node.fontWeight !== 400 ? node.fontWeight : void 0,
		"font-style": node.italic ? "italic" : void 0,
		fill: fillAttr ?? void 0,
		direction: direction === "RTL" ? "rtl" : void 0,
		"text-anchor": textAnchor,
		"text-decoration": textDecoration,
		"letter-spacing": node.letterSpacing ? round(node.letterSpacing) : void 0
	};
	const x = textXForNode(node, direction);
	const y = node.fontSize || 14;
	if (node.styleRuns.length > 0) {
		const spans = [];
		let pos = 0;
		for (const run of node.styleRuns) {
			const text = node.text.slice(pos, pos + run.length);
			pos += run.length;
			spans.push(svg("tspan", styleOverrideToTspanAttrs(run.style, colorSpace), text));
		}
		return svg("text", {
			x,
			y,
			...attrs
		}, ...spans);
	}
	return svg("text", {
		x,
		y,
		...attrs
	}, node.text);
}
function buildTransformAttr(node) {
	const transforms = [];
	if (node.x !== 0 || node.y !== 0) transforms.push(`translate(${round(node.x)}, ${round(node.y)})`);
	if (node.rotation !== 0) transforms.push(`rotate(${round(node.rotation)}, ${round(node.width / 2)}, ${round(node.height / 2)})`);
	if (node.flipX || node.flipY) {
		const tx = node.flipX ? node.width : 0;
		const ty = node.flipY ? node.height : 0;
		const sx = node.flipX ? -1 : 1;
		const sy = node.flipY ? -1 : 1;
		transforms.push(`translate(${round(tx)}, ${round(ty)}) scale(${sx}, ${sy})`);
	}
	return transforms.length > 0 ? transforms.join(" ") : void 0;
}
function buildGroupAttrs(node, ctx) {
	const attrs = {};
	const transform = buildTransformAttr(node);
	if (transform) attrs.transform = transform;
	if (node.opacity < 1) attrs.opacity = round(node.opacity);
	const blend = SVG_BLEND_MODE[node.blendMode];
	if (blend && blend !== "normal" && node.blendMode !== "PASS_THROUGH") attrs.style = `mix-blend-mode: ${blend}`;
	const filterDef = createFilterDef(node.effects, ctx);
	if (filterDef) {
		ctx.defs.push(filterDef.node);
		attrs.filter = `url(#${filterDef.id})`;
	}
	let clipId;
	if (node.clipsContent && node.childIds.length > 0) {
		clipId = nextDefId(ctx, "clip");
		ctx.defs.push(svg("clipPath", { id: clipId }, svg("rect", {
			width: round(node.width),
			height: round(node.height)
		})));
	}
	return {
		attrs,
		clipId
	};
}
function buildSVGStrokeAttrs(visibleStrokes, colorSpace) {
	if (visibleStrokes.length === 0) return {};
	const stroke = visibleStrokes[0];
	const attrs = {
		stroke: formatColor(stroke.color, 1, colorSpace),
		"stroke-width": round(stroke.weight)
	};
	if (stroke.opacity < 1) attrs["stroke-opacity"] = round(stroke.opacity);
	if (stroke.cap && stroke.cap !== "NONE") attrs["stroke-linecap"] = SVG_STROKE_CAP[stroke.cap] ?? "butt";
	if (stroke.join && stroke.join !== "MITER") attrs["stroke-linejoin"] = SVG_STROKE_JOIN[stroke.join] ?? "miter";
	if (stroke.dashPattern && stroke.dashPattern.length > 0) attrs["stroke-dasharray"] = stroke.dashPattern.map((n) => round(n)).join(" ");
	return attrs;
}
function hasPathLevelFills(node) {
	return node.type === "VECTOR" && node.fillGeometry.some((geometry) => geometry.fills?.length);
}
function buildShapeChildren(node, visibleFills, fillAttr, strokeAttrs, visibleStrokeCount, ctx) {
	if (hasPathLevelFills(node)) return vectorShapeElements(node, {
		fill: fillAttr ?? "none",
		...strokeAttrs
	}, strokeAttrs, ctx, visibleFills);
	if (visibleFills.length > 1) {
		const elements = [];
		for (const fill of visibleFills) {
			const ref = resolveFill(fill, node, ctx);
			if (ref) elements.push(...nodeShapeElements(node, ref, fill === visibleFills[visibleFills.length - 1] ? strokeAttrs : {}, ctx));
		}
		return elements;
	}
	if ((fillAttr || visibleStrokeCount > 0) && !isGroupLike(node)) return nodeShapeElements(node, fillAttr, strokeAttrs, ctx);
	return [];
}
function renderNode(node, ctx) {
	if (!node.visible) return null;
	const { attrs: groupAttrs, clipId } = buildGroupAttrs(node, ctx);
	if (node.type === "TEXT") {
		const firstFill = node.fills.find((f) => f.visible);
		return svg("g", groupAttrs, renderTextNode(node, firstFill ? resolveFill(firstFill, node, ctx) : null, ctx.colorSpace));
	}
	const visibleFills = node.fills.filter((f) => f.visible);
	const visibleStrokes = node.strokes.filter((s) => s.visible);
	const children = buildShapeChildren(node, visibleFills, visibleFills.length > 0 && !hasPathLevelFills(node) ? resolveFill(visibleFills[0], node, ctx) : null, buildSVGStrokeAttrs(visibleStrokes, ctx.colorSpace), visibleStrokes.length, ctx);
	const childNodes = ctx.graph.getChildren(node.id);
	const childContent = [];
	for (const child of childNodes) {
		const rendered = renderNode(child, ctx);
		if (rendered) childContent.push(rendered);
	}
	if (clipId && childContent.length > 0) children.push(svg("g", { "clip-path": `url(#${clipId})` }, ...childContent));
	else children.push(...childContent);
	const validChildren = children.filter((c) => c !== null);
	if (validChildren.length === 0 && Object.keys(groupAttrs).length === 0) return null;
	if (validChildren.length === 1 && Object.keys(groupAttrs).length === 0) return validChildren[0];
	return svg("g", groupAttrs, ...validChildren);
}
function isGroupLike(node) {
	return node.type === "GROUP";
}
function renderNodesToSVG(graph, _pageId, nodeIds, options = {}) {
	const bounds = computeContentBounds(graph, nodeIds);
	if (!bounds) return null;
	const { minX, minY, maxX, maxY } = bounds;
	const width = round(maxX - minX);
	const height = round(maxY - minY);
	const ctx = {
		defs: [],
		defIdCounter: 0,
		graph,
		colorSpace: options.colorSpace ?? "srgb"
	};
	const contentNodes = [];
	for (const id of nodeIds) {
		const node = graph.getNode(id);
		if (!node?.visible) continue;
		const abs = graph.getAbsolutePosition(id);
		const offsetX = abs.x - minX;
		const offsetY = abs.y - minY;
		const rendered = renderNode(offsetX !== node.x || offsetY !== node.y ? {
			...node,
			x: round(offsetX),
			y: round(offsetY)
		} : node, ctx);
		if (rendered) contentNodes.push(rendered);
	}
	if (contentNodes.length === 0) return null;
	const rootChildren = [];
	if (ctx.defs.length > 0) rootChildren.push(svg("defs", {}, ...ctx.defs));
	rootChildren.push(...contentNodes);
	const svgStr = renderSVGNode(svg("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		"xmlns:xlink": "http://www.w3.org/1999/xlink",
		width,
		height,
		viewBox: `0 0 ${width} ${height}`
	}, ...rootChildren));
	return (options.xmlDeclaration !== false ? "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" : "") + svgStr;
}
//#endregion
export { geometryBlobToSVGPath, renderNodesToSVG, vectorNetworkToSVGPaths };

//# sourceMappingURL=export.js.map
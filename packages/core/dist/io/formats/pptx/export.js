import { encodeBase64 } from "../../../bytes/base64.js";
import { applyTextCase, effectiveRadius, firstVisibleFill, firstVisibleStroke, getSolidOffsetShadow, hasAsymmetricCorners, hex, isRounded, mapHAlign, mapShadow, mapVAlign, round2, transparency } from "./style.js";
import { hasUnsupportedTransform, inch, nodeBox, nodeScale, pt, transformNodeVector } from "./geometry.js";
import { makeIsolatedRasterize } from "./rasterize.js";
import { TransformMatrix, getWorldMatrix } from "@open-pencil/scene-graph";
//#region src/io/formats/pptx/export.ts
/**
* Scene graph → editable PPTX hybrid conversion.
*
* Text, rectangles, ellipses and lines become native (editable) PowerPoint
* elements; vectors, gradients, masks and blended subtrees fall back to PNG
* images. Unit conversion uses exact formulas — px→inch for positions/sizes and
* px→pt for fonts, letter spacing, line height and stroke widths (1in = 96px =
* 72pt) — with no hand-tuned factors.
*
* Each requested top-level FRAME becomes one slide. Non-frame roots are
* exported as a single image on their own slide.
*/
const BASE_SLIDE_WIDTH_IN = 13.333;
/** Sub-pixel slack when testing whether a clipped container actually crops. */
const CLIP_EPSILON_PX = .5;
const SIMPLE_BLENDS = /* @__PURE__ */ new Set(["NORMAL", "PASS_THROUGH"]);
/** Node types that map to native PPT shapes. Others recurse or fall back to PNG. */
const SHAPE_TYPES = /* @__PURE__ */ new Set([
	"FRAME",
	"RECTANGLE",
	"ROUNDED_RECTANGLE",
	"ELLIPSE",
	"LINE"
]);
const CONTAINER_TYPES = /* @__PURE__ */ new Set([
	"FRAME",
	"GROUP",
	"SECTION"
]);
async function renderNodesToPPTX(graph, _pageId, nodeIds, options = {}) {
	const roots = nodeIds.map((id) => graph.getNode(id)).filter((node) => node?.visible === true);
	if (!roots.length) return null;
	const { default: PptxGen } = await import("pptxgenjs");
	const first = roots[0];
	const firstWidth = Math.max(first.width, 1);
	const firstHeight = Math.max(first.height, 1);
	const slideW = firstWidth >= firstHeight ? BASE_SLIDE_WIDTH_IN : 7.5;
	const slideH = slideW * (firstHeight / firstWidth);
	const pptx = new PptxGen();
	pptx.defineLayout({
		name: "SCENE",
		width: slideW,
		height: slideH
	});
	pptx.layout = "SCENE";
	const rasterize = options.rasterize ?? makeIsolatedRasterize(graph, options.context);
	const stats = {
		editable: 0,
		fallback: 0,
		skipped: 0,
		fallbackReasons: {}
	};
	for (const root of roots) {
		const rootWidth = Math.max(root.width, 1);
		const rootHeight = Math.max(root.height, 1);
		const inchesPerPixel = Math.min(slideW / rootWidth, slideH / rootHeight);
		const contentWidth = rootWidth * inchesPerPixel;
		const contentHeight = rootHeight * inchesPerPixel;
		const offsetX = (slideW - contentWidth) / 2;
		const offsetY = (slideH - contentHeight) / 2;
		const ctx = {
			slide: pptx.addSlide(),
			graph,
			rasterize,
			pxPerInch: 1 / inchesPerPixel,
			toSlideSpace: TransformMatrix.invert(getWorldMatrix(root, graph)) ?? TransformMatrix.identity(),
			offsetX,
			offsetY,
			contentFillsSlide: Math.abs(offsetX) < 1e-6 && Math.abs(offsetY) < 1e-6,
			fallbackScale: options.fallbackScale ?? 2,
			stats
		};
		if (root.type !== "FRAME") {
			await addFallbackImage(ctx, root, root.opacity, `root node type ${root.type}`);
			continue;
		}
		const contentFallbackReason = rootContentFallbackReason(ctx, root);
		if (contentFallbackReason) {
			await addFallbackImage(ctx, root, root.opacity, contentFallbackReason);
			continue;
		}
		await addSlideFramePaint(ctx, root);
		for (const childId of root.childIds) {
			const child = graph.getNode(childId);
			if (child) await walkNode(ctx, child, root.opacity);
		}
	}
	const raw = await pptx.write({ outputType: "arraybuffer" });
	options.onStats?.(stats);
	return new Uint8Array(raw);
}
async function walkNode(ctx, node, inheritedOpacity) {
	if (!node.visible) {
		ctx.stats.skipped += 1;
		return;
	}
	const opacity = inheritedOpacity * node.opacity;
	const fallbackReason = getFallbackReason(ctx, node);
	if (fallbackReason) {
		await addFallbackImage(ctx, node, opacity, fallbackReason);
		return;
	}
	if (node.type === "TEXT") {
		addEditableText(ctx, node, opacity);
		return;
	}
	if (isImageLeaf(node)) {
		await addFallbackImage(ctx, node, opacity, null);
		ctx.stats.editable += 1;
		return;
	}
	if (SHAPE_TYPES.has(node.type)) addEditableShape(ctx, node, opacity);
	if (CONTAINER_TYPES.has(node.type)) for (const childId of node.childIds) {
		const child = ctx.graph.getNode(childId);
		if (child) await walkNode(ctx, child, opacity);
	}
}
/**
* Paints the slide frame itself. A plain solid fill becomes the slide
* background; a stroke, corner radius or translucency still maps to a native
* shape covering the slide. Only paint PPTX cannot express at all is
* rasterized, and then *without* the frame's children — they are converted
* natively right after, and baking them into the image too would draw every
* element twice.
*/
async function addSlideFramePaint(ctx, root) {
	const reason = rootRasterReason(root);
	if (reason) {
		await addFallbackImage(ctx, root, root.opacity, reason, { paintOnly: true });
		return;
	}
	const bg = firstVisibleFill(root);
	const plainBackground = ctx.contentFillsSlide && !root.strokes.some((s) => s.visible) && !root.effects.some((e) => e.visible && e.type === "INNER_SHADOW") && effectiveRadius(root) === 0;
	if (bg?.type === "SOLID" && plainBackground) {
		ctx.slide.background = {
			color: hex(bg.color),
			transparency: transparency(root.opacity * bg.opacity * bg.color.a)
		};
		return;
	}
	addEditableShape(ctx, root, root.opacity);
}
/** Why a slide frame's content must be rasterized as one composited image. */
function rootContentFallbackReason(ctx, root) {
	if (root.childIds.some((id) => {
		const child = ctx.graph.getNode(id);
		return child?.visible === true && child.isMask;
	})) return "contains mask";
	if (clipsOverflowingContent(ctx.graph, root)) return "clipped content";
	return null;
}
/** Why a slide frame's own paint has to be rasterized. Null means it maps natively. */
function rootRasterReason(root) {
	if (!SIMPLE_BLENDS.has(root.blendMode)) return "blend mode";
	if (root.effects.some((e) => e.visible && e.type !== "DROP_SHADOW" && e.type !== "INNER_SHADOW")) return "blur effect";
	const shadowReason = getShadowFallbackReason(root);
	if (shadowReason) return shadowReason;
	if (hasAsymmetricCorners(root)) return "asymmetric corners";
	if (root.strokes.filter((stroke) => stroke.visible).length > 1) return "multiple strokes";
	const fills = root.fills.filter((f) => f.visible);
	if (fills.length > 1) return "multiple fills";
	if (fills[0] && fills[0].type !== "SOLID") return "non-solid frame background";
	return null;
}
function getShadowFallbackReason(node) {
	const shadows = node.effects.filter((effect) => effect.visible && (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW"));
	if (shadows.length > 1) return "multiple shadows";
	if (shadows.length === 0) return null;
	const shadow = shadows[0];
	if (shadow.spread !== 0 && getSolidOffsetShadow(node) !== shadow) return "shadow spread";
	return null;
}
/** Why a node cannot be converted natively. Null means native conversion is possible. */
function getFallbackReason(ctx, node) {
	const commonReason = getCommonFallbackReason(ctx, node);
	if (commonReason) return commonReason;
	if (node.type === "TEXT") return getTextFallbackReason(node);
	if (SHAPE_TYPES.has(node.type) || CONTAINER_TYPES.has(node.type)) return getShapeFallbackReason(node);
	return `node type ${node.type}`;
}
function getCommonFallbackReason(ctx, node) {
	const { graph } = ctx;
	if (hasUnsupportedTransform(ctx, node)) return "unsupported transform";
	if (!SIMPLE_BLENDS.has(node.blendMode)) return "blend mode";
	if (node.effects.some((e) => e.visible && e.type !== "DROP_SHADOW" && e.type !== "INNER_SHADOW")) return "blur effect";
	const shadowReason = getShadowFallbackReason(node);
	if (shadowReason) return shadowReason;
	if (hasAsymmetricCorners(node)) return "asymmetric corners";
	if (node.strokes.filter((stroke) => stroke.visible).length > 1) return "multiple strokes";
	if (node.childIds.some((id) => graph.getNode(id)?.isMask)) return "contains mask";
	if (clipsOverflowingContent(graph, node)) return "clipped content";
	if (isVectorOnlyContainer(graph, node)) return "vector graphics";
	return null;
}
function getTextFallbackReason(node) {
	const fills = node.fills.filter((fill) => fill.visible);
	if (fills.length > 1) return "multiple text fills";
	if (fills[0] && fills[0].type !== "SOLID") return "non-solid text fill";
	if (node.strokes.some((stroke) => stroke.visible)) return "text stroke";
	for (const run of node.styleRuns) {
		const runFills = run.style.fills?.filter((fill) => fill.visible) ?? [];
		if (runFills.length > 1 || runFills.some((fill) => fill.type !== "SOLID")) return "unsupported text run fill";
	}
	return null;
}
function getShapeFallbackReason(node) {
	const visibleFills = node.fills.filter((fill) => fill.visible);
	if (visibleFills.some((fill) => fill.type.startsWith("GRADIENT"))) return "gradient fill";
	if (visibleFills.length > 1) return "multiple fills";
	if (visibleFills.some((fill) => fill.type === "IMAGE") && node.childIds.length > 0) return "image background container";
	return null;
}
function isImageLeaf(node) {
	return node.childIds.length === 0 && node.fills.some((f) => f.visible && f.type === "IMAGE");
}
/** True when `node` clips and some descendant actually reaches past its bounds. */
function clipsOverflowingContent(graph, node) {
	if (!node.clipsContent || !CONTAINER_TYPES.has(node.type)) return false;
	const toNodeSpace = TransformMatrix.invert(getWorldMatrix(node, graph));
	if (!toNodeSpace) return false;
	const pending = [...node.childIds];
	while (pending.length > 0) {
		const childId = pending.pop();
		const child = childId ? graph.getNode(childId) : void 0;
		if (!child?.visible) continue;
		const local = TransformMatrix.multiply(toNodeSpace, getWorldMatrix(child, graph));
		const corners = TransformMatrix.mapPoints(local, [
			0,
			0,
			child.width,
			0,
			child.width,
			child.height,
			0,
			child.height
		]);
		for (let i = 0; i < corners.length; i += 2) {
			const outsideX = corners[i] < -.5 || corners[i] > node.width + CLIP_EPSILON_PX;
			const outsideY = corners[i + 1] < -.5 || corners[i + 1] > node.height + CLIP_EPSILON_PX;
			if (outsideX || outsideY) return true;
		}
		pending.push(...child.childIds);
	}
	return false;
}
function isVectorOnlyContainer(graph, node) {
	if (!CONTAINER_TYPES.has(node.type)) return false;
	const children = node.childIds.map((id) => graph.getNode(id)).filter((child) => child?.visible === true);
	return children.length > 0 && children.every((child) => child.type === "VECTOR");
}
function addEditableShape(ctx, node, opacity) {
	const fill = firstVisibleFill(node);
	const stroke = firstVisibleStroke(node);
	if (!fill && !stroke) return;
	const box = nodeBox(ctx, node);
	const solidShadow = getSolidOffsetShadow(node);
	if (solidShadow) addSolidShadowShape(ctx, node, box, opacity, solidShadow);
	const common = {
		x: box.x,
		y: box.y,
		w: box.w,
		h: box.h,
		rotate: box.rotate,
		flipH: box.flipH,
		shadow: solidShadow ? void 0 : mapShadow(node, opacity),
		fill: fill?.type === "SOLID" ? {
			color: hex(fill.color),
			transparency: transparency(opacity * fill.opacity * fill.color.a)
		} : {
			color: "FFFFFF",
			transparency: 100
		},
		line: stroke ? {
			color: hex(stroke.color),
			width: pt(ctx, stroke.weight),
			transparency: transparency(opacity * stroke.opacity * stroke.color.a),
			dashType: (stroke.dashPattern?.length ?? 0) > 0 ? "dash" : "solid"
		} : {
			color: "FFFFFF",
			transparency: 100,
			width: 0
		}
	};
	if (node.type === "LINE") {
		const paint = stroke ?? fill;
		if (!paint) return;
		ctx.slide.addShape("line", {
			...common,
			line: {
				color: hex(paint.color),
				width: Math.max(pt(ctx, stroke?.weight ?? node.height), .25),
				transparency: transparency(opacity * paint.opacity * paint.color.a)
			}
		});
	} else if (node.type === "ELLIPSE") ctx.slide.addShape("ellipse", common);
	else if (isRounded(node)) {
		const scale = nodeScale(ctx, node);
		ctx.slide.addShape("roundRect", {
			...common,
			rectRadius: Math.min(inch(ctx, effectiveRadius(node) * Math.min(scale.x, scale.y)), Math.min(box.w, box.h) / 2)
		});
	} else ctx.slide.addShape("rect", common);
	ctx.stats.editable += 1;
}
function addEditableText(ctx, node, opacity) {
	if (!node.text) {
		ctx.stats.skipped += 1;
		return;
	}
	const box = nodeBox(ctx, node);
	const singleLine = node.maxLines === 1 || node.textAutoResize === "WIDTH_AND_HEIGHT";
	const runs = buildTextRuns(ctx, node, opacity);
	ctx.slide.addText(runs, {
		x: box.x,
		y: box.y,
		w: box.w,
		h: box.h,
		rotate: box.rotate,
		flipH: box.flipH,
		align: mapHAlign(node.textAlignHorizontal),
		valign: mapVAlign(node.textAlignVertical),
		margin: 0,
		wrap: !singleLine,
		fit: "shrink",
		lineSpacing: node.lineHeight != null ? pt(ctx, node.lineHeight) : void 0,
		shadow: mapShadow(node, opacity)
	});
	ctx.stats.editable += 1;
}
/** Merges styleRuns with base style into PPT text runs (keeps partial styling editable). */
function buildTextRuns(ctx, node, opacity) {
	const text = applyTextCase(node.text, node.textCase);
	const segs = [];
	const sorted = [...node.styleRuns].sort((a, b) => a.start - b.start);
	let cursor = 0;
	for (const run of sorted) {
		const start = Math.max(run.start, cursor);
		const end = Math.min(run.start + run.length, text.length);
		if (start > cursor) segs.push({
			start: cursor,
			end: start,
			style: {}
		});
		if (end > start) segs.push({
			start,
			end,
			style: run.style
		});
		cursor = Math.max(cursor, end);
	}
	if (cursor < text.length) segs.push({
		start: cursor,
		end: text.length,
		style: {}
	});
	if (segs.length === 0) segs.push({
		start: 0,
		end: text.length,
		style: {}
	});
	const baseFill = firstVisibleFill(node);
	return segs.map((seg) => {
		const s = seg.style;
		const fill = s.fills?.find((f) => f.visible && f.type === "SOLID") ?? baseFill;
		const fontSize = s.fontSize ?? node.fontSize;
		const weight = s.fontWeight ?? node.fontWeight;
		const deco = s.textDecoration ?? node.textDecoration;
		return {
			text: text.slice(seg.start, seg.end),
			options: {
				fontFace: s.fontFamily ?? node.fontFamily,
				fontSize: round2(pt(ctx, fontSize)),
				bold: weight >= 600,
				italic: s.italic ?? node.italic,
				color: fill ? hex(fill.color) : "000000",
				transparency: transparency(opacity * (fill ? fill.opacity * fill.color.a : 1)),
				charSpacing: charSpacingPt(ctx, s.letterSpacing ?? node.letterSpacing),
				underline: deco === "UNDERLINE" ? { style: "sng" } : void 0,
				strike: deco === "STRIKETHROUGH" ? "sngStrike" : void 0
			}
		};
	});
}
async function addFallbackImage(ctx, node, opacity, reason, options) {
	const data = await ctx.rasterize([node.id], ctx.fallbackScale, options);
	if (!data) {
		ctx.stats.skipped += 1;
		return;
	}
	const box = nodeBox(ctx, node);
	ctx.slide.addImage({
		data: `data:image/png;base64,${encodeBase64(data)}`,
		x: box.x,
		y: box.y,
		w: box.w,
		h: box.h,
		rotate: box.rotate,
		flipH: box.flipH,
		transparency: transparency(opacity)
	});
	if (reason) {
		ctx.stats.fallback += 1;
		ctx.stats.fallbackReasons[reason] = (ctx.stats.fallbackReasons[reason] ?? 0) + 1;
	}
}
/** letterSpacing px → PPT charSpacing (pt). Zero is omitted (default). */
function charSpacingPt(ctx, px) {
	if (!px) return void 0;
	return round2(pt(ctx, px));
}
/**
* Solid offset shadows (blur 0) cannot be represented crisply with PPT shadow
* properties (viewers render them soft), so draw a same-shaped solid shape at
* the offset position instead.
*/
function addSolidShadowShape(ctx, node, box, opacity, shadow) {
	const sp = shadow.spread;
	const offset = transformNodeVector(ctx, node, shadow.offset);
	const scale = nodeScale(ctx, node);
	const spreadX = inch(ctx, sp * scale.x);
	const spreadY = inch(ctx, sp * scale.y);
	let shapeType = "rect";
	if (isRounded(node)) shapeType = "roundRect";
	else if (node.type === "ELLIPSE") shapeType = "ellipse";
	ctx.slide.addShape(shapeType, {
		x: box.x + offset.x - spreadX,
		y: box.y + offset.y - spreadY,
		w: box.w + spreadX * 2,
		h: box.h + spreadY * 2,
		rotate: box.rotate,
		flipH: box.flipH,
		fill: {
			color: hex(shadow.color),
			transparency: transparency(opacity * shadow.color.a)
		},
		line: {
			color: "FFFFFF",
			transparency: 100,
			width: 0
		},
		...shapeType === "roundRect" ? { rectRadius: Math.min(inch(ctx, effectiveRadius(node) * Math.min(scale.x, scale.y)), Math.min(box.w, box.h) / 2) } : {}
	});
}
//#endregion
export { renderNodesToPPTX };

//# sourceMappingURL=export.js.map
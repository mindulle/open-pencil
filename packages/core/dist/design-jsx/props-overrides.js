import { TRANSPARENT } from "../constants.js";
import { colorToFill, parseColor } from "../color/index.js";
//#region src/design-jsx/props-overrides.ts
const WEIGHT_MAP = {
	normal: 400,
	medium: 500,
	bold: 700
};
const ALIGN_MAP = {
	start: "MIN",
	end: "MAX",
	center: "CENTER",
	between: "SPACE_BETWEEN"
};
const COUNTER_ALIGN_MAP = {
	start: "MIN",
	end: "MAX",
	center: "CENTER",
	stretch: "STRETCH"
};
const TEXT_ALIGN_MAP = {
	left: "LEFT",
	center: "CENTER",
	right: "RIGHT",
	justified: "JUSTIFIED"
};
const TEXT_VERTICAL_ALIGN_MAP = {
	top: "TOP",
	center: "CENTER",
	bottom: "BOTTOM"
};
const TEXT_ALIGN_ALIAS_MAP = {
	...TEXT_ALIGN_MAP,
	left_align: "LEFT",
	center_align: "CENTER",
	right_align: "RIGHT"
};
const TEXT_AUTO_RESIZE_MAP = {
	none: "NONE",
	width: "WIDTH_AND_HEIGHT",
	height: "HEIGHT"
};
const DIRECTION_MAP = {
	auto: "AUTO",
	ltr: "LTR",
	rtl: "RTL"
};
function parseDirection(value) {
	if (typeof value !== "string") return void 0;
	return DIRECTION_MAP[value.toLowerCase()] ?? "AUTO";
}
function parseStroke(value, width) {
	const color = typeof value === "string" ? parseColor(value) : value;
	return {
		color,
		opacity: color.a,
		visible: true,
		weight: width,
		align: "INSIDE"
	};
}
function numberFromPx(value) {
	if (typeof value === "number") return value;
	if (typeof value !== "string") return void 0;
	const trimmed = value.trim();
	if (!trimmed.endsWith("px")) return void 0;
	const parsed = Number.parseFloat(trimmed.slice(0, -2));
	return Number.isFinite(parsed) ? parsed : void 0;
}
function normalizeStyleProps(props) {
	const style = props.style;
	if (style === null || typeof style !== "object" || Array.isArray(style)) return props;
	const source = style;
	const normalized = { ...props };
	const copyIfUnset = (from, to, convert) => {
		if (normalized[to] !== void 0 || source[from] === void 0) return;
		normalized[to] = convert ? convert(source[from]) : source[from];
	};
	copyIfUnset("background", "bg");
	copyIfUnset("backgroundColor", "bg");
	copyIfUnset("color", "color");
	copyIfUnset("borderColor", "stroke");
	copyIfUnset("borderWidth", "strokeWidth", numberFromPx);
	copyIfUnset("borderRadius", "rounded", numberFromPx);
	copyIfUnset("fontSize", "fontSize", numberFromPx);
	copyIfUnset("fontWeight", "fontWeight");
	copyIfUnset("width", "width", numberFromPx);
	copyIfUnset("height", "height", numberFromPx);
	copyIfUnset("opacity", "opacity");
	return normalized;
}
function applySizeOverrides(props, o, parentLayout) {
	const w = props.w ?? props.width;
	const h = props.h ?? props.height;
	if (typeof w === "number") o.width = w;
	if (typeof h === "number") o.height = h;
	const isParentRow = parentLayout === "HORIZONTAL";
	const isParentCol = parentLayout === "VERTICAL";
	const isParentGrid = parentLayout === "GRID";
	applyFillSizing(w, "width", isParentGrid, isParentRow, isParentCol, o);
	applyFillSizing(h, "height", isParentGrid, isParentRow, isParentCol, o);
	if (props.x !== void 0) o.x = props.x;
	if (props.y !== void 0) o.y = props.y;
	if (props.top !== void 0) o.y = props.top;
	if (props.left !== void 0) o.x = props.left;
	if (props.position === "absolute") o.layoutPositioning = "ABSOLUTE";
	if ((props.x !== void 0 || props.y !== void 0 || props.top !== void 0 || props.left !== void 0) && parentLayout !== "NONE") o.layoutPositioning = "ABSOLUTE";
	return {
		w,
		h
	};
}
function applyFillSizing(dim, axis, isGrid, isRow, isCol, o) {
	if (dim !== "fill") return;
	const isPrimary = axis === "width" ? isRow : isCol;
	if (isGrid || (axis === "width" ? isCol : isRow)) o.layoutAlignSelf = "STRETCH";
	else if (isPrimary) o.layoutGrow = 1;
	else {
		o.layoutGrow = 1;
		o.layoutAlignSelf = "STRETCH";
	}
}
function isFill(value) {
	return value !== null && typeof value === "object" && "type" in value && "color" in value && "visible" in value;
}
function isFillValue(value) {
	return typeof value === "string" || isColor(value) || isFill(value);
}
function fillFromValue(value) {
	return isFill(value) ? structuredClone(value) : colorToFill(value);
}
function isColor(value) {
	return value !== null && typeof value === "object" && "r" in value && "g" in value && "b" in value && "a" in value;
}
function applyFillOverride(props, o) {
	if (Array.isArray(props.fills)) {
		const fills = props.fills.filter(isFillValue).map(fillFromValue);
		if (fills.length > 0) o.fills = fills;
		return;
	}
	const bg = props.bg ?? props.fill ?? props.background ?? props.backgroundColor;
	if (isFillValue(bg)) o.fills = [fillFromValue(bg)];
}
function applyStrokeOverride(props, o) {
	const stroke = props.stroke ?? props.border ?? props.borderColor;
	if (typeof stroke !== "string" && !isColor(stroke)) return;
	o.strokes = [parseStroke(stroke, props.strokeWidth ?? props.borderWidth ?? 1)];
}
function applyCornerOverrides(props, o) {
	const rounded = props.rounded ?? props.cornerRadius ?? props.borderRadius;
	if (typeof rounded === "number") o.cornerRadius = rounded;
	if (props.roundedTL !== void 0 || props.roundedTR !== void 0 || props.roundedBL !== void 0 || props.roundedBR !== void 0) {
		o.independentCorners = true;
		if (props.roundedTL !== void 0) o.topLeftRadius = props.roundedTL;
		if (props.roundedTR !== void 0) o.topRightRadius = props.roundedTR;
		if (props.roundedBL !== void 0) o.bottomLeftRadius = props.roundedBL;
		if (props.roundedBR !== void 0) o.bottomRightRadius = props.roundedBR;
	}
	if (props.cornerSmoothing !== void 0) o.cornerSmoothing = props.cornerSmoothing;
}
function applyVisualOverrides(props, o) {
	applyFillOverride(props, o);
	applyStrokeOverride(props, o);
	applyCornerOverrides(props, o);
	if (props.opacity !== void 0) o.opacity = props.opacity;
	applyTransformOverrides(props, o);
	if (props.blendMode !== void 0) o.blendMode = props.blendMode.toUpperCase();
	if (props.overflow === "hidden") o.clipsContent = true;
	if (props.mask) {
		o.isMask = true;
		o.maskType = {
			luminance: "LUMINANCE",
			vector: "VECTOR"
		}[props.mask] ?? "ALPHA";
	}
}
function applyTransformOverrides(props, o) {
	const rotation = props.rotate ?? props.rotation;
	if (rotation !== void 0) o.rotation = rotation;
}
function applyPaddingOverrides(props, o) {
	const p = props.p ?? props.padding;
	if (typeof p === "number") {
		o.paddingTop = p;
		o.paddingRight = p;
		o.paddingBottom = p;
		o.paddingLeft = p;
	}
	const px = props.px;
	const py = props.py;
	if (px !== void 0) {
		o.paddingLeft = px;
		o.paddingRight = px;
	}
	if (py !== void 0) {
		o.paddingTop = py;
		o.paddingBottom = py;
	}
	if (props.pt !== void 0) o.paddingTop = props.pt;
	if (props.pr !== void 0) o.paddingRight = props.pr;
	if (props.pb !== void 0) o.paddingBottom = props.pb;
	if (props.pl !== void 0) o.paddingLeft = props.pl;
}
const AUTO_LAYOUT_TRIGGER_KEYS = [
	...[
		"p",
		"padding",
		"px",
		"py",
		"pt",
		"pr",
		"pb",
		"pl"
	],
	"justify",
	"justifyContent",
	"items",
	"align",
	"alignItems"
];
function hasAutoLayoutTriggerProps(props) {
	return AUTO_LAYOUT_TRIGGER_KEYS.some((k) => props[k] !== void 0);
}
function parseTrack(token) {
	if (token.endsWith("fr")) return {
		sizing: "FR",
		value: Number.parseFloat(token) || 1
	};
	if (token === "auto") return {
		sizing: "AUTO",
		value: 0
	};
	return {
		sizing: "FIXED",
		value: Number.parseFloat(token) || 0
	};
}
function parseTrackList(value) {
	return value.trim().split(/\s+/).map(parseTrack);
}
function applyGridOverrides(props, o, w, h) {
	o.layoutMode = "GRID";
	if (typeof w === "number") o.width = w;
	if (typeof h === "number") o.height = h;
	if (typeof props.columns === "string") o.gridTemplateColumns = parseTrackList(props.columns);
	else if (typeof props.columns === "number") o.gridTemplateColumns = Array.from({ length: props.columns }, () => ({
		sizing: "FR",
		value: 1
	}));
	if (typeof props.rows === "string") o.gridTemplateRows = parseTrackList(props.rows);
	else if (typeof props.rows === "number") o.gridTemplateRows = Array.from({ length: props.rows }, () => ({
		sizing: "FR",
		value: 1
	}));
	if (typeof props.columnGap === "number") o.gridColumnGap = props.columnGap;
	if (typeof props.rowGap === "number") o.gridRowGap = props.rowGap;
	if (typeof props.gap === "number") {
		o.gridColumnGap = props.gap;
		o.gridRowGap = props.gap;
	}
	if (props.rows === void 0 && typeof h !== "number") o.height = 0;
}
function applyGridChildOverrides(props, o) {
	const col = props.colStart ?? props.col;
	const row = props.rowStart ?? props.row;
	const colSpan = props.colSpan ?? 1;
	const rowSpan = props.rowSpan ?? 1;
	if (col !== void 0 || row !== void 0) o.gridPosition = {
		column: col ?? 0,
		row: row ?? 0,
		columnSpan: colSpan,
		rowSpan
	};
}
function applyAutoLayoutSizing(o, props, w, h) {
	const dir = props.flex ?? "col";
	const isVertical = dir === "col" || dir === "column";
	o.layoutMode = isVertical ? "VERTICAL" : "HORIZONTAL";
	o.primaryAxisSizing = "HUG";
	o.counterAxisSizing = "HUG";
	const primaryDim = isVertical ? h : w;
	const counterDim = isVertical ? w : h;
	if (typeof primaryDim === "number") o.primaryAxisSizing = "FIXED";
	if (typeof counterDim === "number") o.counterAxisSizing = "FIXED";
	if (primaryDim === "hug") o.primaryAxisSizing = "HUG";
	if (counterDim === "hug") o.counterAxisSizing = "HUG";
}
function applyLayoutAlignmentOverrides(props, o) {
	const justify = props.justify ?? props.justifyContent;
	if (justify) o.primaryAxisAlign = ALIGN_MAP[justify] ?? "MIN";
	const items = props.items ?? props.align ?? props.alignItems;
	if (items) o.counterAxisAlign = COUNTER_ALIGN_MAP[items] ?? "MIN";
}
function shouldEnableAutoLayout(props, isText) {
	if (props.flex !== void 0) return true;
	if (!isText && hasAutoLayoutTriggerProps(props)) return true;
	return false;
}
function applyLayoutOverrides(props, o, w, h, isText, parentLayout) {
	if (props.grid) {
		applyGridOverrides(props, o, w, h);
		applyPaddingOverrides(props, o);
		if (props.grow !== void 0) o.layoutGrow = props.grow;
		return;
	}
	if (parentLayout === "GRID") applyGridChildOverrides(props, o);
	if (shouldEnableAutoLayout(props, isText)) applyAutoLayoutSizing(o, props, w, h);
	o.layoutDirection = parseDirection(props.flow ?? (!isText ? props.dir : void 0)) ?? o.layoutDirection;
	if (props.gap !== void 0) o.itemSpacing = props.gap;
	if (props.wrap) {
		o.layoutWrap = "WRAP";
		if (props.rowGap !== void 0) o.counterAxisSpacing = props.rowGap;
	}
	applyLayoutAlignmentOverrides(props, o);
	applyPaddingOverrides(props, o);
	if (props.grow !== void 0) o.layoutGrow = props.grow;
	if (props.minW !== void 0) o.width = Math.max(o.width ?? 0, props.minW);
	if (props.maxW !== void 0) o.width = Math.min(o.width ?? Infinity, props.maxW);
}
function applyTextStyleOverrides(props, o) {
	const fontSize = props.size ?? props.fontSize;
	if (typeof fontSize === "number") o.fontSize = fontSize;
	const fontFamily = props.font ?? props.fontFamily;
	if (typeof fontFamily === "string") o.fontFamily = fontFamily;
	const weight = props.weight ?? props.fontWeight;
	if (typeof weight === "number") o.fontWeight = weight;
	else if (typeof weight === "string") o.fontWeight = WEIGHT_MAP[weight] ?? 400;
	if (typeof props.color === "string" || isColor(props.color)) o.fills = [colorToFill(props.color)];
	if (props.lineHeight !== void 0) o.lineHeight = props.lineHeight;
	if (props.letterSpacing !== void 0) o.letterSpacing = props.letterSpacing;
	if (props.textDecoration !== void 0) o.textDecoration = props.textDecoration.toUpperCase();
	if (props.textCase !== void 0) o.textCase = props.textCase.toUpperCase();
	if (props.maxLines !== void 0) {
		o.maxLines = props.maxLines;
		o.textTruncation = "ENDING";
	}
	if (props.truncate) o.textTruncation = "ENDING";
	applyTextAlignmentOverrides(props, o);
}
function applyTextAlignmentOverrides(props, o) {
	const textAlign = props.textAlign ?? props.textAlignHorizontal ?? props.textHorizontalAlignment;
	if (typeof textAlign === "string") o.textAlignHorizontal = TEXT_ALIGN_ALIAS_MAP[textAlign.toLowerCase()] ?? "LEFT";
	const textAlignVertical = props.textAlignVertical ?? props.textVerticalAlignment;
	if (typeof textAlignVertical === "string") o.textAlignVertical = TEXT_VERTICAL_ALIGN_MAP[textAlignVertical.toLowerCase()] ?? "TOP";
}
function applyTextAutoResize(props, o, parentLayout) {
	const w = props.w ?? props.width;
	const hasExplicitWidth = w !== void 0;
	const fillsParent = w === "fill" || props.grow > 0;
	const isInsideAutoLayout = parentLayout !== "NONE";
	if (props.textAutoResize) o.textAutoResize = TEXT_AUTO_RESIZE_MAP[props.textAutoResize] ?? "NONE";
	else if (hasExplicitWidth || isInsideAutoLayout && fillsParent) o.textAutoResize = "HEIGHT";
	else o.textAutoResize = "WIDTH_AND_HEIGHT";
}
function applyTextOverrides(props, o, parentLayout) {
	applyTextStyleOverrides(props, o);
	o.textDirection = parseDirection(props.dir) ?? o.textDirection;
	applyTextAutoResize(props, o, parentLayout);
}
function isEffect(value) {
	return value !== null && typeof value === "object" && "type" in value && "radius" in value && "visible" in value;
}
function applyShapeAndEffectOverrides(props, o) {
	if (Array.isArray(props.effects)) {
		const effects = props.effects.filter(isEffect).map((effect) => structuredClone(effect));
		if (effects.length > 0) o.effects = effects;
	}
	if (props.points !== void 0) o.pointCount = props.points;
	if (props.innerRadius !== void 0) o.starInnerRadius = props.innerRadius;
	if (props.pointCount !== void 0) o.pointCount = props.pointCount;
	if (typeof props.shadow === "string") {
		const parts = props.shadow.split(/\s+/);
		if (parts.length >= 4) {
			const c = parseColor(parts.slice(3).join(" "));
			o.effects = [...o.effects ?? [], {
				type: "DROP_SHADOW",
				color: c,
				offset: {
					x: Number.parseFloat(parts[0]),
					y: Number.parseFloat(parts[1])
				},
				radius: Number.parseFloat(parts[2]),
				spread: 0,
				visible: true
			}];
		}
	}
	if (typeof props.blur === "number") o.effects = [...o.effects ?? [], {
		type: "LAYER_BLUR",
		radius: props.blur,
		visible: true,
		color: { ...TRANSPARENT },
		offset: {
			x: 0,
			y: 0
		},
		spread: 0
	}];
}
function propsToOverrides(props, isText, parentLayout) {
	props = normalizeStyleProps(props);
	const o = {};
	if (props.name) o.name = props.name;
	const { w, h } = applySizeOverrides(props, o, parentLayout);
	applyVisualOverrides(props, o);
	applyLayoutOverrides(props, o, w, h, isText, parentLayout);
	if (isText) applyTextOverrides(props, o, parentLayout);
	applyShapeAndEffectOverrides(props, o);
	return o;
}
//#endregion
export { applySizeOverrides, propsToOverrides };

//# sourceMappingURL=props-overrides.js.map
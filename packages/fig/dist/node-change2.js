import { effectiveFigmaRawNodeFields, effectiveFigmaSourcePayload, readEffectiveFigmaRawField } from "./source-metadata.js";
import { FIG_KIWI_DEFAULT_VERSION as FIG_KIWI_DEFAULT_VERSION$1, buildFigKiwi as buildFigKiwi$1, decompressFigKiwiDataAsync, parseFigKiwiChunks as parseFigKiwiChunks$1 } from "@open-pencil/kiwi/fig/container";
import { guidToString, guidToString as guidToString$1, stringToGuid, stringToGuid as stringToGuid$1 } from "@open-pencil/kiwi/fig/guid";
import { DEFAULT_FONT_FAMILY, DEFAULT_STROKE_MITER_LIMIT, FONT_WEIGHT_NAMES, clampExportScale, normalizeFontFamily, styleToWeight, weightToStyle } from "@open-pencil/scene-graph";
import { parseVariantName } from "@open-pencil/scene-graph/variant-name";
import { BLACK } from "@open-pencil/scene-graph/constants";
import { copyFills } from "@open-pencil/scene-graph/copy";
//#region src/node-change/basics.ts
function mapToFigmaType(type) {
	switch (type) {
		case "FRAME": return "FRAME";
		case "RECTANGLE": return "RECTANGLE";
		case "ROUNDED_RECTANGLE": return "ROUNDED_RECTANGLE";
		case "ELLIPSE": return "ELLIPSE";
		case "TEXT": return "TEXT";
		case "LINE": return "LINE";
		case "STAR": return "STAR";
		case "POLYGON": return "REGULAR_POLYGON";
		case "VECTOR": return "VECTOR";
		case "BOOLEAN_OPERATION": return "BOOLEAN_OPERATION";
		case "GROUP": return "FRAME";
		case "SECTION": return "SECTION";
		case "COMPONENT": return "SYMBOL";
		case "COMPONENT_SET": return "FRAME";
		case "INSTANCE": return "INSTANCE";
		case "CONNECTOR": return "CONNECTOR";
		case "SHAPE_WITH_TEXT": return "SHAPE_WITH_TEXT";
		default: return "RECTANGLE";
	}
}
/** Generate a printable, lexicographically ordered parent position. */
function fractionalPosition(index) {
	const BASE = 94;
	const FIRST = 33;
	const TILDE = 126;
	const numTildes = Math.floor(index / BASE);
	const lastChar = String.fromCharCode(FIRST + index % BASE);
	return String.fromCharCode(TILDE).repeat(numTildes) + lastChar;
}
//#endregion
//#region src/node-change/derived-text-glyphs.ts
function convertFigmaDerivedTextGlyphs(derivedTextData, blobs) {
	return (derivedTextData?.glyphs ?? []).map((glyph) => {
		if (glyph.commandsBlob === void 0) return null;
		return {
			commandsBlob: blobs[glyph.commandsBlob],
			x: glyph.position.x,
			y: glyph.position.y,
			fontSize: glyph.fontSize
		};
	}).filter((glyph) => !!glyph);
}
//#endregion
//#region src/node-change/font/features.ts
const BOOLEAN_FEATURES = [
	["fontVariantCommonLigatures", "LIGA"],
	["fontVariantContextualLigatures", "CALT"],
	["fontVariantDiscretionaryLigatures", "DLIG"],
	["fontVariantHistoricalLigatures", "HLIG"],
	["fontVariantOrdinal", "ORDN"],
	["fontVariantSlashedZero", "ZERO"]
];
const ENUM_FEATURES = [
	["fontVariantNumericFigure", {
		LINING: "LNUM",
		OLDSTYLE: "ONUM"
	}],
	["fontVariantNumericSpacing", {
		PROPORTIONAL: "PNUM",
		TABULAR: "TNUM"
	}],
	["fontVariantNumericFraction", {
		DIAGONAL: "FRAC",
		STACKED: "AFRC"
	}],
	["fontVariantCaps", {
		SMALL: "SMCP",
		PETITE: "PCAP",
		ALL_SMALL: ["SMCP", "C2SC"],
		ALL_PETITE: ["PCAP", "C2PC"],
		UNICASE: "UNIC",
		TITLING: "TITL"
	}]
];
const BOOLEAN_FEATURE_EXPORT = Object.fromEntries(BOOLEAN_FEATURES.map(([field, tag]) => [tag, field]));
const ENUM_FEATURE_EXPORT = {
	LNUM: {
		field: "fontVariantNumericFigure",
		value: "LINING"
	},
	ONUM: {
		field: "fontVariantNumericFigure",
		value: "OLDSTYLE"
	},
	PNUM: {
		field: "fontVariantNumericSpacing",
		value: "PROPORTIONAL"
	},
	TNUM: {
		field: "fontVariantNumericSpacing",
		value: "TABULAR"
	},
	FRAC: {
		field: "fontVariantNumericFraction",
		value: "DIAGONAL"
	},
	AFRC: {
		field: "fontVariantNumericFraction",
		value: "STACKED"
	},
	SMCP: {
		field: "fontVariantCaps",
		value: "SMALL"
	},
	PCAP: {
		field: "fontVariantCaps",
		value: "PETITE"
	},
	C2SC: {
		field: "fontVariantCaps",
		value: "ALL_SMALL"
	},
	C2PC: {
		field: "fontVariantCaps",
		value: "ALL_PETITE"
	},
	UNIC: {
		field: "fontVariantCaps",
		value: "UNICASE"
	},
	TITL: {
		field: "fontVariantCaps",
		value: "TITLING"
	}
};
function addFeature(features, tag, enabled) {
	const normalizedTag = tag.toUpperCase();
	if (features.some((feature) => feature.tag === normalizedTag)) return;
	features.push({
		tag: normalizedTag,
		enabled
	});
}
function convertFontFeatures(nc) {
	const features = [];
	for (const [field, tag] of BOOLEAN_FEATURES) {
		const enabled = nc[field];
		if (enabled !== void 0) addFeature(features, tag, enabled);
	}
	for (const [field, values] of ENUM_FEATURES) {
		const tag = values[String(nc[field])];
		if (Array.isArray(tag)) for (const item of tag) addFeature(features, item, true);
		else if (tag) addFeature(features, tag, true);
	}
	for (const tag of nc.toggledOnOTFeatures ?? []) addFeature(features, tag, true);
	for (const tag of nc.toggledOffOTFeatures ?? []) addFeature(features, tag, false);
	return features;
}
function applyFontFeatureToKiwi(nc, tag, enabled, toggledOn, toggledOff) {
	const booleanField = BOOLEAN_FEATURE_EXPORT[tag];
	if (booleanField) {
		nc[booleanField] = enabled;
		return;
	}
	const enumField = ENUM_FEATURE_EXPORT[tag];
	if (enabled && enumField) {
		nc[enumField.field] = enumField.value;
		return;
	}
	if (enabled) toggledOn.push(tag);
	else toggledOff.push(tag);
}
function applyFontFeaturesToKiwi(nc, features) {
	const toggledOn = [];
	const toggledOff = [];
	for (const feature of features) applyFontFeatureToKiwi(nc, feature.tag.toUpperCase(), feature.enabled, toggledOn, toggledOff);
	if (toggledOn.length > 0) nc.toggledOnOTFeatures = toggledOn;
	if (toggledOff.length > 0) nc.toggledOffOTFeatures = toggledOff;
}
//#endregion
//#region src/node-change/font/variations.ts
function figmaAxisTagToString(axisTag) {
	return String.fromCharCode(axisTag >> 24 & 255, axisTag >> 16 & 255, axisTag >> 8 & 255, axisTag & 255);
}
function stringToFigmaAxisTag(axis) {
	if (axis.length !== 4) return void 0;
	return (axis.charCodeAt(0) << 24 | axis.charCodeAt(1) << 16 | axis.charCodeAt(2) << 8 | axis.charCodeAt(3)) >>> 0;
}
function convertFontVariations(nc) {
	const result = [];
	for (const variation of nc.fontVariations ?? []) {
		if (typeof variation.value !== "number") continue;
		const axis = typeof variation.axisTag === "number" ? figmaAxisTagToString(variation.axisTag) : variation.axisName || "";
		if (axis) result.push({
			axis,
			value: variation.value
		});
	}
	return result;
}
//#endregion
//#region src/node-change/bytes.ts
function hexToBytes(hex) {
	if (hex.length % 2 !== 0) throw new Error("Hex string must contain an even number of characters");
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
		if (Number.isNaN(byte)) throw new Error("Hex string contains invalid characters");
		bytes[i] = byte;
	}
	return bytes;
}
const HEX_BYTES = Array.from({ length: 256 }, (_, byte) => byte.toString(16).padStart(2, "0"));
function bytesToHex(bytes) {
	if (typeof bytes.toHex === "function") return bytes.toHex();
	const chunks = Array.from({ length: bytes.length }, () => "");
	for (let index = 0; index < bytes.length; index++) chunks[index] = HEX_BYTES[bytes[index]];
	return chunks.join("");
}
//#endregion
//#region src/node-change/paint.ts
function safeColor(color) {
	return {
		r: color.r,
		g: color.g,
		b: color.b,
		a: "a" in color ? color.a : 1
	};
}
function fillToKiwiPaint(fill) {
	const paint = {
		type: fill.type,
		color: safeColor(fill.color),
		opacity: fill.opacity,
		visible: fill.visible,
		blendMode: fill.blendMode ?? "NORMAL"
	};
	if (fill.gradientStops) paint.stops = fill.gradientStops.map((stop) => ({
		color: safeColor(stop.color),
		position: stop.position
	}));
	if (fill.gradientTransform) paint.transform = fill.gradientTransform;
	if (fill.imageHash) paint.image = { hash: hexToBytes(fill.imageHash) };
	if (fill.imageScaleMode) paint.imageScaleMode = fill.imageScaleMode;
	if (fill.imageTransform) paint.transform = fill.imageTransform;
	if (fill.sourceNodeId) paint.sourceNodeId = stringToGuid(fill.sourceNodeId);
	if (fill.scale) paint.scale = fill.scale;
	if (fill.spacing) paint.spacing = fill.spacing;
	if (fill.patternSpacing) paint.patternSpacing = fill.patternSpacing;
	if (fill.patternTileType) paint.patternTileType = fill.patternTileType;
	if (fill.verticalAlignment) paint.verticalAlignment = fill.verticalAlignment;
	if (fill.horizontalAlignment) paint.horizontalAlignment = fill.horizontalAlignment;
	if (fill.noiseType) paint.noiseType = fill.noiseType;
	if (fill.density !== void 0) paint.density = fill.density;
	if (fill.noiseSize) paint.noiseSize = fill.noiseSize;
	if (fill.customEffectId) paint.customEffectId = { guid: stringToGuid(fill.customEffectId) };
	return paint;
}
function convertColor(color) {
	if (!color) return { ...BLACK };
	return {
		r: color.r ?? 0,
		g: color.g ?? 0,
		b: color.b ?? 0,
		a: color.a ?? 1
	};
}
function imageHashToString(hash) {
	return Object.keys(hash).sort((a, b) => Number(a) - Number(b)).map((k) => hash[Number(k)]).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function convertGradientTransform(t) {
	if (!t) return void 0;
	return {
		m00: t.m00,
		m01: t.m01,
		m02: t.m02,
		m10: t.m10,
		m11: t.m11,
		m12: t.m12
	};
}
let variableColorResolver = null;
function setVariableColorResolver(resolver) {
	variableColorResolver = resolver;
}
function resolveColorVar(paint) {
	const alias = paint.colorVar?.value?.alias;
	if (!alias || !variableColorResolver) return void 0;
	return variableColorResolver(alias) ?? void 0;
}
function resolvedPaintColor(paint) {
	const resolved = resolveColorVar(paint);
	if (!resolved) return {
		color: convertColor(paint.color),
		opacity: paint.opacity ?? 1
	};
	return {
		color: {
			...resolved,
			a: paint.color?.a ?? 1
		},
		opacity: paint.opacity ?? resolved.a
	};
}
function convertBaseFill(p) {
	const { color, opacity } = resolvedPaintColor(p);
	return {
		type: p.type,
		color,
		opacity,
		visible: p.visible ?? true,
		blendMode: p.blendMode ?? "NORMAL"
	};
}
function applyGradientPaintFields(fill, p) {
	if (!p.type.startsWith("GRADIENT") || !p.stops) return;
	fill.gradientStops = p.stops.map((s) => ({
		color: convertColor(s.color),
		position: s.position
	}));
	if (p.transform) fill.gradientTransform = convertGradientTransform(p.transform);
}
function applyImagePaintFields(fill, p) {
	if (p.type !== "IMAGE") return;
	if (p.image && typeof p.image === "object") {
		const img = p.image;
		if (typeof img.hash === "object") fill.imageHash = imageHashToString(img.hash);
		else if (typeof img.hash === "string") fill.imageHash = img.hash;
	}
	fill.imageScaleMode = p.imageScaleMode ?? "FILL";
	if (p.transform) fill.imageTransform = convertGradientTransform(p.transform);
}
function applySchemaPaintFields(fill, p) {
	if (p.sourceNodeId) fill.sourceNodeId = guidToString(p.sourceNodeId);
	if (p.scale) fill.scale = p.scale;
	if (p.spacing) fill.spacing = p.spacing;
	if (p.patternSpacing) fill.patternSpacing = p.patternSpacing;
	if (p.patternTileType) fill.patternTileType = p.patternTileType;
	if (p.verticalAlignment) fill.verticalAlignment = p.verticalAlignment;
	if (p.horizontalAlignment) fill.horizontalAlignment = p.horizontalAlignment;
	if (p.noiseType) fill.noiseType = p.noiseType;
	if (p.density !== void 0) fill.density = p.density;
	if (p.noiseSize) fill.noiseSize = p.noiseSize;
	if (p.customEffectId?.guid) fill.customEffectId = guidToString(p.customEffectId.guid);
}
function convertFills(paints) {
	if (!paints) return [];
	return paints.map((p) => {
		const fill = convertBaseFill(p);
		applyGradientPaintFields(fill, p);
		applyImagePaintFields(fill, p);
		applySchemaPaintFields(fill, p);
		return fill;
	});
}
function convertStrokes(paints, weight, align, cap, join, dashPattern) {
	if (!paints) return [];
	let strokeAlign = "CENTER";
	if (align === "INSIDE") strokeAlign = "INSIDE";
	else if (align === "OUTSIDE") strokeAlign = "OUTSIDE";
	return paints.map((p) => {
		const { color, opacity } = resolvedPaintColor(p);
		return {
			color,
			weight: weight ?? 1,
			opacity,
			visible: p.visible ?? true,
			align: strokeAlign,
			cap: cap ?? "NONE",
			join: join ?? "MITER",
			dashPattern: dashPattern ?? []
		};
	});
}
function convertEffects(effects) {
	if (!effects) return [];
	return effects.map((e) => ({
		type: e.type,
		color: convertColor(e.color),
		offset: e.offset ?? {
			x: 0,
			y: 0
		},
		radius: e.radius ?? 0,
		spread: e.spread ?? 0,
		visible: e.visible ?? true,
		blendMode: e.blendMode ?? "NORMAL",
		showShadowBehindNode: e.showShadowBehindNode ?? true
	}));
}
//#endregion
//#region src/node-change/variable-bindings.ts
const VARIABLE_BINDING_FIELDS = {
	cornerRadius: "CORNER_RADIUS",
	topLeftRadius: "RECTANGLE_TOP_LEFT_CORNER_RADIUS",
	topRightRadius: "RECTANGLE_TOP_RIGHT_CORNER_RADIUS",
	bottomLeftRadius: "RECTANGLE_BOTTOM_LEFT_CORNER_RADIUS",
	bottomRightRadius: "RECTANGLE_BOTTOM_RIGHT_CORNER_RADIUS",
	strokeWeight: "STROKE_WEIGHT",
	borderTopWeight: "BORDER_TOP_WEIGHT",
	borderBottomWeight: "BORDER_BOTTOM_WEIGHT",
	borderLeftWeight: "BORDER_LEFT_WEIGHT",
	borderRightWeight: "BORDER_RIGHT_WEIGHT",
	itemSpacing: "STACK_SPACING",
	paddingLeft: "STACK_PADDING_LEFT",
	paddingTop: "STACK_PADDING_TOP",
	paddingRight: "STACK_PADDING_RIGHT",
	paddingBottom: "STACK_PADDING_BOTTOM",
	counterAxisSpacing: "STACK_COUNTER_SPACING",
	gridRowGap: "GRID_ROW_GAP",
	gridColumnGap: "GRID_COLUMN_GAP",
	visible: "VISIBLE",
	opacity: "OPACITY",
	width: "WIDTH",
	height: "HEIGHT",
	minWidth: "MIN_WIDTH",
	maxWidth: "MAX_WIDTH",
	minHeight: "MIN_HEIGHT",
	maxHeight: "MAX_HEIGHT",
	x: "X_POSITION",
	y: "Y_POSITION",
	rotation: "ROTATION",
	fontSize: "FONT_SIZE",
	letterSpacing: "LETTER_SPACING",
	lineHeight: "LINE_HEIGHT",
	fontFamily: "FONT_FAMILY"
};
const VARIABLE_BINDING_FIELDS_INVERSE = Object.fromEntries(Object.entries(VARIABLE_BINDING_FIELDS).map(([field, kiwiField]) => [kiwiField, field]));
function resolveVariableConsumptionEntry(entry) {
	const field = entry.variableField ? VARIABLE_BINDING_FIELDS_INVERSE[entry.variableField] : void 0;
	const guid = entry.variableData?.value?.alias?.guid;
	return field && guid ? {
		field,
		variableId: guidToString(guid)
	} : void 0;
}
const NUMERIC_BINDING_FIELDS = /* @__PURE__ */ new Set([
	"cornerRadius",
	"topLeftRadius",
	"topRightRadius",
	"bottomLeftRadius",
	"bottomRightRadius",
	"strokeWeight",
	"borderTopWeight",
	"borderBottomWeight",
	"borderLeftWeight",
	"borderRightWeight",
	"itemSpacing",
	"paddingLeft",
	"paddingTop",
	"paddingRight",
	"paddingBottom",
	"counterAxisSpacing",
	"gridRowGap",
	"gridColumnGap",
	"width",
	"height",
	"minWidth",
	"maxWidth",
	"minHeight",
	"maxHeight",
	"x",
	"y",
	"rotation",
	"fontSize",
	"letterSpacing",
	"lineHeight"
]);
function resolvedNumericBindingUpdate(field, value) {
	if (field === "opacity") return { opacity: Math.max(0, Math.min(1, value / 100)) };
	return NUMERIC_BINDING_FIELDS.has(field) ? { [field]: value } : void 0;
}
//#endregion
//#region src/node-change/plugin-data.ts
const OPEN_PENCIL_PLUGIN_ID = "open-pencil";
const TEXT_DIRECTION_PLUGIN_KEY = "textDirection";
const LAYOUT_DIRECTION_PLUGIN_KEY = "layoutDirection";
const NODE_TYPE_PLUGIN_KEY = "nodeType";
const BOUND_VARIABLES_PLUGIN_KEY = "boundVariables";
const EXPORT_SETTINGS_PLUGIN_KEY = "exportSettings";
const NATIVE_EXPORT_FORMATS = {
	PNG: "png",
	JPEG: "jpg",
	SVG: "svg",
	PDF: "pdf"
};
function upsertPluginData(node, key, value) {
	const pluginData = node.pluginData.filter((entry) => !(entry.pluginId === "open-pencil" && entry.key === key));
	pluginData.push({
		pluginId: OPEN_PENCIL_PLUGIN_ID,
		key,
		value
	});
	node.pluginData = pluginData;
}
function applyExportSettingsPluginData(node) {
	if (node.exportSettings.length === 0) return;
	if (!hasOpenPencilExportSettingsPluginData(node.pluginData) && Array.isArray(readEffectiveFigmaRawField(node, "exportSettings"))) return;
	upsertPluginData(node, EXPORT_SETTINGS_PLUGIN_KEY, JSON.stringify(node.exportSettings));
}
function hasOpenPencilExportSettingsPluginData(pluginData) {
	return pluginData.some((entry) => entry.pluginId === "open-pencil" && entry.key === "exportSettings");
}
function parseBoundVariablesPluginValue(value) {
	if (!value) return {};
	try {
		const parsed = JSON.parse(value);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
		return Object.fromEntries(Object.entries(parsed).filter((entry) => typeof entry[0] === "string" && typeof entry[1] === "string"));
	} catch {
		return {};
	}
}
function extractBoundVariables(nc) {
	const bindings = parseBoundVariablesPluginValue(getOpenPencilPluginValue(nc, BOUND_VARIABLES_PLUGIN_KEY));
	for (const entry of nc.variableConsumptionMap?.entries ?? []) {
		const binding = resolveVariableConsumptionEntry(entry);
		if (binding) bindings[binding.field] = binding.variableId;
	}
	nc.fillPaints?.forEach((paint, i) => {
		const variableGuid = paint.colorVariableBinding?.variableID ?? paint.colorVar?.value?.alias?.guid;
		if (variableGuid) bindings[`fills/${i}/color`] = guidToString(variableGuid);
	});
	nc.strokePaints?.forEach((paint, i) => {
		const variableGuid = paint.colorVariableBinding?.variableID ?? paint.colorVar?.value?.alias?.guid;
		if (variableGuid) bindings[`strokes/${i}/color`] = guidToString(variableGuid);
	});
	return bindings;
}
function isExportFormatId(value) {
	return value === "png" || value === "jpg" || value === "webp" || value === "svg" || value === "pdf";
}
function parseExportSettingsPluginValue(value) {
	if (!value) return null;
	try {
		const parsed = JSON.parse(value);
		if (!Array.isArray(parsed)) return null;
		const settings = parsed.flatMap((entry) => {
			if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
			const scale = entry.scale;
			const format = entry.format;
			if (typeof scale !== "number" || !Number.isFinite(scale) || !isExportFormatId(format)) return [];
			return [{
				scale: clampExportScale(scale),
				format
			}];
		});
		return settings.length === parsed.length ? settings : null;
	} catch {
		return null;
	}
}
function mapNativeImageType(imageType) {
	if (typeof imageType === "string") return NATIVE_EXPORT_FORMATS[imageType] ?? null;
	if (imageType === 0) return "png";
	if (imageType === 1) return "jpg";
	if (imageType === 2) return "svg";
	if (imageType === 3) return "pdf";
	return null;
}
function extractNativeConstraintScale(constraint) {
	if (!constraint || typeof constraint !== "object" || Array.isArray(constraint)) return 1;
	const type = constraint.type;
	if (type !== "CONTENT_SCALE" && type !== 0) return 1;
	const value = constraint.value;
	return typeof value === "number" && Number.isFinite(value) ? clampExportScale(value) : 1;
}
function extractExportSettings(nc) {
	const pluginSettings = parseExportSettingsPluginValue(getOpenPencilPluginValue(nc, EXPORT_SETTINGS_PLUGIN_KEY));
	if (pluginSettings) return pluginSettings;
	return (nc.exportSettings ?? []).flatMap((entry) => {
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
		const format = mapNativeImageType(entry.imageType);
		if (!format) return [];
		return [{
			scale: extractNativeConstraintScale(entry.constraint),
			format
		}];
	});
}
function extractPluginData(nc) {
	return (nc.pluginData ?? []).map((entry) => ({
		pluginId: entry.pluginID,
		key: entry.key,
		value: entry.value
	}));
}
function getOpenPencilPluginValue(nc, key) {
	return nc.pluginData?.find((entry) => entry.pluginID === "open-pencil" && entry.key === key)?.value ?? null;
}
function extractPluginRelaunchData(nc) {
	return (nc.pluginRelaunchData ?? []).map((entry) => ({
		pluginId: entry.pluginID,
		command: entry.command,
		message: entry.message,
		isDeleted: entry.isDeleted
	}));
}
function mergePluginData(pluginData) {
	return pluginData.map((entry) => ({
		pluginID: entry.pluginId,
		key: entry.key,
		value: entry.value
	}));
}
function serializePluginRelaunchData(entries) {
	return entries.map((entry) => ({
		pluginID: entry.pluginId,
		command: entry.command,
		message: entry.message,
		isDeleted: entry.isDeleted
	}));
}
//#endregion
//#region src/node-change/text-values.ts
function mapTextDecoration(d) {
	switch (d) {
		case "UNDERLINE": return "UNDERLINE";
		case "STRIKETHROUGH": return "STRIKETHROUGH";
		default: return "NONE";
	}
}
function convertLineHeight(lh, fontSize) {
	if (!lh) return null;
	if (lh.units === "PIXELS") return lh.value;
	if (lh.units === "PERCENT") return lh.value / 100 * (fontSize ?? 14);
	if (lh.units === "RAW") return lh.value * (fontSize ?? 14);
	return null;
}
function convertLetterSpacing(ls, fontSize) {
	if (!ls) return 0;
	if (ls.units === "PIXELS") return ls.value;
	if (ls.units === "PERCENT") return ls.value / 100 * (fontSize ?? 14);
	return ls.value;
}
//#endregion
//#region src/node-change/style-runs.ts
function applyTextDecorationOverride(style, override) {
	const deco = override.textDecoration;
	if (deco) style.textDecoration = mapTextDecoration(deco);
	if (override.textDecorationStyle) style.textDecorationStyle = override.textDecorationStyle;
	if (override.textDecorationThickness) style.textDecorationThickness = override.textDecorationThickness.value ?? null;
	if (override.textDecorationSkipInk !== void 0) style.textDecorationSkipInk = override.textDecorationSkipInk;
	if (override.textUnderlineOffset) style.textUnderlineOffset = override.textUnderlineOffset.value ?? null;
	if (override.textDecorationFillPaints) {
		const decorationFills = convertFills(override.textDecorationFillPaints);
		if (decorationFills.length > 0) style.textDecorationFills = decorationFills;
	}
}
function convertStyleOverride(override, fallbackFontSize) {
	const style = {};
	if (override.fontName) {
		style.fontFamily = override.fontName.family;
		style.fontWeight = styleToWeight(override.fontName.style);
		style.italic = override.fontName.style.toLowerCase().includes("italic");
	}
	if (override.fontSize !== void 0) style.fontSize = override.fontSize;
	const fontVariations = convertFontVariations(override);
	if (fontVariations.length > 0) style.fontVariations = fontVariations;
	const fontFeatures = convertFontFeatures(override);
	if (fontFeatures.length > 0) style.fontFeatures = fontFeatures;
	if (override.letterSpacing) style.letterSpacing = convertLetterSpacing(override.letterSpacing, override.fontSize ?? fallbackFontSize);
	if (override.lineHeight) {
		const lh = convertLineHeight(override.lineHeight, override.fontSize ?? fallbackFontSize);
		if (lh != null) style.lineHeight = lh;
	}
	applyTextDecorationOverride(style, override);
	if (override.fillPaints) {
		const fills = convertFills(override.fillPaints);
		if (fills.length > 0) style.fills = fills;
	}
	return style;
}
function buildStyleMap(table, fallbackFontSize) {
	const styleMap = /* @__PURE__ */ new Map();
	for (const override of table) {
		const id = override.styleID;
		if (id === void 0) continue;
		const style = convertStyleOverride(override, fallbackFontSize);
		if (Object.keys(style).length > 0) styleMap.set(id, style);
	}
	return styleMap;
}
function collectStyleRuns(ids, styleMap) {
	const runs = [];
	let currentId = ids[0];
	let start = 0;
	for (let i = 1; i <= ids.length; i++) if (i === ids.length || ids[i] !== currentId) {
		if (currentId !== 0) {
			const style = styleMap.get(currentId);
			if (style) runs.push({
				start,
				length: i - start,
				style
			});
		}
		if (i < ids.length) {
			currentId = ids[i];
			start = i;
		}
	}
	return runs;
}
function importStyleRuns(nc) {
	const td = nc.textData;
	if (!td?.characterStyleIDs || !td.styleOverrideTable) return [];
	const ids = td.characterStyleIDs;
	if (ids.length === 0 || td.styleOverrideTable.length === 0) return [];
	const styleMap = buildStyleMap(td.styleOverrideTable, nc.fontSize);
	if (styleMap.size === 0) return [];
	return collectStyleRuns(ids, styleMap);
}
//#endregion
//#region src/node-change/vector-network.ts
function decodeVectorNetworkBlob(data, styleOverrideTable) {
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	let offset = 0;
	const vertexCount = view.getUint32(offset, true);
	offset += 4;
	const segmentCount = view.getUint32(offset, true);
	offset += 4;
	const regionCount = view.getUint32(offset, true);
	offset += 4;
	const styles = /* @__PURE__ */ new Map();
	for (const entry of styleOverrideTable ?? []) styles.set(entry.styleID, entry);
	const vertices = [];
	for (let index = 0; index < vertexCount; index++) {
		const styleIndex = view.getUint32(offset, true);
		offset += 4;
		const x = view.getFloat32(offset, true);
		offset += 4;
		const y = view.getFloat32(offset, true);
		offset += 4;
		vertices.push({
			x,
			y,
			handleMirroring: styles.get(styleIndex)?.handleMirroring ?? "NONE"
		});
	}
	const segments = [];
	for (let index = 0; index < segmentCount; index++) {
		offset += 4;
		const start = view.getUint32(offset, true);
		offset += 4;
		const tangentStartX = view.getFloat32(offset, true);
		offset += 4;
		const tangentStartY = view.getFloat32(offset, true);
		offset += 4;
		const end = view.getUint32(offset, true);
		offset += 4;
		const tangentEndX = view.getFloat32(offset, true);
		offset += 4;
		const tangentEndY = view.getFloat32(offset, true);
		offset += 4;
		segments.push({
			start,
			end,
			tangentStart: {
				x: tangentStartX,
				y: tangentStartY
			},
			tangentEnd: {
				x: tangentEndX,
				y: tangentEndY
			}
		});
	}
	const regions = [];
	for (let index = 0; index < regionCount; index++) {
		const windingRule = view.getUint32(offset, true) === 0 ? "EVENODD" : "NONZERO";
		offset += 4;
		const loopCount = view.getUint32(offset, true);
		offset += 4;
		const loops = [];
		for (let loopIndex = 0; loopIndex < loopCount; loopIndex++) {
			const segmentIndexCount = view.getUint32(offset, true);
			offset += 4;
			const loop = [];
			for (let segmentIndex = 0; segmentIndex < segmentIndexCount; segmentIndex++) {
				loop.push(view.getUint32(offset, true));
				offset += 4;
			}
			loops.push(loop);
		}
		regions.push({
			windingRule,
			loops
		});
	}
	return {
		vertices,
		segments,
		regions
	};
}
function buildStyleOverrideTable(network) {
	const mirroringToId = /* @__PURE__ */ new Map();
	const table = [];
	let nextId = 1;
	for (const vertex of network.vertices) {
		const mirroring = vertex.handleMirroring ?? "NONE";
		if (mirroring === "NONE" || mirroringToId.has(mirroring)) continue;
		mirroringToId.set(mirroring, nextId);
		table.push({
			styleID: nextId,
			handleMirroring: mirroring
		});
		nextId++;
	}
	return {
		table,
		mirroringToId
	};
}
function encodeVectorNetworkBlob(network, mirroringToId) {
	let regionBytes = 0;
	for (const region of network.regions) {
		regionBytes += 8;
		for (const loop of region.loops) regionBytes += 4 + loop.length * 4;
	}
	const buffer = new ArrayBuffer(12 + network.vertices.length * 12 + network.segments.length * 28 + regionBytes);
	const view = new DataView(buffer);
	let offset = 0;
	view.setUint32(offset, network.vertices.length, true);
	offset += 4;
	view.setUint32(offset, network.segments.length, true);
	offset += 4;
	view.setUint32(offset, network.regions.length, true);
	offset += 4;
	for (const vertex of network.vertices) {
		const mirroring = vertex.handleMirroring ?? "NONE";
		view.setUint32(offset, mirroring === "NONE" ? 0 : mirroringToId?.get(mirroring) ?? 0, true);
		offset += 4;
		view.setFloat32(offset, vertex.x, true);
		offset += 4;
		view.setFloat32(offset, vertex.y, true);
		offset += 4;
	}
	for (const segment of network.segments) {
		view.setUint32(offset, 0, true);
		offset += 4;
		view.setUint32(offset, segment.start, true);
		offset += 4;
		view.setFloat32(offset, segment.tangentStart.x, true);
		offset += 4;
		view.setFloat32(offset, segment.tangentStart.y, true);
		offset += 4;
		view.setUint32(offset, segment.end, true);
		offset += 4;
		view.setFloat32(offset, segment.tangentEnd.x, true);
		offset += 4;
		view.setFloat32(offset, segment.tangentEnd.y, true);
		offset += 4;
	}
	for (const region of network.regions) {
		view.setUint32(offset, region.windingRule === "EVENODD" ? 0 : 1, true);
		offset += 4;
		view.setUint32(offset, region.loops.length, true);
		offset += 4;
		for (const loop of region.loops) {
			view.setUint32(offset, loop.length, true);
			offset += 4;
			for (const segmentIndex of loop) {
				view.setUint32(offset, segmentIndex, true);
				offset += 4;
			}
		}
	}
	return new Uint8Array(buffer);
}
//#endregion
//#region src/node-change/vector-geometry.ts
function alignGeometryWindingRules(geometry, vectorNetwork) {
	const regions = vectorNetwork?.regions ?? [];
	if (geometry.length === regions.length) return geometry.map((path, index) => ({
		...path,
		windingRule: regions[index].windingRule
	}));
	if (geometry.length === 1 && regions.length > 0 && regions.every((region) => region.windingRule === regions[0].windingRule)) return [{
		...geometry[0],
		windingRule: regions[0].windingRule
	}];
	return geometry;
}
function resolveVectorNetwork(nc, blobs) {
	const vectorData = nc.vectorData;
	if (vectorData?.vectorNetworkBlob === void 0) return null;
	const idx = vectorData.vectorNetworkBlob;
	if (idx < 0 || idx >= blobs.length) return null;
	try {
		const network = decodeVectorNetworkBlob(blobs[idx], vectorData.styleOverrideTable);
		const ns = vectorData.normalizedSize;
		const nodeW = nc.size?.x ?? 0;
		const nodeH = nc.size?.y ?? 0;
		if (ns && nodeW > 0 && nodeH > 0 && (ns.x !== nodeW || ns.y !== nodeH)) {
			const sx = nodeW / ns.x;
			const sy = nodeH / ns.y;
			for (const v of network.vertices) {
				v.x *= sx;
				v.y *= sy;
			}
			for (const seg of network.segments) {
				seg.tangentStart = {
					x: seg.tangentStart.x * sx,
					y: seg.tangentStart.y * sy
				};
				seg.tangentEnd = {
					x: seg.tangentEnd.x * sx,
					y: seg.tangentEnd.y * sy
				};
			}
		}
		return network;
	} catch {
		return null;
	}
}
function resolveStyleOverrideFills(styleOverrideTable) {
	const fillsByStyleId = /* @__PURE__ */ new Map();
	for (const override of styleOverrideTable ?? []) if (override.fillPaints && override.fillPaints.length > 0) fillsByStyleId.set(override.styleID, convertFills(override.fillPaints));
	return fillsByStyleId;
}
function resolveVectorStyleOverrideFills(source) {
	const vectorData = source.vectorData;
	return resolveStyleOverrideFills(vectorData?.styleOverrideTable);
}
function resolveGeometryPaths(paths, blobs, fillsByStyleId) {
	if (!paths || paths.length === 0) return [];
	const result = [];
	for (const p of paths) {
		if (p.commandsBlob === void 0 || p.commandsBlob < 0 || p.commandsBlob >= blobs.length) continue;
		const blob = blobs[p.commandsBlob];
		if (blob.length === 0) continue;
		const fills = p.styleID ? fillsByStyleId?.get(p.styleID) : void 0;
		result.push({
			windingRule: p.windingRule === "EVENODD" ? "EVENODD" : "NONZERO",
			commandsBlob: blob,
			fills: fills && fills.length > 0 ? copyFills(fills) : void 0
		});
	}
	return result;
}
//#endregion
//#region src/node-change/convert.ts
function extractVariableModes(nc) {
	const result = {};
	const modeMap = nc.variableModeBySetMap;
	for (const entry of modeMap?.entries ?? []) {
		const collectionGuid = entry.variableSetID?.guid;
		const modeGuid = entry.variableModeID;
		if (!collectionGuid || !modeGuid) continue;
		result[guidToString(collectionGuid)] = guidToString(modeGuid);
	}
	return result;
}
const NODE_TYPE_MAP = {
	DOCUMENT: "DOCUMENT",
	VARIABLE: "VARIABLE",
	CANVAS: "CANVAS",
	FRAME: "FRAME",
	RECTANGLE: "RECTANGLE",
	ROUNDED_RECTANGLE: "ROUNDED_RECTANGLE",
	ELLIPSE: "ELLIPSE",
	TEXT: "TEXT",
	LINE: "LINE",
	STAR: "STAR",
	REGULAR_POLYGON: "POLYGON",
	VECTOR: "VECTOR",
	BOOLEAN_OPERATION: "BOOLEAN_OPERATION",
	GROUP: "GROUP",
	SECTION: "SECTION",
	COMPONENT: "COMPONENT",
	COMPONENT_SET: "COMPONENT_SET",
	INSTANCE: "INSTANCE",
	SYMBOL: "COMPONENT",
	CONNECTOR: "CONNECTOR",
	SHAPE_WITH_TEXT: "SHAPE_WITH_TEXT"
};
function mapNodeType(type) {
	if (type) return NODE_TYPE_MAP[type] ?? "RECTANGLE";
	return "RECTANGLE";
}
function mapBooleanOperation(nc) {
	if (nc.type !== "BOOLEAN_OPERATION") return void 0;
	const operation = nc.booleanOperation;
	switch (operation) {
		case "SUBTRACT":
		case "INTERSECT": return operation;
		case "EXCLUDE":
		case "XOR": return "EXCLUDE";
		default: return "UNION";
	}
}
function mapStackMode(mode) {
	switch (mode) {
		case "HORIZONTAL": return "HORIZONTAL";
		case "VERTICAL": return "VERTICAL";
		default: return "NONE";
	}
}
function mapStackSizing(sizing) {
	switch (sizing) {
		case "RESIZE_TO_FIT":
		case "RESIZE_TO_FIT_WITH_IMPLICIT_SIZE": return "HUG";
		case "FILL": return "FILL";
		default: return "FIXED";
	}
}
function mapStackJustify(justify) {
	switch (justify) {
		case "CENTER": return "CENTER";
		case "MAX": return "MAX";
		case "SPACE_BETWEEN":
		case "SPACE_EVENLY": return "SPACE_BETWEEN";
		default: return "MIN";
	}
}
function mapStackCounterAlign(align) {
	switch (align) {
		case "CENTER": return "CENTER";
		case "MAX": return "MAX";
		case "STRETCH": return "STRETCH";
		case "BASELINE": return "BASELINE";
		default: return "MIN";
	}
}
function mapAlignSelf(align) {
	switch (align) {
		case "MIN": return "MIN";
		case "CENTER": return "CENTER";
		case "MAX": return "MAX";
		case "STRETCH": return "STRETCH";
		case "BASELINE": return "BASELINE";
		default: return "AUTO";
	}
}
function mapConstraint(c) {
	switch (c) {
		case "CENTER": return "CENTER";
		case "MAX": return "MAX";
		case "STRETCH": return "STRETCH";
		case "SCALE": return "SCALE";
		default: return "MIN";
	}
}
function mapArcData(data) {
	if (!data) return null;
	return {
		startingAngle: data.startingAngle ?? 0,
		endingAngle: data.endingAngle ?? 2 * Math.PI,
		innerRadius: data.innerRadius ?? 0
	};
}
function convertFigmaTransformProps(nc) {
	const width = nc.size?.x ?? 100;
	const height = nc.size?.y ?? 100;
	let x = nc.transform?.m02 ?? 0;
	let y = nc.transform?.m12 ?? 0;
	let rotation = 0;
	let flipX = false;
	if (nc.transform) {
		const t = nc.transform;
		if (t.m00 * t.m11 - t.m01 * t.m10 < 0) flipX = true;
		rotation = Math.atan2(t.m10, flipX ? t.m11 : t.m00) * (180 / Math.PI);
		const radians = rotation * Math.PI / 180;
		const cos = Math.cos(radians);
		const sin = Math.sin(radians);
		const centerX = width / 2;
		const centerY = height / 2;
		const m00 = flipX ? -cos : cos;
		const m01 = flipX ? sin : -sin;
		const m10 = sin;
		const m11 = cos;
		x = t.m02 - centerX + m00 * centerX + m01 * centerY;
		y = t.m12 - centerY + m10 * centerX + m11 * centerY;
	}
	return {
		x,
		y,
		width,
		height,
		rotation,
		flipX,
		flipY: false
	};
}
function convertCornerProps(nc) {
	return {
		cornerRadius: nc.cornerRadius ?? 0,
		topLeftRadius: nc.rectangleTopLeftCornerRadius ?? nc.cornerRadius ?? 0,
		topRightRadius: nc.rectangleTopRightCornerRadius ?? nc.cornerRadius ?? 0,
		bottomRightRadius: nc.rectangleBottomRightCornerRadius ?? nc.cornerRadius ?? 0,
		bottomLeftRadius: nc.rectangleBottomLeftCornerRadius ?? nc.cornerRadius ?? 0,
		independentCorners: nc.rectangleCornerRadiiIndependent ?? false,
		cornerSmoothing: nc.cornerSmoothing ?? 0
	};
}
function importedTextLineHeight(nc) {
	const derivedLineHeight = nc.derivedTextData?.baselines?.[0]?.lineHeight;
	if (derivedLineHeight !== void 0 && Number.isFinite(derivedLineHeight)) return derivedLineHeight;
	return convertLineHeight(nc.lineHeight, nc.fontSize);
}
function convertTextDecorationProps(nc) {
	return {
		textDecoration: mapTextDecoration(nc.textDecoration),
		textDecorationStyle: nc.textDecorationStyle ?? "SOLID",
		textDecorationThickness: nc.textDecorationThickness?.value ?? null,
		textDecorationFills: convertFills(nc.textDecorationFillPaints),
		textDecorationSkipInk: nc.textDecorationSkipInk ?? true,
		textUnderlineOffset: nc.textUnderlineOffset?.value ?? null
	};
}
function convertTextProps(nc, blobs) {
	return {
		text: nc.textData?.characters ?? "",
		fontSize: nc.fontSize ?? 14,
		fontFamily: nc.fontName?.family ?? DEFAULT_FONT_FAMILY,
		fontWeight: styleToWeight(nc.fontName?.style ?? ""),
		italic: nc.fontName?.style.toLowerCase().includes("italic") ?? false,
		textAlignHorizontal: nc.textAlignHorizontal ?? "LEFT",
		textAlignVertical: nc.textAlignVertical ?? "TOP",
		textAutoResize: nc.textAutoResize ?? "NONE",
		textCase: nc.textCase ?? "ORIGINAL",
		...convertTextDecorationProps(nc),
		leadingTrim: nc.leadingTrim ?? "NONE",
		lineHeight: importedTextLineHeight(nc),
		letterSpacing: convertLetterSpacing(nc.letterSpacing, nc.fontSize),
		maxLines: nc.maxLines ?? null,
		styleRuns: importStyleRuns(nc),
		fontVariations: convertFontVariations(nc),
		fontFeatures: convertFontFeatures(nc),
		textTruncation: nc.textTruncation === "ENDING" ? "ENDING" : "DISABLED",
		textDirection: getOpenPencilPluginValue(nc, "textDirection") || "AUTO",
		figmaDerivedLayout: nc.derivedTextData?.layoutSize ? {
			width: nc.derivedTextData.layoutSize.x,
			height: nc.derivedTextData.layoutSize.y
		} : null,
		figmaDerivedTextGlyphs: convertFigmaDerivedTextGlyphs(nc.derivedTextData, blobs)
	};
}
function convertLayoutPadding(nc) {
	const basePadding = nc.stackPadding ?? 0;
	return {
		paddingTop: nc.stackVerticalPadding ?? basePadding,
		paddingBottom: nc.stackPaddingBottom ?? basePadding,
		paddingLeft: nc.stackHorizontalPadding ?? basePadding,
		paddingRight: nc.stackPaddingRight ?? basePadding
	};
}
function visibleContainerDerivedLayout(nc, layoutMode, primaryAxisSizing, counterAxisSizing) {
	const hasHugAxis = primaryAxisSizing === "HUG" || counterAxisSizing === "HUG";
	const hasVisiblePaint = (nc.fillPaints?.some((paint) => paint.visible !== false) ?? false) || (nc.strokePaints?.some((paint) => paint.visible !== false) ?? false);
	if (layoutMode === "NONE" || !hasHugAxis || !hasVisiblePaint) return void 0;
	return {
		x: nc.transform?.m02 ?? 0,
		y: nc.transform?.m12 ?? 0,
		width: nc.size?.x ?? 100,
		height: nc.size?.y ?? 100
	};
}
function minimumSizeDimension(size, axis) {
	const value = size?.value?.[axis];
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}
function maximumSizeDimension(size, axis) {
	const value = size?.value?.[axis];
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}
function convertLayoutProps(nc) {
	const layoutMode = mapStackMode(nc.stackMode);
	const primaryAxisSizing = mapStackSizing(nc.stackPrimarySizing);
	const counterAxisSizing = mapStackSizing(nc.stackCounterSizing);
	const figmaDerivedLayout = visibleContainerDerivedLayout(nc, layoutMode, primaryAxisSizing, counterAxisSizing);
	return {
		layoutMode,
		itemSpacing: nc.stackSpacing ?? 0,
		...convertLayoutPadding(nc),
		primaryAxisSizing,
		counterAxisSizing,
		primaryAxisAlign: mapStackJustify(nc.stackPrimaryAlignItems ?? nc.stackJustify),
		counterAxisAlign: mapStackCounterAlign(nc.stackCounterAlignItems ?? nc.stackCounterAlign),
		layoutWrap: nc.stackWrap === "WRAP" ? "WRAP" : "NO_WRAP",
		counterAxisSpacing: nc.stackCounterSpacing ?? 0,
		layoutPositioning: nc.stackPositioning === "ABSOLUTE" ? "ABSOLUTE" : "AUTO",
		layoutGrow: nc.stackChildPrimaryGrow ?? 0,
		layoutAlignSelf: mapAlignSelf(nc.stackChildAlignSelf),
		counterAxisAlignContent: nc.stackCounterAlignContent === "SPACE_BETWEEN" ? "SPACE_BETWEEN" : "AUTO",
		itemReverseZIndex: nc.stackReverseZIndex ?? false,
		strokesIncludedInLayout: nc.strokesIncludedInLayout ?? false,
		layoutDirection: getOpenPencilPluginValue(nc, "layoutDirection") || "AUTO",
		...figmaDerivedLayout ? { figmaDerivedLayout } : {}
	};
}
function getVectorStrokeCap(nc, vectorNetwork) {
	return nc.strokeCap ?? vectorNetwork?.vertices.find((v) => v.strokeCap)?.strokeCap ?? "NONE";
}
function getVectorStrokeJoin(nc, vectorNetwork) {
	return nc.strokeJoin ?? vectorNetwork?.vertices.find((v) => v.strokeJoin)?.strokeJoin ?? "MITER";
}
function styleRefId(value) {
	if (!value || typeof value !== "object" || !("guid" in value)) return null;
	const guid = value.guid;
	if (!guid || typeof guid !== "object") return null;
	return guidToString(guid);
}
function sharedStyleType(value) {
	if (value === "FILL" || value === "TEXT" || value === "EFFECT" || value === "GRID") return value;
	return null;
}
function convertLayoutGrids(value) {
	return Array.isArray(value) ? structuredClone(value) : [];
}
function convertVectorAndStrokeProps(nc, blobs) {
	const vectorNetwork = resolveVectorNetwork(nc, blobs);
	const strokeCap = getVectorStrokeCap(nc, vectorNetwork);
	const strokeJoin = getVectorStrokeJoin(nc, vectorNetwork);
	return {
		vectorNetwork,
		fillGeometry: alignGeometryWindingRules(resolveGeometryPaths(nc.fillGeometry, blobs, resolveVectorStyleOverrideFills(nc)), vectorNetwork),
		strokeGeometry: resolveGeometryPaths(nc.strokeGeometry, blobs),
		arcData: mapArcData(nc.arcData),
		strokeCap,
		strokeJoin,
		dashPattern: nc.dashPattern ?? [],
		borderTopWeight: nc.borderTopWeight ?? 0,
		borderRightWeight: nc.borderRightWeight ?? 0,
		borderBottomWeight: nc.borderBottomWeight ?? 0,
		borderLeftWeight: nc.borderLeftWeight ?? 0,
		independentStrokeWeights: nc.borderStrokeWeightsIndependent ?? false,
		strokeMiterLimit: nc.miterLimit ?? DEFAULT_STROKE_MITER_LIMIT
	};
}
function resolveNodeType(nc) {
	const nodeType = mapNodeType(nc.type);
	if (nodeType === "FRAME" && isComponentSet(nc) || getOpenPencilPluginValue(nc, "nodeType") === "COMPONENT_SET") return "COMPONENT_SET";
	if (nodeType === "FRAME" && nc.resizeToFit === true && (nc.stackMode === void 0 || nc.stackMode === "NONE")) return "GROUP";
	return nodeType;
}
function nearlyEqualSize(a, b) {
	return Math.abs((a ?? 0) - (b ?? 0)) <= .5;
}
function shouldImportTextAsAutoSize(nc, parentNc) {
	if (nc.type !== "TEXT" || nc.textAutoResize !== "NONE") return false;
	if (parentNc?.stackMode !== "HORIZONTAL" && parentNc?.stackMode !== "VERTICAL") return false;
	if (!nc.textData?.characters) return false;
	const layoutSize = nc.derivedTextData?.layoutSize;
	if (!layoutSize || !nc.size) return false;
	return nearlyEqualSize(layoutSize.x, nc.size.x) && nearlyEqualSize(layoutSize.y, nc.size.y);
}
function nodeChangeToProps(nc, blobs) {
	const nodeType = resolveNodeType(nc);
	const vectorAndStrokeProps = convertVectorAndStrokeProps(nc, blobs);
	return {
		nodeType,
		name: nc.name ?? nodeType,
		source: extractSourceMetadata(nc, blobs),
		...convertFigmaTransformProps(nc),
		opacity: nc.opacity ?? 1,
		visible: nc.visible ?? true,
		locked: nc.locked ?? false,
		blendMode: nc.blendMode ?? "PASS_THROUGH",
		booleanOperation: mapBooleanOperation(nc),
		fills: convertFills(nc.fillPaints),
		strokes: convertStrokes(nc.strokePaints, nc.strokeWeight, nc.strokeAlign, vectorAndStrokeProps.strokeCap, vectorAndStrokeProps.strokeJoin, nc.dashPattern ?? []),
		effects: convertEffects(nc.effects),
		layoutGrids: convertLayoutGrids(nc.layoutGrids),
		fillStyleId: styleRefId(nc.styleIdForFill),
		strokeStyleId: styleRefId(nc.styleIdForStrokeFill),
		textStyleId: styleRefId(nc.styleIdForText),
		effectStyleId: styleRefId(nc.styleIdForEffect),
		gridStyleId: styleRefId(nc.styleIdForGrid),
		sharedStyleType: sharedStyleType(nc.styleType),
		...convertCornerProps(nc),
		...convertTextProps(nc, blobs),
		horizontalConstraint: mapConstraint(nc.horizontalConstraint),
		verticalConstraint: mapConstraint(nc.verticalConstraint),
		...convertLayoutProps(nc),
		...vectorAndStrokeProps,
		minWidth: minimumSizeDimension(nc.minSize, "x"),
		maxWidth: maximumSizeDimension(nc.maxSize, "x"),
		minHeight: minimumSizeDimension(nc.minSize, "y"),
		maxHeight: maximumSizeDimension(nc.maxSize, "y"),
		isMask: nc.mask ?? false,
		maskType: nc.maskType ?? "ALPHA",
		maskIsOutline: nc.maskIsOutline ?? false,
		expanded: true,
		autoRename: nc.autoRename ?? true,
		boundVariables: extractBoundVariables(nc),
		variableModes: extractVariableModes(nc),
		exportSettings: extractExportSettings(nc),
		pluginData: extractPluginData(nc),
		pluginRelaunchData: extractPluginRelaunchData(nc),
		clipsContent: nc.frameMaskDisabled === false && nc.resizeToFit !== true,
		componentId: extractSymbolId(nc),
		componentPropertyDefinitions: extractComponentPropertyDefs(nc),
		componentPropertyReferences: extractComponentPropertyRefs(nc),
		componentPropertyAssignments: extractComponentPropertyAssignments(nc),
		componentPropertyValues: extractComponentPropertyValues(nc),
		...extractComponentMetadata(nc)
	};
}
const COMPONENT_PROP_TYPE_MAP = {
	VARIANT: "VARIANT",
	TEXT: "TEXT",
	BOOL: "BOOLEAN",
	BOOLEAN: "BOOLEAN",
	INSTANCE_SWAP: "INSTANCE_SWAP"
};
function componentPropValueToString(value) {
	if (!value || typeof value !== "object") return "";
	const propValue = value;
	if (typeof propValue.boolValue === "boolean") return String(propValue.boolValue);
	if (typeof propValue.textValue === "string") return propValue.textValue;
	if (propValue.textValue && typeof propValue.textValue === "object") return propValue.textValue.characters ?? "";
	return propValue.guidValue ? guidToString(propValue.guidValue) : "";
}
function extractComponentPropertyDefs(nc) {
	const defs = nc.componentPropDefs;
	if (!defs?.length) return [];
	const result = [];
	for (const def of defs) {
		if (!def.id || !def.name) continue;
		const propType = COMPONENT_PROP_TYPE_MAP[def.type ?? ""] ?? "VARIANT";
		result.push({
			id: guidToString(def.id),
			name: def.name,
			type: propType,
			defaultValue: componentPropValueToString(def.initialValue),
			variantOptions: propType === "VARIANT" ? def.preferredValues?.stringValues : void 0,
			preferredValues: propType === "INSTANCE_SWAP" ? def.preferredValues?.instanceSwapValues?.map((value) => value.key).filter((value) => value !== void 0) : void 0
		});
	}
	return result;
}
function extractComponentPropertyRefs(nc) {
	const refs = nc.componentPropRefs;
	if (!refs?.length) return [];
	const fieldMap = {
		"0": "VISIBLE",
		"1": "TEXT",
		"2": "INSTANCE_SWAP",
		VISIBLE: "VISIBLE",
		TEXT_DATA: "TEXT",
		OVERRIDDEN_SYMBOL_ID: "INSTANCE_SWAP"
	};
	return refs.flatMap((ref) => {
		const field = fieldMap[String(ref.componentPropNodeField)];
		return ref.defID && field && !ref.isDeleted ? [{
			propertyId: guidToString(ref.defID),
			field
		}] : [];
	});
}
function componentPropertyAssignmentValue(assignment) {
	if (assignment.value && (assignment.value.boolValue !== void 0 || assignment.value.textValue !== void 0 || assignment.value.guidValue !== void 0)) return componentPropValueToString(assignment.value);
	const variableValue = assignment.varValue?.value;
	if (variableValue?.symbolIdValue?.guid) return guidToString(variableValue.symbolIdValue.guid);
	if (variableValue?.boolValue !== void 0) return String(variableValue.boolValue);
	if (variableValue?.textValue !== void 0) return variableValue.textValue;
	return variableValue?.textDataValue?.characters ?? "";
}
function extractComponentPropertyAssignments(nc) {
	const assignments = nc.componentPropAssignments;
	if (!assignments?.length) return {};
	return Object.fromEntries(assignments.flatMap((assignment) => assignment.defID ? [[guidToString(assignment.defID), componentPropertyAssignmentValue(assignment)]] : []));
}
function extractVariantPropSpecs(nc) {
	const specs = nc.variantPropSpecs;
	if (!specs?.length) return [];
	return specs.filter((spec) => !!spec.propDefId).map((spec) => ({
		propDefId: guidToString(spec.propDefId),
		value: spec.value ?? ""
	}));
}
function extractComponentPropertyValues(nc) {
	const specs = extractVariantPropSpecs(nc);
	const defs = new Map(extractComponentPropertyDefs(nc).map((def) => [def.id, def.name]));
	if (specs.length > 0 && defs.size > 0) {
		const values = {};
		for (const spec of specs) values[defs.get(spec.propDefId) ?? spec.propDefId] = spec.value;
		return values;
	}
	const name = nc.name;
	if (!name?.includes("=")) return {};
	return parseVariantName(name);
}
function guidToStringOrNull(value) {
	if (!value || typeof value !== "object") return null;
	const guid = value;
	if (typeof guid.sessionID !== "number" || typeof guid.localID !== "number") return null;
	return guidToString({
		sessionID: guid.sessionID,
		localID: guid.localID
	});
}
function stringOrNull(value) {
	return typeof value === "string" ? value : null;
}
function stringOrEmpty(value) {
	return typeof value === "string" ? value : "";
}
function booleanOrFalse(value) {
	return typeof value === "boolean" ? value : false;
}
function extractComponentMetadata(nc) {
	const symbolLinks = nc.symbolLinks ?? [];
	return {
		componentKey: stringOrNull(nc.componentKey),
		sourceLibraryKey: stringOrNull(nc.sourceLibraryKey),
		publishId: guidToStringOrNull(nc.publishID),
		overrideKey: guidToStringOrNull(nc.overrideKey),
		sharedSymbolVersion: stringOrNull(nc.sharedSymbolVersion),
		publishedVersion: stringOrNull(nc.publishedVersion),
		isPublishable: booleanOrFalse(nc.isPublishable),
		isSymbolPublishable: booleanOrFalse(nc.isSymbolPublishable),
		symbolDescription: stringOrEmpty(nc.symbolDescription),
		symbolLinks: symbolLinks.filter((link) => typeof link.uri === "string").map((link) => ({
			uri: link.uri,
			displayName: link.displayName,
			displayText: link.displayText
		})),
		variantPropSpecs: extractVariantPropSpecs(nc)
	};
}
function isComponentSet(nc) {
	const defs = nc.componentPropDefs;
	if (!defs?.length) return false;
	return defs.some((d) => d.type === "VARIANT");
}
function extractFigmaLayoutMetadata(nc) {
	return {
		stackMode: nc.stackMode,
		stackSpacing: nc.stackSpacing,
		stackPadding: nc.stackPadding,
		stackPaddingRight: nc.stackPaddingRight,
		stackPaddingBottom: nc.stackPaddingBottom,
		stackCounterAlign: nc.stackCounterAlign,
		stackJustify: nc.stackJustify,
		stackCounterAlignItems: nc.stackCounterAlignItems,
		stackPrimaryAlignItems: nc.stackPrimaryAlignItems,
		stackPrimarySizing: nc.stackPrimarySizing,
		stackCounterSizing: nc.stackCounterSizing,
		stackVerticalPadding: nc.stackVerticalPadding,
		stackHorizontalPadding: nc.stackHorizontalPadding,
		stackWrap: nc.stackWrap,
		stackPositioning: nc.stackPositioning,
		stackChildPrimaryGrow: nc.stackChildPrimaryGrow,
		stackChildAlignSelf: nc.stackChildAlignSelf,
		stackCounterSpacing: nc.stackCounterSpacing,
		bordersTakeSpace: nc.bordersTakeSpace,
		stackReverseZIndex: nc.stackReverseZIndex
	};
}
function extractSourceMetadata(nc, blobs) {
	return {
		format: "fig",
		id: nc.guid ? guidToString(nc.guid) : null,
		orderKey: nc.parentIndex?.position ?? null,
		editedFields: [],
		fig: {
			...extractFigmaRawGeometry(nc, blobs),
			...extractFigmaSymbolMetadata(nc, blobs),
			layout: extractFigmaLayoutMetadata(nc)
		}
	};
}
function sortChildren(children, parentNc, nodeMap) {
	const stackMode = parentNc.stackMode;
	const isHorizontal = stackMode === "HORIZONTAL";
	const isVertical = stackMode === "VERTICAL";
	children.sort((a, b) => {
		const aPos = nodeMap.get(a)?.parentIndex?.position ?? "";
		const bPos = nodeMap.get(b)?.parentIndex?.position ?? "";
		if (aPos < bPos) return -1;
		if (aPos > bPos) return 1;
		if (isHorizontal || isVertical) {
			const axis = isHorizontal ? "m02" : "m12";
			const aT = nodeMap.get(a)?.transform?.[axis] ?? 0;
			const bT = nodeMap.get(b)?.transform?.[axis] ?? 0;
			if (aT !== bT) return aT - bT;
		}
		return 0;
	});
}
function preserveFigmaPayloadBlobs(value, blobs) {
	if (value instanceof Uint8Array) return value;
	if (Array.isArray(value)) return value.map((item) => preserveFigmaPayloadBlobs(item, blobs));
	if (!value || typeof value !== "object") return value;
	const result = {};
	for (const [key, child] of Object.entries(value)) if ((key === "commandsBlob" || key === "vectorNetworkBlob") && typeof child === "number") {
		const blob = blobs[child];
		if (blob == null) result[key] = child;
		else result[key] = { __openPencilFigmaBlob: blob instanceof Uint8Array ? blob : new Uint8Array(Object.values(blob)) };
	} else result[key] = preserveFigmaPayloadBlobs(child, blobs);
	return result;
}
const FIGMA_RAW_NODE_FIELD_KEYS = [
	"styleIdForFill",
	"styleIdForStrokeFill",
	"styleIdForText",
	"styleIdForEffect",
	"styleIdForGrid",
	"styleType",
	"componentPropAssignments",
	"backgroundPaints",
	"layoutGrids",
	"exportSettings",
	"componentPropDefs",
	"componentPropRefs",
	"variantPropSpecs",
	"stateGroupPropertyValueOrders",
	"isStateGroup",
	"version",
	"sourceLibraryKey",
	"userFacingVersion",
	"description",
	"key",
	"sortPosition",
	"detachedSymbolId",
	"documentColorProfile",
	"variableConsumptionMap",
	"variableModeBySetMap",
	"parameterConsumptionMap",
	"editInfo",
	"backgroundColor",
	"pageType",
	"isPageDivider",
	"guides",
	"handoffStatusMap",
	"annotationCategories",
	"miterLimit",
	"mask",
	"maskType",
	"maskIsOutline",
	"strokeWeight",
	"strokeJoin",
	"borderStrokeWeightsIndependent",
	"borderTopWeight",
	"borderRightWeight",
	"borderBottomWeight",
	"borderLeftWeight",
	"minSize",
	"maxSize",
	"targetAspectRatio",
	"gridRows",
	"gridColumns",
	"gridRowAnchor",
	"gridColumnAnchor",
	"gridColumnsSizing",
	"gridRowsSizing",
	"gridChildVerticalAlign",
	"gridChildHorizontalAlign",
	"textAutoResize",
	"textData",
	"lineHeight",
	"fontName",
	"fontSize",
	"letterSpacing",
	"textTracking",
	"fontVersion",
	"textUserLayoutVersion",
	"textExplicitLayoutVersion",
	"fontVariations",
	"fontVariantCommonLigatures",
	"fontVariantContextualLigatures",
	"toggledOnOTFeatures",
	"toggledOffOTFeatures",
	"leadingTrim",
	"textDecorationFillPaints",
	"textUnderlineOffset",
	"textDecorationThickness",
	"textDecorationStyle",
	"semanticWeight",
	"semanticItalic",
	"maxLines",
	"textPathStart",
	"derivedTextData",
	"fillPaints",
	"strokePaints",
	"effects",
	"sectionStatusInfo",
	"prototypeStartNodeID",
	"prototypeInteractions",
	"transitionInfo",
	"codeSyntax",
	"lockMode",
	"slideThemeMap",
	"isSoftDeleted",
	"brushType",
	"scatterStrokeSettings",
	"vectorOperationVersion",
	"vectorData",
	"fillGeometry",
	"strokeGeometry"
];
function extractFigmaRawGeometry(nc, blobs) {
	const rawNodeFields = {};
	for (const key of FIGMA_RAW_NODE_FIELD_KEYS) {
		const value = nc[key];
		if (value !== void 0) rawNodeFields[key] = preserveFigmaPayloadBlobs(value, blobs);
	}
	return {
		rawSize: nc.size ? { ...nc.size } : null,
		rawTransform: nc.transform ? { ...nc.transform } : null,
		rawNodeFields
	};
}
function extractFigmaSymbolMetadata(nc, blobs) {
	const sd = nc.symbolData;
	return {
		symbolOverrides: preserveFigmaPayloadBlobs(sd?.symbolOverrides ?? [], blobs),
		componentPropAssignments: preserveFigmaPayloadBlobs(nc.componentPropAssignments ?? [], blobs),
		derivedSymbolData: preserveFigmaPayloadBlobs(nc.derivedSymbolData ?? [], blobs),
		derivedSymbolDataLayoutVersion: typeof nc.derivedSymbolDataLayoutVersion === "number" ? nc.derivedSymbolDataLayoutVersion : null,
		uniformScaleFactor: typeof sd?.uniformScaleFactor === "number" ? sd.uniformScaleFactor : null
	};
}
function extractSymbolId(nc) {
	const sd = nc.symbolData;
	if (!sd?.symbolID) return "";
	return guidToString(sd.symbolID);
}
//#endregion
//#region src/node-change/derived-text-data.ts
function buildDerivedTextData$1(options) {
	return {
		layoutSize: {
			x: options.node.width,
			y: options.node.height
		},
		baselines: options.baselines ?? [{
			firstCharacter: 0,
			endCharacter: Math.max(options.node.text.length - 1, 0),
			position: {
				x: 0,
				y: options.baseline
			},
			width: options.width,
			lineHeight: options.lineHeight,
			lineAscent: options.lineAscent
		}],
		glyphs: options.glyphs,
		fontMetaData: options.fontMetaData,
		logicalIndexToCharacterOffsetMap: options.logicalIndexToCharacterOffsetMap,
		derivedLines: [{ directionality: "LTR" }],
		truncationStartIndex: -1,
		truncatedHeight: -1
	};
}
//#endregion
//#region src/node-change/export-node.ts
function toKiwiBooleanOperation(operation) {
	return operation === "EXCLUDE" ? "XOR" : operation ?? "UNION";
}
/** Resolve effect variable asset refs when the Kiwi effect schema requires GUID aliases. */
function buildAssetRefToVarGuidMap(graph, varIdToGuid) {
	const map = /* @__PURE__ */ new Map();
	for (const [varId, variable] of graph.variables) {
		if (!variable.key) continue;
		const guid = varIdToGuid.get(varId) ?? stringToGuid(varId);
		map.set(variable.key, guid);
		if (variable.version) map.set(`${variable.key}@${variable.version}`, guid);
	}
	return map;
}
function applyColorVariableBinding(context, node, paint, field) {
	const variableId = node.boundVariables[field];
	if (!variableId) return paint;
	return {
		...paint,
		colorVariableBinding: { variableID: context.varIdToGuid?.get(variableId) ?? stringToGuid(variableId) }
	};
}
function createStrokePaints(context, node) {
	return node.strokes.map((stroke, index) => applyColorVariableBinding(context, node, {
		type: "SOLID",
		color: context.safeColor(stroke.color),
		opacity: stroke.opacity,
		visible: stroke.visible,
		blendMode: "NORMAL"
	}, `strokes/${index}/color`));
}
function componentPropertyTypeForKiwi(type) {
	if (type === "BOOLEAN") return "BOOL";
	return type;
}
function componentPropertyValue(type, value, graph) {
	if (type === "BOOLEAN") return { boolValue: value === "true" };
	if (type === "INSTANCE_SWAP") {
		const guid = parseGuidOrNull(graph.getNode(value)?.source.id ?? value);
		return guid ? { guidValue: guid } : { textValue: { characters: value } };
	}
	return { textValue: { characters: value } };
}
function parseGuidOrNull(value) {
	return /^\d+:\d+$/.test(value) ? stringToGuid(value) : null;
}
function serializeVariableModes(node, variableIdToGuid, modeIdToGuid) {
	const entries = Object.entries(node.variableModes).flatMap(([collectionId, modeId]) => {
		const collectionGuid = variableIdToGuid?.get(collectionId) ?? parseGuidOrNull(collectionId);
		const modeGuid = modeIdToGuid?.get(modeId) ?? parseGuidOrNull(modeId);
		if (!collectionGuid || !modeGuid) return [];
		return [{
			variableSetID: { guid: collectionGuid },
			variableModeID: modeGuid
		}];
	});
	return entries.length > 0 ? { entries } : void 0;
}
const FIGMA_PAYLOAD_VARIABLE_MAP_FIELDS = /* @__PURE__ */ new Set(["variableConsumptionMap", "parameterConsumptionMap"]);
const FIGMA_PAYLOAD_PAINT_VARIABLE_FIELDS = /* @__PURE__ */ new Set(["colorVar", "opacityVar"]);
const SUPPORTED_VARIABLE_DATA_TYPES = /* @__PURE__ */ new Set([
	"BOOLEAN",
	"FLOAT",
	"STRING",
	"ALIAS",
	"COLOR",
	"SYMBOL_ID",
	"TEXT_DATA",
	"PROP_REF"
]);
function isFigmaPayloadVariableMap(value) {
	return !!value && typeof value === "object" && !Array.isArray(value) && "entries" in value;
}
function isFigmaPayloadVariableMapEntry(value) {
	return !!value && typeof value === "object" && !Array.isArray(value);
}
function isSupportedVariableMapEntry(value) {
	if (!isFigmaPayloadVariableMapEntry(value)) return false;
	const entry = value;
	const dataType = entry.variableData?.dataType;
	return typeof dataType === "string" && SUPPORTED_VARIABLE_DATA_TYPES.has(dataType) || !!entry.variableData?.value?.propRefValue;
}
function isPropRefVariableMapEntry(value) {
	if (!isFigmaPayloadVariableMapEntry(value)) return false;
	const entry = value;
	return entry.variableData?.dataType === "PROP_REF" || !!entry.variableData?.value?.propRefValue;
}
function materializeSafeVariableMap(value, blobs, options, predicate) {
	if (!isFigmaPayloadVariableMap(value)) return void 0;
	const entries = value.entries?.filter(predicate) ?? [];
	if (entries.length === 0) return void 0;
	return { entries: entries.map((entry) => materializeFigmaPayload(entry, blobs, options)) };
}
function materializeFigmaBlob(value, blobs, options) {
	const blob = value.__openPencilFigmaBlob;
	const bytes = blob instanceof Uint8Array ? blob : new Uint8Array(Object.values(blob ?? {}));
	const key = bytesToHex(bytes);
	const existing = options.blobIndexByHex?.get(key);
	if (existing !== void 0) return existing;
	const index = blobs.length;
	blobs.push(bytes);
	options.blobIndexByHex?.set(key, index);
	return index;
}
function normalizeFigmaPayloadValue(key, value) {
	if (key === "stackCounterAlignItems" && value === "STRETCH") return "MIN";
	if ((key === "stackJustify" || key === "stackPrimaryAlignItems" || key === "stackCounterAlign" || key === "stackCounterAlignItems") && value === "SPACE_EVENLY") return "SPACE_BETWEEN";
	return value;
}
function materializeFigmaPayload(value, blobs, options = {}) {
	if (value instanceof Uint8Array) return value;
	if (Array.isArray(value)) return value.map((item) => materializeFigmaPayload(item, blobs, options));
	if (!value || typeof value !== "object") return value;
	if ("__openPencilFigmaBlob" in value) return materializeFigmaBlob(value, blobs, options);
	const materialized = {};
	for (const [key, child] of Object.entries(value)) {
		if (FIGMA_PAYLOAD_PAINT_VARIABLE_FIELDS.has(key) && !options.includePaintVariables) continue;
		if (FIGMA_PAYLOAD_VARIABLE_MAP_FIELDS.has(key)) {
			const variableMap = materializeSafeVariableMap(child, blobs, options, options.includeVariableMaps ? isSupportedVariableMapEntry : isPropRefVariableMapEntry);
			if (variableMap !== void 0) materialized[key] = variableMap;
			continue;
		}
		materialized[key] = normalizeFigmaPayloadValue(key, materializeFigmaPayload(child, blobs, options));
	}
	return materialized;
}
function resolveInstanceComponentId(context, componentId) {
	const seen = /* @__PURE__ */ new Set();
	let currentId = componentId;
	while (!seen.has(currentId)) {
		seen.add(currentId);
		const node = context.graph.getNode(currentId);
		if (node?.type !== "INSTANCE" || !node.componentId) return currentId;
		currentId = node.componentId;
	}
	return componentId;
}
function getOrCreateNodeGuid(context, nodeId, localIdCounter) {
	const node = context.graph.getNode(nodeId);
	if (!node) return void 0;
	const existing = context.nodeIdToGuid?.get(nodeId);
	if (existing) return existing;
	const importedGuid = node.source.id ? parseGuidOrNull(node.source.id) : null;
	if (importedGuid && context.assignedGuidValues) {
		const key = `${importedGuid.sessionID}:${importedGuid.localID}`;
		if (context.assignedGuidValues.has(key)) {
			const guid = {
				sessionID: 1,
				localID: localIdCounter.value++
			};
			context.nodeIdToGuid?.set(nodeId, guid);
			context.assignedGuidValues.add(`${guid.sessionID}:${guid.localID}`);
			return guid;
		}
	}
	const guid = importedGuid ?? {
		sessionID: 1,
		localID: localIdCounter.value++
	};
	context.nodeIdToGuid?.set(nodeId, guid);
	context.assignedGuidValues?.add(`${guid.sessionID}:${guid.localID}`);
	return guid;
}
function isDescendantOf(context, nodeId, ancestorId) {
	let current = context.graph.getNode(nodeId);
	while (current?.parentId) {
		if (current.parentId === ancestorId) return true;
		current = context.graph.getNode(current.parentId);
	}
	return false;
}
function serializeTextOverrides(context, instance, localIdCounter) {
	const result = [];
	for (const [key, value] of Object.entries(instance.overrides)) {
		if (!key.endsWith(":text") || typeof value !== "string") continue;
		const targetId = key.slice(0, -5);
		const target = context.graph.getNode(targetId);
		if (!target || !isDescendantOf(context, targetId, instance.id)) continue;
		const sourceId = target.componentId;
		if (!sourceId) continue;
		const source = context.graph.getNode(sourceId);
		const targetGuid = (source?.overrideKey ? parseGuidOrNull(source.overrideKey) : null) ?? getOrCreateNodeGuid(context, sourceId, localIdCounter);
		if (!targetGuid) continue;
		result.push({
			guidPath: { guids: [targetGuid] },
			textData: { characters: value }
		});
	}
	return result;
}
function overridePathKey(payload) {
	const guids = payload.guidPath?.guids;
	return guids?.length ? guids.map(({ sessionID, localID }) => `${sessionID}:${localID}`).join("/") : null;
}
function mergeTextOverrides(symbolOverrides, textOverrides) {
	for (const textOverride of textOverrides) {
		const pathKey = overridePathKey(textOverride);
		let existingIndex = -1;
		if (pathKey) for (let index = symbolOverrides.length - 1; index >= 0; index--) {
			if (overridePathKey(symbolOverrides[index]) !== pathKey) continue;
			existingIndex = index;
			break;
		}
		if (existingIndex < 0) symbolOverrides.push(textOverride);
		else symbolOverrides[existingIndex] = {
			...symbolOverrides[existingIndex],
			textData: textOverride.textData
		};
	}
}
/**
* Fields that are ALWAYS set by explicit serialization and must NOT be
* overwritten by rawNodeFields (which may contain stale Figma defaults).
* rawNodeFields is a fallback for fields NOT covered by the explicit path.
*
* Additionally, applyRawFigmaNodeFields skips any key already present on `nc`,
* so conditionally-set fields (fontVariations, derivedTextData, strokeJoin,
* strokeWeight, miterLimit, etc.) are automatically protected when set.
*
* NOTE: fillGeometry, strokeGeometry, and vectorData are deliberately NOT
* listed here. When nodeForGeometryExport suppresses explicit serialization
* (because raw geometry exists), rawNodeFields must supply these fields.
*/
const RAW_FIELDS_OVERRIDE_BLOCKLIST = /* @__PURE__ */ new Set([
	"pageType",
	"derivedSymbolData",
	"derivedSymbolDataLayoutVersion",
	"sourceLibraryKey",
	"minSize",
	"maxSize",
	"variableConsumptionMap",
	"parameterConsumptionMap"
]);
function applyRawFigmaNodeFields(context, node, nc) {
	const materialized = materializeFigmaPayload(effectiveFigmaRawNodeFields(node), context.blobs, {
		blobIndexByHex: context.blobIndexByHex,
		includePaintVariables: true,
		includeVariableMaps: true
	});
	for (const key of Object.keys(materialized)) {
		if (RAW_FIELDS_OVERRIDE_BLOCKLIST.has(String(key))) continue;
		if ((key === "fillPaints" || key === "strokePaints") && node.source.id) {
			nc[key] = materialized[key];
			continue;
		}
		if (key === "effects" && node.source.id && context.assetRefToVarGuid && context.assetRefToVarGuid.size > 0) {
			nc[key] = convertColorVarAssetRefs(materialized[key], context.assetRefToVarGuid);
			continue;
		}
		if (key === "derivedTextData" && node.source.id) {
			nc.derivedTextData = materialized.derivedTextData;
			continue;
		}
		if (key === "textDecorationFillPaints" && node.source.id) {
			nc.textDecorationFillPaints = materialized.textDecorationFillPaints;
			continue;
		}
		if (key in nc) continue;
		nc[key] = materialized[key];
	}
}
/** Convert asset refs only for payloads whose Kiwi schema rejects asset-ref aliases. */
function convertColorVarAssetRefs(values, assetRefToVarGuid) {
	if (!Array.isArray(values)) return values;
	const converted = values.map((value) => {
		const colorVar = value.colorVar;
		const alias = colorVar?.value?.alias;
		if (!colorVar || !alias || alias.guid || !alias.assetRef?.key) return value;
		const assetRef = alias.assetRef;
		const lookupKey = assetRef.version ? `${assetRef.key}@${assetRef.version}` : assetRef.key;
		const guid = assetRefToVarGuid.get(lookupKey) ?? assetRefToVarGuid.get(assetRef.key);
		if (!guid) return value;
		return {
			...value,
			colorVar: {
				...colorVar,
				value: {
					...colorVar.value,
					alias: { guid }
				}
			}
		};
	});
	return converted.some((value, index) => value !== values[index]) ? converted : values;
}
function applyInstancePayload(context, node, nc, localIdCounter) {
	if (node.type !== "INSTANCE" || !node.componentId) return;
	const symbolID = getOrCreateNodeGuid(context, resolveInstanceComponentId(context, node.componentId), localIdCounter);
	if (symbolID) {
		const symbolData = { symbolID };
		const symbolOverrides = [];
		if (node.source.fig.symbolOverrides.length > 0) symbolOverrides.push(...materializeFigmaPayload(node.source.fig.symbolOverrides, context.blobs, {
			blobIndexByHex: context.blobIndexByHex,
			includePaintVariables: true,
			includeVariableMaps: true
		}));
		mergeTextOverrides(symbolOverrides, serializeTextOverrides(context, node, localIdCounter));
		if (symbolOverrides.length > 0) symbolData.symbolOverrides = symbolOverrides;
		if (node.source.fig.uniformScaleFactor != null) symbolData.uniformScaleFactor = node.source.fig.uniformScaleFactor;
		nc.symbolData = symbolData;
	}
	if (node.source.fig.componentPropAssignments.length > 0) nc.componentPropAssignments = materializeFigmaPayload(node.source.fig.componentPropAssignments, context.blobs, {
		blobIndexByHex: context.blobIndexByHex,
		includePaintVariables: true,
		includeVariableMaps: true
	});
	if (node.source.fig.derivedSymbolData.length > 0) nc.derivedSymbolData = materializeFigmaPayload(node.source.fig.derivedSymbolData, context.blobs, {
		blobIndexByHex: context.blobIndexByHex,
		includePaintVariables: true,
		includeVariableMaps: true
	});
	if (node.source.fig.derivedSymbolDataLayoutVersion != null) nc.derivedSymbolDataLayoutVersion = node.source.fig.derivedSymbolDataLayoutVersion;
}
function componentPropertyPreferredValues(definition) {
	if (definition.type === "INSTANCE_SWAP" && definition.preferredValues?.length) return { instanceSwapValues: definition.preferredValues.map((key) => ({
		type: "COMPONENT",
		key
	})) };
	if (definition.type === "VARIANT" && definition.variantOptions?.length) return { stringValues: [...definition.variantOptions] };
}
function componentPropertyNodeField(field) {
	if (field === "TEXT") return "TEXT_DATA";
	if (field === "INSTANCE_SWAP") return "OVERRIDDEN_SYMBOL_ID";
	return "VISIBLE";
}
function buildComponentPropIndex(graph) {
	const definitions = /* @__PURE__ */ new Map();
	for (const candidate of graph.getAllNodes()) for (const definition of candidate.componentPropertyDefinitions) if (!definitions.has(definition.id)) definitions.set(definition.id, definition);
	return definitions;
}
function shouldSerializeRawBackedField(node, rawField, hasValue, alreadySerialized = false) {
	return hasValue && !(rawField in effectiveFigmaRawNodeFields(node)) && !alreadySerialized;
}
function applyComponentMetadata(context, node, nc) {
	if (node.componentKey) nc.componentKey = node.componentKey;
	if (node.sourceLibraryKey) nc.sourceLibraryKey = node.sourceLibraryKey;
	const publishId = node.publishId ? parseGuidOrNull(node.publishId) : null;
	const overrideKey = node.overrideKey ? parseGuidOrNull(node.overrideKey) : null;
	if (publishId) nc.publishID = publishId;
	if (overrideKey) nc.overrideKey = overrideKey;
	if (node.sharedSymbolVersion) nc.sharedSymbolVersion = node.sharedSymbolVersion;
	if (node.publishedVersion) nc.publishedVersion = node.publishedVersion;
	if (node.type === "COMPONENT_SET" || node.isPublishable) nc.isPublishable = node.isPublishable;
	if (node.type === "COMPONENT" || node.isSymbolPublishable) nc.isSymbolPublishable = node.isSymbolPublishable;
	if (node.symbolDescription) nc.symbolDescription = node.symbolDescription;
	if (node.symbolLinks.length > 0) nc.symbolLinks = structuredClone(node.symbolLinks);
	const componentPropDefs = node.componentPropertyDefinitions.map((def) => {
		const id = parseGuidOrNull(def.id);
		return id ? {
			id,
			name: def.name,
			type: componentPropertyTypeForKiwi(def.type),
			initialValue: componentPropertyValue(def.type, def.defaultValue, context.graph),
			preferredValues: componentPropertyPreferredValues(def)
		} : null;
	}).filter((def) => def !== null);
	if (shouldSerializeRawBackedField(node, "componentPropDefs", componentPropDefs.length > 0)) nc.componentPropDefs = componentPropDefs;
	const componentPropRefs = node.componentPropertyReferences.map((ref) => {
		const defID = parseGuidOrNull(ref.propertyId);
		if (!defID) return null;
		return {
			defID,
			componentPropNodeField: componentPropertyNodeField(ref.field)
		};
	}).filter((ref) => ref !== null);
	if (shouldSerializeRawBackedField(node, "componentPropRefs", componentPropRefs.length > 0)) nc.componentPropRefs = componentPropRefs;
	const componentPropAssignments = Object.entries(node.componentPropertyAssignments).map(([propertyId, value]) => {
		const defID = parseGuidOrNull(propertyId);
		const definition = context.componentPropertyDefinitionsById.get(propertyId);
		return defID && definition ? {
			defID,
			value: componentPropertyValue(definition.type, value, context.graph)
		} : null;
	}).filter((assignment) => assignment !== null);
	if (shouldSerializeRawBackedField(node, "componentPropAssignments", componentPropAssignments.length > 0, Boolean(nc.componentPropAssignments))) nc.componentPropAssignments = componentPropAssignments;
	const variantPropSpecs = node.variantPropSpecs.map((spec) => {
		const propDefId = parseGuidOrNull(spec.propDefId);
		return propDefId ? {
			propDefId,
			value: spec.value
		} : null;
	}).filter((spec) => spec !== null);
	if (shouldSerializeRawBackedField(node, "variantPropSpecs", variantPropSpecs.length > 0)) nc.variantPropSpecs = variantPropSpecs;
}
function exportNodeSize(node) {
	const rawSize = effectiveFigmaSourcePayload(node).rawSize;
	return rawSize ? { ...rawSize } : {
		x: node.width,
		y: node.height
	};
}
function exportNodeTransform(context, node) {
	const rawTransform = effectiveFigmaSourcePayload(node).rawTransform;
	return rawTransform ? { ...rawTransform } : context.computeExportTransform(node);
}
function hasRawGeometryPayload(node) {
	const rawNodeFields = effectiveFigmaRawNodeFields(node);
	return "fillGeometry" in rawNodeFields || "strokeGeometry" in rawNodeFields;
}
function hasRawVectorPayload(node) {
	return "vectorData" in effectiveFigmaRawNodeFields(node);
}
const SUPPORTED_NORMALIZED_EFFECT_TYPES = /* @__PURE__ */ new Set([
	"DROP_SHADOW",
	"INNER_SHADOW",
	"LAYER_BLUR",
	"BACKGROUND_BLUR",
	"FOREGROUND_BLUR"
]);
function hasRawUnsupportedEffects(node) {
	const effects = effectiveFigmaRawNodeFields(node).effects;
	return Array.isArray(effects) && effects.some((effect) => effect && typeof effect === "object" && "type" in effect && !SUPPORTED_NORMALIZED_EFFECT_TYPES.has(String(effect.type)));
}
function nodeForGeometryExport(node) {
	if (!hasRawGeometryPayload(node) && !hasRawVectorPayload(node)) return node;
	return {
		...node,
		fillGeometry: hasRawGeometryPayload(node) ? [] : node.fillGeometry,
		strokeGeometry: hasRawGeometryPayload(node) ? [] : node.strokeGeometry,
		vectorNetwork: hasRawVectorPayload(node) ? null : node.vectorNetwork
	};
}
function applySharedStyleProps(node, nc) {
	if (node.fillStyleId) nc.styleIdForFill = { guid: stringToGuid(node.fillStyleId) };
	if (node.strokeStyleId) nc.styleIdForStrokeFill = { guid: stringToGuid(node.strokeStyleId) };
	if (node.textStyleId) nc.styleIdForText = { guid: stringToGuid(node.textStyleId) };
	if (node.effectStyleId) nc.styleIdForEffect = { guid: stringToGuid(node.effectStyleId) };
	if (node.gridStyleId) nc.styleIdForGrid = { guid: stringToGuid(node.gridStyleId) };
	if (node.layoutGrids.length > 0) nc.layoutGrids = structuredClone(node.layoutGrids);
}
function applyNodeVisualProps(context, node, nc) {
	if (node.independentStrokeWeights) {
		nc.borderStrokeWeightsIndependent = true;
		nc.borderTopWeight = node.borderTopWeight;
		nc.borderRightWeight = node.borderRightWeight;
		nc.borderBottomWeight = node.borderBottomWeight;
		nc.borderLeftWeight = node.borderLeftWeight;
	}
	if (node.fills.length > 0) nc.fillPaints = node.fills.map((fill, index) => applyColorVariableBinding(context, node, context.fillToKiwiPaint(fill), `fills/${index}/color`));
	context.serializeCornerRadii(node, nc);
	if (node.effects.length > 0 && !hasRawUnsupportedEffects(node)) nc.effects = node.effects.map((effect) => ({
		type: effect.type === "LAYER_BLUR" ? "FOREGROUND_BLUR" : effect.type,
		color: context.safeColor(effect.color),
		offset: effect.offset,
		radius: effect.radius,
		spread: effect.spread,
		visible: effect.visible,
		blendMode: effect.blendMode ?? "NORMAL",
		showShadowBehindNode: effect.showShadowBehindNode
	}));
	if (node.type === "TEXT") context.serializeTextProps(node, nc, context.graph, context.fontDigestMap, context.blobs, context.glyphBlobMap);
	if (node.type !== "VECTOR") nc.frameMaskDisabled = !node.clipsContent;
	applySharedStyleProps(node, nc);
	if (node.horizontalConstraint !== "MIN") nc.horizontalConstraint = node.horizontalConstraint;
	if (node.verticalConstraint !== "MIN") nc.verticalConstraint = node.verticalConstraint;
	if (node.strokeCap !== "NONE") nc.strokeCap = node.strokeCap;
	const rawNodeFields = effectiveFigmaRawNodeFields(node);
	if (node.strokeJoin !== "MITER" || "strokeJoin" in rawNodeFields) nc.strokeJoin = node.strokeJoin;
	if (node.strokeMiterLimit !== DEFAULT_STROKE_MITER_LIMIT || "miterLimit" in rawNodeFields) nc.miterLimit = node.strokeMiterLimit;
	if (node.dashPattern.length > 0) nc.dashPattern = node.dashPattern;
	if (node.arcData) nc.arcData = {
		startingAngle: node.arcData.startingAngle,
		endingAngle: node.arcData.endingAngle,
		innerRadius: node.arcData.innerRadius
	};
	if (!node.autoRename) nc.autoRename = false;
}
function sceneNodeToKiwiWithContext(node, parentGuid, childIndex, localIdCounter, context) {
	const guid = getOrCreateNodeGuid(context, node.id, localIdCounter) ?? {
		sessionID: 1,
		localID: localIdCounter.value++
	};
	const strokePaints = createStrokePaints(context, node);
	const nc = {
		guid,
		parentIndex: {
			guid: parentGuid,
			position: node.source.orderKey ?? context.fractionalPosition(childIndex)
		},
		type: context.mapToFigmaType(node.type),
		name: node.name,
		visible: node.visible,
		opacity: node.opacity,
		phase: "CREATED",
		size: exportNodeSize(node),
		transform: exportNodeTransform(context, node)
	};
	if (node.sharedStyleType) nc.styleType = node.sharedStyleType;
	if (node.type === "GROUP") nc.resizeToFit = true;
	if (node.strokes.length > 0) {
		nc.strokeWeight = node.strokes[0].weight;
		nc.strokeAlign = node.strokes[0].align;
	}
	if (node.locked) nc.locked = true;
	applyNodeVisualProps(context, node, nc);
	applyComponentMetadata(context, node, nc);
	applyInstancePayload(context, node, nc, localIdCounter);
	if (node.type === "COMPONENT_SET") upsertPluginData(node, NODE_TYPE_PLUGIN_KEY, node.type);
	if (nc.type === "CANVAS") nc.pageType = "DESIGN";
	if (node.type === "BOOLEAN_OPERATION") nc.booleanOperation = toKiwiBooleanOperation(node.booleanOperation);
	if (strokePaints.length > 0) nc.strokePaints = strokePaints;
	context.serializeLayoutProps(node, nc);
	context.serializeGeometry(nodeForGeometryExport(node), nc, context.blobs);
	context.serializeVariableBindings(node, nc, context.graph, context.varIdToGuid);
	applyRawFigmaNodeFields(context, node, nc);
	const variableModeBySetMap = serializeVariableModes(node, context.varIdToGuid, context.modeIdToGuid);
	if (variableModeBySetMap) nc.variableModeBySetMap = variableModeBySetMap;
	applyExportSettingsPluginData(node);
	const pluginData = mergePluginData(node.pluginData);
	if (pluginData.length > 0) nc.pluginData = pluginData;
	if (node.pluginRelaunchData.length > 0) nc.pluginRelaunchData = serializePluginRelaunchData(node.pluginRelaunchData);
	const result = [nc];
	const children = node.type === "INSTANCE" ? [] : context.graph.getChildren(node.id).filter((child) => !child.internalOnly);
	for (let i = 0; i < children.length; i++) result.push(...context.sceneNodeToKiwi(children[i], guid, i, localIdCounter, context));
	return result;
}
//#endregion
//#region src/node-change/export-runtime.ts
const EMPTY_EXPORT_RUNTIME = { getGlyphOutlineMetrics: () => null };
//#endregion
//#region src/node-change/font/style.ts
function weightToFigmaStyle(weight, italic = false) {
	const label = FONT_WEIGHT_NAMES[Math.round(weight / 100) * 100] ?? "Regular";
	return italic ? `${label} Italic` : label;
}
//#endregion
//#region src/node-change/path-commands.ts
const CMD_CLOSE = 0;
const CMD_MOVE_TO = 1;
const CMD_LINE_TO = 2;
const CMD_CUBIC_TO = 4;
function encodePathCommandsBlob(commands, scale = 1) {
	const bytes = [];
	const pushFloat = (value) => {
		const buf = /* @__PURE__ */ new ArrayBuffer(4);
		new DataView(buf).setFloat32(0, (value ?? 0) / scale, true);
		bytes.push(...new Uint8Array(buf));
	};
	const negY = (v) => v === void 0 ? void 0 : -v;
	let curX = 0;
	let curY = 0;
	for (const command of commands) switch (command.type) {
		case "M":
			bytes.push(CMD_MOVE_TO);
			pushFloat(command.x);
			pushFloat(negY(command.y));
			curX = command.x ?? 0;
			curY = command.y ?? 0;
			break;
		case "L":
			bytes.push(CMD_LINE_TO);
			pushFloat(command.x);
			pushFloat(negY(command.y));
			curX = command.x ?? 0;
			curY = command.y ?? 0;
			break;
		case "C":
			bytes.push(CMD_CUBIC_TO);
			pushFloat(command.x1);
			pushFloat(negY(command.y1));
			pushFloat(command.x2);
			pushFloat(negY(command.y2));
			pushFloat(command.x);
			pushFloat(negY(command.y));
			curX = command.x ?? 0;
			curY = command.y ?? 0;
			break;
		case "Q": {
			const qx1 = command.x1 ?? 0;
			const qy1 = command.y1 ?? 0;
			const qx = command.x ?? 0;
			const qy = command.y ?? 0;
			bytes.push(CMD_CUBIC_TO);
			pushFloat(curX + 2 / 3 * (qx1 - curX));
			pushFloat(negY(curY + 2 / 3 * (qy1 - curY)));
			pushFloat(qx + 2 / 3 * (qx1 - qx));
			pushFloat(negY(qy + 2 / 3 * (qy1 - qy)));
			pushFloat(qx);
			pushFloat(negY(qy));
			curX = qx;
			curY = qy;
			break;
		}
		case "Z":
			bytes.push(CMD_CLOSE);
			break;
	}
	return new Uint8Array(bytes);
}
//#endregion
//#region src/node-change/text-data-export.ts
function fontVariationToKiwi(variation) {
	const axisTag = stringToFigmaAxisTag(variation.axis);
	return axisTag === void 0 ? {
		axisName: variation.axis,
		value: variation.value
	} : {
		axisTag,
		axisName: variation.axis,
		value: variation.value
	};
}
function applyTextDecorationOverrideFields(override, style, fillToKiwiPaint) {
	if (style.textDecoration) override.textDecoration = style.textDecoration;
	if (style.textDecorationStyle) override.textDecorationStyle = style.textDecorationStyle;
	if (style.textDecorationThickness != null) override.textDecorationThickness = {
		value: style.textDecorationThickness,
		units: "PIXELS"
	};
	if (style.textDecorationSkipInk !== void 0) override.textDecorationSkipInk = style.textDecorationSkipInk;
	if (style.textUnderlineOffset != null) override.textUnderlineOffset = {
		value: style.textUnderlineOffset,
		units: "PIXELS"
	};
	if (style.textDecorationFills && style.textDecorationFills.length > 0) override.textDecorationFillPaints = style.textDecorationFills.map(fillToKiwiPaint);
}
function textStyleOverrideToKiwi(id, style, node, fillToKiwiPaint) {
	const override = { styleID: id };
	const weight = style.fontWeight ?? node.fontWeight;
	const italic = style.italic ?? node.italic;
	override.fontName = {
		family: normalizeFontFamily(style.fontFamily ?? node.fontFamily),
		style: weightToFigmaStyle(weight, italic),
		postscript: ""
	};
	if (style.fontSize !== void 0) override.fontSize = style.fontSize;
	if (style.fontVariations && style.fontVariations.length > 0) override.fontVariations = style.fontVariations.map(fontVariationToKiwi);
	if (style.fontFeatures && style.fontFeatures.length > 0) applyFontFeaturesToKiwi(override, style.fontFeatures);
	if (style.letterSpacing !== void 0) override.letterSpacing = {
		value: style.letterSpacing,
		units: "PIXELS"
	};
	if (style.lineHeight !== void 0 && style.lineHeight !== null) override.lineHeight = {
		value: style.lineHeight,
		units: "PIXELS"
	};
	applyTextDecorationOverrideFields(override, style, fillToKiwiPaint);
	if (style.fills && style.fills.length > 0) override.fillPaints = style.fills.map(fillToKiwiPaint);
	return override;
}
function collectTextStyleOverrides(node) {
	const charIds = Array.from({ length: node.text.length }).fill(0);
	const styleMap = /* @__PURE__ */ new Map();
	let nextId = 1;
	for (const run of node.styleRuns) {
		const key = JSON.stringify(run.style);
		let entry = styleMap.get(key);
		if (!entry) {
			entry = {
				id: nextId++,
				style: run.style
			};
			styleMap.set(key, entry);
		}
		for (let i = run.start; i < run.start + run.length && i < charIds.length; i++) charIds[i] = entry.id;
	}
	return {
		charIds,
		styleMap
	};
}
function exportTextData(node, textLines, fillToKiwiPaint) {
	if (node.styleRuns.length === 0) return {
		characters: node.text,
		lines: textLines(node.text)
	};
	const { charIds, styleMap } = collectTextStyleOverrides(node);
	const overrideTable = [...styleMap.values()].map(({ id, style }) => textStyleOverrideToKiwi(id, style, node, fillToKiwiPaint));
	return {
		characters: node.text,
		lines: textLines(node.text),
		characterStyleIDs: charIds,
		styleOverrideTable: overrideTable
	};
}
//#endregion
//#region src/node-change/serialize.ts
function textLines(text) {
	const lineCount = Math.max(1, text.split("\n").length);
	return Array.from({ length: lineCount }, () => ({ lineType: "PLAIN" }));
}
function appendGlyphBlob(blobs, glyphBlobMap, blob) {
	const key = bytesToHex(blob);
	const existing = glyphBlobMap.get(key);
	if (existing !== void 0) return existing;
	const index = blobs.push(blob) - 1;
	glyphBlobMap.set(key, index);
	return index;
}
function buildDerivedTextData(node, digestMap, blobs, glyphBlobMap, runtime) {
	const fontMeta = [];
	const seen = /* @__PURE__ */ new Set();
	const addFont = (family, weight, italic) => {
		const style = weightToStyle(weight, italic);
		const normalized = normalizeFontFamily(family);
		const key = `${normalized}|${style}`;
		if (seen.has(key)) return;
		seen.add(key);
		fontMeta.push({
			key: {
				family: normalized,
				style: weightToFigmaStyle(weight, italic),
				postscript: ""
			},
			fontLineHeight: 1.2,
			fontDigest: digestMap.get(key),
			fontStyle: italic ? "ITALIC" : "NORMAL",
			fontWeight: weight
		});
	};
	addFont(node.fontFamily, node.fontWeight, node.italic);
	for (const run of node.styleRuns) addFont(run.style.fontFamily ?? node.fontFamily, run.style.fontWeight ?? node.fontWeight, run.style.italic ?? node.italic);
	const lineHeight = node.lineHeight ?? Math.ceil(node.fontSize * 1.2);
	const glyphAdvance = node.text.length > 0 ? node.width / Math.max(node.text.length, 1) : 0;
	const derivedGlyphs = node.figmaDerivedTextGlyphs ?? [];
	const glyphs = derivedGlyphs.length > 0 ? derivedGlyphs.map((glyph, index) => ({
		commandsBlob: appendGlyphBlob(blobs, glyphBlobMap, glyph.commandsBlob),
		position: {
			x: glyph.x,
			y: glyph.y
		},
		fontSize: glyph.fontSize,
		firstCharacter: index,
		advance: index + 1 < derivedGlyphs.length ? Math.max(derivedGlyphs[index + 1].x - glyph.x, 0) : glyphAdvance,
		rotation: 0
	})) : (runtime.getGlyphOutlineMetrics(node.fontFamily, weightToStyle(node.fontWeight, node.italic), node.text, node.fontSize) ?? []).map((glyph, index) => ({
		commandsBlob: appendGlyphBlob(blobs, glyphBlobMap, encodePathCommandsBlob(glyph.commands, node.fontSize)),
		position: {
			x: glyph.x || index * glyphAdvance,
			y: lineHeight
		},
		fontSize: node.fontSize,
		firstCharacter: index,
		advance: glyph.advance || glyphAdvance,
		rotation: 0
	}));
	const logicalIndexToCharacterOffsetMap = Array.from({ length: node.text.length + 1 }, (_, index) => index * glyphAdvance);
	return buildDerivedTextData$1({
		node,
		glyphs,
		fontMetaData: fontMeta,
		baseline: lineHeight,
		width: node.width,
		lineHeight,
		lineAscent: Math.max(lineHeight - node.fontSize * .2, 0),
		logicalIndexToCharacterOffsetMap
	});
}
function serializeCornerRadii(node, nc) {
	const anyIndividual = node.topLeftRadius > 0 || node.topRightRadius > 0 || node.bottomLeftRadius > 0 || node.bottomRightRadius > 0;
	if (node.cornerRadius > 0) nc.cornerRadius = node.cornerRadius;
	if (anyIndividual || node.independentCorners) {
		const rawIndependent = node.source.id ? effectiveFigmaRawNodeFields(node)?.rectangleCornerRadiiIndependent : void 0;
		nc.rectangleCornerRadiiIndependent = typeof rawIndependent === "boolean" ? rawIndependent : node.independentCorners;
		nc.rectangleTopLeftCornerRadius = node.topLeftRadius;
		nc.rectangleTopRightCornerRadius = node.topRightRadius;
		nc.rectangleBottomLeftCornerRadius = node.bottomLeftRadius;
		nc.rectangleBottomRightCornerRadius = node.bottomRightRadius;
	}
	if (node.cornerSmoothing > 0 || "cornerSmoothing" in effectiveFigmaRawNodeFields(node)) nc.cornerSmoothing = node.cornerSmoothing;
}
function resolveTextAutoResize(node, graph) {
	if (node.source.id) return node.textAutoResize;
	const parent = node.parentId ? graph.getNode(node.parentId) : void 0;
	if (parent && parent.layoutMode !== "NONE" && parent.layoutMode !== "GRID" && node.layoutPositioning !== "ABSOLUTE") return "HEIGHT";
	return node.textAutoResize;
}
function serializeTextProps(node, nc, graph, fontDigestMap, blobs, glyphBlobMap, runtime) {
	upsertPluginData(node, TEXT_DIRECTION_PLUGIN_KEY, node.textDirection);
	nc.fontSize = node.fontSize;
	nc.fontName = {
		family: normalizeFontFamily(node.fontFamily),
		style: weightToFigmaStyle(node.fontWeight, node.italic),
		postscript: ""
	};
	nc.textData = exportTextData(node, textLines, fillToKiwiPaint);
	if (node.fontVariations.length > 0) nc.fontVariations = node.fontVariations.map(fontVariationToKiwi);
	nc.textAutoResize = resolveTextAutoResize(node, graph);
	nc.textAlignHorizontal = node.textAlignHorizontal;
	nc.textAlignVertical = node.textAlignVertical;
	nc.textUserLayoutVersion = 4;
	nc.textExplicitLayoutVersion = 1;
	nc.textBidiVersion = 1;
	nc.textDecorationSkipInk = node.textDecorationSkipInk;
	nc.fontVariantCommonLigatures = true;
	nc.fontVariantContextualLigatures = true;
	applyFontFeaturesToKiwi(nc, node.fontFeatures);
	nc.fontVersion = "";
	nc.emojiImageSet = "APPLE";
	if (node.textCase !== "ORIGINAL") nc.textCase = node.textCase;
	if (node.textTruncation === "ENDING") nc.textTruncation = "ENDING";
	if (node.maxLines != null) nc.maxLines = node.maxLines;
	if (fontDigestMap) nc.derivedTextData = buildDerivedTextData(node, fontDigestMap, blobs, glyphBlobMap ?? /* @__PURE__ */ new Map(), runtime);
	if (node.leadingTrim !== "NONE") nc.leadingTrim = node.leadingTrim;
	if (node.lineHeight != null) nc.lineHeight = {
		value: node.lineHeight,
		units: "PIXELS"
	};
	nc.letterSpacing = {
		value: node.letterSpacing,
		units: "PIXELS"
	};
	if (node.textDecoration !== "NONE") nc.textDecoration = node.textDecoration === "UNDERLINE" ? "UNDERLINE" : "STRIKETHROUGH";
	if (node.textDecorationStyle !== "SOLID") nc.textDecorationStyle = node.textDecorationStyle;
	if (node.textDecorationThickness != null) nc.textDecorationThickness = {
		value: node.textDecorationThickness,
		units: "PIXELS"
	};
	if (node.textUnderlineOffset != null) nc.textUnderlineOffset = {
		value: node.textUnderlineOffset,
		units: "PIXELS"
	};
	if (node.textDecorationFills.length > 0) nc.textDecorationFillPaints = node.textDecorationFills.map(fillToKiwiPaint);
}
function normalizeStackMode(value) {
	return value === "HORIZONTAL" || value === "VERTICAL" || value === "NONE" ? value : void 0;
}
function normalizeStackSizing(value) {
	return value === "FIXED" || value === "RESIZE_TO_FIT" || value === "RESIZE_TO_FIT_WITH_IMPLICIT_SIZE" ? value : void 0;
}
function normalizeStackJustify(value) {
	return value === "SPACE_EVENLY" ? "SPACE_BETWEEN" : value;
}
function normalizeStackCounterAlign(value) {
	return value === "SPACE_EVENLY" ? "SPACE_BETWEEN" : value;
}
function normalizeStackCounterAlignItems(value) {
	const normalized = normalizeStackCounterAlign(value);
	return normalized === "STRETCH" ? "MIN" : normalized;
}
function serializeInheritedCounterAxisStretch(node, nc, graph) {
	if (!node.parentId || node.layoutAlignSelf !== "AUTO" || node.layoutPositioning === "ABSOLUTE") return;
	const parent = graph.getNode(node.parentId);
	if (parent?.counterAxisAlign === "STRETCH" && (parent.layoutMode === "HORIZONTAL" || parent.layoutMode === "VERTICAL")) nc.stackChildAlignSelf = "STRETCH";
}
function preserveTrailingPadding(explicitValue, leadingValue, baseValue, normalizedValue) {
	if (explicitValue !== void 0) return explicitValue;
	return normalizedValue !== (leadingValue ?? baseValue ?? normalizedValue) ? normalizedValue : void 0;
}
function serializeSizeConstraints(node, nc) {
	if (node.minWidth != null || node.minHeight != null) nc.minSize = { value: {
		x: node.minWidth ?? 0,
		y: node.minHeight ?? 0
	} };
	if (node.maxWidth != null || node.maxHeight != null) nc.maxSize = { value: {
		x: node.maxWidth ?? Number.POSITIVE_INFINITY,
		y: node.maxHeight ?? Number.POSITIVE_INFINITY
	} };
}
function serializeLayoutProps(node, nc, graph) {
	if (!node.source.id) upsertPluginData(node, LAYOUT_DIRECTION_PLUGIN_KEY, node.layoutDirection);
	serializeSizeConstraints(node, nc);
	const figLayout = node.source.fig.layout;
	if (figLayout) {
		nc.stackMode = normalizeStackMode(figLayout.stackMode);
		nc.stackSpacing = figLayout.stackSpacing;
		nc.stackPadding = figLayout.stackPadding;
		nc.stackPaddingRight = preserveTrailingPadding(figLayout.stackPaddingRight, figLayout.stackHorizontalPadding, figLayout.stackPadding, node.paddingRight);
		nc.stackPaddingBottom = preserveTrailingPadding(figLayout.stackPaddingBottom, figLayout.stackVerticalPadding, figLayout.stackPadding, node.paddingBottom);
		nc.stackCounterAlign = normalizeStackCounterAlign(figLayout.stackCounterAlign);
		nc.stackJustify = normalizeStackJustify(figLayout.stackJustify);
		nc.stackCounterAlignItems = normalizeStackCounterAlignItems(figLayout.stackCounterAlignItems);
		nc.stackPrimaryAlignItems = normalizeStackJustify(figLayout.stackPrimaryAlignItems);
		const stackPrimarySizing = normalizeStackSizing(figLayout.stackPrimarySizing);
		if (stackPrimarySizing) nc.stackPrimarySizing = stackPrimarySizing;
		const stackCounterSizing = normalizeStackSizing(figLayout.stackCounterSizing);
		if (stackCounterSizing) nc.stackCounterSizing = stackCounterSizing;
		nc.stackVerticalPadding = figLayout.stackVerticalPadding;
		nc.stackHorizontalPadding = figLayout.stackHorizontalPadding;
		nc.stackWrap = figLayout.stackWrap;
		nc.stackPositioning = figLayout.stackPositioning;
		nc.stackChildPrimaryGrow = figLayout.stackChildPrimaryGrow;
		nc.stackChildAlignSelf = figLayout.stackChildAlignSelf;
		nc.stackCounterSpacing = figLayout.stackCounterSpacing;
		nc.bordersTakeSpace = figLayout.bordersTakeSpace;
		if (figLayout.stackReverseZIndex) nc.stackReverseZIndex = true;
		serializeInheritedCounterAxisStretch(node, nc, graph);
		return;
	}
	if (node.layoutMode !== "NONE" && node.layoutMode !== "GRID") {
		nc.stackMode = node.layoutMode;
		nc.stackSpacing = node.itemSpacing;
		nc.stackVerticalPadding = node.paddingTop;
		nc.stackHorizontalPadding = node.paddingLeft;
		nc.stackPaddingBottom = node.paddingBottom;
		nc.stackPaddingRight = node.paddingRight;
		nc.stackPrimarySizing = node.primaryAxisSizing === "HUG" ? "RESIZE_TO_FIT" : "FIXED";
		nc.stackCounterSizing = node.counterAxisSizing === "HUG" ? "RESIZE_TO_FIT" : "FIXED";
		nc.stackPrimaryAlignItems = normalizeStackJustify(node.primaryAxisAlign);
		nc.stackCounterAlignItems = normalizeStackCounterAlignItems(node.counterAxisAlign);
		if (node.layoutWrap === "WRAP") nc.stackWrap = "WRAP";
		if (node.counterAxisSpacing > 0) nc.stackCounterSpacing = node.counterAxisSpacing;
		nc.bordersTakeSpace = node.strokesIncludedInLayout;
	}
	if (node.itemReverseZIndex) nc.stackReverseZIndex = true;
	if (node.layoutPositioning === "ABSOLUTE") nc.stackPositioning = "ABSOLUTE";
	if (node.layoutGrow > 0) nc.stackChildPrimaryGrow = node.layoutGrow;
	if (node.layoutAlignSelf !== "AUTO") nc.stackChildAlignSelf = node.layoutAlignSelf;
	else serializeInheritedCounterAxisStretch(node, nc, graph);
}
function serializeGeometry(node, nc, blobs) {
	if (node.isMask) {
		nc.mask = true;
		nc.maskType = node.maskType;
		if (node.maskIsOutline) nc.maskIsOutline = true;
	}
	let styleOverrides = [];
	const vectorData = {};
	if (node.vectorNetwork && node.type === "VECTOR") {
		const { table, mirroringToId } = buildStyleOverrideTable(node.vectorNetwork);
		styleOverrides = table;
		const blobIdx = blobs.length;
		blobs.push(encodeVectorNetworkBlob(node.vectorNetwork, mirroringToId));
		vectorData.vectorNetworkBlob = blobIdx;
		vectorData.normalizedSize = {
			x: node.width,
			y: node.height
		};
	}
	if (node.fillGeometry.length > 0) nc.fillGeometry = node.fillGeometry.map((geometry) => {
		const blobIdx = blobs.length;
		blobs.push(geometry.commandsBlob);
		if (!geometry.fills || geometry.fills.length === 0) return {
			windingRule: geometry.windingRule,
			commandsBlob: blobIdx
		};
		const styleID = styleOverrides.length + 1;
		styleOverrides.push({
			styleID,
			fillPaints: geometry.fills.map(fillToKiwiPaint)
		});
		return {
			windingRule: geometry.windingRule,
			commandsBlob: blobIdx,
			styleID
		};
	});
	if (styleOverrides.length > 0) vectorData.styleOverrideTable = styleOverrides;
	if (Object.keys(vectorData).length > 0) nc.vectorData = vectorData;
	if (node.strokeGeometry.length > 0) nc.strokeGeometry = node.strokeGeometry.map((g) => {
		const blobIdx = blobs.length;
		blobs.push(g.commandsBlob);
		return {
			windingRule: g.windingRule,
			commandsBlob: blobIdx
		};
	});
}
function serializeVariableBindings(node, nc, graph, varIdToGuid) {
	if (Object.keys(node.boundVariables).length === 0) return;
	const entries = [];
	const roundtripBindings = {};
	const typeMap = {
		COLOR: "COLOR",
		BOOLEAN: "BOOLEAN",
		STRING: "STRING"
	};
	for (const [field, varId] of Object.entries(node.boundVariables)) {
		const variable = graph.variables.get(varId);
		if (!variable) continue;
		const varGuid = varIdToGuid?.get(varId) ?? stringToGuid(varId);
		roundtripBindings[field] = guidToString(varGuid);
		const kiwiField = VARIABLE_BINDING_FIELDS[field];
		if (!kiwiField) continue;
		const resolvedType = typeMap[variable.type] ?? "FLOAT";
		entries.push({
			variableData: {
				value: { alias: { guid: varGuid } },
				dataType: "ALIAS",
				resolvedDataType: resolvedType
			},
			variableField: kiwiField
		});
	}
	if (Object.keys(roundtripBindings).length > 0) upsertPluginData(node, BOUND_VARIABLES_PLUGIN_KEY, JSON.stringify(roundtripBindings));
	if (entries.length > 0) nc.variableConsumptionMap = { entries };
}
function computeExportTransform(node) {
	const sx = node.flipX ? -1 : 1;
	const cos = Math.cos(node.rotation * Math.PI / 180);
	const sin = Math.sin(node.rotation * Math.PI / 180);
	const m00 = cos * sx;
	const m01 = -sin * sx;
	const m10 = sin;
	const m11 = cos;
	const corners = [
		{
			x: 0,
			y: 0
		},
		{
			x: node.width,
			y: 0
		},
		{
			x: 0,
			y: node.height
		},
		{
			x: node.width,
			y: node.height
		}
	].map((point) => ({
		x: m00 * point.x + m01 * point.y,
		y: m10 * point.x + m11 * point.y
	}));
	const offsetX = Math.min(...corners.map((point) => point.x));
	const offsetY = Math.min(...corners.map((point) => point.y));
	return {
		m00,
		m01,
		m02: node.x - offsetX,
		m10,
		m11,
		m12: node.y - offsetY
	};
}
function sceneNodeToKiwi(node, parentGuid, childIndex, localIdCounter, graph, blobs, nodeIdToGuid, fontDigestMap, varIdToGuid, glyphBlobMap = /* @__PURE__ */ new Map(), blobIndexByHex, assignedGuidValues, runtime = EMPTY_EXPORT_RUNTIME, componentPropertyDefinitionsById = buildComponentPropIndex(graph), modeIdToGuid) {
	return sceneNodeToKiwiWithContext(node, parentGuid, childIndex, localIdCounter, {
		graph,
		blobs,
		blobIndexByHex,
		nodeIdToGuid,
		assignedGuidValues,
		fontDigestMap,
		glyphBlobMap,
		varIdToGuid,
		modeIdToGuid,
		assetRefToVarGuid: varIdToGuid ? buildAssetRefToVarGuidMap(graph, varIdToGuid) : void 0,
		componentPropertyDefinitionsById,
		fractionalPosition,
		mapToFigmaType,
		fillToKiwiPaint,
		safeColor,
		computeExportTransform,
		serializeCornerRadii,
		serializeTextProps: (textNode, nc, textGraph, digests, textBlobs, glyphs) => serializeTextProps(textNode, nc, textGraph, digests, textBlobs, glyphs, runtime),
		serializeLayoutProps: (layoutNode, nc) => serializeLayoutProps(layoutNode, nc, graph),
		serializeGeometry,
		serializeVariableBindings,
		sceneNodeToKiwi: sceneNodeToKiwiWithContext
	});
}
const IDENTITY_TRANSFORM = {
	m00: 1,
	m01: 0,
	m02: 0,
	m10: 0,
	m11: 1,
	m12: 0
};
const DEFAULT_STROKE_WEIGHT = 1;
function makeDocumentNodeChange(guid, documentColorSpace = "display-p3") {
	return {
		guid,
		type: "DOCUMENT",
		name: "Document",
		visible: true,
		opacity: 1,
		phase: "CREATED",
		transform: { ...IDENTITY_TRANSFORM },
		strokeWeight: DEFAULT_STROKE_WEIGHT,
		strokeAlign: "CENTER",
		strokeJoin: "MITER",
		documentColorProfile: documentColorSpace === "display-p3" ? "DISPLAY_P3" : "SRGB"
	};
}
function makeCanvasNodeChange(guid, parentGuid, position, name, extra) {
	return {
		guid,
		parentIndex: {
			guid: parentGuid,
			position
		},
		type: "CANVAS",
		name,
		visible: true,
		opacity: 1,
		phase: "CREATED",
		transform: { ...IDENTITY_TRANSFORM },
		strokeWeight: DEFAULT_STROKE_WEIGHT,
		strokeAlign: "CENTER",
		strokeJoin: "MITER",
		pageType: "DESIGN",
		...extra
	};
}
//#endregion
//#region src/node-change/style-refs.ts
const TEXT_STYLE_FIELDS = [
	"fontSize",
	"fontName",
	"lineHeight",
	"letterSpacing",
	"textDecoration",
	"textCase"
];
function referencedStyle(changeMap, reference, assetRefs) {
	if (reference?.guid) return changeMap.get(guidToString(reference.guid));
	if (!reference?.assetRef || !assetRefs) return void 0;
	const { key, version } = reference.assetRef;
	const id = (version ? assetRefs.get(`${key}@${version}`) : void 0) ?? assetRefs.get(key);
	return id ? changeMap.get(id) : void 0;
}
function applyPaintStyleRefs(changeMap, fields, assetRefs) {
	const fillStyle = referencedStyle(changeMap, fields.styleIdForFill, assetRefs);
	if (fillStyle?.styleType === "FILL" && fillStyle.fillPaints) fields.fillPaints = fillStyle.fillPaints;
	const strokeStyle = referencedStyle(changeMap, fields.styleIdForStrokeFill, assetRefs);
	if (strokeStyle?.styleType === "FILL" && strokeStyle.fillPaints) fields.strokePaints = strokeStyle.fillPaints;
}
function applyEffectAndGridStyleRefs(changeMap, fields, assetRefs) {
	const effectStyle = referencedStyle(changeMap, fields.styleIdForEffect, assetRefs);
	if (effectStyle?.styleType === "EFFECT" && effectStyle.effects) fields.effects = effectStyle.effects;
	const gridStyle = referencedStyle(changeMap, fields.styleIdForGrid, assetRefs);
	if (gridStyle?.styleType === "GRID" && gridStyle.layoutGrids) fields.layoutGrids = gridStyle.layoutGrids;
}
function applyTextStyleRef(changeMap, fields, assetRefs) {
	const style = referencedStyle(changeMap, fields.styleIdForText, assetRefs);
	if (style?.type !== "TEXT" || style.styleType !== "TEXT") return;
	for (const field of TEXT_STYLE_FIELDS) if (field === "textDecoration") fields.textDecoration = style.textDecoration;
	else if (style[field] !== void 0) Object.assign(fields, { [field]: style[field] });
}
function applyStyleRefsToFields(changeMap, fields, assetRefs) {
	applyPaintStyleRefs(changeMap, fields, assetRefs);
	applyEffectAndGridStyleRefs(changeMap, fields, assetRefs);
	applyTextStyleRef(changeMap, fields, assetRefs);
}
//#endregion
export { BOUND_VARIABLES_PLUGIN_KEY, EMPTY_EXPORT_RUNTIME, EXPORT_SETTINGS_PLUGIN_KEY, FIGMA_RAW_NODE_FIELD_KEYS, FIG_KIWI_DEFAULT_VERSION$1 as FIG_KIWI_DEFAULT_VERSION, LAYOUT_DIRECTION_PLUGIN_KEY, NODE_TYPE_PLUGIN_KEY, OPEN_PENCIL_PLUGIN_ID, TEXT_DIRECTION_PLUGIN_KEY, VARIABLE_BINDING_FIELDS, VARIABLE_BINDING_FIELDS_INVERSE, alignGeometryWindingRules, applyExportSettingsPluginData, applyFontFeaturesToKiwi, applyStyleRefsToFields, buildAssetRefToVarGuidMap, buildComponentPropIndex, buildDerivedTextData$1 as buildDerivedTextData, buildFigKiwi$1 as buildFigKiwi, buildStyleOverrideTable, convertEffects, convertFigmaDerivedTextGlyphs, convertFigmaTransformProps, convertFills, convertFontFeatures, convertFontVariations, convertLetterSpacing, convertLineHeight, convertStrokes, decodeVectorNetworkBlob, decompressFigKiwiDataAsync, encodePathCommandsBlob, encodeVectorNetworkBlob, exportTextData, extractBoundVariables, extractExportSettings, extractPluginData, extractPluginRelaunchData, figmaAxisTagToString, fillToKiwiPaint, fontVariationToKiwi, fractionalPosition, getOpenPencilPluginValue, guidToString$1 as guidToString, importStyleRuns, makeCanvasNodeChange, makeDocumentNodeChange, mapAlignSelf, mapArcData, mapStackCounterAlign, mapStackJustify, mapStackSizing, mapTextDecoration, mapToFigmaType, mergePluginData, nodeChangeToProps, parseFigKiwiChunks$1 as parseFigKiwiChunks, resolveGeometryPaths, resolveStyleOverrideFills, resolveVariableConsumptionEntry, resolveVectorNetwork, resolveVectorStyleOverrideFills, resolvedNumericBindingUpdate, safeColor, sceneNodeToKiwi, sceneNodeToKiwiWithContext, serializePluginRelaunchData, setVariableColorResolver, shouldImportTextAsAutoSize, sortChildren, stringToFigmaAxisTag, stringToGuid$1 as stringToGuid, upsertPluginData, weightToFigmaStyle };

//# sourceMappingURL=node-change2.js.map
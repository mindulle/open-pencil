import { parseColor } from "./color.js";
import { generateId } from "@open-pencil/scene-graph";
import { BLACK } from "@open-pencil/scene-graph/constants";
//#region src/convert.ts
function penVarTypeToSceneType(t) {
	if (t === "color") return "COLOR";
	if (t === "number") return "FLOAT";
	return "STRING";
}
function penValueToSceneValue(raw, type) {
	if (type === "COLOR" && typeof raw === "string") return parseColor(raw);
	if (type === "FLOAT" && typeof raw === "number") return raw;
	if (type === "STRING") return String(raw);
	if (typeof raw === "number") return raw;
	return String(raw);
}
function defaultForType(type) {
	if (type === "COLOR") return { ...BLACK };
	if (type === "FLOAT") return 0;
	if (type === "BOOLEAN") return false;
	return "";
}
function isVarRef(val) {
	return typeof val === "string" && val.startsWith("$--");
}
function varName(ref) {
	return ref.replace(/^\$/, "");
}
function bindIfVar(node, field, val, ctx) {
	if (!isVarRef(val)) return;
	const entry = ctx.byName.get(varName(val));
	if (entry) node.boundVariables[field] = entry.id;
}
function buildVarContext(graph, penVars, themes) {
	const collectionId = generateId();
	const modes = [];
	const themeKeys = Object.keys(themes);
	if (themeKeys.length > 0) {
		const themeKey = themeKeys[0];
		for (const modeName of themes[themeKey]) modes.push({
			modeId: generateId(),
			name: modeName
		});
	}
	if (modes.length === 0) modes.push({
		modeId: generateId(),
		name: "Default"
	});
	const collection = {
		id: collectionId,
		name: "Variables",
		modes,
		defaultModeId: modes[0].modeId,
		variableIds: []
	};
	graph.addCollection(collection);
	const modeByThemeValue = /* @__PURE__ */ new Map();
	if (themeKeys.length > 0) {
		const themeKey = themeKeys[0];
		for (const mode of modes) modeByThemeValue.set(`${themeKey}:${mode.name}`, mode.modeId);
	}
	const byName = /* @__PURE__ */ new Map();
	for (const [name, def] of Object.entries(penVars)) {
		const varId = generateId();
		const varType = penVarTypeToSceneType(def.type);
		const valuesByMode = {};
		if (Array.isArray(def.value)) for (const entry of def.value) if (entry.theme) {
			const [tKey, tVal] = Object.entries(entry.theme)[0];
			const modeId = modeByThemeValue.get(`${tKey}:${tVal}`);
			if (modeId) valuesByMode[modeId] = penValueToSceneValue(entry.value, varType);
		} else valuesByMode[modes[0].modeId] = penValueToSceneValue(entry.value, varType);
		else valuesByMode[modes[0].modeId] = penValueToSceneValue(def.value, varType);
		for (const mode of modes) if (!(mode.modeId in valuesByMode)) valuesByMode[mode.modeId] = valuesByMode[modes[0].modeId] ?? defaultForType(varType);
		const variable = {
			id: varId,
			name,
			type: varType,
			collectionId,
			valuesByMode,
			description: "",
			hiddenFromPublishing: false
		};
		graph.addVariable(variable);
		byName.set(name, {
			id: varId,
			variable
		});
	}
	let activeModeId = modes[0].modeId;
	function resolveVal(ref) {
		const entry = byName.get(ref.replace(/^\$/, ""));
		if (!entry) return void 0;
		return entry.variable.valuesByMode[activeModeId] ?? Object.values(entry.variable.valuesByMode)[0];
	}
	return {
		byName,
		activeModeId,
		collectionId,
		modeByThemeName: modeByThemeValue,
		resolveColor(ref) {
			const val = resolveVal(ref);
			if (val === void 0) return parseColor(ref);
			if (typeof val === "object" && "r" in val) return val;
			if (typeof val === "string") return parseColor(val);
			return { ...BLACK };
		},
		resolveNumber(ref) {
			const val = resolveVal(ref);
			return typeof val === "number" ? val : 0;
		},
		resolveString(ref) {
			const val = resolveVal(ref);
			return typeof val === "string" ? val : "";
		},
		setActiveTheme(themeName) {
			const modeId = modeByThemeValue.get(`theme:${themeName}`);
			if (modeId) {
				activeModeId = modeId;
				graph.activeMode.set(collectionId, modeId);
			}
		}
	};
}
function parseFillColor(fill, ctx) {
	const raw = typeof fill === "string" ? fill : fill.color;
	return isVarRef(raw) ? ctx.resolveColor(raw) : parseColor(raw);
}
function convertFill(fill, ctx, node) {
	if (fill === void 0) return [];
	return (Array.isArray(fill) ? fill : [fill]).map((item, index) => {
		const visible = typeof item === "string" ? true : item.enabled !== false;
		const color = parseFillColor(item, ctx);
		const result = {
			type: "SOLID",
			visible,
			opacity: color.a,
			color
		};
		if (node) bindIfVar(node, `fills[${index}]`, typeof item === "string" ? item : item.color, ctx);
		return result;
	});
}
function strokeWeight(stroke) {
	return typeof stroke.thickness === "number" ? stroke.thickness : Math.max(...Object.values(stroke.thickness));
}
function convertStroke(stroke, ctx, node) {
	if (!stroke?.fill) return [];
	const color = isVarRef(stroke.fill) ? ctx.resolveColor(stroke.fill) : parseColor(stroke.fill);
	let align = "CENTER";
	if (stroke.align === "inside") align = "INSIDE";
	else if (stroke.align === "outside") align = "OUTSIDE";
	const result = {
		visible: true,
		color,
		opacity: color.a,
		weight: strokeWeight(stroke),
		align,
		dashPattern: []
	};
	if (node) {
		bindIfVar(node, "strokes[0]", stroke.fill, ctx);
		if (typeof stroke.thickness === "object") {
			node.independentStrokeWeights = true;
			node.borderTopWeight = stroke.thickness.top ?? 0;
			node.borderRightWeight = stroke.thickness.right ?? 0;
			node.borderBottomWeight = stroke.thickness.bottom ?? 0;
			node.borderLeftWeight = stroke.thickness.left ?? 0;
		}
		node.strokeJoin = mapStrokeJoin(stroke.join);
		node.strokeCap = mapStrokeCap(stroke.cap);
	}
	return [result];
}
function mapStrokeJoin(join) {
	if (join === "round") return "ROUND";
	if (join === "bevel") return "BEVEL";
	return "MITER";
}
function mapStrokeCap(cap) {
	if (cap === "round") return "ROUND";
	if (cap === "square") return "SQUARE";
	return "NONE";
}
function convertEffects(effect) {
	if (!effect) return [];
	return (Array.isArray(effect) ? effect : [effect]).flatMap((item) => {
		if (item.type !== "shadow") return [];
		const color = item.color ? parseColor(item.color) : {
			r: 0,
			g: 0,
			b: 0,
			a: .25
		};
		return [{
			type: item.shadowType === "inner" ? "INNER_SHADOW" : "DROP_SHADOW",
			visible: true,
			blendMode: "NORMAL",
			color,
			offset: item.offset ?? {
				x: 0,
				y: 0
			},
			radius: item.blur ?? 0,
			spread: item.spread ?? 0
		}];
	});
}
function applyCornerRadius(node, radius, ctx) {
	if (radius === void 0) return;
	if (Array.isArray(radius)) {
		const values = radius.map((value) => parseSize(value, 0, ctx).value);
		node.independentCorners = true;
		node.topLeftRadius = values[0] ?? 0;
		node.topRightRadius = values[1] ?? 0;
		node.bottomRightRadius = values[2] ?? 0;
		node.bottomLeftRadius = values[3] ?? 0;
		return;
	}
	node.cornerRadius = parseSize(radius, 0, ctx).value;
}
function applyPadding(node, padding, ctx) {
	if (padding === void 0) return;
	const resolve = (v) => typeof v === "string" ? isVarRef(v) && ctx ? ctx.resolveNumber(v) : Number(v) || 0 : v;
	if (Array.isArray(padding)) {
		node.paddingTop = resolve(padding[0] ?? 0);
		node.paddingRight = resolve(padding[1] ?? 0);
		node.paddingBottom = resolve(padding[2] ?? 0);
		node.paddingLeft = resolve(padding[3] ?? 0);
		return;
	}
	const resolved = resolve(padding);
	node.paddingTop = resolved;
	node.paddingRight = resolved;
	node.paddingBottom = resolved;
	node.paddingLeft = resolved;
}
function parseSize(value, fallback, ctx) {
	if (value === void 0) return {
		value: fallback,
		sizing: "FIXED"
	};
	if (typeof value === "number") return {
		value,
		sizing: "FIXED"
	};
	if (value === "fill_container") return {
		value: fallback,
		sizing: "FILL"
	};
	if (value === "hug_content") return {
		value: fallback,
		sizing: "HUG"
	};
	if (isVarRef(value) && ctx) return {
		value: ctx.resolveNumber(value),
		sizing: "FIXED"
	};
	const parsed = Number(value);
	return {
		value: Number.isFinite(parsed) ? parsed : fallback,
		sizing: "FIXED"
	};
}
function mapLayoutMode(pen) {
	if (pen.layout === "row" || pen.layout === "horizontal") return "HORIZONTAL";
	if (pen.layout === "column" || pen.layout === "vertical") return "VERTICAL";
	return "NONE";
}
function mapJustifyContent(value) {
	if (value === "center") return "CENTER";
	if (value === "end") return "MAX";
	if (value === "space-between") return "SPACE_BETWEEN";
	return "MIN";
}
function mapAlignItems(value) {
	if (value === "center") return "CENTER";
	if (value === "end") return "MAX";
	if (value === "stretch") return "STRETCH";
	return "MIN";
}
function mapTextAlign(value) {
	if (value === "center") return "CENTER";
	if (value === "right" || value === "end") return "RIGHT";
	if (value === "justified") return "JUSTIFIED";
	return "LEFT";
}
function mapTextAlignVertical(value) {
	if (value === "center") return "CENTER";
	if (value === "bottom" || value === "end") return "BOTTOM";
	return "TOP";
}
function mapFontWeight(value) {
	if (typeof value === "number") return value;
	if (value === "thin") return 100;
	if (value === "extralight") return 200;
	if (value === "light") return 300;
	if (value === "medium") return 500;
	if (value === "semibold") return 600;
	if (value === "bold") return 700;
	if (value === "extrabold") return 800;
	if (value === "black") return 900;
	return 400;
}
function mapNodeType(pen) {
	if (pen.type === "frame") return pen.reusable ? "COMPONENT" : "FRAME";
	if (pen.type === "rectangle") return "RECTANGLE";
	if (pen.type === "ellipse") return "ELLIPSE";
	if (pen.type === "text" || pen.type === "icon_font") return "TEXT";
	if (pen.type === "path") return "VECTOR";
	if (pen.type === "ref") return "INSTANCE";
	return "FRAME";
}
//#endregion
export { applyCornerRadius, applyPadding, bindIfVar, buildVarContext, convertEffects, convertFill, convertStroke, isVarRef, mapAlignItems, mapFontWeight, mapJustifyContent, mapLayoutMode, mapNodeType, mapTextAlign, mapTextAlignVertical, parseSize };

//# sourceMappingURL=convert.js.map
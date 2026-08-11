import { BLACK } from "@open-pencil/core/constants";
import { copyEffects, copyFills, copyLayoutGrids, sharedStyleRefKey } from "@open-pencil/scene-graph";
//#region src/controls/shared-style/model.ts
function strokePaintsFromStyle(target, style) {
	const fills = style.fills.filter((fill) => fill.type === "SOLID");
	if (fills.length === 0) return target.strokes;
	const fallback = target.strokes[0] ?? {
		color: BLACK,
		weight: 1,
		opacity: 1,
		visible: true,
		align: "CENTER"
	};
	return fills.map((fill, index) => {
		return {
			...target.strokes[index] ?? fallback,
			color: { ...fill.color },
			opacity: fill.opacity,
			visible: fill.visible
		};
	});
}
function sharedStylePatch(kind, target, styleId, style) {
	const patch = { [sharedStyleRefKey(kind)]: styleId };
	if (!style) return patch;
	if (kind === "fill") patch.fills = copyFills(style.fills);
	else if (kind === "stroke") patch.strokes = strokePaintsFromStyle(target, style);
	else if (kind === "effect") patch.effects = copyEffects(style.effects);
	else if (kind === "grid") patch.layoutGrids = copyLayoutGrids(style.layoutGrids);
	else Object.assign(patch, {
		fontFamily: style.fontFamily,
		fontWeight: style.fontWeight,
		italic: style.italic,
		fontSize: style.fontSize,
		lineHeight: style.lineHeight,
		letterSpacing: style.letterSpacing,
		textDecoration: style.textDecoration,
		textCase: style.textCase
	});
	return patch;
}
function sharedStyleDetachPatch(kind) {
	return { [sharedStyleRefKey(kind)]: null };
}
//#endregion
export { sharedStyleDetachPatch, sharedStylePatch };

//# sourceMappingURL=model.js.map
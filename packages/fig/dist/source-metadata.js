//#region src/source-metadata.ts
const RAW_SIZE_KEYS = /* @__PURE__ */ new Set(["width", "height"]);
const RAW_TRANSFORM_KEYS = /* @__PURE__ */ new Set([
	"x",
	"y",
	"rotation",
	"flipX",
	"flipY"
]);
const TEXT_DERIVED_RAW_FIELDS = [
	"textData",
	"derivedTextData",
	"textUserLayoutVersion",
	"textExplicitLayoutVersion"
];
const STROKE_GEOMETRY_RAW_FIELDS = ["strokeGeometry", "vectorData"];
const EDITED_RAW_FIELDS = {
	fillStyleId: ["styleIdForFill"],
	strokeStyleId: ["styleIdForStrokeFill"],
	textStyleId: ["styleIdForText"],
	effectStyleId: ["styleIdForEffect"],
	gridStyleId: ["styleIdForGrid"],
	fills: [
		"fillPaints",
		"backgroundPaints",
		"backgroundColor"
	],
	strokes: ["strokePaints"],
	effects: ["effects"],
	layoutGrids: ["layoutGrids"],
	exportSettings: ["exportSettings"],
	cornerRadius: ["cornerRadius"],
	independentCorners: ["rectangleCornerRadiiIndependent"],
	topLeftRadius: ["rectangleTopLeftCornerRadius", "rectangleCornerRadiiIndependent"],
	topRightRadius: ["rectangleTopRightCornerRadius", "rectangleCornerRadiiIndependent"],
	bottomLeftRadius: ["rectangleBottomLeftCornerRadius", "rectangleCornerRadiiIndependent"],
	bottomRightRadius: ["rectangleBottomRightCornerRadius", "rectangleCornerRadiiIndependent"],
	cornerSmoothing: ["cornerSmoothing"],
	borderTopWeight: ["borderTopWeight", ...STROKE_GEOMETRY_RAW_FIELDS],
	borderRightWeight: ["borderRightWeight", ...STROKE_GEOMETRY_RAW_FIELDS],
	borderBottomWeight: ["borderBottomWeight", ...STROKE_GEOMETRY_RAW_FIELDS],
	borderLeftWeight: ["borderLeftWeight", ...STROKE_GEOMETRY_RAW_FIELDS],
	independentStrokeWeights: [
		"borderStrokeWeightsIndependent",
		"borderTopWeight",
		"borderRightWeight",
		"borderBottomWeight",
		"borderLeftWeight",
		...STROKE_GEOMETRY_RAW_FIELDS
	],
	strokeWeight: ["strokeWeight", ...STROKE_GEOMETRY_RAW_FIELDS],
	strokeJoin: ["strokeJoin", ...STROKE_GEOMETRY_RAW_FIELDS],
	strokeMiterLimit: ["miterLimit", ...STROKE_GEOMETRY_RAW_FIELDS],
	strokeCap: [...STROKE_GEOMETRY_RAW_FIELDS],
	dashPattern: [...STROKE_GEOMETRY_RAW_FIELDS],
	text: [...TEXT_DERIVED_RAW_FIELDS],
	styleRuns: [...TEXT_DERIVED_RAW_FIELDS],
	fontSize: ["fontSize", ...TEXT_DERIVED_RAW_FIELDS],
	fontFamily: [
		"fontName",
		"fontVersion",
		...TEXT_DERIVED_RAW_FIELDS
	],
	fontWeight: ["semanticWeight", ...TEXT_DERIVED_RAW_FIELDS],
	italic: ["semanticItalic", ...TEXT_DERIVED_RAW_FIELDS],
	lineHeight: ["lineHeight", ...TEXT_DERIVED_RAW_FIELDS],
	letterSpacing: [
		"letterSpacing",
		"textTracking",
		...TEXT_DERIVED_RAW_FIELDS
	],
	textAutoResize: ["textAutoResize", ...TEXT_DERIVED_RAW_FIELDS],
	textDecorationStyle: ["textDecorationStyle", ...TEXT_DERIVED_RAW_FIELDS],
	textDecorationThickness: ["textDecorationThickness", ...TEXT_DERIVED_RAW_FIELDS],
	textDecorationFills: ["textDecorationFillPaints", ...TEXT_DERIVED_RAW_FIELDS],
	textUnderlineOffset: ["textUnderlineOffset", ...TEXT_DERIVED_RAW_FIELDS],
	leadingTrim: ["leadingTrim", ...TEXT_DERIVED_RAW_FIELDS],
	maxLines: ["maxLines", ...TEXT_DERIVED_RAW_FIELDS],
	fontVariations: ["fontVariations", ...TEXT_DERIVED_RAW_FIELDS],
	fontFeatures: [
		"fontVariantCommonLigatures",
		"fontVariantContextualLigatures",
		"toggledOnOTFeatures",
		"toggledOffOTFeatures",
		...TEXT_DERIVED_RAW_FIELDS
	],
	minWidth: ["minSize"],
	minHeight: ["minSize"],
	maxWidth: ["maxSize"],
	maxHeight: ["maxSize"],
	vectorNetwork: [
		"vectorData",
		"fillGeometry",
		"strokeGeometry"
	],
	fillGeometry: ["fillGeometry", "vectorData"],
	strokeGeometry: ["strokeGeometry", "vectorData"],
	isMask: ["mask"],
	maskType: ["maskType"],
	maskIsOutline: ["maskIsOutline"],
	componentPropertyDefinitions: ["componentPropDefs"],
	componentPropertyReferences: ["componentPropRefs"],
	componentPropertyAssignments: ["componentPropAssignments"],
	variantPropSpecs: ["variantPropSpecs"]
};
function staleFigmaRawFields(editedFields = []) {
	return new Set(editedFields.flatMap((key) => EDITED_RAW_FIELDS[key] ?? []));
}
function effectiveFigmaRawNodeFields(node) {
	const staleFields = staleFigmaRawFields(node.source.editedFields ?? []);
	if (staleFields.size === 0) return node.source.fig.rawNodeFields;
	return Object.fromEntries(Object.entries(node.source.fig.rawNodeFields).filter(([key]) => !staleFields.has(key)));
}
function effectiveFigmaSourcePayload(node) {
	const sourceEditedFields = node.source.editedFields ?? [];
	return {
		...node.source.fig,
		rawNodeFields: effectiveFigmaRawNodeFields(node),
		rawSize: sourceEditedFields.some((key) => RAW_SIZE_KEYS.has(key)) ? null : node.source.fig.rawSize,
		rawTransform: sourceEditedFields.some((key) => RAW_TRANSFORM_KEYS.has(key)) ? null : node.source.fig.rawTransform
	};
}
function readEffectiveFigmaRawField(node, field) {
	if (staleFigmaRawFields(node.source.editedFields ?? []).has(field)) return void 0;
	return node.source.fig.rawNodeFields[field];
}
//#endregion
export { effectiveFigmaRawNodeFields, effectiveFigmaSourcePayload, readEffectiveFigmaRawField, staleFigmaRawFields };

//# sourceMappingURL=source-metadata.js.map
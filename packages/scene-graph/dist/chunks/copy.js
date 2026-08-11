import { BLACK, DEFAULT_FONT_FAMILY } from "../constants.js";
import { isEqual } from "es-toolkit/predicate";
//#region src/node-defaults.ts
function createDefaultSourceMetadata() {
	return {
		format: null,
		id: null,
		orderKey: null,
		editedFields: [],
		fig: {
			rawSize: null,
			rawTransform: null,
			rawNodeFields: {},
			layout: null,
			symbolOverrides: [],
			componentPropAssignments: [],
			derivedSymbolData: [],
			derivedSymbolDataLayoutVersion: null,
			uniformScaleFactor: null
		}
	};
}
function createDefaultNode(generateId, type, overrides = {}) {
	return {
		id: generateId(),
		type,
		name: type.charAt(0) + type.slice(1).toLowerCase(),
		parentId: null,
		childIds: [],
		x: 0,
		y: 0,
		width: 100,
		height: 100,
		rotation: 0,
		source: createDefaultSourceMetadata(),
		figmaDerivedLayout: null,
		fills: type === "TEXT" ? [{
			type: "SOLID",
			color: BLACK,
			opacity: 1,
			visible: true
		}] : [],
		strokes: [],
		effects: [],
		layoutGrids: [],
		fillStyleId: null,
		strokeStyleId: null,
		textStyleId: null,
		effectStyleId: null,
		gridStyleId: null,
		sharedStyleType: null,
		opacity: 1,
		cornerRadius: 0,
		topLeftRadius: 0,
		topRightRadius: 0,
		bottomRightRadius: 0,
		bottomLeftRadius: 0,
		independentCorners: false,
		cornerSmoothing: 0,
		visible: true,
		locked: false,
		clipsContent: false,
		text: "",
		fontSize: 14,
		fontFamily: DEFAULT_FONT_FAMILY,
		fontWeight: 400,
		italic: false,
		textAlignHorizontal: "LEFT",
		textDirection: "AUTO",
		textLanguage: null,
		leadingTrim: "NONE",
		lineHeight: null,
		letterSpacing: 0,
		layoutMode: "NONE",
		layoutDirection: "AUTO",
		layoutWrap: "NO_WRAP",
		primaryAxisAlign: "MIN",
		counterAxisAlign: "MIN",
		primaryAxisSizing: "FIXED",
		counterAxisSizing: "FIXED",
		itemSpacing: 0,
		counterAxisSpacing: 0,
		paddingTop: 0,
		paddingRight: 0,
		paddingBottom: 0,
		paddingLeft: 0,
		blendMode: "PASS_THROUGH",
		layoutPositioning: "AUTO",
		layoutGrow: 0,
		layoutAlignSelf: "AUTO",
		vectorNetwork: null,
		handleMirroring: "NONE",
		fillGeometry: [],
		strokeGeometry: [],
		arcData: null,
		textAlignVertical: "TOP",
		textAutoResize: "NONE",
		textCase: "ORIGINAL",
		textDecoration: "NONE",
		textDecorationStyle: "SOLID",
		textDecorationThickness: null,
		textDecorationFills: [],
		textDecorationSkipInk: true,
		textUnderlineOffset: null,
		maxLines: null,
		styleRuns: [],
		fontVariations: [],
		fontFeatures: [],
		horizontalConstraint: "MIN",
		verticalConstraint: "MIN",
		strokeCap: "NONE",
		strokeJoin: "MITER",
		dashPattern: [],
		borderTopWeight: 0,
		borderRightWeight: 0,
		borderBottomWeight: 0,
		borderLeftWeight: 0,
		independentStrokeWeights: false,
		strokeMiterLimit: 4,
		minWidth: null,
		maxWidth: null,
		minHeight: null,
		maxHeight: null,
		isMask: false,
		maskType: "ALPHA",
		maskIsOutline: false,
		gridTemplateColumns: [],
		gridTemplateRows: [],
		gridColumnGap: 0,
		gridRowGap: 0,
		gridPosition: null,
		counterAxisAlignContent: "AUTO",
		itemReverseZIndex: false,
		strokesIncludedInLayout: false,
		expanded: true,
		textTruncation: "DISABLED",
		autoRename: true,
		pointCount: 5,
		starInnerRadius: .38,
		componentId: null,
		overrides: {},
		componentPropertyDefinitions: [],
		componentPropertyReferences: [],
		componentPropertyAssignments: {},
		componentPropertyValues: {},
		componentKey: null,
		sourceLibraryKey: null,
		publishId: null,
		overrideKey: null,
		sharedSymbolVersion: null,
		publishedVersion: null,
		isPublishable: false,
		isSymbolPublishable: false,
		symbolDescription: "",
		symbolLinks: [],
		variantPropSpecs: [],
		boundVariables: {},
		variableModes: {},
		exportSettings: [],
		pluginData: [],
		pluginRelaunchData: [],
		internalOnly: false,
		flipX: false,
		flipY: false,
		textPicture: null,
		figmaDerivedTextGlyphs: null,
		...overrides
	};
}
const CONTAINER_TYPES = /* @__PURE__ */ new Set([
	"CANVAS",
	"FRAME",
	"GROUP",
	"BOOLEAN_OPERATION",
	"SECTION",
	"COMPONENT",
	"COMPONENT_SET",
	"INSTANCE"
]);
//#endregion
//#region src/vector-network.ts
/** Concatenate vector networks while preserving independent geometry. */
function mergeVectorNetworks(networks) {
	const vertices = [];
	const segments = [];
	const regions = [];
	let vertexOffset = 0;
	let segmentOffset = 0;
	for (const network of networks) {
		for (const vertex of network.vertices) vertices.push({ ...vertex });
		for (const segment of network.segments) segments.push({
			...segment,
			start: segment.start + vertexOffset,
			end: segment.end + vertexOffset,
			tangentStart: { ...segment.tangentStart },
			tangentEnd: { ...segment.tangentEnd }
		});
		for (const region of network.regions) {
			const loops = [];
			for (const loop of region.loops) {
				const shifted = [];
				for (const segmentIndex of loop) shifted.push(segmentIndex + segmentOffset);
				loops.push(shifted);
			}
			regions.push({
				windingRule: region.windingRule,
				loops
			});
		}
		vertexOffset += network.vertices.length;
		segmentOffset += network.segments.length;
	}
	return {
		vertices,
		segments,
		regions
	};
}
/**
* Map a VectorNetwork through an affine matrix: vertices as points,
* tangents as direction vectors (linear part only, no translation).
* Returns a deep copy; the input is not mutated.
*/
function transformVectorNetwork(m, vn) {
	const mapVector = (v) => ({
		x: m[0] * v.x + m[1] * v.y,
		y: m[3] * v.x + m[4] * v.y
	});
	return {
		vertices: vn.vertices.map((v) => ({
			...v,
			x: m[0] * v.x + m[1] * v.y + m[2],
			y: m[3] * v.x + m[4] * v.y + m[5]
		})),
		segments: vn.segments.map((s) => ({
			...s,
			tangentStart: mapVector(s.tangentStart),
			tangentEnd: mapVector(s.tangentEnd)
		})),
		regions: vn.regions.map((r) => ({
			windingRule: r.windingRule,
			loops: r.loops.map((l) => [...l])
		}))
	};
}
/** Structural equality of two VectorNetworks (order-sensitive, exact values). */
function vectorNetworksEqual(a, b) {
	return isEqual(a.vertices, b.vertices) && isEqual(a.segments, b.segments) && isEqual(a.regions, b.regions);
}
/** Deep-copy a VectorNetwork, stripping any Vue Proxy wrappers. */
function cloneVectorNetwork(vn) {
	return {
		vertices: vn.vertices.map((v) => ({ ...v })),
		segments: vn.segments.map((s) => ({
			...s,
			tangentStart: { ...s.tangentStart },
			tangentEnd: { ...s.tangentEnd }
		})),
		regions: vn.regions.map((r) => ({
			windingRule: r.windingRule,
			loops: r.loops.map((l) => [...l])
		}))
	};
}
/**
* Validate a VectorNetwork structure, returning an array of error messages.
* Empty array means the network is valid.
*/
function validateVectorNetwork(value) {
	if (!isRecord(value)) return ["network must be an object"];
	if (!Array.isArray(value.vertices)) return ["vertices must be an array"];
	if (!Array.isArray(value.segments)) return ["segments must be an array"];
	const errors = [];
	validateVertices(value.vertices, errors);
	validateSegments(value.segments, value.vertices.length, errors);
	const typedSegments = value.segments.filter(isSegmentRecord);
	if (value.regions !== void 0) if (Array.isArray(value.regions)) validateRegions(value.regions, value.segments.length, typedSegments.length === value.segments.length ? typedSegments : null, errors);
	else errors.push("regions must be an array when provided");
	return errors;
}
function validateVertices(vertices, errors) {
	for (let index = 0; index < vertices.length; index++) if (!isFiniteVector(vertices[index])) errors.push(`vertex[${index}]: x and y must be finite numbers`);
}
function validateSegments(segments, vertexCount, errors) {
	for (let index = 0; index < segments.length; index++) {
		const segment = segments[index];
		if (!isRecord(segment)) {
			errors.push(`segment[${index}] must be an object`);
			continue;
		}
		if (!isInteger(segment.start) || !isInteger(segment.end)) {
			errors.push(`segment[${index}]: start and end must be integers`);
			continue;
		}
		if (segment.start < 0 || segment.start >= vertexCount) errors.push(`segment[${index}]: start index ${segment.start} out of range`);
		if (segment.end < 0 || segment.end >= vertexCount) errors.push(`segment[${index}]: end index ${segment.end} out of range`);
		validateSegmentTangents(segment, index, errors);
	}
}
function validateSegmentTangents(segment, index, errors) {
	for (const tangentKey of ["tangentStart", "tangentEnd"]) {
		const tangent = segment[tangentKey];
		if (tangent !== void 0 && !isFiniteVector(tangent)) errors.push(`segment[${index}]: ${tangentKey} must contain finite x and y numbers`);
	}
}
function validateRegions(regions, segmentCount, segments, errors) {
	for (let regionIndex = 0; regionIndex < regions.length; regionIndex++) {
		const region = regions[regionIndex];
		if (!isRecord(region) || !Array.isArray(region.loops)) {
			errors.push(`region[${regionIndex}]: loops must be an array`);
			continue;
		}
		if (region.windingRule !== "NONZERO" && region.windingRule !== "EVENODD") errors.push(`region[${regionIndex}]: windingRule must be NONZERO or EVENODD`);
		if (region.loops.length === 0) errors.push(`region[${regionIndex}]: loops must contain at least one loop`);
		validateRegionLoops(region.loops, regionIndex, segmentCount, segments, errors);
	}
}
function validateRegionLoops(loops, regionIndex, segmentCount, segments, errors) {
	for (let loopIndex = 0; loopIndex < loops.length; loopIndex++) {
		const loop = loops[loopIndex];
		if (!Array.isArray(loop)) {
			errors.push(`region[${regionIndex}].loop[${loopIndex}] must be an array`);
			continue;
		}
		if (loop.length === 0) {
			errors.push(`region[${regionIndex}].loop[${loopIndex}] must contain at least one segment`);
			continue;
		}
		const segmentIndices = [];
		for (const segmentIndex of loop) if (!isInteger(segmentIndex) || segmentIndex < 0 || segmentIndex >= segmentCount) errors.push(`region[${regionIndex}].loop[${loopIndex}]: segment index ${String(segmentIndex)} out of range`);
		else segmentIndices.push(segmentIndex);
		if (segmentIndices.length !== loop.length) continue;
		if (new Set(segmentIndices).size !== segmentIndices.length) {
			errors.push(`region[${regionIndex}].loop[${loopIndex}] must not repeat segments`);
			continue;
		}
		if (segments && !formsContinuousChain(segmentIndices, segments)) errors.push(`region[${regionIndex}].loop[${loopIndex}] segments must form a continuous chain`);
	}
}
function formsContinuousChain(indices, segments) {
	if (indices.length <= 1) return true;
	const first = segments[indices[0]];
	return followsChain(indices, segments, first.end) || followsChain(indices, segments, first.start);
}
function followsChain(indices, segments, initialEnd) {
	let current = initialEnd;
	for (let index = 1; index < indices.length; index++) {
		const segment = segments[indices[index]];
		if (segment.start === current) current = segment.end;
		else if (segment.end === current) current = segment.start;
		else return false;
	}
	return true;
}
function isSegmentRecord(value) {
	return isRecord(value) && isInteger(value.start) && isInteger(value.end);
}
function isFiniteVector(value) {
	return isRecord(value) && typeof value.x === "number" && Number.isFinite(value.x) && typeof value.y === "number" && Number.isFinite(value.y);
}
function isInteger(value) {
	return typeof value === "number" && Number.isInteger(value);
}
function isRecord(value) {
	return typeof value === "object" && value !== null;
}
/**
* Ensure every segment has tangentStart/tangentEnd and a regions array.
* Missing tangents default to {x:0, y:0} (straight line segments).
* Use at system boundaries where input may come from JSON/MCP.
*/
function normalizeVectorNetwork(vn) {
	const ZERO = {
		x: 0,
		y: 0
	};
	return {
		vertices: vn.vertices,
		segments: vn.segments.map((s) => ({
			start: s.start,
			end: s.end,
			tangentStart: s.tangentStart ?? { ...ZERO },
			tangentEnd: s.tangentEnd ?? { ...ZERO }
		})),
		regions: vn.regions ?? []
	};
}
//#endregion
//#region src/copy.ts
function copyFill(f) {
	const copy = {
		...f,
		color: { ...f.color }
	};
	if (f.gradientStops) copy.gradientStops = f.gradientStops.map(copyGradientStop);
	if (f.gradientTransform) copy.gradientTransform = { ...f.gradientTransform };
	if (f.imageTransform) copy.imageTransform = { ...f.imageTransform };
	if (f.patternSpacing) copy.patternSpacing = { ...f.patternSpacing };
	if (f.noiseSize) copy.noiseSize = { ...f.noiseSize };
	return copy;
}
function copyStroke(s) {
	const copy = {
		...s,
		color: { ...s.color }
	};
	if (s.dashPattern) copy.dashPattern = [...s.dashPattern];
	return copy;
}
function copyEffect(e) {
	return {
		...e,
		color: { ...e.color },
		offset: { ...e.offset }
	};
}
function copyStyleRun(r) {
	return {
		...r,
		style: {
			...r.style,
			fills: r.style.fills ? r.style.fills.map(copyFill) : void 0,
			textDecorationFills: r.style.textDecorationFills ? r.style.textDecorationFills.map(copyFill) : void 0,
			fontVariations: r.style.fontVariations ? r.style.fontVariations.map((v) => ({ ...v })) : void 0,
			fontFeatures: r.style.fontFeatures ? r.style.fontFeatures.map((v) => ({ ...v })) : void 0
		}
	};
}
const internalCopySources = /* @__PURE__ */ new WeakMap();
/** Record immutable lineage for an internal deep copy without sharing mutable values. */
function markCopySource(source, copy) {
	internalCopySources.set(copy, internalCopySources.get(source) ?? source);
	return copy;
}
/** Compare internal deep copies in O(1) without traversing large paint or text payloads. */
function hasSameCopySource(left, right) {
	if (left === right) return true;
	return (internalCopySources.get(left) ?? left) === (internalCopySources.get(right) ?? right);
}
function copyFills(fills) {
	return fills.map(copyFill);
}
function copyStrokes(strokes) {
	return strokes.map(copyStroke);
}
function copyEffects(effects) {
	return effects.map(copyEffect);
}
function copyLayoutGrids(grids) {
	return grids.map((grid) => ({
		...grid,
		color: grid.color ? { ...grid.color } : void 0
	}));
}
function copyStyleRuns(runs) {
	return runs.map(copyStyleRun);
}
function copyGeometryPaths(paths) {
	return paths.map((p) => ({
		windingRule: p.windingRule,
		commandsBlob: p.commandsBlob.slice(),
		fills: p.fills ? copyFills(p.fills) : void 0
	}));
}
/** Scale geometry path coordinates while preserving independent path fills. */
function scaleGeometryPaths(paths, scaleX, scaleY) {
	const copies = copyGeometryPaths(paths);
	if (scaleX === 1 && scaleY === 1) return copies;
	for (const path of copies) {
		const view = new DataView(path.commandsBlob.buffer, path.commandsBlob.byteOffset, path.commandsBlob.byteLength);
		let offset = 0;
		while (offset < path.commandsBlob.length) {
			const command = path.commandsBlob[offset];
			offset += 1;
			if (command === 0) continue;
			let coordinateCount = 0;
			if (command === 1 || command === 2) coordinateCount = 1;
			else if (command === 3) coordinateCount = 2;
			else if (command === 4) coordinateCount = 3;
			if (coordinateCount === 0 || offset + coordinateCount * 8 > path.commandsBlob.length) break;
			for (let index = 0; index < coordinateCount; index++) {
				view.setFloat32(offset, view.getFloat32(offset, true) * scaleX, true);
				view.setFloat32(offset + 4, view.getFloat32(offset + 4, true) * scaleY, true);
				offset += 8;
			}
		}
	}
	return copies;
}
/** Copy an optional array: non-empty → mapped, empty → [], undefined → undefined. */
function copyOpt(arr, fn) {
	if (arr === void 0) return void 0;
	return arr.length > 0 ? fn(arr) : [];
}
function copyGradientStop(gs) {
	return {
		color: { ...gs.color },
		position: gs.position
	};
}
function copySpread(arr) {
	return arr?.map((item) => ({ ...item })) ?? [];
}
function copyPropertyDefs(defs) {
	return defs?.map((d) => ({
		...d,
		variantOptions: d.variantOptions ? [...d.variantOptions] : void 0,
		preferredValues: d.preferredValues ? [...d.preferredValues] : void 0
	})) ?? [];
}
function copyGlyphs(glyphs) {
	return glyphs ? glyphs.map((g) => ({
		...g,
		commandsBlob: new Uint8Array(g.commandsBlob)
	})) : null;
}
function copyArcData(a) {
	return {
		startingAngle: a.startingAngle,
		endingAngle: a.endingAngle,
		innerRadius: a.innerRadius
	};
}
function cloneNodeProps(src, componentId, mode = "deep") {
	const { id: _, parentId: _p, childIds: _c, ...rest } = src;
	if (mode === "fig-import") return {
		...rest,
		...componentId !== null ? { componentId } : {},
		source: createDefaultSourceMetadata(),
		boundVariables: { ...src.boundVariables },
		variableModes: { ...src.variableModes },
		overrides: Object.keys(src.overrides).length > 0 ? structuredClone(src.overrides) : {},
		componentPropertyAssignments: { ...src.componentPropertyAssignments },
		componentPropertyValues: { ...src.componentPropertyValues }
	};
	return {
		...rest,
		...componentId !== null ? { componentId } : {},
		boundVariables: { ...src.boundVariables },
		variableModes: { ...src.variableModes },
		overrides: Object.keys(src.overrides).length > 0 ? structuredClone(src.overrides) : {},
		fills: copyOpt(src.fills, (value) => markCopySource(value, copyFills(value))),
		strokes: copyOpt(src.strokes, (value) => markCopySource(value, copyStrokes(value))),
		effects: copyOpt(src.effects, (value) => markCopySource(value, copyEffects(value))),
		layoutGrids: copyOpt(src.layoutGrids, copyLayoutGrids),
		styleRuns: copyOpt(src.styleRuns, (value) => markCopySource(value, copyStyleRuns(value))),
		source: componentId === null ? structuredClone(src.source) : createDefaultSourceMetadata(),
		dashPattern: copyOpt(src.dashPattern, (a) => [...a]),
		fontVariations: copyOpt(src.fontVariations, (a) => a.map((v) => ({ ...v }))),
		fontFeatures: copyOpt(src.fontFeatures, (a) => a.map((v) => ({ ...v }))),
		textDecorationFills: copyOpt(src.textDecorationFills, copyFills),
		fillGeometry: copyOpt(src.fillGeometry, copyGeometryPaths),
		strokeGeometry: copyOpt(src.strokeGeometry, copyGeometryPaths),
		gridTemplateColumns: copySpread(src.gridTemplateColumns),
		gridTemplateRows: copySpread(src.gridTemplateRows),
		componentPropertyDefinitions: copyPropertyDefs(src.componentPropertyDefinitions),
		componentPropertyReferences: copySpread(src.componentPropertyReferences),
		componentPropertyAssignments: { ...src.componentPropertyAssignments },
		symbolLinks: copySpread(src.symbolLinks),
		variantPropSpecs: copySpread(src.variantPropSpecs),
		pluginData: copySpread(src.pluginData),
		pluginRelaunchData: copySpread(src.pluginRelaunchData),
		exportSettings: copySpread(src.exportSettings),
		componentPropertyValues: { ...src.componentPropertyValues },
		figmaDerivedLayout: src.figmaDerivedLayout ? { ...src.figmaDerivedLayout } : null,
		arcData: src.arcData ? copyArcData(src.arcData) : null,
		vectorNetwork: src.vectorNetwork ? cloneVectorNetwork(src.vectorNetwork) : null,
		textPicture: src.textPicture ? new Uint8Array(src.textPicture) : null,
		figmaDerivedTextGlyphs: src.figmaDerivedTextGlyphs ? markCopySource(src.figmaDerivedTextGlyphs, copyGlyphs(src.figmaDerivedTextGlyphs) ?? []) : null,
		gridPosition: src.gridPosition ? { ...src.gridPosition } : null
	};
}
//#endregion
export { CONTAINER_TYPES, cloneNodeProps, cloneVectorNetwork, copyEffect, copyEffects, copyFill, copyFills, copyGeometryPaths, copyLayoutGrids, copyStroke, copyStrokes, copyStyleRun, copyStyleRuns, createDefaultNode, createDefaultSourceMetadata, hasSameCopySource, markCopySource, mergeVectorNetworks, normalizeVectorNetwork, scaleGeometryPaths, transformVectorNetwork, validateVectorNetwork, vectorNetworksEqual };

//# sourceMappingURL=copy.js.map
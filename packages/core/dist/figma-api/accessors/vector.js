import { computeAccurateBounds } from "../../vector/curve-math.js";
import { regenerateFillGeometry } from "../../vector/fill-geometry.js";
import { raw, updateNode } from "../accessor-utils.js";
import { geometryBlobToSVGPath, vectorNetworkToSVGPaths } from "../../io/formats/svg/paths.js";
import { copyFills } from "@open-pencil/scene-graph/copy";
import { mergeVectorNetworks, normalizeVectorNetwork, transformVectorNetwork, validateVectorNetwork } from "@open-pencil/scene-graph";
import { parsePluginVectorPath } from "@open-pencil/scene-graph/parse-path";
//#region src/figma-api/accessors/vector.ts
const EMPTY_NETWORK = {
	vertices: [],
	segments: [],
	regions: []
};
const HANDLE_MIRRORING_VALUES = /* @__PURE__ */ new Set([
	"NONE",
	"ANGLE",
	"ANGLE_AND_LENGTH"
]);
function networkFromVectorPaths(paths) {
	const networks = [];
	for (let index = 0; index < paths.length; index++) {
		const path = paths[index];
		if (typeof path !== "object" || path === null || !("data" in path)) throw new TypeError(`vectorPaths[${index}].data must be a string`);
		const data = path.data;
		if (typeof data !== "string") throw new TypeError(`vectorPaths[${index}].data must be a string`);
		const windingRule = "windingRule" in path ? path.windingRule : void 0;
		if (windingRule !== "NONZERO" && windingRule !== "EVENODD" && windingRule !== "NONE") throw new TypeError(`vectorPaths[${index}].windingRule is invalid`);
		const parsed = parsePluginVectorPath(data, windingRule);
		if (!parsed.ok) throw new TypeError(`Invalid vector path: ${parsed.error}`);
		if (parsed.network.segments.length > 0) networks.push(parsed.network);
	}
	return networks.length > 0 ? mergeVectorNetworks(networks) : structuredClone(EMPTY_NETWORK);
}
function normalizeInputNetwork(value) {
	const regions = value.regions ?? [];
	return normalizeVectorNetwork({
		vertices: value.vertices.map((vertex) => ({ ...vertex })),
		segments: value.segments.map((segment) => ({
			...segment,
			tangentStart: {
				x: segment.tangentStart?.x ?? 0,
				y: segment.tangentStart?.y ?? 0
			},
			tangentEnd: {
				x: segment.tangentEnd?.x ?? 0,
				y: segment.tangentEnd?.y ?? 0
			}
		})),
		regions: regions.map((region) => ({
			windingRule: region.windingRule,
			loops: region.loops.map((loop) => [...loop])
		}))
	});
}
function validateRegionPaintMetadata(regions) {
	for (let index = 0; index < regions.length; index++) {
		const region = regions[index];
		if (region.fills !== void 0 && !Array.isArray(region.fills)) throw new TypeError(`vectorNetwork.regions[${index}].fills must be an array`);
		if (region.fillStyleId !== void 0 && typeof region.fillStyleId !== "string") throw new TypeError(`vectorNetwork.regions[${index}].fillStyleId must be a string`);
	}
}
function geometryForRegions(regions) {
	if (!regions.some((region) => region.fills !== void 0 || region.fillStyleId !== void 0)) return [];
	return regions.map((region) => ({
		windingRule: region.windingRule,
		commandsBlob: /* @__PURE__ */ new Uint8Array(),
		fills: region.fills ? copyFills([...region.fills]) : [],
		fillStyleId: region.fillStyleId ?? ""
	}));
}
function setGeometry(target, internals, network, fillGeometry) {
	const node = raw(target, internals);
	const bounds = computeAccurateBounds(network);
	const hasGeometry = network.vertices.length > 0;
	const normalized = hasGeometry ? transformVectorNetwork([
		1,
		0,
		-bounds.x,
		0,
		1,
		-bounds.y,
		0,
		0,
		1
	], network) : structuredClone(EMPTY_NETWORK);
	const normalizedGeometry = fillGeometry.length > 0 ? regenerateFillGeometry(normalized, fillGeometry) : [];
	updateNode(target, internals, {
		x: hasGeometry ? node.x + bounds.x : node.x,
		y: hasGeometry ? node.y + bounds.y : node.y,
		width: hasGeometry ? bounds.width : 0,
		height: hasGeometry ? bounds.height : 0,
		vectorNetwork: normalized,
		fillGeometry: normalizedGeometry,
		strokeGeometry: []
	});
}
function assignVectorNetwork(target, internals, value) {
	const errors = validateVectorNetwork(value);
	if (errors.length > 0) throw new TypeError(`Invalid vectorNetwork: ${errors.join("; ")}`);
	validateRegionPaintMetadata(value.regions ?? []);
	setGeometry(target, internals, normalizeInputNetwork(value), geometryForRegions(value.regions ?? []));
}
function vectorPathsForNetwork(network) {
	if (network.segments.length === 0) return [];
	const regions = network.regions ?? [];
	if (regions.length === 0) return vectorNetworkToSVGPaths({
		...network,
		regions
	}, null).map((data) => ({
		windingRule: "NONE",
		data
	}));
	const paths = [];
	const usedSegments = /* @__PURE__ */ new Set();
	for (const region of regions) {
		for (const loop of region.loops) for (const segmentIndex of loop) usedSegments.add(segmentIndex);
		const data = vectorNetworkToSVGPaths({
			...network,
			regions: [region]
		}, null)[0];
		if (data) paths.push({
			windingRule: region.windingRule,
			data
		});
	}
	const remainingSegments = network.segments.filter((_, index) => !usedSegments.has(index));
	if (remainingSegments.length > 0) {
		const data = vectorNetworkToSVGPaths({
			vertices: network.vertices,
			segments: remainingSegments,
			regions: []
		}, null)[0];
		if (data) paths.push({
			windingRule: "NONE",
			data
		});
	}
	return paths;
}
function readVectorPaths(target, internals) {
	const node = raw(target, internals);
	const paths = node.vectorNetwork && node.vectorNetwork.segments.length > 0 ? vectorPathsForNetwork(node.vectorNetwork) : node.fillGeometry.map((geometry) => ({
		windingRule: geometry.windingRule,
		data: geometryBlobToSVGPath(geometry.commandsBlob, null)
	}));
	return Object.freeze(paths.map((path) => Object.freeze(path)));
}
function readVectorNetwork(target, internals) {
	const node = raw(target, internals);
	const network = node.vectorNetwork ?? EMPTY_NETWORK;
	const vertices = network.vertices.map((vertex) => Object.freeze({
		...vertex,
		strokeCap: vertex.strokeCap ?? node.strokeCap,
		strokeJoin: vertex.strokeJoin ?? node.strokeJoin,
		cornerRadius: vertex.cornerRadius ?? 0,
		handleMirroring: vertex.handleMirroring ?? "NONE"
	}));
	const segments = network.segments.map((segment) => Object.freeze({
		...segment,
		tangentStart: Object.freeze({ ...segment.tangentStart }),
		tangentEnd: Object.freeze({ ...segment.tangentEnd })
	}));
	const regions = (network.regions ?? []).map((region, index) => {
		const geometry = node.fillGeometry.at(index);
		return Object.freeze({
			windingRule: region.windingRule,
			loops: Object.freeze(region.loops.map((loop) => Object.freeze([...loop]))),
			fillStyleId: geometry?.fillStyleId ?? "",
			fills: Object.freeze(copyFills(geometry?.fills ?? []))
		});
	});
	return Object.freeze({
		vertices: Object.freeze(vertices),
		segments: Object.freeze(segments),
		regions: Object.freeze(regions)
	});
}
function readHandleMirroring(target, internals, mixed) {
	const node = raw(target, internals);
	const values = new Set((node.vectorNetwork?.vertices ?? []).map((vertex) => vertex.handleMirroring ?? "NONE"));
	if (values.size === 0) return node.handleMirroring;
	if (values.size > 1) return mixed;
	return values.values().next().value ?? node.handleMirroring;
}
function installVectorNodeProxyAccessors(target, internals, mixed) {
	Object.defineProperties(target, {
		vectorPaths: {
			get() {
				return readVectorPaths(this, internals);
			},
			set(value) {
				if (!Array.isArray(value)) throw new TypeError("vectorPaths must be an array");
				setGeometry(this, internals, networkFromVectorPaths(value), []);
			},
			enumerable: true,
			configurable: true
		},
		vectorNetwork: {
			get() {
				return readVectorNetwork(this, internals);
			},
			set(value) {
				assignVectorNetwork(this, internals, value);
			},
			enumerable: true,
			configurable: true
		},
		setVectorNetworkAsync: {
			value(value) {
				return Promise.resolve().then(() => assignVectorNetwork(this, internals, value));
			},
			enumerable: true,
			configurable: true
		},
		handleMirroring: {
			get() {
				return readHandleMirroring(this, internals, mixed);
			},
			set(value) {
				if (!HANDLE_MIRRORING_VALUES.has(value)) throw new TypeError(`Invalid handleMirroring: ${String(value)}`);
				const node = raw(this, internals);
				updateNode(this, internals, {
					handleMirroring: value,
					vectorNetwork: node.vectorNetwork ? {
						...node.vectorNetwork,
						vertices: node.vectorNetwork.vertices.map((vertex) => ({
							...vertex,
							handleMirroring: value
						}))
					} : null
				});
			},
			enumerable: true,
			configurable: true
		}
	});
}
//#endregion
export { installVectorNodeProxyAccessors };

//# sourceMappingURL=vector.js.map
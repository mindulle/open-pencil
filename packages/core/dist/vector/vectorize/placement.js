import { computeAccurateBounds } from "../curve-math.js";
import { regenerateFillGeometry } from "../fill-geometry.js";
import { mergeVectorNetworks } from "@open-pencil/scene-graph";
//#region src/vector/vectorize/placement.ts
function shouldTightenToContent(node, content) {
	return node.rotation === 0 && content.width > 0 && content.height > 0 && (content.x > 0 || content.y > 0 || content.width < node.width - .5 || content.height < node.height - .5);
}
function resolveVectorFramePlacement(node, content) {
	const tighten = shouldTightenToContent(node, content);
	const offsetX = tighten ? content.x : 0;
	const offsetY = tighten ? content.y : 0;
	return {
		x: node.x + offsetX,
		y: node.y + offsetY,
		width: tighten ? content.width : node.width,
		height: tighten ? content.height : node.height,
		offsetX,
		offsetY
	};
}
function offsetVectorNetwork(network, offsetX, offsetY) {
	if (offsetX === 0 && offsetY === 0) return network;
	return {
		vertices: network.vertices.map((vertex) => ({
			...vertex,
			x: vertex.x - offsetX,
			y: vertex.y - offsetY
		})),
		segments: network.segments,
		regions: network.regions
	};
}
/** Fit vector geometry to node-local coordinates and a tight width/height (pen-tool pattern). */
function normalizeVectorToNodeBounds(network) {
	if (network.vertices.length === 0) return null;
	const bounds = computeAccurateBounds(network);
	return {
		bounds,
		network: {
			vertices: network.vertices.map((vertex) => ({
				...vertex,
				x: vertex.x - bounds.x,
				y: vertex.y - bounds.y
			})),
			segments: network.segments,
			regions: network.regions
		}
	};
}
function createNormalizedVectorChild(graph, frameId, normalized, index, paints) {
	graph.createNode("VECTOR", frameId, {
		name: `path ${index + 1}`,
		x: normalized.bounds.x,
		y: normalized.bounds.y,
		width: normalized.bounds.width,
		height: normalized.bounds.height,
		vectorNetwork: normalized.network,
		...paints
	});
}
function createVectorChild(graph, frameId, path, placement, index) {
	const normalized = normalizeVectorToNodeBounds(offsetVectorNetwork(path.vectorNetwork, placement.offsetX, placement.offsetY));
	if (!normalized) return;
	createNormalizedVectorChild(graph, frameId, normalized, index, {
		fillGeometry: [],
		fills: path.fills,
		strokes: path.strokes
	});
}
function remapFillsToBounds(fills, source, target) {
	return structuredClone(fills).map((fill) => {
		const transform = fill.gradientTransform;
		if (!transform || source.width <= 0 || source.height <= 0 || target.width <= 0 || target.height <= 0) return fill;
		const scaleX = source.width / target.width;
		const scaleY = source.height / target.height;
		return {
			...fill,
			gradientTransform: {
				m00: transform.m00 * scaleX,
				m01: transform.m01 * scaleX,
				m02: (source.x - target.x) / target.width + transform.m02 * scaleX,
				m10: transform.m10 * scaleY,
				m11: transform.m11 * scaleY,
				m12: (source.y - target.y) / target.height + transform.m12 * scaleY
			}
		};
	});
}
function createFlattenedVectorChild(graph, frameId, paths, placement, index) {
	const prepared = paths.map((path) => {
		const network = offsetVectorNetwork(path.vectorNetwork, placement.offsetX, placement.offsetY);
		return {
			path,
			network,
			bounds: computeAccurateBounds(network)
		};
	});
	const normalized = normalizeVectorToNodeBounds(mergeVectorNetworks(prepared.map(({ network }) => network)));
	if (!normalized) return;
	const placeholders = prepared.flatMap(({ path, network, bounds }) => {
		const fills = remapFillsToBounds(path.fills, bounds, normalized.bounds);
		return network.regions.map((region) => ({
			windingRule: region.windingRule,
			commandsBlob: /* @__PURE__ */ new Uint8Array(0),
			fills: structuredClone(fills)
		}));
	});
	const fills = prepared[0] ? remapFillsToBounds(prepared[0].path.fills, prepared[0].bounds, normalized.bounds) : [];
	createNormalizedVectorChild(graph, frameId, normalized, index, {
		fillGeometry: regenerateFillGeometry(normalized.network, placeholders),
		fills,
		strokes: []
	});
}
function createVectorFrameChildren(graph, frameId, vectorized, placement) {
	for (const [index, path] of vectorized.paths.entries()) createVectorChild(graph, frameId, path, placement, index);
}
function isFlattenableVectorPath(path) {
	return path.fills.length > 0 && path.strokes.length === 0 && path.vectorNetwork.regions.length > 0;
}
/** Merge adjacent fill-only SVG paths without changing their paint order. */
function createFlattenedVectorFrameChildren(graph, frameId, vectorized, placement) {
	let run = [];
	const flush = () => {
		if (run.length > 1) createFlattenedVectorChild(graph, frameId, run.map(({ path }) => path), placement, run[0].index);
		else if (run[0]) createVectorChild(graph, frameId, run[0].path, placement, run[0].index);
		run = [];
	};
	for (const [index, path] of vectorized.paths.entries()) {
		if (isFlattenableVectorPath(path)) {
			run.push({
				path,
				index
			});
			continue;
		}
		flush();
		createVectorChild(graph, frameId, path, placement, index);
	}
	flush();
}
//#endregion
export { createFlattenedVectorFrameChildren, createVectorFrameChildren, resolveVectorFramePlacement };

//# sourceMappingURL=placement.js.map
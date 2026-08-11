import { readEffectiveFigmaRawField } from "./source-metadata.js";
import { VARIABLE_BINDING_FIELDS_INVERSE, alignGeometryWindingRules, applyStyleRefsToFields, convertEffects, convertFigmaDerivedTextGlyphs, convertFigmaTransformProps, convertFills, convertLetterSpacing, convertLineHeight, convertStrokes, extractBoundVariables, guidToString, importStyleRuns, mapAlignSelf, mapArcData, mapStackCounterAlign, mapStackJustify, mapStackSizing, mapTextDecoration, resolveGeometryPaths, resolveVectorStyleOverrideFills, resolvedNumericBindingUpdate } from "./node-change2.js";
import { copyInstanceComponentProps, getNodeLocalMatrix, styleToWeight } from "@open-pencil/scene-graph";
import { copyEffects, copyFills, copyGeometryPaths, copyStrokes, copyStyleRuns, hasSameCopySource, markCopySource, scaleGeometryPaths } from "@open-pencil/scene-graph/copy";
import { cloneVectorNetwork } from "@open-pencil/scene-graph/vector-network";
import { omit } from "es-toolkit/object";
import { isEqual } from "es-toolkit/predicate";
import { constrainedChildRect } from "@open-pencil/scene-graph/resize";
//#region src/instance-overrides/derived-symbol-data/geometry.ts
function resolveDsdGeometry(d, target, blobs) {
	const result = {};
	const fg = resolveGeometryPaths(d.fillGeometry, blobs, resolveVectorStyleOverrideFills(d));
	const sg = resolveGeometryPaths(d.strokeGeometry, blobs);
	if (fg.length > 0) result.fillGeometry = alignGeometryWindingRules(fg, target.vectorNetwork);
	else if (d.size && target.fillGeometry.length > 0 && target.width > 0 && target.height > 0) result.fillGeometry = scaleGeometryPaths(target.fillGeometry, d.size.x / target.width, d.size.y / target.height);
	if (sg.length > 0) result.strokeGeometry = sg;
	else if (d.size && target.strokeGeometry.length > 0 && target.width > 0 && target.height > 0) result.strokeGeometry = scaleGeometryPaths(target.strokeGeometry, d.size.x / target.width, d.size.y / target.height);
	if (d.size && target.vectorNetwork?.vertices.length) {
		const network = cloneVectorNetwork(target.vectorNetwork);
		const originX = Math.min(...network.vertices.map(({ x }) => x));
		const originY = Math.min(...network.vertices.map(({ y }) => y));
		const xs = network.vertices.map(({ x }) => x);
		const ys = network.vertices.map(({ y }) => y);
		const networkWidth = Math.max(...xs) - Math.min(...xs);
		const networkHeight = Math.max(...ys) - Math.min(...ys);
		const scaleX = networkWidth === 0 ? 1 : d.size.x / networkWidth;
		const scaleY = networkHeight === 0 ? 1 : d.size.y / networkHeight;
		for (const vertex of network.vertices) {
			vertex.x = originX + (vertex.x - originX) * scaleX;
			vertex.y = originY + (vertex.y - originY) * scaleY;
		}
		for (const segment of network.segments) {
			segment.tangentStart.x *= scaleX;
			segment.tangentStart.y *= scaleY;
			segment.tangentEnd.x *= scaleX;
			segment.tangentEnd.y *= scaleY;
		}
		result.vectorNetwork = network;
	}
	return result;
}
//#endregion
//#region src/instance-overrides/derived-symbol-data/layout.ts
function getVisibleSiblingCount(ctx, cache, parentId) {
	const cached = cache.get(parentId);
	if (cached !== void 0) return cached;
	const count = ctx.graph.getChildren(parentId).filter((child) => child.visible).length;
	cache.set(parentId, count);
	return count;
}
function resolveSizeOnlyPosition(ctx, visibleSiblingCount, node) {
	if (!node.parentId || getVisibleSiblingCount(ctx, visibleSiblingCount, node.parentId) !== 1 || !node.componentId) return null;
	const source = ctx.graph.getNode(node.componentId);
	const targetParent = ctx.graph.getNode(node.parentId);
	if (!source || !targetParent) return null;
	return source.x >= 0 && source.y >= 0 && source.x + source.width <= targetParent.width + .01 && source.y + source.height <= targetParent.height + .01 ? {
		x: source.x,
		y: source.y
	} : null;
}
function preserveTransformedPositionAfterResize(node, width, height) {
	if (node.rotation === 0 && !node.flipX && !node.flipY) return null;
	const matrix = getNodeLocalMatrix(node);
	const centerX = width / 2;
	const centerY = height / 2;
	return {
		x: matrix[2] - centerX + matrix[0] * centerX + matrix[1] * centerY,
		y: matrix[5] - centerY + matrix[3] * centerX + matrix[4] * centerY
	};
}
function buildDsdTextUpdates(d, blobs, target) {
	const updates = {};
	if (d.fontSize !== void 0) updates.fontSize = d.fontSize;
	if (d.lineHeight !== void 0) updates.lineHeight = convertLineHeight(d.lineHeight, d.fontSize);
	if (d.letterSpacing !== void 0) updates.letterSpacing = convertLetterSpacing(d.letterSpacing, d.fontSize);
	if (d.strokeWeight !== void 0 && target.strokes.length > 0) updates.strokes = target.strokes.map((stroke) => ({
		...stroke,
		weight: d.strokeWeight
	}));
	const figmaDerivedTextGlyphs = convertFigmaDerivedTextGlyphs(d.derivedTextData, blobs);
	if (figmaDerivedTextGlyphs.length > 0) updates.figmaDerivedTextGlyphs = figmaDerivedTextGlyphs;
	return updates;
}
function buildDsdLayoutUpdates(ctx, _visibleSiblingCount, d, target) {
	const updates = buildDsdTextUpdates(d, ctx.blobs, target);
	const figmaDerivedLayout = {};
	if (d.size) {
		updates.width = d.size.x;
		updates.height = d.size.y;
		figmaDerivedLayout.width = d.size.x;
		figmaDerivedLayout.height = d.size.y;
	}
	if (d.transform) {
		const transformed = convertFigmaTransformProps({
			transform: d.transform,
			size: d.size ?? {
				x: target.width,
				y: target.height
			}
		});
		updates.x = transformed.x;
		updates.y = transformed.y;
		updates.rotation = transformed.rotation;
		updates.flipX = transformed.flipX;
		updates.flipY = transformed.flipY;
		figmaDerivedLayout.x = transformed.x;
		figmaDerivedLayout.y = transformed.y;
	} else if (d.size) {
		const position = preserveTransformedPositionAfterResize(target, d.size.x, d.size.y) ?? resolveSizeOnlyPosition(ctx, _visibleSiblingCount, target);
		if (position) {
			updates.x = position.x;
			updates.y = position.y;
			figmaDerivedLayout.x = position.x;
			figmaDerivedLayout.y = position.y;
		}
	}
	if (Object.keys(figmaDerivedLayout).length > 0) updates.figmaDerivedLayout = figmaDerivedLayout;
	Object.assign(updates, resolveDsdGeometry(d, target, ctx.blobs));
	return {
		updates,
		hasSize: d.size !== void 0
	};
}
//#endregion
//#region src/instance-overrides/utils.ts
function* overrideCandidates(graph, activeNodeIds) {
	if (!activeNodeIds) {
		yield* graph.getAllNodes();
		return;
	}
	for (const id of activeNodeIds) {
		const node = graph.getNode(id);
		if (node) yield node;
	}
}
//#endregion
//#region src/instance-overrides/sync/clone-update.ts
function cloneInstanceUpdate(source, componentId, extra = {}) {
	return {
		...copyInstanceComponentProps(source),
		componentId,
		figmaDerivedLayout: source.figmaDerivedLayout ? { ...source.figmaDerivedLayout } : null,
		...extra
	};
}
//#endregion
//#region src/instance-overrides/sync/sources.ts
const refreshedCloneSourceMaps = /* @__PURE__ */ new WeakSet();
const cloneSourceIdCaches = /* @__PURE__ */ new WeakMap();
function cloneSourceIds(cloneSources) {
	let cached = cloneSourceIdCaches.get(cloneSources);
	if (!cached) {
		cached = new Map([...cloneSources].map(([sourceId, cloneIds]) => [sourceId, new Set(cloneIds)]));
		cloneSourceIdCaches.set(cloneSources, cached);
	}
	return cached;
}
function refreshCloneSources(graph, cloneSources, activeNodeIds) {
	if (refreshedCloneSourceMaps.has(cloneSources)) return;
	const knownIds = cloneSourceIds(cloneSources);
	for (const node of overrideCandidates(graph, activeNodeIds)) {
		if (!node.componentId) continue;
		let known = knownIds.get(node.componentId);
		if (!known) {
			known = /* @__PURE__ */ new Set();
			knownIds.set(node.componentId, known);
			cloneSources.set(node.componentId, []);
		}
		if (known.has(node.id)) continue;
		known.add(node.id);
		cloneSources.get(node.componentId)?.push(node.id);
	}
	refreshedCloneSourceMaps.add(cloneSources);
}
function indexCloneNodes(graph, nodeIds, cloneSources) {
	const knownIds = cloneSourceIds(cloneSources);
	for (const nodeId of nodeIds) {
		const node = graph.getNode(nodeId);
		if (!node?.componentId) continue;
		let known = knownIds.get(node.componentId);
		if (!known) {
			known = /* @__PURE__ */ new Set();
			knownIds.set(node.componentId, known);
		}
		if (known.has(node.id)) continue;
		known.add(node.id);
		const clones = cloneSources.get(node.componentId);
		if (clones) clones.push(node.id);
		else cloneSources.set(node.componentId, [node.id]);
	}
}
function indexCloneSubtree(graph, rootId, cloneSources) {
	const nodeIds = [];
	const queue = [rootId];
	let index = 0;
	while (index < queue.length) {
		const node = graph.getNode(queue[index]);
		index++;
		if (!node) continue;
		nodeIds.push(node.id);
		queue.push(...node.childIds);
	}
	indexCloneNodes(graph, nodeIds, cloneSources);
}
/** Capture clone-source identities by path before a populated branch is replaced. */
function snapshotChildSources(graph, parentId) {
	const result = [];
	const parent = graph.getNode(parentId);
	if (!parent) return result;
	const visit = (nodeId, path) => {
		const node = graph.getNode(nodeId);
		if (!node) return;
		result.push({
			id: node.id,
			path,
			type: node.type
		});
		node.childIds.forEach((childId, index) => visit(childId, [...path, index]));
	};
	parent.childIds.forEach((childId, index) => visit(childId, [index]));
	return result;
}
function resolveChildPath(graph, parentId, path) {
	let node = graph.getNode(parentId);
	if (!node) return null;
	for (const index of path) {
		const childId = node.childIds[index];
		if (!childId) return null;
		node = graph.getNode(childId);
		if (!node) return null;
	}
	return node;
}
function cloneIdsForReplacement(graph, previousId, replacementId, cloneSources) {
	return /* @__PURE__ */ new Set([
		...cloneSources?.get(previousId) ?? [],
		...cloneSources?.get(replacementId) ?? [],
		...graph.instanceIndex.get(previousId) ?? [],
		...graph.instanceIndex.get(replacementId) ?? []
	]);
}
function indexReplacementClone(cloneSources, replacementId, cloneId) {
	if (!cloneSources) return;
	const sourceIds = cloneSourceIds(cloneSources);
	let known = sourceIds.get(replacementId);
	if (!known) {
		known = /* @__PURE__ */ new Set();
		sourceIds.set(replacementId, known);
	}
	if (known.has(cloneId)) return;
	known.add(cloneId);
	let replacements = cloneSources.get(replacementId);
	if (!replacements) {
		replacements = [];
		cloneSources.set(replacementId, replacements);
	}
	replacements.push(cloneId);
}
/**
* Redirect descendants that cloned the removed branch to its structural
* replacements. Without this, deep instances keep componentId references to
* deleted nodes and miss later text, visibility, and geometry synchronization.
*/
function remapRepopulatedChildSources(graph, parentId, previousSources, cloneSources, activeNodeIds) {
	if (cloneSources) refreshCloneSources(graph, cloneSources, activeNodeIds);
	for (const previous of previousSources) {
		const replacement = resolveChildPath(graph, parentId, previous.path);
		if (!replacement || replacement.type !== previous.type) continue;
		const cloneIds = cloneIdsForReplacement(graph, previous.id, replacement.id, cloneSources);
		for (const cloneId of cloneIds) {
			const clone = graph.getNode(cloneId);
			if (clone?.componentId !== previous.id && clone?.componentId !== replacement.id) continue;
			graph.updateNode(cloneId, cloneInstanceUpdate(replacement, replacement.id));
			indexReplacementClone(cloneSources, replacement.id, cloneId);
		}
	}
}
//#endregion
//#region src/instance-overrides/resolve.ts
const MAX_CHAIN_DEPTH = 20;
const siblingIndexCache = /* @__PURE__ */ new WeakMap();
const siblingGroupCache = /* @__PURE__ */ new WeakMap();
const candidateCache = /* @__PURE__ */ new WeakMap();
const componentFindCache = /* @__PURE__ */ new WeakMap();
const sourcePathCache = /* @__PURE__ */ new WeakMap();
const overridePathTargetCache = /* @__PURE__ */ new WeakMap();
/**
* Pre-compute componentId root for every node.
*
* Must run while all internal-page nodes are still alive. After overrides,
* instance swaps delete intermediate clones, breaking the chain.
* DSD resolution uses this to match across clone levels.
*/
function preComputeRoots(ctx) {
	function resolve(nodeId, depth = 0) {
		const cached = ctx.preComputedRoot.get(nodeId);
		if (cached !== void 0) return cached;
		if (depth > MAX_CHAIN_DEPTH) return nodeId;
		const node = ctx.graph.getNode(nodeId);
		if (node?.componentId && node.componentId !== nodeId) {
			const root = resolve(node.componentId, depth + 1);
			ctx.preComputedRoot.set(nodeId, root);
			return root;
		}
		ctx.preComputedRoot.set(nodeId, nodeId);
		return nodeId;
	}
	for (const node of overrideCandidates(ctx.graph, ctx.activeNodeIds)) {
		if (!node.componentId) continue;
		resolve(node.id);
		const clones = ctx.preComputedClones.get(node.componentId);
		if (clones) clones.push(node.id);
		else ctx.preComputedClones.set(node.componentId, [node.id]);
	}
}
/**
* Walk the componentId chain to the ultimate source COMPONENT.
* Falls back to kiwi symbolData for deleted internal-page nodes.
*/
function getComponentRoot(ctx, nodeId, depth = 0) {
	const cached = ctx.componentIdRoot.get(nodeId);
	if (cached !== void 0) return cached;
	if (depth > MAX_CHAIN_DEPTH) {
		ctx.componentIdRoot.set(nodeId, nodeId);
		return nodeId;
	}
	const node = ctx.graph.getNode(nodeId);
	if (node?.componentId) {
		const root = getComponentRoot(ctx, node.componentId, depth + 1);
		ctx.componentIdRoot.set(nodeId, root);
		return root;
	}
	const figmaId = ctx.nodeIdToGuid.get(nodeId);
	if (figmaId) {
		const symId = ctx.changeMap.get(figmaId)?.symbolData?.symbolID;
		if (symId) {
			const compNodeId = ctx.guidToNodeId.get(guidToString(symId));
			if (compNodeId && compNodeId !== nodeId) {
				const root = getComponentRoot(ctx, compNodeId, depth + 1);
				ctx.componentIdRoot.set(nodeId, root);
				return root;
			}
		}
	}
	ctx.componentIdRoot.set(nodeId, nodeId);
	return nodeId;
}
/**
* Find a descendant whose componentId matches, walking recursively.
*
* Pass 1: exact componentId on direct children.
* Pass 2: root match — only if exactly one child shares the root (avoids
*         ambiguity when multiple siblings share the same root).
* Pass 3: recurse into children.
*/
function buildSiblingGroups(ctx) {
	const groups = /* @__PURE__ */ new Map();
	for (const [id, sibling] of ctx.changeMap) {
		const siblingParent = sibling.parentIndex?.guid ? guidToString(sibling.parentIndex.guid) : null;
		const siblingSymbol = sibling.symbolData?.symbolID ? guidToString(sibling.symbolData.symbolID) : null;
		if (!siblingParent || !siblingSymbol) continue;
		const groupKey = `${siblingParent}\0${siblingSymbol}`;
		const group = groups.get(groupKey);
		if (group) group.push(id);
		else groups.set(groupKey, [id]);
	}
	for (const group of groups.values()) group.sort((aId, bId) => {
		const a = ctx.changeMap.get(aId);
		const b = ctx.changeMap.get(bId);
		return (a?.transform?.m12 ?? 0) - (b?.transform?.m12 ?? 0) || (a?.transform?.m02 ?? 0) - (b?.transform?.m02 ?? 0);
	});
	return groups;
}
function getSiblingGroups(ctx) {
	const cached = siblingGroupCache.get(ctx);
	if (cached) return cached;
	const groups = buildSiblingGroups(ctx);
	siblingGroupCache.set(ctx, groups);
	return groups;
}
function sourceSiblingIndex(ctx, sourceId) {
	let cache = siblingIndexCache.get(ctx);
	if (!cache) {
		cache = /* @__PURE__ */ new Map();
		siblingIndexCache.set(ctx, cache);
	}
	if (cache.has(sourceId)) return cache.get(sourceId) ?? null;
	const nc = ctx.changeMap.get(sourceId);
	const parentId = nc?.parentIndex?.guid ? guidToString(nc.parentIndex.guid) : null;
	const symbolId = nc?.symbolData?.symbolID ? guidToString(nc.symbolData.symbolID) : null;
	if (!nc || !parentId || !symbolId) {
		cache.set(sourceId, null);
		return null;
	}
	const index = (getSiblingGroups(ctx).get(`${parentId}\0${symbolId}`) ?? []).indexOf(sourceId);
	const result = index !== -1 ? index : null;
	cache.set(sourceId, result);
	return result;
}
function sourcePathToNode(ctx, sourceRootId, targetId) {
	let cache = sourcePathCache.get(ctx);
	if (!cache) {
		cache = /* @__PURE__ */ new Map();
		sourcePathCache.set(ctx, cache);
	}
	const cacheKey = `${sourceRootId}\0${targetId}`;
	if (cache.has(cacheKey)) return cache.get(cacheKey) ?? null;
	const visit = (nodeId, path) => {
		const node = ctx.graph.getNode(nodeId);
		if (!node) return null;
		if (nodeId === targetId || node.componentId === targetId) return path;
		for (let index = 0; index < node.childIds.length; index++) {
			const result = visit(node.childIds[index], [...path, index]);
			if (result) return result;
		}
		return null;
	};
	const result = visit(sourceRootId, []);
	cache.set(cacheKey, result);
	return result;
}
function findNodeBySourcePath(ctx, currentId, targetId) {
	const current = ctx.graph.getNode(currentId);
	if (!current?.componentId) return null;
	const path = sourcePathToNode(ctx, current.componentId, targetId);
	if (!path) return null;
	let target = current;
	for (const index of path) {
		const childId = target.childIds[index];
		if (!childId) return null;
		const child = ctx.graph.getNode(childId);
		if (!child) return null;
		target = child;
	}
	return target.id;
}
function findNodeByNameAndType(ctx, parentId, name, type) {
	if (!name || !type) return null;
	let match = null;
	let count = 0;
	const visit = (id) => {
		if (count > 1) return;
		const node = ctx.graph.getNode(id);
		if (!node) return;
		if (node.name === name && node.type === type) {
			count++;
			match = id;
		}
		for (const childId of node.childIds) visit(childId);
	};
	visit(parentId);
	return count === 1 ? match : null;
}
function findNodeBySourceSiblingIndex(ctx, parentId, componentId, sourceId) {
	const index = sourceSiblingIndex(ctx, sourceId);
	if (index == null) return null;
	const targetRoot = ctx.preComputedRoot.get(componentId) ?? getComponentRoot(ctx, componentId);
	let cache = candidateCache.get(ctx);
	if (!cache) {
		cache = /* @__PURE__ */ new Map();
		candidateCache.set(ctx, cache);
	}
	const cacheKey = `${parentId}\0${targetRoot}`;
	let candidates = cache.get(cacheKey);
	if (!candidates) {
		candidates = [];
		const collect = (id) => {
			const node = ctx.graph.getNode(id);
			if (!node) return;
			if (node.componentId) {
				if ((ctx.preComputedRoot.get(node.componentId) ?? getComponentRoot(ctx, node.componentId)) === targetRoot) candidates?.push(id);
			}
			for (const childId of node.childIds) collect(childId);
		};
		collect(parentId);
		candidates.sort((aId, bId) => {
			const a = ctx.graph.getNode(aId);
			const b = ctx.graph.getNode(bId);
			return (a?.y ?? 0) - (b?.y ?? 0) || (a?.x ?? 0) - (b?.x ?? 0);
		});
		cache.set(cacheKey, candidates);
	}
	return candidates[index] ?? null;
}
function findNodeByComponentId(ctx, parentId, componentId) {
	let cache = componentFindCache.get(ctx);
	if (!cache) {
		cache = /* @__PURE__ */ new Map();
		componentFindCache.set(ctx, cache);
	}
	const cacheKey = `${parentId}\0${componentId}`;
	if (cache.has(cacheKey)) return cache.get(cacheKey) ?? null;
	const parent = ctx.graph.getNode(parentId);
	if (!parent) return null;
	for (const childId of parent.childIds) if (ctx.graph.getNode(childId)?.componentId === componentId) {
		cache.set(cacheKey, childId);
		return childId;
	}
	const targetRoot = ctx.preComputedRoot.get(componentId) ?? getComponentRoot(ctx, componentId);
	if (targetRoot) {
		let rootMatch = null;
		let ambiguous = false;
		for (const childId of parent.childIds) {
			const child = ctx.graph.getNode(childId);
			if (!child?.componentId) continue;
			if ((ctx.preComputedRoot.get(child.componentId) ?? getComponentRoot(ctx, child.componentId)) === targetRoot) {
				if (rootMatch) {
					ambiguous = true;
					break;
				}
				rootMatch = childId;
			}
		}
		if (rootMatch && !ambiguous) {
			cache.set(cacheKey, rootMatch);
			return rootMatch;
		}
	}
	for (const childId of parent.childIds) {
		const deep = findNodeByComponentId(ctx, childId, componentId);
		if (deep) {
			cache.set(cacheKey, deep);
			return deep;
		}
	}
	return null;
}
/**
* Resolve a guidPath to a target node within an instance subtree.
*
* Each GUID in the path identifies an overrideKey → source id → graph node.
* The chain walks from the instance down to the target.
*/
function resolveOverrideStep(ctx, currentId, sourceId, remapped, targetNc) {
	if (!remapped) return findNodeByNameAndType(ctx, currentId, targetNc?.name, targetNc?.type);
	if (ctx.graph.getNode(currentId)?.componentId === remapped) return currentId;
	return findNodeBySourcePath(ctx, currentId, remapped) ?? findNodeByComponentId(ctx, currentId, remapped) ?? findNodeBySourceSiblingIndex(ctx, currentId, remapped, sourceId) ?? findNodeByNameAndType(ctx, currentId, targetNc?.name, targetNc?.type);
}
function resolveOverrideTarget(ctx, instanceId, guids) {
	let pathTargets = overridePathTargetCache.get(ctx);
	if (!pathTargets) {
		pathTargets = /* @__PURE__ */ new Map();
		overridePathTargetCache.set(ctx, pathTargets);
	}
	let currentId = instanceId;
	const path = [];
	for (let index = 0; index < guids.length; index++) {
		const key = guidToString(guids[index]);
		path.push(key);
		const pathKey = `${instanceId}\0${path.join("/")}`;
		const cachedTarget = pathTargets.get(pathKey);
		if (cachedTarget && ctx.graph.getNode(cachedTarget)) {
			currentId = cachedTarget;
			continue;
		}
		if (cachedTarget) pathTargets.delete(pathKey);
		const sourceId = ctx.overrideKeyToGuid.get(key) ?? key;
		const targetNc = ctx.changeMap.get(sourceId);
		const symbolGuid = targetNc?.symbolData?.symbolID ? guidToString(targetNc.symbolData.symbolID) : null;
		const remapped = ctx.guidToNodeId.get(sourceId) ?? (symbolGuid ? ctx.guidToNodeId.get(symbolGuid) : void 0);
		const resolved = resolveOverrideStep(ctx, currentId, sourceId, remapped, targetNc);
		if (resolved) {
			currentId = resolved;
			pathTargets.set(pathKey, resolved);
			continue;
		}
		const parent = ctx.graph.getNode(currentId);
		if (parent?.childIds.length === 1) {
			currentId = parent.childIds[0];
			index--;
			path.pop();
			continue;
		}
		return null;
	}
	return currentId;
}
/**
* Repopulate an INSTANCE node with children from a new component (instance swap).
* Only renames when the current name matches the root component name (preserves
* user-given names). Clears the componentIdRoot cache after changing the tree.
*/
function collectStyledStrokeDescendants(ctx, nodeId) {
	const result = [];
	const visit = (id) => {
		const node = ctx.graph.getNode(id);
		if (!node) return;
		if (node.strokes.length > 0) result.push(copyStrokes(node.strokes));
		for (const childId of node.childIds) visit(childId);
	};
	visit(nodeId);
	return result;
}
function applyStrokeDescendants(ctx, nodeId, strokes) {
	let index = 0;
	const visit = (id) => {
		const node = ctx.graph.getNode(id);
		if (!node) return;
		if (node.strokes.length > 0) {
			if (index < strokes.length) ctx.graph.preserveSourceMetadataDuring(() => {
				ctx.graph.updateNode(id, { strokes: copyStrokes(strokes[index]) });
			});
			index++;
		}
		for (const childId of node.childIds) visit(childId);
	};
	visit(nodeId);
}
function componentInstanceName(ctx, component) {
	if (!component) return "";
	const parent = component.parentId ? ctx.graph.getNode(component.parentId) : void 0;
	return parent?.type === "COMPONENT_SET" ? parent.name : component.name;
}
function swappedRootProps(node, component) {
	const props = copyInstanceComponentProps(component);
	props.width = node.width;
	props.height = node.height;
	props.boundVariables = { ...props.boundVariables };
	for (const field of ["width", "height"]) {
		const binding = node.boundVariables[field];
		if (binding) props.boundVariables[field] = binding;
	}
	return props;
}
function repopulateInstance(ctx, nodeId, compId) {
	const node = ctx.graph.getNode(nodeId);
	if (node?.type !== "INSTANCE") return;
	const previousStrokes = collectStyledStrokeDescendants(ctx, nodeId);
	const previousSources = snapshotChildSources(ctx.graph, nodeId);
	const rootCompId = node.componentId ? getComponentRoot(ctx, node.componentId) : void 0;
	const rootComp = rootCompId ? ctx.graph.getNode(rootCompId) : void 0;
	for (const childId of Array.from(node.childIds)) ctx.graph.deleteNode(childId);
	const comp = ctx.graph.getNode(compId);
	const updates = comp ? {
		...swappedRootProps(node, comp),
		componentId: compId
	} : { componentId: compId };
	const previousName = componentInstanceName(ctx, rootComp);
	const nextName = componentInstanceName(ctx, comp);
	if (nextName && previousName && (node.name === previousName || node.name === rootComp?.name)) updates.name = nextName;
	ctx.graph.preserveSourceMetadataDuring(() => ctx.graph.updateNode(nodeId, updates));
	if (comp && comp.childIds.length > 0) {
		ctx.graph.populateInstanceChildren(nodeId, compId, "fig-import");
		indexCloneSubtree(ctx.graph, nodeId, ctx.preComputedClones);
		applyStrokeDescendants(ctx, nodeId, previousStrokes);
	}
	remapRepopulatedChildSources(ctx.graph, nodeId, previousSources, ctx.preComputedClones, ctx.activeNodeIds);
	ctx.swappedInstances.add(nodeId);
	ctx.componentIdRoot.clear();
	candidateCache.delete(ctx);
	componentFindCache.delete(ctx);
}
//#endregion
//#region src/instance-overrides/patches/protection.ts
const PROP_TO_PROTECTED_FIELD = {
	text: "text",
	visible: "visible",
	opacity: "opacity",
	fills: "fills",
	strokes: "strokes",
	effects: "effects",
	styleRuns: "styleRuns",
	layoutGrow: "layoutGrow",
	textAutoResize: "textAutoResize",
	locked: "locked",
	x: "x",
	y: "y",
	width: "width",
	height: "height",
	figmaDerivedLayout: "figmaDerivedLayout",
	fontSize: "fontSize",
	lineHeight: "lineHeight",
	letterSpacing: "letterSpacing",
	fillGeometry: "fillGeometry",
	strokeGeometry: "strokeGeometry"
};
function protectField(protections, nodeId, field) {
	const fields = protections.get(nodeId);
	if (fields) fields.add(field);
	else protections.set(nodeId, /* @__PURE__ */ new Set([field]));
}
function protectPatchProps(protections, nodeId, props) {
	for (const key of Object.keys(props)) {
		const field = PROP_TO_PROTECTED_FIELD[key];
		if (field) protectField(protections, nodeId, field);
	}
}
function isFieldProtected(protections, nodeId, field) {
	return protections?.get(nodeId)?.has(field) === true;
}
//#endregion
//#region src/instance-overrides/patches/apply.ts
function preserveStrokeShapeProps(target, updates) {
	if (!updates.strokes) return;
	updates.strokes = updates.strokes.map((stroke, index) => {
		if (index >= target.strokes.length) return {
			...stroke,
			cap: target.strokeCap,
			join: target.strokeJoin,
			dashPattern: target.dashPattern
		};
		const existing = target.strokes[index];
		return {
			...stroke,
			cap: existing.cap,
			join: existing.join,
			dashPattern: existing.dashPattern
		};
	});
}
function applyOverridePatch(ctx, patch) {
	let changed = false;
	if (patch.swapComponentId) {
		repopulateInstance(ctx, patch.targetId, patch.swapComponentId);
		protectField(ctx.protectedFields, patch.targetId, "structure");
		changed = true;
	}
	if (patch.props && Object.keys(patch.props).length > 0) {
		const target = ctx.graph.getNode(patch.targetId);
		if (target) {
			const props = patch.props;
			if (props.boundVariables) props.boundVariables = {
				...target.boundVariables,
				...props.boundVariables
			};
			preserveStrokeShapeProps(target, props);
			ctx.graph.preserveSourceMetadataDuring(() => ctx.graph.updateNode(patch.targetId, props));
			protectPatchProps(ctx.protectedFields, patch.targetId, props);
			changed = true;
		}
	}
	return changed;
}
//#endregion
//#region src/instance-overrides/sync/fields.ts
function canSync(protections, targetId, field) {
	return !isFieldProtected(protections, targetId, field);
}
function assignDirectUpdate(key, source, updates) {
	switch (key) {
		case "text":
			updates.text = source.text;
			break;
		case "visible":
			updates.visible = source.visible;
			break;
		case "opacity":
			updates.opacity = source.opacity;
			break;
		case "locked":
			updates.locked = source.locked;
			break;
		case "layoutGrow":
			updates.layoutGrow = source.layoutGrow;
			break;
		case "textAutoResize":
			updates.textAutoResize = source.textAutoResize;
			break;
	}
}
function directSync(key, field) {
	return (source, target, updates, protections) => {
		if (source[key] !== target[key] && canSync(protections, target.id, field)) assignDirectUpdate(key, source, updates);
	};
}
const DIRECT_SYNCERS = [
	directSync("text", "text"),
	directSync("visible", "visible"),
	directSync("opacity", "opacity"),
	directSync("locked", "locked"),
	directSync("layoutGrow", "layoutGrow"),
	directSync("textAutoResize", "textAutoResize")
];
function assignCopiedUpdate(key, source, updates) {
	switch (key) {
		case "fills":
			updates.fills = markCopySource(source.fills, copyFills(source.fills));
			break;
		case "strokes":
			updates.strokes = markCopySource(source.strokes, copyStrokes(source.strokes));
			break;
		case "effects":
			updates.effects = markCopySource(source.effects, copyEffects(source.effects));
			break;
		case "styleRuns":
			updates.styleRuns = markCopySource(source.styleRuns, copyStyleRuns(source.styleRuns));
			break;
	}
}
function syncPaintBindings(key, source, target, updates) {
	const prefix = `${key}/`;
	const currentBindings = updates.boundVariables ?? target.boundVariables;
	const bindings = omit(currentBindings, Object.keys(currentBindings).filter((field) => field.startsWith(prefix)));
	for (const [field, variableId] of Object.entries(source.boundVariables)) if (field.startsWith(prefix)) bindings[field] = variableId;
	updates.boundVariables = bindings;
}
function copiedSync(key, field) {
	return (source, target, updates, protections) => {
		if (!hasSameCopySource(source[key], target[key]) && canSync(protections, target.id, field)) {
			assignCopiedUpdate(key, source, updates);
			if (key === "fills" || key === "strokes") syncPaintBindings(key, source, target, updates);
		}
	};
}
const COPIED_SYNCERS = [
	copiedSync("fills", "fills"),
	copiedSync("strokes", "strokes"),
	copiedSync("effects", "effects"),
	copiedSync("styleRuns", "styleRuns")
];
function syncScalarBinding(key, source, target, updates) {
	const sourceVariableId = source.boundVariables[key];
	if (target.boundVariables[key] === sourceVariableId) return;
	const bindings = { ...updates.boundVariables ?? target.boundVariables };
	if (sourceVariableId) bindings[key] = sourceVariableId;
	updates.boundVariables = sourceVariableId ? bindings : omit(bindings, [key]);
}
function syncFields(source, target, updates, protections) {
	for (const sync of DIRECT_SYNCERS) sync(source, target, updates, protections);
	for (const sync of COPIED_SYNCERS) sync(source, target, updates, protections);
	syncScalarBinding("opacity", source, target, updates);
}
function syncNodeProps(graph, source, target, protections) {
	const updates = {};
	syncFields(source, target, updates, protections);
	if (Object.keys(updates).length > 0) graph.updateNode(target.id, updates);
}
//#endregion
//#region src/instance-overrides/sync/clones.ts
function recloneChildren(graph, srcChildId, tgtNode, swappedInstances, protections, cloneSources, activeNodeIds) {
	const srcChild = graph.getNode(srcChildId);
	if (!srcChild) return;
	const effectiveCloneSources = cloneSources ?? buildClonesMap(graph, activeNodeIds);
	const previousSources = snapshotChildSources(graph, tgtNode.id);
	for (const childId of Array.from(tgtNode.childIds)) graph.deleteNode(childId);
	graph.updateNode(tgtNode.id, cloneInstanceUpdate(srcChild, srcChild.componentId, { name: srcChild.name }));
	syncNodeProps(graph, srcChild, tgtNode, protections);
	if (srcChild.childIds.length > 0) {
		graph.populateInstanceChildren(tgtNode.id, srcChildId, "fig-import");
		indexCloneSubtree(graph, tgtNode.id, effectiveCloneSources);
	}
	remapRepopulatedChildSources(graph, tgtNode.id, previousSources, effectiveCloneSources, activeNodeIds);
	swappedInstances.add(tgtNode.id);
}
function syncChildrenDeep(graph, sourceId, targetId, swappedInstances, skip, protections, cloneSources, activeNodeIds) {
	const src = graph.getNode(sourceId);
	const tgt = graph.getNode(targetId);
	if (!src || !tgt) return;
	const effectiveCloneSources = cloneSources ?? buildClonesMap(graph, activeNodeIds);
	const len = Math.min(src.childIds.length, tgt.childIds.length);
	for (let i = 0; i < len; i++) {
		if (skip?.has(tgt.childIds[i])) continue;
		const srcNode = graph.getNode(src.childIds[i]);
		const tgtNode = graph.getNode(tgt.childIds[i]);
		if (!srcNode || !tgtNode || srcNode.type !== tgtNode.type) continue;
		if (srcNode.type === "INSTANCE" && srcNode.componentId !== tgtNode.componentId) {
			recloneChildren(graph, src.childIds[i], tgtNode, swappedInstances, protections, effectiveCloneSources, activeNodeIds);
			continue;
		}
		syncNodeProps(graph, srcNode, tgtNode, protections);
		syncChildrenDeep(graph, src.childIds[i], tgt.childIds[i], swappedInstances, skip, protections, effectiveCloneSources, activeNodeIds);
	}
}
function buildClonesMap(graph, activeNodeIds) {
	const clonesOf = /* @__PURE__ */ new Map();
	for (const node of overrideCandidates(graph, activeNodeIds)) {
		if (!node.componentId) continue;
		let arr = clonesOf.get(node.componentId);
		if (!arr) {
			arr = [];
			clonesOf.set(node.componentId, arr);
		}
		arr.push(node.id);
	}
	return clonesOf;
}
//#endregion
//#region src/instance-overrides/sync/propagate.ts
function expandSeedsToParents(graph, seeds) {
	const expanded = new Set(seeds);
	for (const seedId of seeds) {
		let cur = graph.getNode(seedId);
		while (cur?.parentId) {
			const parent = graph.getNode(cur.parentId);
			if (!parent) break;
			if (parent.type === "INSTANCE" || parent.type === "COMPONENT") expanded.add(parent.id);
			cur = parent;
		}
	}
	return expanded;
}
function buildNeedsSyncSet(expandedSeeds, clonesOf) {
	const needsSync = /* @__PURE__ */ new Set();
	const queue = [...expandedSeeds];
	for (let id = queue.pop(); id !== void 0; id = queue.pop()) {
		const clones = clonesOf.get(id);
		if (!clones) continue;
		for (const cloneId of clones) {
			if (needsSync.has(cloneId)) continue;
			needsSync.add(cloneId);
			queue.push(cloneId);
		}
	}
	return needsSync;
}
function mergeCloneLineage(current, preComputed) {
	if (!preComputed) return current;
	const merged = /* @__PURE__ */ new Map();
	for (const source of [preComputed, current]) for (const [sourceId, cloneIds] of source) {
		const existing = merged.get(sourceId);
		if (existing) {
			for (const cloneId of cloneIds) if (!existing.includes(cloneId)) existing.push(cloneId);
		} else merged.set(sourceId, [...cloneIds]);
	}
	return merged;
}
function propagateNodePropsTransitively(graph, seeds, activeNodeIds, protections, preComputedClones) {
	if (seeds.size === 0) return;
	const clonesOf = mergeCloneLineage(buildClonesMap(graph, activeNodeIds), preComputedClones);
	const visited = new Set(seeds);
	const queue = [...seeds].map((id) => ({
		lineageId: id,
		sourceId: id
	}));
	let index = 0;
	while (index < queue.length) {
		const { lineageId, sourceId } = queue[index];
		index++;
		const source = graph.getNode(sourceId);
		if (!source) continue;
		for (const cloneId of clonesOf.get(lineageId) ?? []) {
			if (visited.has(cloneId)) continue;
			visited.add(cloneId);
			const clone = graph.getNode(cloneId);
			if (clone) syncNodeProps(graph, source, clone, protections);
			queue.push({
				lineageId: cloneId,
				sourceId: clone?.id ?? sourceId
			});
		}
	}
}
function propagateOverridesTransitively(graph, seeds, swappedInstances, componentIdRoot, protect, activeNodeIds, protections) {
	if (seeds.size === 0) return;
	componentIdRoot.clear();
	const clonesOf = buildClonesMap(graph, activeNodeIds);
	const expandedSeeds = expandSeedsToParents(graph, seeds);
	const needsSync = buildNeedsSyncSet(expandedSeeds, clonesOf);
	const skip = protect && protect.size > 0 ? /* @__PURE__ */ new Set([...seeds, ...protect]) : seeds;
	const visited = /* @__PURE__ */ new Set();
	const syncQueue = [...expandedSeeds];
	let index = 0;
	while (index < syncQueue.length) {
		const sourceId = syncQueue[index];
		index++;
		const clones = clonesOf.get(sourceId);
		if (!clones) continue;
		const source = graph.getNode(sourceId);
		if (!source) continue;
		for (const cloneId of clones) {
			if (!needsSync.has(cloneId) || visited.has(cloneId)) continue;
			visited.add(cloneId);
			const node = graph.getNode(cloneId);
			if (!node) continue;
			if (skip.has(cloneId)) {
				syncQueue.push(cloneId);
				continue;
			}
			syncNodeProps(graph, source, node, protections);
			if (source.childIds.length !== node.childIds.length) {
				const previousSources = snapshotChildSources(graph, node.id);
				for (const childId of Array.from(node.childIds)) graph.deleteNode(childId);
				if (source.childIds.length > 0) {
					graph.populateInstanceChildren(node.id, sourceId, "fig-import");
					indexCloneSubtree(graph, node.id, clonesOf);
				}
				remapRepopulatedChildSources(graph, node.id, previousSources, clonesOf, activeNodeIds);
			} else if (source.childIds.length > 0 && node.childIds.length > 0) syncChildrenDeep(graph, sourceId, node.id, swappedInstances, skip, protections, clonesOf, activeNodeIds);
			syncQueue.push(cloneId);
		}
	}
}
//#endregion
//#region src/instance-overrides/derived-symbol-data/propagate.ts
function buildSizeOverriddenCloneUpdates(source, clone) {
	if (clone.type !== "INSTANCE" || !source.figmaDerivedLayout) return {};
	const sourceLayout = source.figmaDerivedLayout;
	return {
		...sourceLayout.x === void 0 ? {} : { x: sourceLayout.x },
		...sourceLayout.y === void 0 ? {} : { y: sourceLayout.y },
		figmaDerivedLayout: {
			...sourceLayout,
			...clone.figmaDerivedLayout,
			x: sourceLayout.x ?? clone.figmaDerivedLayout?.x,
			y: sourceLayout.y ?? clone.figmaDerivedLayout?.y
		}
	};
}
function buildCloneUpdates(ctx, source, clone, cloneId, sizeSet) {
	const updates = {};
	if (sizeSet.has(cloneId)) return buildSizeOverriddenCloneUpdates(source, clone);
	if (source.width !== clone.width) updates.width = source.width;
	if (source.height !== clone.height) updates.height = source.height;
	if (source.x !== clone.x) updates.x = source.x;
	if (source.y !== clone.y) updates.y = source.y;
	if (!ctx.geometryOverrideNodes.has(cloneId)) {
		if (source.fillGeometry !== clone.fillGeometry) updates.fillGeometry = copyGeometryPaths(source.fillGeometry);
		if (source.strokeGeometry !== clone.strokeGeometry) updates.strokeGeometry = copyGeometryPaths(source.strokeGeometry);
	}
	if (source.text === clone.text && source.figmaDerivedTextGlyphs) updates.figmaDerivedTextGlyphs = structuredClone(source.figmaDerivedTextGlyphs);
	if (source.text === clone.text && source.figmaDerivedLayout) updates.figmaDerivedLayout = { ...source.figmaDerivedLayout };
	return updates;
}
function reconcileEffectiveCloneGeometry(ctx, scaledInstanceIds) {
	restoreScaledInstanceLeafBounds(ctx, scaledInstanceIds);
	restoreThinCloneCrossPositions(ctx);
}
function restoreScaledInstanceLeafBounds(ctx, scaledInstanceIds) {
	for (const instanceId of scaledInstanceIds) {
		const instance = ctx.graph.getNode(instanceId);
		if (instance?.layoutMode !== "NONE" || instance.childIds.length !== 1) continue;
		const child = ctx.graph.getNode(instance.childIds[0]);
		if (!child || child.childIds.length > 0 || child.horizontalConstraint !== "SCALE" || child.verticalConstraint !== "SCALE") continue;
		const width = child.figmaDerivedLayout?.width;
		const height = child.figmaDerivedLayout?.height;
		const restoresDerivedBounds = width !== void 0 && height !== void 0;
		const restoresImageBounds = !restoresDerivedBounds && child.type === "ROUNDED_RECTANGLE" && child.fills.some((fill) => fill.type === "IMAGE");
		if (!restoresDerivedBounds && !restoresImageBounds) continue;
		const restoredWidth = width ?? instance.width;
		const restoredHeight = height ?? instance.height;
		if (child.width === restoredWidth && child.height === restoredHeight) continue;
		ctx.graph.updateNode(child.id, {
			width: restoredWidth,
			height: restoredHeight
		});
	}
}
function isThinCenteredCrossChild(parent, clone) {
	if (parent.counterAxisAlign !== "CENTER") return false;
	if (parent.layoutMode === "HORIZONTAL") return clone.height <= 1 && clone.width > clone.height;
	if (parent.layoutMode === "VERTICAL") return clone.width <= 1 && clone.height > clone.width;
	return false;
}
function thinCloneCrossPosition(graph, clone) {
	if (clone.source.format !== null || !clone.componentId || !clone.name.endsWith("Divider") || !clone.parentId || clone.figmaDerivedLayout?.x !== void 0 || clone.figmaDerivedLayout?.y !== void 0) return null;
	const parent = graph.getNode(clone.parentId);
	const source = graph.getNode(clone.componentId);
	const sourceLayout = source?.figmaDerivedLayout;
	if (!parent || !source || sourceLayout?.x === void 0 || sourceLayout.y === void 0) return null;
	if (clone.width !== source.width || clone.height !== source.height) return null;
	if (!isThinCenteredCrossChild(parent, clone)) return null;
	return parent.layoutMode === "HORIZONTAL" ? {
		axis: "y",
		position: sourceLayout.y
	} : {
		axis: "x",
		position: sourceLayout.x
	};
}
function restoreThinCloneCrossPositions(ctx) {
	for (const clone of overrideCandidates(ctx.graph, ctx.activeNodeIds)) {
		const crossPosition = thinCloneCrossPosition(ctx.graph, clone);
		if (!crossPosition) continue;
		ctx.graph.updateNode(clone.id, { figmaDerivedLayout: {
			...clone.figmaDerivedLayout,
			[crossPosition.axis]: crossPosition.position
		} });
	}
}
function applyGeneratedFreeformStretch(ctx) {
	for (const node of overrideCandidates(ctx.graph, ctx.activeNodeIds)) {
		if (node.source.format === "fig" || !node.figmaDerivedLayout || !node.parentId || node.layoutPositioning === "ABSOLUTE") continue;
		const parent = ctx.graph.getNode(node.parentId);
		if (!parent || parent.source.format === "fig" || parent.layoutMode !== "NONE" || !parent.figmaDerivedLayout) continue;
		const updates = {};
		if (node.horizontalConstraint === "STRETCH" && node.figmaDerivedLayout.width !== void 0 && node.figmaDerivedLayout.width === parent.figmaDerivedLayout.width) updates.width = node.figmaDerivedLayout.width;
		if (node.verticalConstraint === "STRETCH" && node.figmaDerivedLayout.height !== void 0 && node.figmaDerivedLayout.height === parent.figmaDerivedLayout.height) updates.height = node.figmaDerivedLayout.height;
		if (Object.keys(updates).length > 0) ctx.graph.updateNode(node.id, updates);
	}
}
function propagateDsdChanges(ctx, modified, sizeSet) {
	if (modified.size === 0) return;
	const clonesOf = buildClonesMap(ctx.graph, ctx.activeNodeIds);
	const queue = [...modified];
	const visited = /* @__PURE__ */ new Set();
	let index = 0;
	while (index < queue.length) {
		const sourceId = queue[index];
		index++;
		const source = ctx.graph.getNode(sourceId);
		if (!source) continue;
		const clones = clonesOf.get(sourceId);
		if (!clones) continue;
		for (const cloneId of clones) {
			if (visited.has(cloneId)) continue;
			visited.add(cloneId);
			const clone = ctx.graph.getNode(cloneId);
			if (!clone) continue;
			const updates = buildCloneUpdates(ctx, source, clone, cloneId, sizeSet);
			if (Object.keys(updates).length > 0) ctx.graph.preserveSourceMetadataDuring(() => ctx.graph.updateNode(cloneId, updates));
			queue.push(cloneId);
		}
	}
}
//#endregion
//#region src/instance-overrides/clone-index.ts
function buildCloneIndex(ctx) {
	const clonesBySource = /* @__PURE__ */ new Map();
	for (const [sourceId, nodeIds] of ctx.graph.instanceIndex) for (const nodeId of nodeIds) {
		if (ctx.activeNodeIds && !ctx.activeNodeIds.has(nodeId)) continue;
		if (ctx.graph.getNode(nodeId)?.type !== "INSTANCE") continue;
		const clones = clonesBySource.get(sourceId);
		if (clones) clones.push(nodeId);
		else clonesBySource.set(sourceId, [nodeId]);
	}
	return clonesBySource;
}
function instanceAndClones(instanceNodeId, clonesBySource, cache) {
	const cached = cache.get(instanceNodeId);
	if (cached) return cached;
	const result = [];
	const seen = /* @__PURE__ */ new Set();
	const visit = (id) => {
		if (seen.has(id)) return;
		seen.add(id);
		result.push(id);
		for (const cloneId of clonesBySource.get(id) ?? []) visit(cloneId);
	};
	visit(instanceNodeId);
	cache.set(instanceNodeId, result);
	return result;
}
//#endregion
//#region src/instance-overrides/component-props/values.ts
function normalizePropName(value) {
	return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function stringToGuidParts(value) {
	const [sessionID, localID] = value.split(":").map(Number);
	return {
		sessionID,
		localID
	};
}
function propTextCharacters(value) {
	if (typeof value.textValue === "string") return value.textValue;
	return value.textValue?.characters ?? value.textDataValue?.characters;
}
function isEmptyPropValue(v) {
	return v.boolValue === void 0 && v.textValue === void 0 && v.textDataValue === void 0 && v.guidValue === void 0;
}
function resolveAssignmentValue(ctx, assignment, key, resolveDefaults) {
	if (!isEmptyPropValue(assignment.value)) return assignment.value;
	const variableValue = assignment.varValue?.value;
	if (variableValue?.symbolIdValue?.guid) return { guidValue: variableValue.symbolIdValue.guid };
	if (variableValue?.boolValue !== void 0) return { boolValue: variableValue.boolValue };
	if (variableValue?.textValue !== void 0) return { textValue: variableValue.textValue };
	if (variableValue?.textDataValue !== void 0) return { textDataValue: variableValue.textDataValue };
	return resolveDefaults ? ctx.propDefaults.get(key) ?? assignment.value : assignment.value;
}
function assignmentsToValueMap(ctx, assignments, resolveDefaults = false) {
	const valueByDef = /* @__PURE__ */ new Map();
	for (const assignment of assignments) {
		if (!assignment.defID) continue;
		const key = guidToString(assignment.defID);
		valueByDef.set(key, resolveAssignmentValue(ctx, assignment, key, resolveDefaults));
	}
	return valueByDef;
}
//#endregion
//#region src/instance-overrides/component-props/apply.ts
function applyPatchAndMark(ctx, childId, patch, modified) {
	if (applyOverridePatch(ctx, patch)) modified?.add(childId);
}
function applyVisibleProp(ctx, childId, val, modified) {
	if (val.boolValue === void 0) return;
	applyPatchAndMark(ctx, childId, {
		targetId: childId,
		source: "component-prop",
		props: { visible: val.boolValue }
	}, modified);
}
function applyTextProp(ctx, childId, val, modified) {
	const child = ctx.graph.getNode(childId);
	const text = propTextCharacters(val);
	if (text === void 0 || child?.type !== "TEXT") return;
	const source = child.componentId ? ctx.graph.getNode(child.componentId) : null;
	const props = { text };
	if (source?.type === "TEXT" && source.text === text) {
		props.width = source.width;
		props.height = source.height;
		props.fills = copyFills(source.fills);
		props.styleRuns = copyStyleRuns(source.styleRuns);
		props.figmaDerivedTextGlyphs = source.figmaDerivedTextGlyphs ? structuredClone(source.figmaDerivedTextGlyphs) : void 0;
	}
	applyPatchAndMark(ctx, childId, {
		targetId: childId,
		source: "component-prop",
		props
	}, modified);
}
function applySwapProp(ctx, childId, val, modified) {
	const swapId = propTextCharacters(val) ?? (val.guidValue ? guidToString(val.guidValue) : void 0);
	const newCompId = swapId ? ctx.guidToNodeId.get(swapId) : void 0;
	if (!newCompId) return;
	applyPatchAndMark(ctx, childId, {
		targetId: childId,
		source: "component-prop",
		swapComponentId: getComponentRoot(ctx, newCompId)
	}, modified);
}
function applyComponentPropRef(ctx, childId, ref, val, modified) {
	switch (ref.componentPropNodeField) {
		case "VISIBLE":
			applyVisibleProp(ctx, childId, val, modified);
			break;
		case "TEXT_DATA":
			applyTextProp(ctx, childId, val, modified);
			break;
		case "OVERRIDDEN_SYMBOL_ID":
			applySwapProp(ctx, childId, val, modified);
			break;
	}
}
//#endregion
//#region src/instance-overrides/component-props/refs.ts
function findPropRefs(ctx, nodeId, propRefsMap) {
	let sourceId = nodeId;
	for (let depth = 0; sourceId && depth < 10; depth++) {
		const node = ctx.graph.getNode(sourceId);
		const overrideKey = node?.overrideKey ? ctx.overrideKeyToGuid.get(node.overrideKey) ?? node.overrideKey : void 0;
		const figmaId = ctx.nodeIdToGuid.get(sourceId) ?? overrideKey;
		if (figmaId) {
			const refs = propRefsMap.get(figmaId);
			if (refs) return refs;
		}
		const nextId = node?.componentId ?? void 0;
		if (nextId === sourceId) break;
		sourceId = nextId;
	}
}
function fallbackRefsForChild(ctx, childName, valueByDef) {
	const normalizedChildName = normalizePropName(childName);
	const refs = [];
	for (const defId of valueByDef.keys()) {
		const propName = ctx.propNames.get(defId);
		if (propName && normalizePropName(propName) === normalizedChildName) refs.push({
			defID: stringToGuidParts(defId),
			componentPropNodeField: "VISIBLE"
		});
	}
	return refs.length > 0 ? refs : void 0;
}
function valueForRef(ref, valueByDef) {
	return ref.defID ? valueByDef.get(guidToString(ref.defID)) : void 0;
}
//#endregion
//#region src/instance-overrides/component-props/assignments.ts
function applyChildPropRefs(ctx, childId, refs, valueByDef, modified) {
	if (!refs) return;
	for (const ref of refs) {
		const val = valueForRef(ref, valueByDef);
		if (val) applyComponentPropRef(ctx, childId, ref, val, modified);
	}
}
function sourceChildPropRefs(ctx, sourceParentId, child, propRefsMap) {
	if (!sourceParentId) return void 0;
	const sourceParent = ctx.graph.getNode(sourceParentId);
	if (!sourceParent) return void 0;
	let fallbackMatchId;
	for (const sourceChildId of sourceParent.childIds) {
		const sourceChild = ctx.graph.getNode(sourceChildId);
		if (!sourceChild) continue;
		if (sourceChild.id === child.componentId || sourceChild.componentId && sourceChild.componentId === child.componentId) return findPropRefs(ctx, sourceChild.id, propRefsMap) ?? [];
		if (!fallbackMatchId && sourceChild.name === child.name && sourceChild.type === child.type) fallbackMatchId = sourceChild.id;
	}
	return fallbackMatchId ? findPropRefs(ctx, fallbackMatchId, propRefsMap) : void 0;
}
function applyPropAssignments(ctx, parentId, valueByDef, propRefsMap, modified) {
	const parent = ctx.graph.getNode(parentId);
	if (!parent) return;
	for (const childId of parent.childIds) {
		const child = ctx.graph.getNode(childId);
		if (!child?.componentId) {
			applyPropAssignments(ctx, childId, valueByDef, propRefsMap, modified);
			continue;
		}
		applyChildPropRefs(ctx, childId, sourceChildPropRefs(ctx, parent.componentId, child, propRefsMap) ?? findPropRefs(ctx, child.componentId, propRefsMap) ?? fallbackRefsForChild(ctx, child.name, valueByDef), valueByDef, modified);
		applyPropAssignments(ctx, childId, valueByDef, propRefsMap, modified);
	}
}
function applyInstanceDirectAssignments(ctx, assignmentSources, propRefsMap, modified) {
	for (const [figmaId, assignments] of assignmentSources) {
		const nodeId = ctx.guidToNodeId.get(figmaId);
		if (!nodeId || ctx.activeNodeIds && !ctx.activeNodeIds.has(nodeId)) continue;
		if (ctx.graph.getNode(nodeId)?.type !== "INSTANCE") continue;
		applyPropAssignments(ctx, nodeId, assignmentsToValueMap(ctx, assignments), propRefsMap, modified);
	}
}
function applyOverrideAssignments(ctx, propRefsMap, modified) {
	const clonesBySource = buildCloneIndex(ctx);
	const clonesByInstance = /* @__PURE__ */ new Map();
	for (const [figmaId, nc] of ctx.changeMap) {
		const instanceNodeId = ctx.guidToNodeId.get(figmaId);
		if (!instanceNodeId || ctx.activeNodeIds && !ctx.activeNodeIds.has(instanceNodeId)) continue;
		if (ctx.graph.getNode(instanceNodeId)?.type !== "INSTANCE") continue;
		const overrides = nc.symbolData?.symbolOverrides;
		if (!overrides) continue;
		for (const ov of overrides) {
			if (!ov.componentPropAssignments?.length) continue;
			const guids = ov.guidPath?.guids;
			if (!guids?.length) continue;
			const valueByDef = assignmentsToValueMap(ctx, ov.componentPropAssignments, true);
			for (const targetInstanceId of instanceAndClones(instanceNodeId, clonesBySource, clonesByInstance)) {
				const targetId = resolveOverrideTarget(ctx, targetInstanceId, guids);
				if (!targetId) continue;
				applyPropAssignments(ctx, targetId, valueByDef, propRefsMap, modified);
			}
		}
	}
}
//#endregion
//#region src/instance-overrides/component-props/maps.ts
function collectPropRefsMap(ctx) {
	if (ctx.componentPropRefsMap) return ctx.componentPropRefsMap;
	const result = /* @__PURE__ */ new Map();
	for (const [figmaId, nc] of ctx.changeMap) if (nc.componentPropRefs?.length) result.set(figmaId, nc.componentPropRefs);
	ctx.componentPropRefsMap = result;
	return result;
}
function collectAssignmentsMap(ctx) {
	if (ctx.componentPropAssignmentsMap) return ctx.componentPropAssignmentsMap;
	const result = /* @__PURE__ */ new Map();
	for (const [figmaId, nc] of ctx.changeMap) if (nc.componentPropAssignments?.length) result.set(figmaId, nc.componentPropAssignments);
	ctx.componentPropAssignmentsMap = result;
	return result;
}
//#endregion
//#region src/instance-overrides/component-props/index.ts
/**
* Apply all component property assignments (visibility toggles, instance swaps).
*
* Returns the set of modified node IDs so the caller can run a second
* transitive sync to propagate the changes to deeper clones.
*/
function applyComponentProperties(ctx) {
	const modified = /* @__PURE__ */ new Set();
	const propRefsMap = collectPropRefsMap(ctx);
	if (propRefsMap.size === 0) return modified;
	applyInstanceDirectAssignments(ctx, collectAssignmentsMap(ctx), propRefsMap, modified);
	applyOverrideAssignments(ctx, propRefsMap, modified);
	return modified;
}
//#endregion
//#region src/instance-overrides/constraints.ts
const MAX_CLONE_CHAIN_DEPTH = 10;
/**
* Apply SCALE constraint resizing to children of instances whose size
* differs from their component's original size, then propagate the
* changes through clone chains.
*/
function applyConstraintScaling(ctx) {
	const { graph } = ctx;
	const scaled = /* @__PURE__ */ new Set();
	for (const node of overrideCandidates(graph, ctx.activeNodeIds)) {
		if (node.type !== "INSTANCE" || !node.componentId) continue;
		const comp = graph.getNode(node.componentId);
		if (!comp || comp.width <= 0 || comp.height <= 0) continue;
		const scale = resolveInstanceScale(graph, node, comp);
		if (!scale) continue;
		positionPinnedAbsoluteChildren(ctx, node, scale.basis);
		if (node.layoutMode !== "NONE") continue;
		const { sx, sy } = scale;
		if (Math.abs(sx - 1) < .001 && Math.abs(sy - 1) < .001) continue;
		const figmaId = ctx.nodeIdToGuid.get(node.id);
		const strokeScale = figmaId ? ctx.changeMap.get(figmaId)?.strokeWeight : void 0;
		scaleChildren(graph, node, comp, sx, sy, scaled, ctx.geometryOverrideNodes, scale.useCurrentChildAsSource, strokeScale, scale.scaleThroughFixedWrappers);
	}
	if (scaled.size > 0) propagateScaling(ctx, scaled);
}
function resolveInstanceScale(graph, instance, component) {
	const targetAspectRatio = resolveTargetAspectRatio(instance);
	const resolvedBasis = resolveScaleBasis(graph, instance, component);
	if (!targetAspectRatio && !resolvedBasis) return null;
	const basis = resolvedBasis ?? component;
	return {
		basis,
		scaleThroughFixedWrappers: targetAspectRatio !== null,
		sx: instance.width / basis.width,
		sy: instance.height / basis.height,
		useCurrentChildAsSource: basis !== component
	};
}
function resolveTargetAspectRatio(instance) {
	const rawTarget = readEffectiveFigmaRawField(instance, "targetAspectRatio");
	if (!rawTarget || typeof rawTarget !== "object" || !("value" in rawTarget)) return null;
	const value = rawTarget.value;
	if (!value || typeof value !== "object" || !("x" in value) || !("y" in value)) return null;
	const { x, y } = value;
	if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y) || x <= 0 || y <= 0) return null;
	return {
		width: x,
		height: y
	};
}
function isCloneOfSource(graph, child, sourceId) {
	let current = child;
	for (let depth = 0; depth < MAX_CLONE_CHAIN_DEPTH && current?.componentId; depth++) {
		if (current.componentId === sourceId) return true;
		current = graph.getNode(current.componentId);
	}
	return false;
}
function pinnedPositionUpdates(ctx, child, resized) {
	const updates = {};
	const horizontalPinned = child.horizontalConstraint === "MAX" || child.horizontalConstraint === "CENTER";
	const verticalPinned = child.verticalConstraint === "MAX" || child.verticalConstraint === "CENTER";
	if (horizontalPinned && child.figmaDerivedLayout?.x === void 0 && !isFieldProtected(ctx.protectedFields, child.id, "x") && child.x !== resized.x) updates.x = resized.x;
	if (verticalPinned && child.figmaDerivedLayout?.y === void 0 && !isFieldProtected(ctx.protectedFields, child.id, "y") && child.y !== resized.y) updates.y = resized.y;
	return updates;
}
function stretchedChildSizeUpdates(ctx, child, resized) {
	const updates = {};
	if (child.horizontalConstraint === "STRETCH" && child.figmaDerivedLayout?.width === void 0 && !isFieldProtected(ctx.protectedFields, child.id, "width") && child.width !== resized.width) updates.width = resized.width;
	if (child.verticalConstraint === "STRETCH" && child.figmaDerivedLayout?.height === void 0 && !isFieldProtected(ctx.protectedFields, child.id, "height") && child.height !== resized.height) updates.height = resized.height;
	return updates;
}
function pinnedChildUpdates(ctx, child, resized) {
	return {
		...pinnedPositionUpdates(ctx, child, resized),
		...stretchedChildSizeUpdates(ctx, child, resized)
	};
}
function positionPinnedAbsoluteChildren(ctx, instance, source) {
	const count = Math.min(instance.childIds.length, source.childIds.length);
	for (let index = 0; index < count; index++) {
		const child = ctx.graph.getNode(instance.childIds[index]);
		const sourceChild = ctx.graph.getNode(source.childIds[index]);
		if (!child || !sourceChild || child.layoutPositioning !== "ABSOLUTE") continue;
		if (child.componentId && !isCloneOfSource(ctx.graph, child, sourceChild.id)) continue;
		const updates = pinnedChildUpdates(ctx, child, constrainedChildRect(sourceChild, source, instance, child.horizontalConstraint, child.verticalConstraint));
		if (Object.keys(updates).length > 0) ctx.graph.updateNode(child.id, updates);
	}
}
function resolveScaleBasis(graph, instance, component) {
	if (instance.width !== component.width || instance.height !== component.height) return component;
	let source = component;
	for (let depth = 0; depth < MAX_CLONE_CHAIN_DEPTH && source.type === "INSTANCE" && source.componentId; depth++) {
		const next = graph.getNode(source.componentId);
		if (!next || next.width <= 0 || next.height <= 0) break;
		if (instance.width !== next.width || instance.height !== next.height) return next;
		source = next;
	}
	return null;
}
function scaleVectorNetwork(network, sx, sy) {
	if (!network) return null;
	return {
		vertices: network.vertices.map((vertex) => ({
			...vertex,
			x: vertex.x * sx,
			y: vertex.y * sy
		})),
		segments: network.segments.map((segment) => ({
			...segment,
			tangentStart: {
				x: segment.tangentStart.x * sx,
				y: segment.tangentStart.y * sy
			},
			tangentEnd: {
				x: segment.tangentEnd.x * sx,
				y: segment.tangentEnd.y * sy
			}
		})),
		regions: structuredClone(network.regions)
	};
}
function scaledStrokes(source, child, shapeScaleX, shapeScaleY, strokeScale) {
	if (source.strokes.length !== child.strokes.length) return void 0;
	if (Math.abs(shapeScaleX - shapeScaleY) >= .001) return void 0;
	const scale = strokeScale ?? 1;
	return child.strokes.map((stroke, strokeIndex) => ({
		...stroke,
		weight: source.strokes[strokeIndex].weight * scale
	}));
}
function scaledGeometryUpdates(source, shapeScaleX, shapeScaleY, hasDerivedGeometry) {
	const updates = {};
	if (!hasDerivedGeometry && source.fillGeometry.length > 0) updates.fillGeometry = scaleGeometryPaths(source.fillGeometry, shapeScaleX, shapeScaleY);
	if (!hasDerivedGeometry && source.strokeGeometry.length > 0) updates.strokeGeometry = scaleGeometryPaths(source.strokeGeometry, shapeScaleX, shapeScaleY);
	if (source.vectorNetwork) updates.vectorNetwork = scaleVectorNetwork(source.vectorNetwork, shapeScaleX, shapeScaleY);
	return updates;
}
function scaleDescendantAxes(graph, node, cache) {
	const cached = cache.get(node.id);
	if (cached) return cached;
	const result = {
		horizontal: false,
		vertical: false
	};
	for (const child of graph.getChildren(node.id)) {
		const nested = scaleDescendantAxes(graph, child, cache);
		result.horizontal ||= child.horizontalConstraint === "SCALE" || nested.horizontal;
		result.vertical ||= child.verticalConstraint === "SCALE" || nested.vertical;
		if (result.horizontal && result.vertical) break;
	}
	cache.set(node.id, result);
	return result;
}
function childScaleAxes(graph, child, scaleThroughFixedWrappers, cache) {
	const descendantAxes = scaleDescendantAxes(graph, child, cache);
	return {
		horizontal: child.horizontalConstraint === "SCALE" || scaleThroughFixedWrappers && descendantAxes.horizontal,
		vertical: child.verticalConstraint === "SCALE" || scaleThroughFixedWrappers && descendantAxes.vertical
	};
}
function scaleChildren(graph, instance, comp, sx, sy, scaled, geometryOverrideNodes, useCurrentChildAsSource = false, strokeScale, scaleThroughFixedWrappers = false, descendantScaleCache = /* @__PURE__ */ new Map()) {
	const len = Math.min(instance.childIds.length, comp.childIds.length);
	for (let i = 0; i < len; i++) {
		const child = graph.getNode(instance.childIds[i]);
		const compChild = graph.getNode(comp.childIds[i]);
		if (!child || !compChild) continue;
		const scaleAxes = childScaleAxes(graph, child, scaleThroughFixedWrappers, descendantScaleCache);
		const hScale = scaleAxes.horizontal;
		const vScale = scaleAxes.vertical;
		if (!hScale && !vScale) continue;
		const updates = {};
		const source = useCurrentChildAsSource ? child : compChild;
		if (hScale) {
			updates.x = source.x * sx;
			updates.width = source.width * sx;
		}
		if (vScale) {
			updates.y = source.y * sy;
			updates.height = source.height * sy;
		}
		const shapeScaleX = hScale ? sx : 1;
		const shapeScaleY = vScale ? sy : 1;
		Object.assign(updates, scaledGeometryUpdates(source, shapeScaleX, shapeScaleY, geometryOverrideNodes.has(child.id)));
		updates.strokes = scaledStrokes(source, child, shapeScaleX, shapeScaleY, strokeScale);
		graph.updateNode(child.id, updates);
		scaled.add(child.id);
		if (child.childIds.length > 0 && compChild.childIds.length > 0) scaleChildren(graph, child, compChild, hScale ? sx : 1, vScale ? sy : 1, scaled, geometryOverrideNodes, useCurrentChildAsSource, strokeScale, scaleThroughFixedWrappers, descendantScaleCache);
	}
}
function propagateScaling(ctx, scaled) {
	const { graph } = ctx;
	const clonesOf = buildClonesMap(graph, ctx.activeNodeIds);
	const queue = [...scaled];
	const visited = /* @__PURE__ */ new Set();
	let index = 0;
	while (index < queue.length) {
		const srcId = queue[index];
		index++;
		const source = graph.getNode(srcId);
		if (!source) continue;
		const clones = clonesOf.get(srcId);
		if (!clones) continue;
		for (const cloneId of clones) {
			if (visited.has(cloneId)) continue;
			visited.add(cloneId);
			const clone = graph.getNode(cloneId);
			if (!clone) continue;
			const cu = {};
			if (clone.width !== source.width) cu.width = source.width;
			if (clone.height !== source.height) cu.height = source.height;
			if (clone.x !== source.x) cu.x = source.x;
			if (clone.y !== source.y) cu.y = source.y;
			if (!ctx.geometryOverrideNodes.has(cloneId)) {
				if (source.fillGeometry.length > 0) cu.fillGeometry = copyGeometryPaths(source.fillGeometry);
				if (source.strokeGeometry.length > 0) cu.strokeGeometry = copyGeometryPaths(source.strokeGeometry);
				if (source.vectorNetwork) cu.vectorNetwork = structuredClone(source.vectorNetwork);
			}
			if (source.strokes.length === clone.strokes.length) cu.strokes = clone.strokes.map((stroke, strokeIndex) => ({
				...stroke,
				weight: source.strokes[strokeIndex].weight
			}));
			if (Object.keys(cu).length > 0) graph.updateNode(cloneId, cu);
			queue.push(cloneId);
		}
	}
}
//#endregion
//#region src/instance-overrides/derived-symbol-data/index.ts
function applyDsdOverride(ctx, visibleSiblingCount, nodeId, d, modified, sizeSet) {
	const guids = d.guidPath?.guids;
	if (!guids?.length) return;
	const targetId = resolveOverrideTarget(ctx, nodeId, guids);
	if (!targetId) return;
	if (targetId === nodeId) {
		sizeSet.add(nodeId);
		return;
	}
	const target = ctx.graph.getNode(targetId);
	if (!target) return;
	const { updates, hasSize } = buildDsdLayoutUpdates(ctx, visibleSiblingCount, d, target);
	if (d.fillGeometry?.length || d.strokeGeometry?.length) ctx.geometryOverrideNodes.add(targetId);
	if (Object.keys(updates).length === 0) return;
	if (applyOverridePatch(ctx, {
		targetId,
		source: "derived-symbol-data",
		props: updates
	})) modified.add(targetId);
	if (hasSize) sizeSet.add(targetId);
}
function resolveDsdUpdates(ctx) {
	const modified = /* @__PURE__ */ new Set();
	const sizeSet = /* @__PURE__ */ new Set();
	const visibleSiblingCount = /* @__PURE__ */ new Map();
	for (const [ncId, nc] of ctx.changeMap) {
		if (nc.type !== "INSTANCE") continue;
		const derived = nc.derivedSymbolData;
		if (!derived?.length) continue;
		const nodeId = ctx.guidToNodeId.get(ncId);
		if (!nodeId || ctx.activeNodeIds && !ctx.activeNodeIds.has(nodeId)) continue;
		for (const d of derived) applyDsdOverride(ctx, visibleSiblingCount, nodeId, d, modified, sizeSet);
	}
	return {
		modified,
		sizeSet
	};
}
function applyDerivedSymbolData(ctx) {
	const { modified, sizeSet } = resolveDsdUpdates(ctx);
	propagateDsdChanges(ctx, modified, sizeSet);
}
//#endregion
//#region src/instance-overrides/populate.ts
/**
* Populate empty INSTANCE nodes from their source components.
*
* Instances must be populated bottom-up: if an instance's source is
* itself an unpopulated instance, populate the source first so cloned
* children are complete.
*/
function collectSubtreeIds(graph, rootIds) {
	const result = /* @__PURE__ */ new Set();
	const queue = [...rootIds];
	let index = 0;
	while (index < queue.length) {
		const id = queue[index];
		index++;
		if (result.has(id)) continue;
		result.add(id);
		const node = graph.getNode(id);
		if (node) queue.push(...node.childIds);
	}
	return result;
}
function populateInstances(graph, rootIds) {
	const visiting = /* @__PURE__ */ new Set();
	function ensurePopulated(nodeId) {
		const node = graph.getNode(nodeId);
		if (node?.type !== "INSTANCE" || !node.componentId || node.childIds.length > 0) return;
		if (visiting.has(nodeId)) return;
		visiting.add(nodeId);
		const comp = graph.getNode(node.componentId);
		if (!comp) return;
		if (comp.type === "INSTANCE" && comp.componentId && comp.childIds.length === 0) ensurePopulated(comp.id);
		for (const childId of comp.childIds) {
			const child = graph.getNode(childId);
			if (child?.type === "INSTANCE" && child.componentId && child.childIds.length === 0) ensurePopulated(childId);
		}
		if (comp.childIds.length > 0 && node.childIds.length === 0) graph.populateInstanceChildren(nodeId, node.componentId, "fig-import");
	}
	if (!rootIds) {
		for (const node of graph.nodes.values()) if (node.type === "INSTANCE" && node.componentId && node.childIds.length === 0) ensurePopulated(node.id);
		return;
	}
	const queue = [...rootIds];
	const visited = /* @__PURE__ */ new Set();
	let index = 0;
	while (index < queue.length) {
		const nodeId = queue[index];
		index++;
		if (!nodeId || visited.has(nodeId)) continue;
		visited.add(nodeId);
		ensurePopulated(nodeId);
		const node = graph.getNode(nodeId);
		if (!node) continue;
		queue.push(...node.childIds);
	}
	return collectSubtreeIds(graph, rootIds);
}
//#endregion
//#region src/instance-overrides/symbol/props.ts
function applyOverridePaints(ov, updates) {
	if (ov.textData != null) {
		const td = ov.textData;
		if (td.characters != null) updates.text = td.characters;
		const runs = importStyleRuns(ov);
		if (runs.length > 0) updates.styleRuns = runs;
	}
	if (ov.fillPaints != null) updates.fills = convertFills(ov.fillPaints);
	if (ov.strokePaints != null) updates.strokes = convertStrokes(ov.strokePaints, ov.strokeWeight, ov.strokeAlign);
	if (ov.fillPaints != null || ov.strokePaints != null) {
		const bindings = extractBoundVariables(ov);
		if (Object.keys(bindings).length > 0) updates.boundVariables = bindings;
	}
	if (ov.effects != null) updates.effects = convertEffects(ov.effects);
	if (ov.visible != null) updates.visible = ov.visible;
	if (ov.opacity != null) updates.opacity = ov.opacity;
	if (ov.name != null) updates.name = ov.name;
	if (ov.locked != null) updates.locked = ov.locked;
}
function applyOverrideGeometry(ov, updates) {
	if (ov.size != null) {
		const sz = ov.size;
		if (sz.x != null) updates.width = sz.x;
		if (sz.y != null) updates.height = sz.y;
	}
	if (ov.cornerRadius != null) updates.cornerRadius = ov.cornerRadius;
	if (ov.rectangleTopLeftCornerRadius != null) updates.topLeftRadius = ov.rectangleTopLeftCornerRadius;
	if (ov.rectangleTopRightCornerRadius != null) updates.topRightRadius = ov.rectangleTopRightCornerRadius;
	if (ov.rectangleBottomRightCornerRadius != null) updates.bottomRightRadius = ov.rectangleBottomRightCornerRadius;
	if (ov.rectangleBottomLeftCornerRadius != null) updates.bottomLeftRadius = ov.rectangleBottomLeftCornerRadius;
	if (ov.rectangleCornerRadiiIndependent != null) updates.independentCorners = ov.rectangleCornerRadiiIndependent;
	if (ov.arcData != null) updates.arcData = mapArcData(ov.arcData);
	if (ov.frameMaskDisabled != null) updates.clipsContent = ov.frameMaskDisabled === false;
}
function applyOverrideLayout(ov, updates) {
	if (ov.stackSpacing != null) updates.itemSpacing = ov.stackSpacing;
	if (ov.stackPrimarySizing != null) updates.primaryAxisSizing = mapStackSizing(ov.stackPrimarySizing);
	if (ov.stackCounterSizing != null) updates.counterAxisSizing = mapStackSizing(ov.stackCounterSizing);
	if (ov.stackPrimaryAlignItems != null) updates.primaryAxisAlign = mapStackJustify(ov.stackPrimaryAlignItems);
	if (ov.stackCounterAlignItems != null) updates.counterAxisAlign = mapStackCounterAlign(ov.stackCounterAlignItems);
	if (ov.stackChildPrimaryGrow != null) updates.layoutGrow = ov.stackChildPrimaryGrow;
	if (ov.stackChildAlignSelf != null) updates.layoutAlignSelf = mapAlignSelf(ov.stackChildAlignSelf);
	if (ov.stackPositioning != null) updates.layoutPositioning = ov.stackPositioning === "ABSOLUTE" ? "ABSOLUTE" : "AUTO";
	if (ov.stackVerticalPadding != null) {
		updates.paddingTop = ov.stackVerticalPadding;
		if (ov.stackPaddingBottom == null) updates.paddingBottom = ov.stackVerticalPadding;
	}
	if (ov.stackHorizontalPadding != null) {
		updates.paddingLeft = ov.stackHorizontalPadding;
		if (ov.stackPaddingRight == null) updates.paddingRight = ov.stackHorizontalPadding;
	}
	if (ov.stackPaddingBottom != null) updates.paddingBottom = ov.stackPaddingBottom;
	if (ov.stackPaddingRight != null) updates.paddingRight = ov.stackPaddingRight;
}
function applyOverrideStrokes(ov, updates) {
	if (ov.strokeWeight != null && !ov.strokePaints && updates.strokes) for (const stroke of updates.strokes) stroke.weight = ov.strokeWeight;
	if (ov.strokeAlign != null && updates.strokes) {
		let align = "CENTER";
		if (ov.strokeAlign === "INSIDE") align = "INSIDE";
		else if (ov.strokeAlign === "OUTSIDE") align = "OUTSIDE";
		for (const s of updates.strokes) s.align = align;
	}
	if (ov.borderTopWeight != null) updates.borderTopWeight = ov.borderTopWeight;
	if (ov.borderRightWeight != null) updates.borderRightWeight = ov.borderRightWeight;
	if (ov.borderBottomWeight != null) updates.borderBottomWeight = ov.borderBottomWeight;
	if (ov.borderLeftWeight != null) updates.borderLeftWeight = ov.borderLeftWeight;
	if (ov.borderStrokeWeightsIndependent != null) updates.independentStrokeWeights = ov.borderStrokeWeightsIndependent;
}
function applyOverrideText(ov, updates) {
	if (ov.fontName != null) {
		const fn = ov.fontName;
		if (fn.family) updates.fontFamily = fn.family;
		if (fn.style) {
			updates.fontWeight = styleToWeight(fn.style);
			updates.italic = fn.style.toLowerCase().includes("italic");
		}
	}
	if (ov.fontSize != null) updates.fontSize = ov.fontSize;
	if (ov.textAlignHorizontal != null) updates.textAlignHorizontal = ov.textAlignHorizontal;
	if (ov.textAutoResize != null) updates.textAutoResize = ov.textAutoResize;
	if (ov.lineHeight != null) updates.lineHeight = convertLineHeight(ov.lineHeight, ov.fontSize);
	if (ov.letterSpacing != null) updates.letterSpacing = convertLetterSpacing(ov.letterSpacing, ov.fontSize);
	if (ov.maxLines != null) updates.maxLines = ov.maxLines;
	if (ov.textTruncation != null) updates.textTruncation = ov.textTruncation === "ENDING" ? "ENDING" : "DISABLED";
	if (ov.textDecoration != null) updates.textDecoration = mapTextDecoration(ov.textDecoration);
}
function convertOverrideToProps(ov) {
	const updates = {};
	applyOverridePaints(ov, updates);
	applyOverrideGeometry(ov, updates);
	applyOverrideLayout(ov, updates);
	applyOverrideStrokes(ov, updates);
	applyOverrideText(ov, updates);
	return updates;
}
//#endregion
//#region src/instance-overrides/symbol/patches.ts
const VARIABLE_RADIUS_FIELDS = /* @__PURE__ */ new Set([
	"RECTANGLE_TOP_LEFT_CORNER_RADIUS",
	"RECTANGLE_TOP_RIGHT_CORNER_RADIUS",
	"RECTANGLE_BOTTOM_LEFT_CORNER_RADIUS",
	"RECTANGLE_BOTTOM_RIGHT_CORNER_RADIUS"
]);
function assetRefKey(assetRef) {
	return assetRef.version ? `${assetRef.key}@${assetRef.version}` : assetRef.key;
}
function resolveAliasId(alias, assetRefs) {
	if (alias.guid) return guidToString(alias.guid);
	const assetRef = alias.assetRef;
	if (!assetRef?.key) return void 0;
	return assetRefs.get(assetRefKey(assetRef)) ?? assetRefs.get(assetRef.key);
}
function resolveFloatVariable(ctx, id, assetRefs, depth = 0) {
	if (depth > 10) return void 0;
	const entry = ctx.changeMap.get(id)?.variableDataValues?.entries?.[0];
	if (!entry) return void 0;
	const value = entry.variableData.value;
	if (!value) return void 0;
	if (typeof value.floatValue === "number") return value.floatValue;
	const alias = value.alias;
	const aliasId = alias ? resolveAliasId(alias, assetRefs) : void 0;
	return aliasId ? resolveFloatVariable(ctx, aliasId, assetRefs, depth + 1) : void 0;
}
function applyVariableRadiusOverrides(ctx, fields, props) {
	const entries = fields.variableConsumptionMap?.entries;
	if (!entries?.length) return;
	const assetRefs = ctx.assetRefToGuid;
	for (const entry of entries) {
		const variableField = entry.variableField;
		if (!variableField || !VARIABLE_RADIUS_FIELDS.has(variableField)) continue;
		const alias = entry.variableData?.value?.alias;
		const id = alias ? resolveAliasId(alias, assetRefs) : void 0;
		const value = id ? resolveFloatVariable(ctx, id, assetRefs) : void 0;
		if (typeof value !== "number") continue;
		const field = VARIABLE_BINDING_FIELDS_INVERSE[variableField];
		if (field === "topLeftRadius") props.topLeftRadius = value;
		else if (field === "topRightRadius") props.topRightRadius = value;
		else if (field === "bottomRightRadius") props.bottomRightRadius = value;
		else if (field === "bottomLeftRadius") props.bottomLeftRadius = value;
	}
}
function patchFromSymbolOverride(ctx, targetId, ov) {
	const patch = {
		targetId,
		source: "symbol-override"
	};
	if (ov.overriddenSymbolID) {
		const swapGuid = guidToString(ov.overriddenSymbolID);
		patch.swapComponentId = ctx.guidToNodeId.get(swapGuid);
	}
	const fields = { ...ov };
	delete fields.guidPath;
	delete fields.overriddenSymbolID;
	delete fields.componentPropAssignments;
	if (Object.keys(fields).length > 0) {
		applyStyleRefsToFields(ctx.changeMap, fields);
		const props = convertOverrideToProps(fields);
		applyVariableRadiusOverrides(ctx, fields, props);
		if (Object.keys(props).length > 0) patch.props = props;
	}
	return patch.swapComponentId || patch.props ? patch : null;
}
//#endregion
//#region src/instance-overrides/symbol/overrides.ts
function isActiveInstance(ctx, nodeId) {
	return nodeId !== void 0 && (!ctx.activeNodeIds || ctx.activeNodeIds.has(nodeId));
}
function preserveInstanceRootBounds(hasRootSize, instanceId, targetId, patch) {
	if (!hasRootSize || targetId !== instanceId || !patch?.props) return;
	delete patch.props.width;
	delete patch.props.height;
}
/**
* Apply symbolOverrides from kiwi data.
*
* Handles instance swaps (overriddenSymbolID) and property overrides
* (fills, text, visibility, etc.). Returns the set of directly
* overridden node IDs (used as seeds for transitive sync).
*/
function applySymbolOverrides(ctx, propertiesOnly = false) {
	const overriddenNodes = /* @__PURE__ */ new Set();
	ctx.componentIdRoot.clear();
	for (const [ncId, nc] of ctx.changeMap) {
		if (nc.type !== "INSTANCE") continue;
		const overrides = nc.symbolData?.symbolOverrides;
		if (!overrides?.length) continue;
		const nodeId = ctx.guidToNodeId.get(ncId);
		if (!isActiveInstance(ctx, nodeId)) continue;
		for (const ov of overrides) {
			const guids = ov.guidPath?.guids;
			if (!guids?.length) continue;
			const targetId = resolveOverrideTarget(ctx, nodeId, guids);
			if (!targetId) continue;
			if (targetId === nodeId && ctx.kiwiPropertyNodes.has(nodeId)) continue;
			const patch = patchFromSymbolOverride(ctx, targetId, ov);
			if (!patch) continue;
			preserveInstanceRootBounds(nc.size !== void 0, nodeId, targetId, patch);
			if (propertiesOnly) patch.swapComponentId = void 0;
			if (!patch.swapComponentId && !patch.props) continue;
			overriddenNodes.add(targetId);
			applyOverridePatch(ctx, patch);
		}
	}
	return overriddenNodes;
}
//#endregion
//#region src/instance-overrides/index.ts
/**
* Identify nodes whose kiwi NC has explicit property values that DIFFER
* from their component source. Only these need protection from sync.
*/
function* changedNodeEntries(changeMap, guidToNodeId) {
	for (const [figmaId, nodeId] of guidToNodeId) {
		const nc = changeMap.get(figmaId);
		if (nc) yield [nodeId, nc];
	}
}
function buildKiwiPropertyNodes(graph, changeMap, guidToNodeId) {
	const result = /* @__PURE__ */ new Set();
	for (const [nodeId, change] of changedNodeEntries(changeMap, guidToNodeId)) {
		const nc = change;
		const node = graph.getNode(nodeId);
		if (!node?.componentId) continue;
		const comp = graph.getNode(node.componentId);
		if (!comp) continue;
		const hasDiffRadius = (nc.cornerRadius !== void 0 || nc.rectangleCornerRadiiIndependent !== void 0) && node.cornerRadius !== comp.cornerRadius;
		const hasDiffVisible = nc.visible === false && comp.visible;
		const hasDiffFills = nc.fillPaints !== void 0 && !isEqual(node.fills, comp.fills);
		const hasDiffStrokes = nc.strokePaints !== void 0 && !isEqual(node.strokes, comp.strokes);
		const hasDiffText = nc.textData !== void 0 && node.type === "TEXT" && comp.type === "TEXT" && node.text !== comp.text;
		if (hasDiffRadius || hasDiffVisible || hasDiffFills || hasDiffStrokes || hasDiffText) result.add(nodeId);
	}
	return result;
}
function buildKiwiGeometryNodes(changeMap, guidToNodeId) {
	const result = /* @__PURE__ */ new Set();
	for (const [nodeId, nc] of changedNodeEntries(changeMap, guidToNodeId)) if (nc.fillGeometry?.length || nc.strokeGeometry?.length) result.add(nodeId);
	return result;
}
function componentLinkedNodes(graph) {
	const nodes = [];
	for (const node of graph.getAllNodes()) if (node.componentId) nodes.push(node);
	return nodes;
}
function instancePlacementPairs(graph) {
	const pairs = [];
	for (const node of graph.getAllNodes()) {
		if (node.type !== "INSTANCE" || !node.componentId) continue;
		const source = graph.getNode(node.componentId);
		if (!source || source.childIds.length !== node.childIds.length) continue;
		for (let index = 0; index < node.childIds.length; index++) pairs.push({
			sourceChildId: source.childIds[index],
			childId: node.childIds[index]
		});
	}
	return pairs;
}
function propagateResolvedFills(graph, protectedNodes, candidates = componentLinkedNodes(graph)) {
	for (let pass = 0; pass < 10; pass++) {
		let changed = false;
		for (const node of candidates) {
			if (!node.componentId) continue;
			const source = graph.getNode(node.componentId);
			if (!source || isEqual(source.fills, node.fills)) continue;
			if (protectedNodes.has(node.id) && !protectedNodes.has(source.id)) continue;
			graph.updateNode(node.id, { fills: copyFills(source.fills) });
			changed = true;
		}
		if (!changed) return;
	}
}
function propagateResolvedChildPlacementClones(graph, pairs = instancePlacementPairs(graph)) {
	for (let pass = 0; pass < 10; pass++) {
		let changed = false;
		for (const pair of pairs) {
			const sourceChild = graph.getNode(pair.sourceChildId);
			const child = graph.getNode(pair.childId);
			if (!sourceChild || !child) continue;
			if (sourceChild.overrideKey && child.overrideKey && sourceChild.overrideKey !== child.overrideKey) continue;
			const updates = {};
			if (!sourceChild.visible && child.visible) updates.visible = false;
			if (sourceChild.x !== child.x) updates.x = sourceChild.x;
			if (sourceChild.y !== child.y) updates.y = sourceChild.y;
			if (Object.keys(updates).length === 0) continue;
			graph.updateNode(child.id, updates);
			changed = true;
		}
		if (!changed) return;
	}
}
function sameDerivedGlyphSource(source, target) {
	if (source === target) return true;
	if (!source || !target) return false;
	return hasSameCopySource(source, target);
}
function propagateResolvedTextClones(graph, activeNodeIds) {
	const ordered = [];
	const visited = /* @__PURE__ */ new Set();
	const visiting = /* @__PURE__ */ new Set();
	const visit = (node) => {
		if (visited.has(node.id) || visiting.has(node.id)) return;
		visiting.add(node.id);
		const source = node.componentId ? graph.getNode(node.componentId) : void 0;
		if (source?.type === "TEXT") visit(source);
		visiting.delete(node.id);
		visited.add(node.id);
		if (node.type === "TEXT" && node.componentId) ordered.push(node);
	};
	for (const nodeId of activeNodeIds ?? graph.nodes.keys()) {
		const node = graph.getNode(nodeId);
		if (node?.type === "TEXT" && node.componentId) visit(node);
	}
	for (const node of ordered) {
		const source = node.componentId ? graph.getNode(node.componentId) : void 0;
		if (source?.type !== "TEXT" || source.text !== node.text) continue;
		if (source.width === node.width && source.height === node.height && isEqual(source.fills, node.fills) && isEqual(source.styleRuns, node.styleRuns) && sameDerivedGlyphSource(source.figmaDerivedTextGlyphs, node.figmaDerivedTextGlyphs)) continue;
		graph.updateNode(node.id, {
			width: source.width,
			height: source.height,
			fills: copyFills(source.fills),
			styleRuns: copyStyleRuns(source.styleRuns),
			figmaDerivedTextGlyphs: source.figmaDerivedTextGlyphs ? markCopySource(source.figmaDerivedTextGlyphs, structuredClone(source.figmaDerivedTextGlyphs)) : void 0
		});
	}
}
function buildOverrideContext(graph, changeMap, guidToNodeId, blobs, activeNodeIds) {
	const overrideKeyToGuid = /* @__PURE__ */ new Map();
	const assetRefToGuid = /* @__PURE__ */ new Map();
	for (const [id, nc] of changeMap) {
		if (nc.overrideKey) overrideKeyToGuid.set(guidToString(nc.overrideKey), id);
		if (typeof nc.key !== "string") continue;
		assetRefToGuid.set(nc.key, id);
		if (typeof nc.version === "string") assetRefToGuid.set(`${nc.key}@${nc.version}`, id);
	}
	const propDefaults = /* @__PURE__ */ new Map();
	const propNames = /* @__PURE__ */ new Map();
	for (const [, nc] of changeMap) {
		if (!nc.componentPropDefs?.length) continue;
		for (const def of nc.componentPropDefs) {
			if (!def.id) continue;
			const id = guidToString(def.id);
			if (def.initialValue) propDefaults.set(id, def.initialValue);
			if (def.name) propNames.set(id, def.name);
		}
	}
	const nodeIdToGuid = /* @__PURE__ */ new Map();
	for (const [figmaId, nodeId] of guidToNodeId) nodeIdToGuid.set(nodeId, figmaId);
	const kiwiPropertyNodes = buildKiwiPropertyNodes(graph, changeMap, guidToNodeId);
	const geometryOverrideNodes = buildKiwiGeometryNodes(changeMap, guidToNodeId);
	return {
		graph,
		changeMap,
		guidToNodeId,
		blobs,
		overrideKeyToGuid,
		assetRefToGuid,
		nodeIdToGuid,
		propDefaults,
		propNames,
		preComputedRoot: /* @__PURE__ */ new Map(),
		preComputedClones: /* @__PURE__ */ new Map(),
		componentIdRoot: /* @__PURE__ */ new Map(),
		swappedInstances: /* @__PURE__ */ new Set(),
		protectedFields: /* @__PURE__ */ new Map(),
		kiwiPropertyNodes,
		geometryOverrideNodes,
		activeNodeIds
	};
}
function applyResolvedNumericBindings(graph, activeNodeIds) {
	for (const node of overrideCandidates(graph, activeNodeIds)) {
		const updates = {};
		for (const [field, variableId] of Object.entries(node.boundVariables)) {
			if (Array.isArray(variableId)) continue;
			const value = graph.resolveNumberVariableForNode(node.id, variableId);
			if (value === void 0) continue;
			Object.assign(updates, resolvedNumericBindingUpdate(field, value));
		}
		if (Object.keys(updates).length > 0) graph.updateNode(node.id, updates);
	}
}
/**
*
* Shared between .fig file import and clipboard paste. Both paths produce
* a SceneGraph with INSTANCE nodes whose componentId references have been
* remapped to graph node IDs but whose children may be missing and whose
* overrides have not yet been applied.
*
* Resolution order:
* 1. Populate — clone component trees into empty instances
* 2. Symbol overrides — set property values and swap instances
* 3. Transitive sync — propagate overrides through clone chains
* 4. Component properties — toggle visibility / swap via prop assignments
* 5. Second transitive sync — propagate property changes to deeper clones
* 6. Derived symbol data — apply Figma's pre-computed sizes last
*/
function populateAndApplyOverrides(graph, changeMap, guidToNodeId, blobs = [], activeRootIds) {
	const ctx = buildOverrideContext(graph, changeMap, guidToNodeId, blobs, populateInstances(graph, activeRootIds));
	preComputeRoots(ctx);
	const overriddenNodes = applySymbolOverrides(ctx);
	for (const id of ctx.kiwiPropertyNodes) overriddenNodes.add(id);
	propagateOverridesTransitively(graph, overriddenNodes, ctx.swappedInstances, ctx.componentIdRoot, void 0, ctx.activeNodeIds, ctx.protectedFields);
	const propModified = applyComponentProperties(ctx);
	if (propModified.size > 0) propagateOverridesTransitively(graph, propModified, ctx.swappedInstances, ctx.componentIdRoot, overriddenNodes, ctx.activeNodeIds, ctx.protectedFields);
	if (activeRootIds) {
		const populated = populateInstances(graph, activeRootIds);
		if (populated) {
			ctx.activeNodeIds = populated;
			indexCloneNodes(graph, populated, ctx.preComputedClones);
		}
		const latePropModified = applyComponentProperties(ctx);
		const lateSeeds = /* @__PURE__ */ new Set([
			...overriddenNodes,
			...propModified,
			...latePropModified
		]);
		if (lateSeeds.size > 0) propagateOverridesTransitively(graph, lateSeeds, ctx.swappedInstances, ctx.componentIdRoot, overriddenNodes, ctx.activeNodeIds, ctx.protectedFields);
		propagateResolvedChildPlacementClones(graph);
	}
	applyDerivedSymbolData(ctx);
	propagateResolvedFills(graph, /* @__PURE__ */ new Set([...ctx.kiwiPropertyNodes, ...overriddenNodes]));
	propagateResolvedTextClones(graph, ctx.activeNodeIds);
	applyConstraintScaling(ctx);
	const scaledInstances = /* @__PURE__ */ new Set();
	for (const node of overrideCandidates(graph, ctx.activeNodeIds)) {
		if (node.type !== "INSTANCE" || !node.componentId) continue;
		const component = graph.getNode(node.componentId);
		if (component && (node.width !== component.width || node.height !== component.height)) scaledInstances.add(node.id);
	}
	applyComponentProperties(ctx);
	propagateNodePropsTransitively(graph, applySymbolOverrides(ctx, true), ctx.activeNodeIds, ctx.protectedFields, ctx.preComputedClones);
	reconcileEffectiveCloneGeometry(ctx, scaledInstances);
	applyResolvedNumericBindings(graph, ctx.activeNodeIds);
	applyGeneratedFreeformStretch(ctx);
}
//#endregion
export { applyGeneratedFreeformStretch, buildDsdLayoutUpdates, populateAndApplyOverrides, propagateDsdChanges, protectField, syncChildrenDeep, syncNodeProps };

//# sourceMappingURL=instance-overrides.js.map
//#region src/canvas/labels/cache.ts
const LABEL_TYPES = /* @__PURE__ */ new Set(["COMPONENT", "COMPONENT_SET"]);
const COMPONENT_LABEL_PARENT_TYPES = /* @__PURE__ */ new Set(["CANVAS", "SECTION"]);
function isInViewport(absX, absY, w, h, vp) {
	return absX + w >= vp.x && absY + h >= vp.y && absX <= vp.x + vp.w && absY <= vp.y + vp.h;
}
function collectVisibleLabels(graph, viewport, cachedItems, metadata) {
	const result = [];
	for (const cached of cachedItems) {
		const node = graph.getNode(cached.nodeId);
		if (!node || !isInViewport(cached.absX, cached.absY, node.width, node.height, viewport)) continue;
		result.push({
			node,
			absX: cached.absX,
			absY: cached.absY,
			...metadata(cached)
		});
	}
	return result;
}
var LabelCache = class {
	sections = [];
	components = [];
	cachedSceneVersion = -1;
	cachedPositionPreviewVersion = -1;
	cachedPageId = null;
	update(graph, pageId, sceneVersion, positionPreviewVersion = graph.positionPreviewVersion) {
		if (sceneVersion === this.cachedSceneVersion && positionPreviewVersion === this.cachedPositionPreviewVersion && pageId === this.cachedPageId) return;
		this.rebuild(graph, pageId);
		this.cachedSceneVersion = sceneVersion;
		this.cachedPositionPreviewVersion = positionPreviewVersion;
		this.cachedPageId = pageId;
	}
	invalidate() {
		this.cachedSceneVersion = -1;
		this.cachedPositionPreviewVersion = -1;
		this.cachedPageId = null;
		this.sections = [];
		this.components = [];
	}
	getSections(graph, viewport) {
		return collectVisibleLabels(graph, viewport, this.sections, (cached) => ({ nested: cached.nested }));
	}
	getComponents(graph, viewport) {
		return collectVisibleLabels(graph, viewport, this.components, () => ({ inside: false }));
	}
	getAllSections() {
		return this.sections;
	}
	getAllComponents() {
		return this.components;
	}
	rebuild(graph, pageId) {
		this.sections = [];
		this.components = [];
		const pageNode = graph.getNode(pageId ?? graph.rootId);
		if (!pageNode) return;
		this.walkChildren(graph, pageNode.id, 0, 0, false);
	}
	walkChildren(graph, parentId, ox, oy, insideSection) {
		const parent = graph.getNode(parentId);
		if (!parent) return;
		const parentType = parent.type;
		for (const childId of parent.childIds) {
			const child = graph.getNode(childId);
			if (!child || !child.visible) continue;
			const ax = ox + child.x;
			const ay = oy + child.y;
			if (child.type === "SECTION") {
				this.sections.push({
					nodeId: childId,
					absX: ax,
					absY: ay,
					nested: insideSection
				});
				this.walkChildren(graph, childId, ax, ay, true);
			} else if (LABEL_TYPES.has(child.type)) {
				if (COMPONENT_LABEL_PARENT_TYPES.has(parentType)) this.components.push({
					nodeId: childId,
					absX: ax,
					absY: ay,
					parentType
				});
				if (child.childIds.length > 0) this.walkChildren(graph, childId, ax, ay, insideSection);
			} else if (child.childIds.length > 0) this.walkChildren(graph, childId, ax, ay, insideSection);
		}
	}
};
//#endregion
export { LabelCache };

//# sourceMappingURL=cache.js.map
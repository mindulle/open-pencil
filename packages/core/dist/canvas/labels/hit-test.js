import "../../constants.js";
//#region src/canvas/labels/hit-test.ts
function measureGlyphWidth(font, text) {
	const glyphIds = font.getGlyphIDs(text);
	const widths = font.getGlyphWidths(glyphIds);
	let total = 0;
	for (const w of widths) total += w;
	return total;
}
function rotatePoint(x, y, rotation) {
	if (rotation === 0) return {
		x,
		y
	};
	const rad = -rotation * Math.PI / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	return {
		x: x * cos - y * sin,
		y: x * sin + y * cos
	};
}
function hitInRect(px, py, x, y, w, h) {
	return px >= x && px <= x + w && py >= y && py <= y + h;
}
function walkLabelTree(graph, pageId, callback) {
	let result = null;
	const walk = (parentId, ox, oy, insideSection) => {
		const parent = graph.getNode(parentId);
		if (!parent) return;
		for (let i = parent.childIds.length - 1; i >= 0; i--) {
			if (result) return;
			const child = graph.getNode(parent.childIds[i]);
			if (!child || !child.visible) continue;
			const ax = ox + child.x;
			const ay = oy + child.y;
			const hit = callback(child, parent, ax, ay, insideSection);
			if (hit) {
				result = hit;
				return;
			}
			if (child.type === "SECTION") walk(child.id, ax, ay, true);
			else if (child.childIds.length > 0) walk(child.id, ax, ay, insideSection);
		}
	};
	const pageNode = graph.getNode(pageId);
	if (pageNode) walk(pageNode.id, 0, 0, false);
	return result;
}
function labelHitContext(canvasX, canvasY, zoom, font) {
	return {
		canvasX,
		canvasY,
		zoom,
		font
	};
}
function hitCachedLabel(graph, items, hit) {
	for (let i = items.length - 1; i >= 0; i--) {
		const item = items[i];
		const node = graph.getNode(item.nodeId);
		if (!node || !node.visible) continue;
		const result = hit(node, item);
		if (result) return result;
	}
	return null;
}
function hitCachedLabelWithContext(graph, items, context, hit) {
	return hitCachedLabel(graph, items, (node, item) => hit(node, item, context));
}
function hitSectionTitle(child, ax, ay, insideSection, canvasX, canvasY, zoom, font) {
	const textW = measureGlyphWidth(font, child.name);
	const pillW = Math.min(textW + 16, child.width * zoom) / zoom;
	const pillH = 24 / zoom;
	const gap = 6 / zoom;
	const hit = rotatePoint(canvasX - ax, canvasY - ay, child.rotation);
	const pillY = insideSection ? gap : -pillH - gap;
	return hitInRect(hit.x, hit.y, 0, pillY, pillW, pillH) ? child : null;
}
function hitCachedSectionTitle(child, section, context) {
	return hitSectionTitle(child, section.absX, section.absY, section.nested, context.canvasX, context.canvasY, context.zoom, context.font);
}
function hitTestSectionTitle(graph, canvasX, canvasY, zoom, pageId, font, labelCache) {
	if (!font) return null;
	if (labelCache) return hitCachedLabelWithContext(graph, labelCache.getAllSections(), labelHitContext(canvasX, canvasY, zoom, font), hitCachedSectionTitle);
	return walkLabelTree(graph, pageId, (child, _parent, ax, ay, insideSection) => {
		if (child.type !== "SECTION") return void 0;
		return hitSectionTitle(child, ax, ay, insideSection, canvasX, canvasY, zoom, font);
	});
}
function hitComponentLabel(child, ax, ay, canvasX, canvasY, zoom, font) {
	const labelW = (14 + measureGlyphWidth(font, child.name)) / zoom;
	const labelH = 11 / zoom;
	const gap = 6 / zoom;
	return hitInRect(canvasX, canvasY, ax, ay - labelH - gap, labelW, labelH) ? child : null;
}
function hitCachedComponentLabel(child, component, context) {
	const { canvasX, canvasY, zoom, font } = context;
	return hitComponentLabel(child, component.absX, component.absY, canvasX, canvasY, zoom, font);
}
function hitTestComponentLabel(graph, canvasX, canvasY, zoom, pageId, font, labelCache) {
	if (!font) return null;
	const cachedHit = labelCache ? hitCachedLabelWithContext(graph, labelCache.getAllComponents(), labelHitContext(canvasX, canvasY, zoom, font), hitCachedComponentLabel) : null;
	if (cachedHit) return cachedHit;
	const LABEL_TYPES = /* @__PURE__ */ new Set(["COMPONENT", "COMPONENT_SET"]);
	return walkLabelTree(graph, pageId, (child, _parent, ax, ay) => {
		if (!LABEL_TYPES.has(child.type)) return void 0;
		return hitComponentLabel(child, ax, ay, canvasX, canvasY, zoom, font);
	});
}
function hitTestFrameTitle(graph, canvasX, canvasY, zoom, selectedIds, font) {
	if (!font || selectedIds.size !== 1) return null;
	const id = [...selectedIds][0];
	const node = graph.getNode(id);
	if (node?.type !== "FRAME") return null;
	const parent = node.parentId ? graph.getNode(node.parentId) : null;
	if (!(!parent || parent.type === "CANVAS" || parent.type === "SECTION")) return null;
	const abs = graph.getAbsolutePosition(id);
	const labelW = measureGlyphWidth(font, node.name) / zoom;
	const labelH = 11 / zoom;
	const hit = rotatePoint(canvasX - abs.x, canvasY - abs.y, node.rotation);
	const labelY = -8 / zoom - labelH;
	return hitInRect(hit.x, hit.y, 0, labelY, labelW, labelH) ? node : null;
}
//#endregion
export { hitTestComponentLabel, hitTestFrameTitle, hitTestSectionTitle };

//# sourceMappingURL=hit-test.js.map
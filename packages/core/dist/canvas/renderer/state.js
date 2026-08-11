//#region src/canvas/renderer/state.ts
function invalidateScenePicture(r) {
	r.scenePicture?.delete();
	r.scenePicture = null;
	r.scenePictureVersion = -1;
	r.scenePictureFontGeneration = -1;
	r.sceneBacking?.image.delete();
	r.sceneBacking = null;
	r.sceneBackingBuild?.surface.delete();
	r.sceneBackingBuild = null;
}
function clearSubtreePictureCache(r) {
	for (const entry of r.subtreePictureCache.values()) entry.picture.delete();
	r.subtreePictureCache.clear();
	r.subtreePictureCachePageId = null;
	r.subtreePictureCacheSceneVersion = -1;
	r.subtreePictureCachePositionPreviewVersion = -1;
	r.subtreePictureCacheFontGeneration = -1;
}
function invalidateAllPictures(r) {
	invalidateScenePicture(r);
	for (const pic of r.nodePictureCache.values()) pic?.delete();
	r.nodePictureCache.clear();
	r.nodePictureCacheGenerations.clear();
	clearSubtreePictureCache(r);
}
function invalidateNodePicture(r, nodeId) {
	const pic = r.nodePictureCache.get(nodeId);
	if (pic) {
		pic.delete();
		r.nodePictureCache.delete(nodeId);
		r.nodePictureCacheGenerations.delete(nodeId);
	}
	const subtree = r.subtreePictureCache.get(nodeId);
	if (subtree) {
		subtree.picture.delete();
		r.subtreePictureCache.delete(nodeId);
	}
}
function flashNode(r, nodeId) {
	r._flashes.push({
		nodeId,
		startTime: performance.now()
	});
}
function aiMarkActive(r, nodeIds) {
	for (const id of nodeIds) r._aiActiveNodes.add(id);
}
function aiMarkDone(r, nodeIds) {
	const now = performance.now();
	for (const id of nodeIds) if (r._aiActiveNodes.delete(id)) r._aiDoneFlashes.push({
		nodeId: id,
		startTime: now
	});
}
function aiFlashDone(r, nodeIds) {
	const now = performance.now();
	for (const id of nodeIds) r._aiDoneFlashes.push({
		nodeId: id,
		startTime: now
	});
}
function aiClearActive(r) {
	r._aiActiveNodes.clear();
}
function aiClearAll(r) {
	r._aiActiveNodes.clear();
	r._aiDoneFlashes = [];
}
function hasActiveFlashes(r) {
	return r._flashes.length > 0 || r._aiActiveNodes.size > 0 || r._aiDoneFlashes.length > 0;
}
//#endregion
export { aiClearActive, aiClearAll, aiFlashDone, aiMarkActive, aiMarkDone, clearSubtreePictureCache, flashNode, hasActiveFlashes, invalidateAllPictures, invalidateNodePicture, invalidateScenePicture };

//# sourceMappingURL=state.js.map
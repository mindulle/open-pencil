//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop-hitbox@1.1.0/node_modules/@atlaskit/pragmatic-drag-and-drop-hitbox/dist/esm/get-reorder-destination-index.js
function getReorderDestinationIndex(_ref) {
	var startIndex = _ref.startIndex, closestEdgeOfTarget = _ref.closestEdgeOfTarget, indexOfTarget = _ref.indexOfTarget, axis = _ref.axis;
	if (startIndex === -1 || indexOfTarget === -1) return startIndex;
	if (startIndex === indexOfTarget) return startIndex;
	if (closestEdgeOfTarget == null) return indexOfTarget;
	var isGoingAfter = axis === "vertical" && closestEdgeOfTarget === "bottom" || axis === "horizontal" && closestEdgeOfTarget === "right";
	if (startIndex < indexOfTarget) return isGoingAfter ? indexOfTarget : indexOfTarget - 1;
	return isGoingAfter ? indexOfTarget + 1 : indexOfTarget;
}
//#endregion
export { getReorderDestinationIndex };

//# sourceMappingURL=get-reorder-destination-index.js.js.map
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/detect-broken-drag.js
function getBindingsForBrokenDrags(_ref) {
	var onDragEnd = _ref.onDragEnd;
	return [{
		type: "pointermove",
		listener: function() {
			var callCount = 0;
			return function listener() {
				if (callCount < 20) {
					callCount++;
					return;
				}
				onDragEnd();
			};
		}()
	}, {
		type: "pointerdown",
		listener: onDragEnd
	}];
}
//#endregion
export { getBindingsForBrokenDrags };

//# sourceMappingURL=detect-broken-drag.js.js.map
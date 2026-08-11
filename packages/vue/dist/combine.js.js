//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/public-utils/combine.js
/** Create a new combined function that will call all the provided functions */
function combine() {
	for (var _len = arguments.length, fns = new Array(_len), _key = 0; _key < _len; _key++) fns[_key] = arguments[_key];
	return function cleanup() {
		fns.forEach(function(fn) {
			return fn();
		});
	};
}
//#endregion
export { combine };

//# sourceMappingURL=combine.js.js.map
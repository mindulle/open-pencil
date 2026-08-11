//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/public-utils/once.js
/** Provide a function that you only ever want to be called a single time */
function once(fn) {
	var cache = null;
	return function wrapped() {
		if (!cache) {
			for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
			cache = { result: fn.apply(this, args) };
		}
		return cache.result;
	};
}
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/android.js
var isAndroid = once(function isAndroid() {
	return navigator.userAgent.toLocaleLowerCase().includes("android");
});
var androidFallbackText = "pdnd:android-fallback";
//#endregion
export { androidFallbackText, isAndroid, once };

//# sourceMappingURL=android.js.js.map
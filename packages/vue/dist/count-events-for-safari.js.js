import { __commonJSMin } from "./rolldown-runtime.js";
import { require_bind, require_bind_all } from "./bind-all.js.js";
import { once } from "./android.js.js";
//#region ../../node_modules/.bun/bind-event-listener@3.0.0/node_modules/bind-event-listener/dist/index.js
var require_dist = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.bindAll = exports.bind = void 0;
	var bind_1 = require_bind();
	Object.defineProperty(exports, "bind", {
		enumerable: true,
		get: function() {
			return bind_1.bind;
		}
	});
	var bind_all_1 = require_bind_all();
	Object.defineProperty(exports, "bindAll", {
		enumerable: true,
		get: function() {
			return bind_all_1.bindAll;
		}
	});
}));
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/is-safari.js
var import_dist = require_dist();
/**
* Returns `true` if a `Safari` browser.
* Returns `true` if the browser is running on iOS (they are all Safari).
*
* Use `isSafariOnIOS` if you want to check if something is Safari + iOS
* */
var isSafari = once(function isSafari() {
	var userAgent = navigator.userAgent;
	return userAgent.includes("AppleWebKit") && !userAgent.includes("Chrome");
});
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/changing-window/count-events-for-safari.js
var symbols = {
	isLeavingWindow: Symbol("leaving"),
	isEnteringWindow: Symbol("entering")
};
function isLeavingWindowInSafari(_ref2) {
	var dragLeave = _ref2.dragLeave;
	if (!isSafari()) return false;
	return dragLeave.hasOwnProperty(symbols.isLeavingWindow);
}
(function fixSafari() {
	if (typeof window === "undefined") return;
	if (!isSafari()) return;
	function getInitialState() {
		return {
			enterCount: 0,
			isOverWindow: false
		};
	}
	var state = getInitialState();
	function resetState() {
		state = getInitialState();
	}
	(0, import_dist.bindAll)(window, [
		{
			type: "dragstart",
			listener: function listener() {
				state.enterCount = 0;
				state.isOverWindow = true;
			}
		},
		{
			type: "drop",
			listener: resetState
		},
		{
			type: "dragend",
			listener: resetState
		},
		{
			type: "dragenter",
			listener: function listener(event) {
				if (!state.isOverWindow && state.enterCount === 0) event[symbols.isEnteringWindow] = true;
				state.isOverWindow = true;
				state.enterCount++;
			}
		},
		{
			type: "dragleave",
			listener: function listener(event) {
				state.enterCount--;
				if (state.isOverWindow && state.enterCount === 0) {
					event[symbols.isLeavingWindow] = true;
					state.isOverWindow = false;
				}
			}
		}
	], { capture: true });
})();
//#endregion
export { isLeavingWindowInSafari, isSafari, require_dist };

//# sourceMappingURL=count-events-for-safari.js.js.map
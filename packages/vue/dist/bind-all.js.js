import { __commonJSMin } from "./rolldown-runtime.js";
//#region ../../node_modules/.bun/bind-event-listener@3.0.0/node_modules/bind-event-listener/dist/bind.js
var require_bind = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.bind = void 0;
	function bind(target, _a) {
		var type = _a.type, listener = _a.listener, options = _a.options;
		target.addEventListener(type, listener, options);
		return function unbind() {
			target.removeEventListener(type, listener, options);
		};
	}
	exports.bind = bind;
}));
//#endregion
//#region ../../node_modules/.bun/bind-event-listener@3.0.0/node_modules/bind-event-listener/dist/bind-all.js
var require_bind_all = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __assign = exports && exports.__assign || function() {
		__assign = Object.assign || function(t) {
			for (var s, i = 1, n = arguments.length; i < n; i++) {
				s = arguments[i];
				for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
			}
			return t;
		};
		return __assign.apply(this, arguments);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.bindAll = void 0;
	var bind_1 = require_bind();
	function toOptions(value) {
		if (typeof value === "undefined") return;
		if (typeof value === "boolean") return { capture: value };
		return value;
	}
	function getBinding(original, sharedOptions) {
		if (sharedOptions == null) return original;
		return __assign(__assign({}, original), { options: __assign(__assign({}, toOptions(sharedOptions)), toOptions(original.options)) });
	}
	function bindAll(target, bindings, sharedOptions) {
		var unbinds = bindings.map(function(original) {
			var binding = getBinding(original, sharedOptions);
			return (0, bind_1.bind)(target, binding);
		});
		return function unbindAll() {
			unbinds.forEach(function(unbind) {
				return unbind();
			});
		};
	}
	exports.bindAll = bindAll;
}));
//#endregion
export { require_bind, require_bind_all };

//# sourceMappingURL=bind-all.js.js.map
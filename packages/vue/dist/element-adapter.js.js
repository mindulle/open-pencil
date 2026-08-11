import { _defineProperty } from "./defineProperty.js.js";
import { combine } from "./combine.js.js";
import { _arrayWithHoles } from "./arrayWithHoles.js.js";
import { _arrayLikeToArray as _arrayLikeToArray$2 } from "./arrayLikeToArray.js.js";
import { isLeavingWindowInSafari, isSafari, require_dist } from "./count-events-for-safari.js.js";
import { _arrayWithoutHoles } from "./arrayWithoutHoles.js.js";
import { androidFallbackText, isAndroid, once } from "./android.js.js";
import { getBindingsForBrokenDrags } from "./detect-broken-drag.js.js";
import { makeDispatch } from "./dispatch-consumer-event.js.js";
import { addAttribute } from "./add-attribute.js.js";
import { elementAdapterNativeDataKey } from "./element-adapter-native-data-key.js.js";
//#region ../../node_modules/.bun/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/esm/iterableToArrayLimit.js
function _iterableToArrayLimit(r, l) {
	var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
	if (null != t) {
		var e, n, i, u, a = [], f = !0, o = !1;
		try {
			if (i = (t = t.call(r)).next, 0 === l) {
				if (Object(t) !== t) return;
				f = !1;
			} else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
		} catch (r) {
			o = !0, n = r;
		} finally {
			try {
				if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
			} finally {
				if (o) throw n;
			}
		}
		return a;
	}
}
//#endregion
//#region ../../node_modules/.bun/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js
function _unsupportedIterableToArray$2(r, a) {
	if (r) {
		if ("string" == typeof r) return _arrayLikeToArray$2(r, a);
		var t = {}.toString.call(r).slice(8, -1);
		return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray$2(r, a) : void 0;
	}
}
//#endregion
//#region ../../node_modules/.bun/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/esm/nonIterableRest.js
function _nonIterableRest() {
	throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
//#endregion
//#region ../../node_modules/.bun/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/esm/slicedToArray.js
function _slicedToArray(r, e) {
	return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray$2(r, e) || _nonIterableRest();
}
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/honey-pot-fix/honey-pot-data-attribute.js
var import_dist = require_dist();
var honeyPotDataAttribute = "data-pdnd-honey-pot";
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/honey-pot-fix/is-honey-pot-element.js
function isHoneyPotElement(target) {
	return target instanceof Element && target.hasAttribute("data-pdnd-honey-pot");
}
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/honey-pot-fix/get-element-from-point-without-honey-pot.js
function getElementFromPointWithoutHoneypot(client) {
	var _document$elementsFro2 = _slicedToArray(document.elementsFromPoint(client.x, client.y), 2), top = _document$elementsFro2[0], second = _document$elementsFro2[1];
	if (!top) return null;
	if (isHoneyPotElement(top)) return second !== null && second !== void 0 ? second : null;
	return top;
}
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/max-z-index.js
var maxZIndex = 2147483647;
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/honey-pot-fix/make-honey-pot-fix.js
function ownKeys$2(e, r) {
	var t = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var o = Object.getOwnPropertySymbols(e);
		r && (o = o.filter(function(r) {
			return Object.getOwnPropertyDescriptor(e, r).enumerable;
		})), t.push.apply(t, o);
	}
	return t;
}
function _objectSpread$2(e) {
	for (var r = 1; r < arguments.length; r++) {
		var t = null != arguments[r] ? arguments[r] : {};
		r % 2 ? ownKeys$2(Object(t), !0).forEach(function(r) {
			_defineProperty(e, r, t[r]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$2(Object(t)).forEach(function(r) {
			Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
		});
	}
	return e;
}
var honeyPotSize = 2;
var halfHoneyPotSize = honeyPotSize / 2;
/**
* `clientX` and `clientY` can be in sub pixels (eg `2.332`)
* However, browser hitbox testing is commonly do to the closest pixel.
*
* → https://issues.chromium.org/issues/40940531
*
* To be sure that the honey pot will be over the `client` position,
* we `.floor()` `clientX` and`clientY` and then make it `2px` in size.
**/
function floorToClosestPixel(point) {
	return {
		x: Math.floor(point.x),
		y: Math.floor(point.y)
	};
}
/**
* We want to make sure the honey pot sits around the users position.
* This seemed to be the most resilient while testing.
*/
function pullBackByHalfHoneyPotSize(point) {
	return {
		x: point.x - halfHoneyPotSize,
		y: point.y - halfHoneyPotSize
	};
}
/**
* Prevent the honey pot from changing the window size.
* This is super unlikely to occur, but just being safe.
*/
function preventGoingBackwardsOffScreen(point) {
	return {
		x: Math.max(point.x, 0),
		y: Math.max(point.y, 0)
	};
}
/**
* Prevent the honey pot from changing the window size.
* This is super unlikely to occur, but just being safe.
*/
function preventGoingForwardsOffScreen(point) {
	return {
		x: Math.min(point.x, window.innerWidth - honeyPotSize),
		y: Math.min(point.y, window.innerHeight - honeyPotSize)
	};
}
/**
* Create a `2x2` `DOMRect` around the `client` position
*/
function getHoneyPotRectFor(_ref) {
	var client = _ref.client;
	var point = preventGoingForwardsOffScreen(preventGoingBackwardsOffScreen(pullBackByHalfHoneyPotSize(floorToClosestPixel(client))));
	return DOMRect.fromRect({
		x: point.x,
		y: point.y,
		width: honeyPotSize,
		height: honeyPotSize
	});
}
function getRectStyles(_ref2) {
	var clientRect = _ref2.clientRect;
	return {
		left: "".concat(clientRect.left, "px"),
		top: "".concat(clientRect.top, "px"),
		width: "".concat(clientRect.width, "px"),
		height: "".concat(clientRect.height, "px")
	};
}
function isWithin(_ref3) {
	var client = _ref3.client, clientRect = _ref3.clientRect;
	return client.x >= clientRect.x && client.x <= clientRect.x + clientRect.width && client.y >= clientRect.y && client.y <= clientRect.y + clientRect.height;
}
/**
* The honey pot fix is designed to get around a painful bug in all browsers.
*
* [Overview](https://www.youtube.com/watch?v=udE9qbFTeQg)
*
* **Background**
*
* When a drag starts, browsers incorrectly think that the users pointer is
* still depressed where the drag started. Any element that goes under this position
* will be entered into, causing `"mouseenter"` events and `":hover"` styles to be applied.
*
* _This is a violation of the spec_
*
* > "From the moment that the user agent is to initiate the drag-and-drop operation,
* > until the end 	of the drag-and-drop operation, device input events
* > (e.g. mouse and keyboard events) must be suppressed."
* >
* > - https://html.spec.whatwg.org/multipage/dnd.html#drag-and-drop-processing-model
*
* _Some impacts_
*
* - `":hover"` styles being applied where they shouldn't (looks messy)
* - components such as tooltips responding to `"mouseenter"` can show during a drag,
*   and on an element the user isn't even over
*
* Bug: https://issues.chromium.org/issues/41129937
*
* **Honey pot fix**
*
* 1. Create an element where the browser thinks the depressed pointer is
*    to absorb the incorrect pointer events
* 2. Remove that element when it is no longer needed
*/
function mountHoneyPot(_ref4) {
	var initial = _ref4.initial;
	var element = document.createElement("div");
	element.setAttribute(honeyPotDataAttribute, "true");
	var clientRect = getHoneyPotRectFor({ client: initial });
	Object.assign(element.style, _objectSpread$2(_objectSpread$2({
		backgroundColor: "transparent",
		position: "fixed",
		padding: 0,
		margin: 0,
		boxSizing: "border-box"
	}, getRectStyles({ clientRect })), {}, {
		pointerEvents: "auto",
		zIndex: maxZIndex
	}));
	document.body.appendChild(element);
	/**
	*  🦊 In firefox we can get `"pointermove"` events after the drag
	* has started, which is a spec violation.
	* The final `"pointermove"` will reveal where the "depressed" position
	* is for our honey pot fix.
	*/
	var unbindPointerMove = (0, import_dist.bind)(window, {
		type: "pointermove",
		listener: function listener(event) {
			clientRect = getHoneyPotRectFor({ client: {
				x: event.clientX,
				y: event.clientY
			} });
			Object.assign(element.style, getRectStyles({ clientRect }));
		},
		options: { capture: true }
	});
	return function finish(_ref5) {
		var current = _ref5.current;
		unbindPointerMove();
		if (isWithin({
			client: current,
			clientRect
		})) {
			element.remove();
			return;
		}
		function cleanup() {
			unbindPostDragEvents();
			element.remove();
		}
		var unbindPostDragEvents = (0, import_dist.bindAll)(window, [
			{
				type: "pointerdown",
				listener: cleanup
			},
			{
				type: "pointermove",
				listener: cleanup
			},
			{
				type: "focusin",
				listener: cleanup
			},
			{
				type: "focusout",
				listener: cleanup
			},
			{
				type: "dragstart",
				listener: cleanup
			},
			{
				type: "dragenter",
				listener: cleanup
			},
			{
				type: "dragover",
				listener: cleanup
			}
		], { capture: true });
	};
}
function makeHoneyPotFix() {
	var latestPointerMove = null;
	function bindEvents() {
		latestPointerMove = null;
		return (0, import_dist.bind)(window, {
			type: "pointermove",
			listener: function listener(event) {
				latestPointerMove = {
					x: event.clientX,
					y: event.clientY
				};
			},
			options: { capture: true }
		});
	}
	function getOnPostDispatch() {
		var finish = null;
		return function onPostEvent(_ref6) {
			var eventName = _ref6.eventName, payload = _ref6.payload;
			if (eventName === "onDragStart") {
				var input = payload.location.initial.input;
				finish = mountHoneyPot({ initial: latestPointerMove !== null && latestPointerMove !== void 0 ? latestPointerMove : {
					x: input.clientX,
					y: input.clientY
				} });
			}
			if (eventName === "onDrop") {
				var _finish;
				var _input = payload.location.current.input;
				(_finish = finish) === null || _finish === void 0 || _finish({ current: {
					x: _input.clientX,
					y: _input.clientY
				} });
				finish = null;
				latestPointerMove = null;
			}
		};
	}
	return {
		bindEvents,
		getOnPostDispatch
	};
}
//#endregion
//#region ../../node_modules/.bun/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/esm/iterableToArray.js
function _iterableToArray(r) {
	if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
//#endregion
//#region ../../node_modules/.bun/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/esm/nonIterableSpread.js
function _nonIterableSpread() {
	throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
//#endregion
//#region ../../node_modules/.bun/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/esm/toConsumableArray.js
function _toConsumableArray(r) {
	return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray$2(r) || _nonIterableSpread();
}
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/is-firefox.js
/**
* Returns `true` if a `Firefox` browser
* */
var isFirefox = once(function isFirefox() {
	return navigator.userAgent.includes("Firefox");
});
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/changing-window/is-from-another-window.js
/**
* Does the `EventTarget` look like a `Node` based on "duck typing".
*
* Helpful when the `Node` might be outside of the current document
* so we cannot to an `target instanceof Node` check.
*/
function isNodeLike(target) {
	return "nodeName" in target;
}
/**
* Is an `EventTarget` a `Node` from another `window`?
*/
function isFromAnotherWindow(eventTarget) {
	return isNodeLike(eventTarget) && eventTarget.ownerDocument !== document;
}
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/changing-window/is-leaving-window.js
function isLeavingWindow(_ref) {
	var dragLeave = _ref.dragLeave;
	var type = dragLeave.type, relatedTarget = dragLeave.relatedTarget;
	if (type !== "dragleave") return false;
	if (isSafari()) return isLeavingWindowInSafari({ dragLeave });
	if (relatedTarget == null) return true;
	/**
	* 🦊 Exception: `iframe` in Firefox (`125.0`)
	*
	* Case 1: parent `window` → child `iframe`
	* `dragLeave.relatedTarget` is element _inside_ the child `iframe`
	* (foreign element)
	*
	* Case 2: child `iframe` → parent `window`
	* `dragLeave.relatedTarget` is the `iframe` in the parent `window`
	* (foreign element)
	*/
	if (isFirefox()) return isFromAnotherWindow(relatedTarget);
	/**
	* 🌏 Exception: `iframe` in Chrome (`124.0`)
	*
	* Case 1: parent `window` → child `iframe`
	* `dragLeave.relatedTarget` is the `iframe` in the parent `window`
	*
	* Case 2: child `iframe` → parent `window`
	* `dragLeave.relatedTarget` is `null` *(standard check)*
	*/
	return relatedTarget instanceof HTMLIFrameElement;
}
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/get-input.js
function getInput(event) {
	return {
		altKey: event.altKey,
		button: event.button,
		buttons: event.buttons,
		ctrlKey: event.ctrlKey,
		metaKey: event.metaKey,
		shiftKey: event.shiftKey,
		clientX: event.clientX,
		clientY: event.clientY,
		pageX: event.pageX,
		pageY: event.pageY
	};
}
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/ledger/lifecycle-manager.js
var globalState = { isActive: false };
function canStart() {
	return !globalState.isActive;
}
function getNativeSetDragImage(event) {
	if (event.dataTransfer) return event.dataTransfer.setDragImage.bind(event.dataTransfer);
	return null;
}
function hasHierarchyChanged(_ref) {
	var current = _ref.current, next = _ref.next;
	if (current.length !== next.length) return true;
	for (var i = 0; i < current.length; i++) if (current[i].element !== next[i].element) return true;
	return false;
}
function start(_ref2) {
	var event = _ref2.event, dragType = _ref2.dragType, getDropTargetsOver = _ref2.getDropTargetsOver, dispatchEvent = _ref2.dispatchEvent;
	if (!canStart()) return;
	var initial = getStartLocation({
		event,
		dragType,
		getDropTargetsOver
	});
	globalState.isActive = true;
	var state = { current: initial };
	setDropEffectOnEvent({
		event,
		current: initial.dropTargets
	});
	var dispatch = makeDispatch({
		source: dragType.payload,
		dispatchEvent,
		initial
	});
	function updateState(next) {
		var hasChanged = hasHierarchyChanged({
			current: state.current.dropTargets,
			next: next.dropTargets
		});
		state.current = next;
		if (hasChanged) dispatch.dragUpdate({ current: state.current });
	}
	function onUpdateEvent(event) {
		var input = getInput(event);
		var nextDropTargets = getDropTargetsOver({
			target: isHoneyPotElement(event.target) ? getElementFromPointWithoutHoneypot({
				x: input.clientX,
				y: input.clientY
			}) : event.target,
			input,
			source: dragType.payload,
			current: state.current.dropTargets
		});
		if (nextDropTargets.length) {
			event.preventDefault();
			setDropEffectOnEvent({
				event,
				current: nextDropTargets
			});
		}
		updateState({
			dropTargets: nextDropTargets,
			input
		});
	}
	function cancel() {
		if (state.current.dropTargets.length) updateState({
			dropTargets: [],
			input: state.current.input
		});
		dispatch.drop({
			current: state.current,
			updatedSourcePayload: null
		});
		finish();
	}
	function finish() {
		globalState.isActive = false;
		unbindEvents();
	}
	var unbindEvents = (0, import_dist.bindAll)(window, [
		{
			type: "dragover",
			listener: function listener(event) {
				onUpdateEvent(event);
				dispatch.drag({ current: state.current });
			}
		},
		{
			type: "dragenter",
			listener: onUpdateEvent
		},
		{
			type: "dragleave",
			listener: function listener(event) {
				if (!isLeavingWindow({ dragLeave: event })) return;
				/**
				* At this point we don't know if a drag is being cancelled,
				* or if a drag is leaving the `window`.
				*
				* Both have:
				*   1. "dragleave" (with `relatedTarget: null`)
				*   2. "dragend" (a "dragend" can occur when outside the `window`)
				*
				* **Clearing drop targets**
				*
				* For either case we are clearing the the drop targets
				*
				* - cancelling: we clear drop targets in `"dragend"` anyway
				* - leaving the `window`: we clear the drop targets (to clear stickiness)
				*
				* **Leaving the window and finishing the drag**
				*
				* _internal drags_
				*
				* - The drag continues when the user is outside the `window`
				*   and can resume if the user drags back over the `window`,
				*   or end when the user drops in an external `window`.
				* - We will get a `"dragend"`, or we can listen for other
				*   events to determine the drag is finished when the user re-enters the `window`).
				*
				* _external drags_
				*
				* - We conclude the drag operation.
				* - We have no idea if the user will drag back over the `window`,
				*   or if the drag ends elsewhere.
				* - We will create a new drag if the user re-enters the `window`.
				*
				* **Not updating `input`**
				*
				* 🐛 Bug[Chrome] the final `"dragleave"` has default input values (eg `clientX == 0`)
				* Workaround: intentionally not updating `input` in "dragleave"
				* rather than the users current input values
				* - [Conversation](https://twitter.com/alexandereardon/status/1642697633864241152)
				* - [Bug](https://bugs.chromium.org/p/chromium/issues/detail?id=1429937)
				**/
				updateState({
					input: state.current.input,
					dropTargets: []
				});
				if (dragType.startedFrom === "external") cancel();
			}
		},
		{
			type: "drop",
			listener: function listener(event) {
				state.current = {
					dropTargets: state.current.dropTargets,
					input: getInput(event)
				};
				/** If there are no drop targets, then we will get
				* a "drop" event if:
				* - `preventUnhandled()` is being used
				* - there is an unmanaged drop target (eg another library)
				* In these cases, it's up to the consumer
				* to handle the drop if it's not over one of our drop targets
				* - `preventUnhandled()` will cancel the "drop"
				* - unmanaged drop targets can handle the "drop" how they want to
				* We won't call `event.preventDefault()` in this call path */
				if (!state.current.dropTargets.length) {
					cancel();
					return;
				}
				event.preventDefault();
				setDropEffectOnEvent({
					event,
					current: state.current.dropTargets
				});
				dispatch.drop({
					current: state.current,
					updatedSourcePayload: dragType.type === "external" ? dragType.getDropPayload(event) : null
				});
				finish();
			}
		},
		{
			type: "dragend",
			listener: function listener(event) {
				state.current = {
					dropTargets: state.current.dropTargets,
					input: getInput(event)
				};
				cancel();
			}
		}
	].concat(_toConsumableArray(getBindingsForBrokenDrags({ onDragEnd: cancel }))), { capture: true });
	dispatch.start({ nativeSetDragImage: getNativeSetDragImage(event) });
}
function setDropEffectOnEvent(_ref3) {
	var _current$;
	var event = _ref3.event;
	var innerMost = (_current$ = _ref3.current[0]) === null || _current$ === void 0 ? void 0 : _current$.dropEffect;
	if (innerMost != null && event.dataTransfer) event.dataTransfer.dropEffect = innerMost;
}
function getStartLocation(_ref4) {
	var event = _ref4.event, dragType = _ref4.dragType, getDropTargetsOver = _ref4.getDropTargetsOver;
	var input = getInput(event);
	if (dragType.startedFrom === "external") return {
		input,
		dropTargets: []
	};
	return {
		input,
		dropTargets: getDropTargetsOver({
			input,
			source: dragType.payload,
			target: event.target,
			current: []
		})
	};
}
var lifecycle = {
	canStart,
	start
};
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/ledger/usage-ledger.js
var ledger = /* @__PURE__ */ new Map();
function registerUsage(_ref) {
	var typeKey = _ref.typeKey, mount = _ref.mount;
	var entry = ledger.get(typeKey);
	if (entry) {
		entry.usageCount++;
		return entry;
	}
	var initial = {
		typeKey,
		unmount: mount(),
		usageCount: 1
	};
	ledger.set(typeKey, initial);
	return initial;
}
function register(args) {
	var entry = registerUsage(args);
	return function unregister() {
		entry.usageCount--;
		if (entry.usageCount > 0) return;
		entry.unmount();
		ledger.delete(args.typeKey);
	};
}
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/make-adapter/make-drop-target.js
function ownKeys$1(e, r) {
	var t = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var o = Object.getOwnPropertySymbols(e);
		r && (o = o.filter(function(r) {
			return Object.getOwnPropertyDescriptor(e, r).enumerable;
		})), t.push.apply(t, o);
	}
	return t;
}
function _objectSpread$1(e) {
	for (var r = 1; r < arguments.length; r++) {
		var t = null != arguments[r] ? arguments[r] : {};
		r % 2 ? ownKeys$1(Object(t), !0).forEach(function(r) {
			_defineProperty(e, r, t[r]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$1(Object(t)).forEach(function(r) {
			Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
		});
	}
	return e;
}
function _createForOfIteratorHelper$1(r, e) {
	var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
	if (!t) {
		if (Array.isArray(r) || (t = _unsupportedIterableToArray$1(r)) || e && r && "number" == typeof r.length) {
			t && (r = t);
			var _n = 0, F = function F() {};
			return {
				s: F,
				n: function n() {
					return _n >= r.length ? { done: !0 } : {
						done: !1,
						value: r[_n++]
					};
				},
				e: function e(r) {
					throw r;
				},
				f: F
			};
		}
		throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	var o, a = !0, u = !1;
	return {
		s: function s() {
			t = t.call(r);
		},
		n: function n() {
			var r = t.next();
			return a = r.done, r;
		},
		e: function e(r) {
			u = !0, o = r;
		},
		f: function f() {
			try {
				a || null == t.return || t.return();
			} finally {
				if (u) throw o;
			}
		}
	};
}
function _unsupportedIterableToArray$1(r, a) {
	if (r) {
		if ("string" == typeof r) return _arrayLikeToArray$1(r, a);
		var t = {}.toString.call(r).slice(8, -1);
		return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray$1(r, a) : void 0;
	}
}
function _arrayLikeToArray$1(r, a) {
	(null == a || a > r.length) && (a = r.length);
	for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	return n;
}
function copyReverse(array) {
	return array.slice(0).reverse();
}
function makeDropTarget(_ref) {
	var typeKey = _ref.typeKey, defaultDropEffect = _ref.defaultDropEffect;
	var registry = /* @__PURE__ */ new WeakMap();
	var dropTargetDataAtt = "data-drop-target-for-".concat(typeKey);
	var dropTargetSelector = "[".concat(dropTargetDataAtt, "]");
	function addToRegistry(args) {
		registry.set(args.element, args);
		return function() {
			return registry.delete(args.element);
		};
	}
	function dropTargetForConsumers(args) {
		var existing = registry.get(args.element);
		if (existing) console.warn("You have already registered a [".concat(typeKey, "] dropTarget on the same element"), {
			existing,
			proposed: args
		});
		if (args.element instanceof HTMLIFrameElement) console.warn("\n            We recommend not registering <iframe> elements as drop targets\n            as it can result in some strange browser event ordering.\n          ".replace(/\s{2,}/g, " ").trim());
		return once(combine(addAttribute(args.element, {
			attribute: dropTargetDataAtt,
			value: "true"
		}), addToRegistry(args)));
	}
	function getActualDropTargets(_ref2) {
		var _args$getData, _args$getData2, _args$getDropEffect, _args$getDropEffect2;
		var source = _ref2.source, target = _ref2.target, input = _ref2.input, _ref2$result = _ref2.result, result = _ref2$result === void 0 ? [] : _ref2$result;
		if (target == null) return result;
		if (!(target instanceof Element)) {
			if (target instanceof Node) return getActualDropTargets({
				source,
				target: target.parentElement,
				input,
				result
			});
			return result;
		}
		var closest = target.closest(dropTargetSelector);
		if (closest == null) return result;
		var args = registry.get(closest);
		if (args == null) return result;
		var feedback = {
			input,
			source,
			element: args.element
		};
		if (args.canDrop && !args.canDrop(feedback)) return getActualDropTargets({
			source,
			target: args.element.parentElement,
			input,
			result
		});
		var data = (_args$getData = (_args$getData2 = args.getData) === null || _args$getData2 === void 0 ? void 0 : _args$getData2.call(args, feedback)) !== null && _args$getData !== void 0 ? _args$getData : {};
		var dropEffect = (_args$getDropEffect = (_args$getDropEffect2 = args.getDropEffect) === null || _args$getDropEffect2 === void 0 ? void 0 : _args$getDropEffect2.call(args, feedback)) !== null && _args$getDropEffect !== void 0 ? _args$getDropEffect : defaultDropEffect;
		var record = {
			data,
			element: args.element,
			dropEffect,
			isActiveDueToStickiness: false
		};
		return getActualDropTargets({
			source,
			target: args.element.parentElement,
			input,
			result: [].concat(_toConsumableArray(result), [record])
		});
	}
	function notifyCurrent(_ref3) {
		var eventName = _ref3.eventName, payload = _ref3.payload;
		var _iterator = _createForOfIteratorHelper$1(payload.location.current.dropTargets), _step;
		try {
			for (_iterator.s(); !(_step = _iterator.n()).done;) {
				var _entry$eventName;
				var record = _step.value;
				var entry = registry.get(record.element);
				var args = _objectSpread$1(_objectSpread$1({}, payload), {}, { self: record });
				entry === null || entry === void 0 || (_entry$eventName = entry[eventName]) === null || _entry$eventName === void 0 || _entry$eventName.call(entry, args);
			}
		} catch (err) {
			_iterator.e(err);
		} finally {
			_iterator.f();
		}
	}
	var actions = {
		onGenerateDragPreview: notifyCurrent,
		onDrag: notifyCurrent,
		onDragStart: notifyCurrent,
		onDrop: notifyCurrent,
		onDropTargetChange: function onDropTargetChange(_ref4) {
			var payload = _ref4.payload;
			var isCurrent = new Set(payload.location.current.dropTargets.map(function(record) {
				return record.element;
			}));
			var visited = /* @__PURE__ */ new Set();
			var _iterator2 = _createForOfIteratorHelper$1(payload.location.previous.dropTargets), _step2;
			try {
				for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
					var _entry$onDropTargetCh;
					var record = _step2.value;
					visited.add(record.element);
					var entry = registry.get(record.element);
					var isOver = isCurrent.has(record.element);
					var args = _objectSpread$1(_objectSpread$1({}, payload), {}, { self: record });
					entry === null || entry === void 0 || (_entry$onDropTargetCh = entry.onDropTargetChange) === null || _entry$onDropTargetCh === void 0 || _entry$onDropTargetCh.call(entry, args);
					if (!isOver) {
						var _entry$onDragLeave;
						entry === null || entry === void 0 || (_entry$onDragLeave = entry.onDragLeave) === null || _entry$onDragLeave === void 0 || _entry$onDragLeave.call(entry, args);
					}
				}
			} catch (err) {
				_iterator2.e(err);
			} finally {
				_iterator2.f();
			}
			var _iterator3 = _createForOfIteratorHelper$1(payload.location.current.dropTargets), _step3;
			try {
				for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
					var _entry$onDropTargetCh2, _entry$onDragEnter;
					var _record = _step3.value;
					if (visited.has(_record.element)) continue;
					var _args = _objectSpread$1(_objectSpread$1({}, payload), {}, { self: _record });
					var _entry = registry.get(_record.element);
					_entry === null || _entry === void 0 || (_entry$onDropTargetCh2 = _entry.onDropTargetChange) === null || _entry$onDropTargetCh2 === void 0 || _entry$onDropTargetCh2.call(_entry, _args);
					_entry === null || _entry === void 0 || (_entry$onDragEnter = _entry.onDragEnter) === null || _entry$onDragEnter === void 0 || _entry$onDragEnter.call(_entry, _args);
				}
			} catch (err) {
				_iterator3.e(err);
			} finally {
				_iterator3.f();
			}
		}
	};
	function dispatchEvent(args) {
		actions[args.eventName](args);
	}
	function getIsOver(_ref5) {
		var source = _ref5.source, target = _ref5.target, input = _ref5.input, current = _ref5.current;
		var actual = getActualDropTargets({
			source,
			target,
			input
		});
		if (actual.length >= current.length) return actual;
		var lastCaptureOrdered = copyReverse(current);
		var actualCaptureOrdered = copyReverse(actual);
		var resultCaptureOrdered = [];
		for (var index = 0; index < lastCaptureOrdered.length; index++) {
			var _argsForLast$getIsSti;
			var last = lastCaptureOrdered[index];
			var fresh = actualCaptureOrdered[index];
			if (fresh != null) {
				resultCaptureOrdered.push(fresh);
				continue;
			}
			var parent = resultCaptureOrdered[index - 1];
			var lastParent = lastCaptureOrdered[index - 1];
			if ((parent === null || parent === void 0 ? void 0 : parent.element) !== (lastParent === null || lastParent === void 0 ? void 0 : lastParent.element)) break;
			var argsForLast = registry.get(last.element);
			if (!argsForLast) break;
			var feedback = {
				input,
				source,
				element: argsForLast.element
			};
			if (argsForLast.canDrop && !argsForLast.canDrop(feedback)) break;
			if (!((_argsForLast$getIsSti = argsForLast.getIsSticky) !== null && _argsForLast$getIsSti !== void 0 && _argsForLast$getIsSti.call(argsForLast, feedback))) break;
			resultCaptureOrdered.push(_objectSpread$1(_objectSpread$1({}, last), {}, { isActiveDueToStickiness: true }));
		}
		return copyReverse(resultCaptureOrdered);
	}
	return {
		dropTargetForConsumers,
		getIsOver,
		dispatchEvent
	};
}
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/make-adapter/make-monitor.js
function _createForOfIteratorHelper(r, e) {
	var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
	if (!t) {
		if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
			t && (r = t);
			var _n = 0, F = function F() {};
			return {
				s: F,
				n: function n() {
					return _n >= r.length ? { done: !0 } : {
						done: !1,
						value: r[_n++]
					};
				},
				e: function e(r) {
					throw r;
				},
				f: F
			};
		}
		throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	var o, a = !0, u = !1;
	return {
		s: function s() {
			t = t.call(r);
		},
		n: function n() {
			var r = t.next();
			return a = r.done, r;
		},
		e: function e(r) {
			u = !0, o = r;
		},
		f: function f() {
			try {
				a || null == t.return || t.return();
			} finally {
				if (u) throw o;
			}
		}
	};
}
function _unsupportedIterableToArray(r, a) {
	if (r) {
		if ("string" == typeof r) return _arrayLikeToArray(r, a);
		var t = {}.toString.call(r).slice(8, -1);
		return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
	}
}
function _arrayLikeToArray(r, a) {
	(null == a || a > r.length) && (a = r.length);
	for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	return n;
}
function ownKeys(e, r) {
	var t = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var o = Object.getOwnPropertySymbols(e);
		r && (o = o.filter(function(r) {
			return Object.getOwnPropertyDescriptor(e, r).enumerable;
		})), t.push.apply(t, o);
	}
	return t;
}
function _objectSpread(e) {
	for (var r = 1; r < arguments.length; r++) {
		var t = null != arguments[r] ? arguments[r] : {};
		r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
			_defineProperty(e, r, t[r]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
			Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
		});
	}
	return e;
}
function makeMonitor() {
	var registry = /* @__PURE__ */ new Set();
	var dragging = null;
	function tryAddToActive(monitor) {
		if (!dragging) return;
		if (!monitor.canMonitor || monitor.canMonitor(dragging.canMonitorArgs)) dragging.active.add(monitor);
	}
	function monitorForConsumers(args) {
		var entry = _objectSpread({}, args);
		registry.add(entry);
		tryAddToActive(entry);
		function cleanup() {
			registry.delete(entry);
			if (dragging) dragging.active.delete(entry);
		}
		return once(cleanup);
	}
	function dispatchEvent(_ref) {
		var eventName = _ref.eventName, payload = _ref.payload;
		if (eventName === "onGenerateDragPreview") {
			dragging = {
				canMonitorArgs: {
					initial: payload.location.initial,
					source: payload.source
				},
				active: /* @__PURE__ */ new Set()
			};
			var _iterator = _createForOfIteratorHelper(registry), _step;
			try {
				for (_iterator.s(); !(_step = _iterator.n()).done;) {
					var monitor = _step.value;
					tryAddToActive(monitor);
				}
			} catch (err) {
				_iterator.e(err);
			} finally {
				_iterator.f();
			}
		}
		if (!dragging) return;
		var active = Array.from(dragging.active);
		for (var _i = 0, _active = active; _i < _active.length; _i++) {
			var _monitor = _active[_i];
			if (dragging.active.has(_monitor)) {
				var _monitor$eventName;
				(_monitor$eventName = _monitor[eventName]) === null || _monitor$eventName === void 0 || _monitor$eventName.call(_monitor, payload);
			}
		}
		if (eventName === "onDrop") {
			dragging.active.clear();
			dragging = null;
		}
	}
	return {
		dispatchEvent,
		monitorForConsumers
	};
}
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/make-adapter/make-adapter.js
function makeAdapter(_ref) {
	var typeKey = _ref.typeKey, mount = _ref.mount, dispatchEventToSource = _ref.dispatchEventToSource, onPostDispatch = _ref.onPostDispatch, defaultDropEffect = _ref.defaultDropEffect;
	var monitorAPI = makeMonitor();
	var dropTargetAPI = makeDropTarget({
		typeKey,
		defaultDropEffect
	});
	function dispatchEvent(args) {
		dispatchEventToSource === null || dispatchEventToSource === void 0 || dispatchEventToSource(args);
		dropTargetAPI.dispatchEvent(args);
		monitorAPI.dispatchEvent(args);
		onPostDispatch === null || onPostDispatch === void 0 || onPostDispatch(args);
	}
	function start(_ref2) {
		var event = _ref2.event, dragType = _ref2.dragType;
		lifecycle.start({
			event,
			dragType,
			getDropTargetsOver: dropTargetAPI.getIsOver,
			dispatchEvent
		});
	}
	function registerUsage() {
		function mountAdapter() {
			return mount({
				canStart: lifecycle.canStart,
				start
			});
		}
		return register({
			typeKey,
			mount: mountAdapter
		});
	}
	return {
		registerUsage,
		dropTarget: dropTargetAPI.dropTargetForConsumers,
		monitor: monitorAPI.monitorForConsumers
	};
}
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/media-types/text-media-type.js
var textMediaType = "text/plain";
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/adapter/element-adapter.js
var draggableRegistry = /* @__PURE__ */ new WeakMap();
function addToRegistry(args) {
	draggableRegistry.set(args.element, args);
	return function cleanup() {
		draggableRegistry.delete(args.element);
	};
}
var honeyPotFix = makeHoneyPotFix();
var adapter = makeAdapter({
	typeKey: "element",
	defaultDropEffect: "move",
	mount: function mount(api) {
		/**  Binding event listeners the `document` rather than `window` so that
		* this adapter always gets preference over the text adapter.
		* `document` is the first `EventTarget` under `window`
		* https://twitter.com/alexandereardon/status/1604658588311465985
		*/
		return combine(honeyPotFix.bindEvents(), (0, import_dist.bind)(document, {
			type: "dragstart",
			listener: function listener(event) {
				var _entry$dragHandle, _entry$getInitialData, _entry$getInitialData2, _entry$dragHandle2, _entry$getInitialData3, _entry$getInitialData4;
				if (!api.canStart(event)) return;
				if (event.defaultPrevented) return;
				if (!event.dataTransfer) {
					console.warn("\n              It appears as though you have are not testing DragEvents correctly.\n\n              - If you are unit testing, ensure you have polyfilled DragEvent.\n              - If you are browser testing, ensure you are dispatching drag events correctly.\n\n              Please see our testing guides for more information:\n              https://atlassian.design/components/pragmatic-drag-and-drop/core-package/testing\n            ".replace(/ {2}/g, ""));
					return;
				}
				var target = event.target;
				if (!(target instanceof HTMLElement)) return;
				var entry = draggableRegistry.get(target);
				if (!entry) return;
				/**
				* A text selection drag _can_ have the `draggable` element be
				* the `event.target` if the user is dragging the text selection
				* from the `draggable`.
				*
				* To know if the `draggable` is being dragged, we look at whether any
				* `"text/plain"` data is being dragged. If it is, then a text selection
				* drag is occurring.
				*
				* This behaviour has been validated on:
				*
				* - Chrome@128 on Android@14
				* - Chrome@128 on iOS@17.6.1
				* - Chrome@128 on Windows@11
				* - Chrome@128 on MacOS@14.6.1
				* - Firefox@129 on Windows@11 (not possible for user to select text in a draggable)
				* - Firefox@129 on MacOS@14.6.1 (not possible for user to select text in a draggable)
				*
				* Note: Could usually just use: `event.dataTransfer.types.includes(textMediaType)`
				* but unfortunately ProseMirror is always setting `""` as the dragged text
				*
				* Note: Unfortunately editor is (heavily) leaning on the current functionality today
				* and unwinding it will be a decent amount of effort. So for now, a text selection
				* where the `event.target` is a `draggable` element will still trigger the
				* element adapter.
				*
				* // Future state:
				* if(event.dataTransfer.getData(textMediaType)) {
				* 	return;
				* }
				*
				*/
				var input = getInput(event);
				var feedback = {
					element: entry.element,
					dragHandle: (_entry$dragHandle = entry.dragHandle) !== null && _entry$dragHandle !== void 0 ? _entry$dragHandle : null,
					input
				};
				if (entry.canDrag && !entry.canDrag(feedback)) {
					event.preventDefault();
					return;
				}
				if (entry.dragHandle) {
					var over = getElementFromPointWithoutHoneypot({
						x: input.clientX,
						y: input.clientY
					});
					if (!entry.dragHandle.contains(over)) {
						event.preventDefault();
						return;
					}
				}
				/**
				*  **Goal**
				*  Pass information to other applications
				*
				* **Approach**
				*  Put data into the native data store
				*
				*  **What about the native adapter?**
				*  When the element adapter puts native data into the native data store
				*  the native adapter is not triggered in the current window,
				*  but a native adapter in an external window _can_ be triggered
				*
				*  **Why bake this into core?**
				*  This functionality could be pulled out and exposed inside of
				*  `onGenerateDragPreview`. But decided to make it a part of the
				*  base API as it felt like a common enough use case and ended
				*  up being a similar amount of code to include this function as
				*  it was to expose the hook for it
				*/
				var nativeData = (_entry$getInitialData = (_entry$getInitialData2 = entry.getInitialDataForExternal) === null || _entry$getInitialData2 === void 0 ? void 0 : _entry$getInitialData2.call(entry, feedback)) !== null && _entry$getInitialData !== void 0 ? _entry$getInitialData : null;
				if (nativeData) for (var _i = 0, _Object$entries = Object.entries(nativeData); _i < _Object$entries.length; _i++) {
					var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2), key = _Object$entries$_i[0], data = _Object$entries$_i[1];
					event.dataTransfer.setData(key, data !== null && data !== void 0 ? data : "");
				}
				/**
				*  📱 For Android devices, a drag operation will not start unless
				* "text/plain" or "text/uri-list" data exists in the native data store
				* https://twitter.com/alexandereardon/status/1732189803754713424
				*
				* Tested on:
				* Device: Google Pixel 5
				* Android version: 14 (November 5, 2023)
				* Chrome version: 120.0
				*/
				if (isAndroid() && !event.dataTransfer.types.includes("text/plain") && !event.dataTransfer.types.includes("text/uri-list")) event.dataTransfer.setData(textMediaType, androidFallbackText);
				/**
				* 1. Must set any media type for `iOS15` to work
				* 2. We are also doing adding data so that the native adapter
				* can know that the element adapter has handled this drag
				*
				* We used to wrap this `setData()` in a `try/catch` for Firefox,
				* but it looks like that was not needed.
				*
				* Tested using: https://codesandbox.io/s/checking-firefox-throw-behaviour-on-dragstart-qt8h4f
				*
				* - ✅ Firefox@70.0 (Oct 2019) on macOS Sonoma
				* - ✅ Firefox@70.0 (Oct 2019) on macOS Big Sur
				* - ✅ Firefox@70.0 (Oct 2019) on Windows 10
				*
				* // just checking a few more combinations to be super safe
				*
				* - ✅ Chrome@78 (Oct 2019) on macOS Big Sur
				* - ✅ Chrome@78 (Oct 2019) on Windows 10
				* - ✅ Safari@14.1 on macOS Big Sur
				*/
				event.dataTransfer.setData(elementAdapterNativeDataKey, "");
				var dragType = {
					type: "element",
					payload: {
						element: entry.element,
						dragHandle: (_entry$dragHandle2 = entry.dragHandle) !== null && _entry$dragHandle2 !== void 0 ? _entry$dragHandle2 : null,
						data: (_entry$getInitialData3 = (_entry$getInitialData4 = entry.getInitialData) === null || _entry$getInitialData4 === void 0 ? void 0 : _entry$getInitialData4.call(entry, feedback)) !== null && _entry$getInitialData3 !== void 0 ? _entry$getInitialData3 : {}
					},
					startedFrom: "internal"
				};
				api.start({
					event,
					dragType
				});
			}
		}));
	},
	dispatchEventToSource: function dispatchEventToSource(_ref) {
		var _draggableRegistry$ge, _draggableRegistry$ge2;
		var eventName = _ref.eventName, payload = _ref.payload;
		(_draggableRegistry$ge = draggableRegistry.get(payload.source.element)) === null || _draggableRegistry$ge === void 0 || (_draggableRegistry$ge2 = _draggableRegistry$ge[eventName]) === null || _draggableRegistry$ge2 === void 0 || _draggableRegistry$ge2.call(_draggableRegistry$ge, payload);
	},
	onPostDispatch: honeyPotFix.getOnPostDispatch()
});
var dropTargetForElements = adapter.dropTarget;
var monitorForElements = adapter.monitor;
function draggable(args) {
	if (args.dragHandle && !args.element.contains(args.dragHandle)) console.warn("Drag handle element must be contained in draggable element", {
		element: args.element,
		dragHandle: args.dragHandle
	});
	var existing = draggableRegistry.get(args.element);
	if (existing) console.warn("You have already registered a `draggable` on the same element", {
		existing,
		proposed: args
	});
	return once(combine(adapter.registerUsage(), addToRegistry(args), addAttribute(args.element, {
		attribute: "draggable",
		value: "true"
	})));
}
/** Common event payload for all events */
/** A map containing payloads for all events */
/** Common event payload for all drop target events */
/** A map containing payloads for all events on drop targets */
/** Arguments given to all feedback functions (eg `canDrag()`) on for a `draggable()` */
/** Arguments given to all feedback functions (eg `canDrop()`) on a `dropTargetForElements()` */
/** Arguments given to all monitor feedback functions (eg `canMonitor()`) for a `monitorForElements` */
//#endregion
export { draggable, dropTargetForElements, monitorForElements };

//# sourceMappingURL=element-adapter.js.js.map
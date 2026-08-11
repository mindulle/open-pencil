//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/ledger/dispatch-consumer-event.js
var scheduleOnDrag = function rafSchd(fn) {
	var lastArgs = [];
	var frameId = null;
	var wrapperFn = function wrapperFn() {
		for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
		lastArgs = args;
		if (frameId) return;
		frameId = requestAnimationFrame(function() {
			frameId = null;
			fn.apply(void 0, lastArgs);
		});
	};
	wrapperFn.cancel = function() {
		if (!frameId) return;
		cancelAnimationFrame(frameId);
		frameId = null;
	};
	return wrapperFn;
}(function(fn) {
	return fn();
});
var dragStart = function() {
	var scheduled = null;
	function schedule(fn) {
		scheduled = {
			frameId: requestAnimationFrame(function() {
				scheduled = null;
				fn();
			}),
			fn
		};
	}
	function flush() {
		if (scheduled) {
			cancelAnimationFrame(scheduled.frameId);
			scheduled.fn();
			scheduled = null;
		}
	}
	return {
		schedule,
		flush
	};
}();
function makeDispatch(_ref) {
	var source = _ref.source, initial = _ref.initial, dispatchEvent = _ref.dispatchEvent;
	var previous = { dropTargets: [] };
	function safeDispatch(args) {
		dispatchEvent(args);
		previous = { dropTargets: args.payload.location.current.dropTargets };
	}
	return {
		start: function start(_ref2) {
			var nativeSetDragImage = _ref2.nativeSetDragImage;
			var location = {
				current: initial,
				previous,
				initial
			};
			safeDispatch({
				eventName: "onGenerateDragPreview",
				payload: {
					source,
					location,
					nativeSetDragImage
				}
			});
			dragStart.schedule(function() {
				safeDispatch({
					eventName: "onDragStart",
					payload: {
						source,
						location
					}
				});
			});
		},
		dragUpdate: function dragUpdate(_ref3) {
			var current = _ref3.current;
			dragStart.flush();
			scheduleOnDrag.cancel();
			safeDispatch({
				eventName: "onDropTargetChange",
				payload: {
					source,
					location: {
						initial,
						previous,
						current
					}
				}
			});
		},
		drag: function drag(_ref4) {
			var current = _ref4.current;
			scheduleOnDrag(function() {
				dragStart.flush();
				safeDispatch({
					eventName: "onDrag",
					payload: {
						source,
						location: {
							initial,
							previous,
							current
						}
					}
				});
			});
		},
		drop: function drop(_ref5) {
			var current = _ref5.current, updatedSourcePayload = _ref5.updatedSourcePayload;
			dragStart.flush();
			scheduleOnDrag.cancel();
			safeDispatch({
				eventName: "onDrop",
				payload: {
					source: updatedSourcePayload !== null && updatedSourcePayload !== void 0 ? updatedSourcePayload : source,
					location: {
						current,
						previous,
						initial
					}
				}
			});
		}
	};
}
//#endregion
export { makeDispatch };

//# sourceMappingURL=dispatch-consumer-event.js.js.map
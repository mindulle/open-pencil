import { export_helper_default, useEditor } from "./canvas/CanvasRoot.js";
import { MIXED, useNodeProps, useSceneComputed } from "./controls/appearance/helpers.js";
import { usePageList } from "./editor/commands/use.js";
import { _defineProperty } from "./defineProperty.js.js";
import { combine } from "./combine.js.js";
import { draggable, dropTargetForElements, monitorForElements } from "./element-adapter.js.js";
import { getReorderDestinationIndex } from "./get-reorder-destination-index.js.js";
import { inputValue, useInlineRename } from "./editor/inline-rename/use.js";
import { useLayout } from "./controls/layout/use.js";
import { useAppearance } from "./controls/appearance/use.js";
import { useTypography } from "./controls/typography/use.js";
import { useColorModel } from "./controls/color-model/use.js";
import { useConstraints } from "./controls/constraints/use.js";
import { useBindingProvider } from "./controls/binding-provider/context.js";
import { clampNumberValue, evaluateNumberExpression, normalizeNumberValue, stepNumberValue } from "./controls/number-expression/evaluate.js";
import { EDITOR_TOOLS, EDITOR_TOOLS as EDITOR_TOOLS$1, TOOL_SHORTCUTS, createEditor } from "@open-pencil/core/editor";
import { computed, createBlock, createCommentVNode, createElementBlock, createElementVNode, createTextVNode, createVNode, defineComponent, getCurrentInstance, guardReactiveProps, h, inject, mergeModels, mergeProps, nextTick, normalizeClass, normalizeProps, normalizeStyle, onBeforeUnmount, onScopeDispose, openBlock, provide, proxyRefs, reactive, ref, renderSlot, toDisplayString, useModel, watch, watchEffect, withCtx, withModifiers } from "vue";
import { templateRef, unrefElement, useEventListener } from "@vueuse/core";
import { BLACK } from "@open-pencil/core/constants";
import { randomHex } from "@open-pencil/core/random";
import { CollapsibleContent, CollapsibleRoot, ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport, ComboboxVirtualizer, EditableArea, EditableInput, EditablePreview, EditableRoot, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger, Primitive, RovingFocusGroup, RovingFocusItem, SliderRoot, SliderThumb, SliderTrack, ToggleGroupItem, ToggleGroupRoot, TreeRoot, useFilter } from "reka-ui";
import { colorToCSS, colorToHexRaw, parseColor } from "@open-pencil/core/color";
import { getCoreRowModel, useVueTable } from "@tanstack/vue-table";
//#region ../../node_modules/.bun/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/esm/objectWithoutPropertiesLoose.js
function _objectWithoutPropertiesLoose(r, e) {
	if (null == r) return {};
	var t = {};
	for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
		if (-1 !== e.indexOf(n)) continue;
		t[n] = r[n];
	}
	return t;
}
//#endregion
//#region ../../node_modules/.bun/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/esm/objectWithoutProperties.js
function _objectWithoutProperties(e, t) {
	if (null == e) return {};
	var o, r, i = _objectWithoutPropertiesLoose(e, t);
	if (Object.getOwnPropertySymbols) {
		var n = Object.getOwnPropertySymbols(e);
		for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
	}
	return i;
}
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop-hitbox@1.1.0/node_modules/@atlaskit/pragmatic-drag-and-drop-hitbox/dist/esm/internal/memoize.js
function isShallowEqual(a, b) {
	var aKeys = Object.keys(a);
	var bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) return false;
	return aKeys.every(function(key) {
		return Object.is(a[key], b[key]);
	});
}
/**
* Used to store a stable object, which returns a new object only if one of the values has changed
*/
function stable() {
	var isEqual = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : isShallowEqual;
	var cache = null;
	return function(value) {
		if (cache && isEqual(cache.value, value)) return cache.value;
		cache = { value };
		return cache.value;
	};
}
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop-hitbox@1.1.0/node_modules/@atlaskit/pragmatic-drag-and-drop-hitbox/dist/esm/tree-item.js
var _excluded = ["block"];
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
var uniqueKey$1 = Symbol("tree-item-instruction");
function getCenter(rect) {
	return {
		x: (rect.right + rect.left) / 2,
		y: (rect.bottom + rect.top) / 2
	};
}
function standardHitbox(_ref) {
	var client = _ref.client, borderBox = _ref.borderBox;
	var quarterOfHeight = borderBox.height / 4;
	if (client.y <= borderBox.top + quarterOfHeight) return "reorder-above";
	if (client.y >= borderBox.bottom - quarterOfHeight) return "reorder-below";
	return "make-child";
}
function getInstruction(_ref2) {
	var element = _ref2.element, input = _ref2.input, currentLevel = _ref2.currentLevel, indentPerLevel = _ref2.indentPerLevel, mode = _ref2.mode;
	var client = {
		x: input.clientX,
		y: input.clientY
	};
	var borderBox = element.getBoundingClientRect();
	if (mode === "standard") return {
		type: standardHitbox({
			borderBox,
			client
		}),
		indentPerLevel,
		currentLevel
	};
	var center = getCenter(borderBox);
	if (mode === "expanded") {
		var _type = standardHitbox({
			borderBox,
			client
		});
		return {
			type: _type === "reorder-above" ? _type : "make-child",
			indentPerLevel,
			currentLevel
		};
	}
	var visibleInset = indentPerLevel * currentLevel;
	if (client.x < borderBox.left + visibleInset) {
		if (client.y < center.y) return {
			type: "reorder-above",
			indentPerLevel,
			currentLevel
		};
		var rawLevel = (client.x - borderBox.left) / indentPerLevel;
		return {
			type: "reparent",
			desiredLevel: Math.max(Math.floor(rawLevel), 0),
			indentPerLevel,
			currentLevel
		};
	}
	return {
		type: standardHitbox({
			borderBox,
			client
		}),
		indentPerLevel,
		currentLevel
	};
}
function areInstructionsEqual(a, b) {
	if (a.type !== b.type) return false;
	if (a.type === "instruction-blocked" && b.type === "instruction-blocked") return areInstructionsEqual(a.desired, b.desired);
	return isShallowEqual(a, b);
}
var memoizeInstruction$1 = stable(areInstructionsEqual);
function applyInstructionBlock(_ref3) {
	var desired = _ref3.desired, block = _ref3.block;
	if (block !== null && block !== void 0 && block.includes(desired.type) && desired.type !== "instruction-blocked") return {
		type: "instruction-blocked",
		desired
	};
	return desired;
}
function attachInstruction$1(userData, _ref4) {
	var block = _ref4.block;
	var memoized = memoizeInstruction$1(applyInstructionBlock({
		desired: getInstruction(_objectWithoutProperties(_ref4, _excluded)),
		block
	}));
	return _objectSpread$1(_objectSpread$1({}, userData), {}, _defineProperty({}, uniqueKey$1, memoized));
}
function extractInstruction$1(userData) {
	var _ref5;
	return (_ref5 = userData[uniqueKey$1]) !== null && _ref5 !== void 0 ? _ref5 : null;
}
//#endregion
//#region src/primitives/LayerTree/useLayerDrag.ts
function useLayerDrag(editor, indentPerLevel = 16, onMakeChildDrop) {
	const draggingId = ref(null);
	const instruction = ref(null);
	const instructionTargetId = ref(null);
	function setupItem(el, item) {
		watchEffect((onCleanup) => {
			const element = el.value;
			if (!element) return;
			const data = item();
			const isContainer = editor.graph.isContainer(data.id);
			const mode = data.hasChildren ? "expanded" : "standard";
			onCleanup(combine(draggable({
				element,
				getInitialData: () => ({ id: data.id }),
				onDragStart: () => {
					draggingId.value = data.id;
				},
				onDrop: () => {
					draggingId.value = null;
				}
			}), dropTargetForElements({
				element,
				getData: ({ input, element: el }) => attachInstruction$1({ id: data.id }, {
					input,
					element: el,
					indentPerLevel,
					currentLevel: data.level,
					mode,
					block: isContainer ? ["reparent"] : ["make-child", "reparent"]
				}),
				canDrop: ({ source }) => source.data.id !== data.id,
				onDrag: ({ self }) => {
					const inst = extractInstruction$1(self.data);
					if (!inst || inst.type === "instruction-blocked") {
						instruction.value = null;
						instructionTargetId.value = null;
						return;
					}
					instruction.value = inst;
					instructionTargetId.value = data.id;
				},
				onDragLeave: () => {
					instruction.value = null;
					instructionTargetId.value = null;
				},
				onDrop: () => {
					instruction.value = null;
					instructionTargetId.value = null;
				},
				getIsSticky: () => true
			})));
		});
	}
	onScopeDispose(monitorForElements({ onDrop: ({ source, location }) => {
		const target = location.current.dropTargets.at(0);
		if (!target) return;
		const sourceId = source.data.id;
		const targetId = target.data.id;
		const rawInstruction = extractInstruction$1(target.data);
		if (!rawInstruction || rawInstruction.type === "instruction-blocked") return;
		const inst = rawInstruction;
		if (!sourceId || !targetId) return;
		if (editor.graph.isDescendant(targetId, sourceId)) return;
		const targetNode = editor.graph.getNode(targetId);
		if (!targetNode) return;
		const targetParentId = targetNode.parentId ?? editor.state.currentPageId;
		const targetParent = editor.graph.getNode(targetParentId);
		if (!targetParent) return;
		const targetIndex = targetParent.childIds.indexOf(targetId);
		if (inst.type === "reorder-above") editor.reorderChildWithUndo(sourceId, targetParentId, targetIndex);
		else if (inst.type === "reorder-below") editor.reorderChildWithUndo(sourceId, targetParentId, targetIndex + 1);
		else {
			const container = editor.graph.getNode(targetId);
			if (!container || !editor.graph.isContainer(targetId)) return;
			editor.reorderChildWithUndo(sourceId, targetId, container.childIds.length);
			onMakeChildDrop?.(targetId);
		}
		draggingId.value = null;
		instruction.value = null;
		instructionTargetId.value = null;
	} }));
	return {
		draggingId,
		instruction,
		instructionTargetId,
		setupItem
	};
}
//#endregion
//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop-hitbox@1.1.0/node_modules/@atlaskit/pragmatic-drag-and-drop-hitbox/dist/esm/list-item.js
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
var uniqueKey = Symbol("list-item-instruction");
var axisLookup = {
	vertical: {
		start: "top",
		end: "bottom",
		size: "height",
		point: "y"
	},
	horizontal: {
		start: "left",
		end: "right",
		size: "width",
		point: "x"
	}
};
function reorderAndCombine(_ref) {
	var client = _ref.client, borderBox = _ref.borderBox, axis = _ref.axis;
	var quarterOfSize = borderBox[axis.size] / 4;
	if (client[axis.point] <= borderBox[axis.start] + quarterOfSize) return "reorder-before";
	if (client[axis.point] >= borderBox[axis.end] - quarterOfSize) return "reorder-after";
	return "combine";
}
function reorder(_ref2) {
	var client = _ref2.client, borderBox = _ref2.borderBox, axis = _ref2.axis;
	var halfSize = borderBox[axis.size] / 2;
	if (client[axis.point] < borderBox[axis.start] + halfSize) return "reorder-before";
	return "reorder-after";
}
var memoizeInstruction = stable();
function isPossible() {
	for (var _len = arguments.length, values = new Array(_len), _key = 0; _key < _len; _key++) values[_key] = arguments[_key];
	return values.every(function(value) {
		return value === "available" || value === "blocked";
	});
}
function isNotAvailable() {
	for (var _len2 = arguments.length, values = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) values[_key2] = arguments[_key2];
	return values.every(function(value) {
		return value === "not-available";
	});
}
/**
* Calculate the `Instruction` for a drag operation based on the users input
* and the available operations.
*
* Notes:
*
* - `attachInstruction` can attach an `Instruction | null`. `null` will be attached if all `operations` provided are `"not-available"`.
* - Use `extractInstruction` to obtain the `Instruction | null`
*
* @example
*
* ```ts
* dropTargetForElements({
* 	element: myElement,
*  getData({input, element}) {
*    // The data I want to attach to the drop target
* 		const myData = {type: 'card', cardId: 'A'};
*
*    // Add an instruction to myData
*    return attachInstruction(myData, {
* 			input,
* 			element,
* 			operations: {
* 				'reorder-before': 'available',
* 				'reorder-after': 'available',
* 				combine: 'available',
* 			}
*    });
*  }
* });
* ```
*/
function attachInstruction(userData, _ref3) {
	var _operations$combine, _operations$reorderB, _operations$reorderA;
	var operations = _ref3.operations, element = _ref3.element, input = _ref3.input, _ref3$axis = _ref3.axis, axisValue = _ref3$axis === void 0 ? "vertical" : _ref3$axis;
	var client = {
		x: input.clientX,
		y: input.clientY
	};
	var borderBox = element.getBoundingClientRect();
	var axis = axisLookup[axisValue];
	var combine = (_operations$combine = operations.combine) !== null && _operations$combine !== void 0 ? _operations$combine : "not-available";
	var reorderAbove = (_operations$reorderB = operations["reorder-before"]) !== null && _operations$reorderB !== void 0 ? _operations$reorderB : "not-available";
	var reorderBelow = (_operations$reorderA = operations["reorder-after"]) !== null && _operations$reorderA !== void 0 ? _operations$reorderA : "not-available";
	var operation = function() {
		if (!isPossible(combine)) {
			if (isPossible(reorderAbove, reorderBelow)) return reorder({
				client,
				borderBox,
				axis
			});
			if (isPossible(reorderAbove)) return "reorder-before";
			if (isPossible(reorderBelow)) return "reorder-after";
			return null;
		}
		var result = reorderAndCombine({
			client,
			borderBox,
			axis
		});
		if (result === "reorder-after") return isNotAvailable(reorderBelow) ? "combine" : result;
		if (result === "reorder-before") return isNotAvailable(reorderAbove) ? "combine" : result;
		return result;
	}();
	if (!operation) return userData;
	var memoized = memoizeInstruction({
		operation,
		blocked: operations[operation] === "blocked",
		axis: axisValue
	});
	return _objectSpread(_objectSpread({}, userData), {}, _defineProperty({}, uniqueKey, memoized));
}
/**
* Extract an instruction from the user data if it is available.
*
*
* @example
*
* ```ts
* monitorForElements({
*  onDrop({location}) {
*   const innerMost = location.current.dropTargets[0];
*   if(!innerMost) {
*     return;
*   }
*   const instruction: Instruction | null = extractInstruction(innerMost.data);
*  }
* });
* ```
*/
function extractInstruction(userData) {
	var _ref4;
	return (_ref4 = userData[uniqueKey]) !== null && _ref4 !== void 0 ? _ref4 : null;
}
//#endregion
//#region src/shared/drag/useFlatReorderDrag.ts
function isFlatReorderInstruction(instruction) {
	return !!instruction && !instruction.blocked && (instruction.operation === "reorder-before" || instruction.operation === "reorder-after");
}
function edgeForInstruction(instruction, axis) {
	if (axis === "vertical") return instruction.operation === "reorder-before" ? "top" : "bottom";
	return instruction.operation === "reorder-before" ? "left" : "right";
}
function useFlatReorderDrag({ items, onMove, axis = "vertical", getId = (item) => item.id }) {
	const draggingId = ref(null);
	const instruction = ref(null);
	const instructionTargetId = ref(null);
	const registered = /* @__PURE__ */ new Map();
	function clearInstruction() {
		instruction.value = null;
		instructionTargetId.value = null;
	}
	function cleanupItem(id) {
		registered.get(id)?.cleanup();
		registered.delete(id);
	}
	function setupItem(element, item) {
		const { id } = item();
		if (registered.get(id)?.element === element) return;
		cleanupItem(id);
		if (!element) return;
		const cleanup = combine(draggable({
			element,
			getInitialData: () => ({ id }),
			onDragStart: () => {
				draggingId.value = id;
			},
			onDrop: () => {
				draggingId.value = null;
			}
		}), dropTargetForElements({
			element,
			getData: ({ input, element: target }) => attachInstruction({ id }, {
				input,
				element: target,
				axis,
				operations: {
					"reorder-before": "available",
					"reorder-after": "available"
				}
			}),
			canDrop: ({ source }) => source.data.id !== id,
			onDrag: ({ self }) => {
				const nextInstruction = extractInstruction(self.data);
				if (!isFlatReorderInstruction(nextInstruction)) {
					clearInstruction();
					return;
				}
				instruction.value = nextInstruction;
				instructionTargetId.value = id;
			},
			onDragLeave: clearInstruction,
			onDrop: clearInstruction,
			getIsSticky: () => true
		}));
		registered.set(id, {
			element,
			cleanup
		});
	}
	const cleanupMonitor = monitorForElements({ onDrop: ({ source, location }) => {
		const target = location.current.dropTargets.at(0);
		if (!target) return;
		const sourceId = typeof source.data.id === "string" ? source.data.id : null;
		const targetId = typeof target.data.id === "string" ? target.data.id : null;
		if (!sourceId || !targetId || sourceId === targetId) return;
		const dropInstruction = extractInstruction(target.data);
		if (!isFlatReorderInstruction(dropInstruction)) return;
		const currentItems = items();
		const startIndex = currentItems.findIndex((item) => getId(item) === sourceId);
		const targetIndex = getReorderDestinationIndex({
			startIndex,
			indexOfTarget: currentItems.findIndex((item) => getId(item) === targetId),
			axis,
			closestEdgeOfTarget: edgeForInstruction(dropInstruction, axis)
		});
		if (targetIndex !== startIndex) onMove(sourceId, targetIndex);
		draggingId.value = null;
		clearInstruction();
	} });
	onScopeDispose(() => {
		cleanupMonitor();
		for (const id of registered.keys()) cleanupItem(id);
	});
	return {
		draggingId,
		instruction,
		instructionTargetId,
		setupItem
	};
}
//#endregion
//#region src/primitives/Toolbar/useToolbarState.ts
const CATEGORY_COUNT = 3;
function isToolbarToolActive(tool, activeTool) {
	return tool.key === activeTool || (tool.flyout?.includes(activeTool) ?? false);
}
function getToolbarToolSelection(tool, activeTool, flyoutSelections) {
	if (tool.flyout?.includes(activeTool)) return activeTool;
	return flyoutSelections?.get(tool.key) ?? tool.key;
}
/**
* Returns responsive toolbar UI state for mobile category paging.
*
* This composable is presentation-oriented and complements {@link useToolbar}
* when building toolbar shells.
*/
function useToolbarState() {
	const mobileCategory = ref(0);
	const slideDirection = ref(1);
	const hasPrev = computed(() => mobileCategory.value > 0);
	const hasNext = computed(() => mobileCategory.value < CATEGORY_COUNT - 1);
	function goPrev() {
		if (!hasPrev.value) return;
		slideDirection.value = -1;
		mobileCategory.value--;
	}
	function goNext() {
		if (!hasNext.value) return;
		slideDirection.value = 1;
		mobileCategory.value++;
	}
	return {
		mobileCategory,
		slideDirection,
		hasPrev,
		hasNext,
		isActive: isToolbarToolActive,
		activeKeyForTool: getToolbarToolSelection,
		goPrev,
		goNext
	};
}
//#endregion
//#region src/testing/test-id.ts
function testId(id) {
	return id ? { "data-test-id": id } : {};
}
function testIdSelector(id) {
	return `[data-test-id="${cssEscape(id)}"]`;
}
function toolbarToolTestId(tool, mobile = false) {
	return `${mobile ? "mobile-" : ""}toolbar-tool-${tool.toLowerCase()}`;
}
function toolbarFlyoutTestId(tool, mobile = false) {
	return `${mobile ? "mobile-" : ""}toolbar-flyout-${tool.toLowerCase()}`;
}
function toolbarFlyoutItemTestId(tool, mobile = false) {
	return `${mobile ? "mobile-" : ""}toolbar-flyout-item-${tool.toLowerCase()}`;
}
function variablesAddTestId(type) {
	return `variables-add-${type.toLowerCase()}`;
}
function acpPermissionOptionTestId(kind) {
	return `acp-permission-option-${kind}`;
}
function cssEscape(value) {
	return CSS.escape(value);
}
//#endregion
//#region src/testing/v-test-id.ts
function applyTestId(el, value) {
	if (value) el.setAttribute("data-test-id", value);
	else el.removeAttribute("data-test-id");
}
const vTestId = {
	mounted(el, binding) {
		applyTestId(el, binding.value);
	},
	updated(el, binding) {
		applyTestId(el, binding.value);
	}
};
//#endregion
//#region src/variables/helpers.ts
function createVariableCollectionActions(editor, activeCollectionId) {
	function setActiveCollection(id) {
		activeCollectionId.value = id;
	}
	function addCollection() {
		const id = `col:${randomHex(8)}`;
		const collection = {
			id,
			name: "New collection",
			modes: [{
				modeId: "default",
				name: "Mode 1"
			}],
			defaultModeId: "default",
			variableIds: []
		};
		editor.addCollection(collection);
		activeCollectionId.value = id;
	}
	function renameCollection(id, newName) {
		editor.renameCollection(id, newName);
	}
	function removeCollection(id) {
		editor.removeCollection(id);
		activeCollectionId.value = [...editor.getCollections()][0]?.id ?? "";
	}
	function addMode() {
		const colId = activeCollectionId.value;
		if (!colId) return void 0;
		return editor.addMode(colId);
	}
	function removeMode(modeId) {
		const colId = activeCollectionId.value;
		if (!colId) return;
		editor.removeMode(colId, modeId);
	}
	function renameMode(modeId, newName) {
		const colId = activeCollectionId.value;
		if (!colId) return;
		editor.renameMode(colId, modeId, newName);
	}
	function setDefaultMode(modeId) {
		const colId = activeCollectionId.value;
		if (!colId) return;
		editor.setDefaultMode(colId, modeId);
	}
	function duplicateMode(modeId) {
		const colId = activeCollectionId.value;
		if (!colId) return void 0;
		return editor.duplicateMode(colId, modeId);
	}
	function setActiveMode(modeId) {
		const colId = activeCollectionId.value;
		if (!colId) return;
		editor.setActiveMode(colId, modeId);
	}
	return {
		setActiveCollection,
		addCollection,
		renameCollection,
		removeCollection,
		addMode,
		removeMode,
		renameMode,
		setDefaultMode,
		duplicateMode,
		setActiveMode
	};
}
function createVariableValueActions(editor, getActiveCollection) {
	function defaultVariableValue(type) {
		if (type === "COLOR") return { ...BLACK };
		if (type === "FLOAT") return 0;
		if (type === "BOOLEAN") return false;
		return "";
	}
	function defaultVariableName(type) {
		if (type === "COLOR") return "New color";
		if (type === "FLOAT") return "New number";
		if (type === "BOOLEAN") return "New boolean";
		return "New text";
	}
	function addVariable(type = "COLOR") {
		const col = getActiveCollection();
		if (!col) return;
		const id = `var:${randomHex(8)}`;
		const valuesByMode = {};
		for (const mode of col.modes) valuesByMode[mode.modeId] = defaultVariableValue(type);
		editor.addVariable({
			id,
			name: defaultVariableName(type),
			type,
			collectionId: col.id,
			valuesByMode,
			description: "",
			hiddenFromPublishing: false
		});
	}
	function removeVariable(id) {
		editor.removeVariable(id);
	}
	function renameVariable(id, newName) {
		editor.renameVariable(id, newName);
	}
	function updateVariableValue(id, modeId, value) {
		editor.updateVariableValue(id, modeId, value);
	}
	function formatModeValue(variable, modeId) {
		const value = variable.valuesByMode[modeId];
		if (typeof value === "object" && "r" in value) return colorToHexRaw(value);
		if (typeof value === "object" && "aliasId" in value) {
			const aliased = editor.getVariable(value.aliasId);
			return aliased ? `→ ${aliased.name}` : "→ ?";
		}
		return String(value);
	}
	function parseVariableValue(variable, raw) {
		if (variable.type === "COLOR") return parseColor(raw.startsWith("#") ? raw : `#${raw}`);
		if (variable.type === "FLOAT") {
			const num = Number.parseFloat(raw);
			return Number.isNaN(num) ? void 0 : num;
		}
		if (variable.type === "BOOLEAN") return raw.toLowerCase() === "true";
		return raw;
	}
	function shortName(variable) {
		const parts = variable.name.split("/");
		return parts[parts.length - 1] ?? variable.name;
	}
	return {
		addVariable,
		removeVariable,
		renameVariable,
		updateVariableValue,
		formatModeValue,
		parseVariableValue,
		shortName
	};
}
//#endregion
//#region src/variables/use.ts
function useVariables() {
	const editor = useEditor();
	const searchTerm = ref("");
	function setSearchTerm(term) {
		searchTerm.value = term;
	}
	const collections = useSceneComputed(() => editor.getCollections());
	const activeCollectionId = ref(collections.value[0]?.id ?? "");
	watch(collections, (cols) => {
		if (!activeCollectionId.value && cols[0]) activeCollectionId.value = cols[0].id;
	});
	const activeCollection = computed(() => editor.getCollection(activeCollectionId.value) ?? null);
	const activeModes = computed(() => activeCollection.value?.modes ?? []);
	const variables = useSceneComputed(() => {
		if (!activeCollectionId.value) return [];
		const all = editor.getVariablesForCollection(activeCollectionId.value);
		if (!searchTerm.value) return all;
		const q = searchTerm.value.toLowerCase();
		return all.filter((v) => v.name.toLowerCase().includes(q));
	});
	const collectionActions = createVariableCollectionActions(editor, activeCollectionId);
	const variableActions = createVariableValueActions(editor, () => activeCollection.value);
	return {
		editor,
		collections,
		activeCollectionId,
		activeCollection,
		activeModes,
		variables,
		searchTerm,
		setSearchTerm,
		...collectionActions,
		...variableActions
	};
}
//#endregion
//#region src/variables/dialog/use.ts
function useVariablesDialogState() {
	const variables = useVariables();
	const collectionRename = useInlineRename((id, newName) => {
		variables.renameCollection(id, newName);
	});
	const modeRename = useInlineRename((modeId, newName) => {
		variables.renameMode(modeId, newName);
	});
	function startRenameCollection(id) {
		const col = variables.collections.value.find((c) => c.id === id);
		if (col) collectionRename.start(id, col.name);
	}
	function startRenameMode(modeId) {
		const mode = variables.activeModes.value.find((m) => m.modeId === modeId);
		if (mode) modeRename.start(modeId, mode.name);
	}
	return {
		...variables,
		collectionRename,
		modeRename,
		startRenameCollection,
		startRenameMode
	};
}
//#endregion
//#region src/variables/table/helpers.ts
function commitNameEdit(options, variable, newName) {
	if (newName && newName !== variable.name) options.renameVariable(variable.id, newName);
}
function commitValueEdit(options, variable, modeId, newValue) {
	const parsed = options.parseVariableValue(variable, newValue);
	if (parsed !== void 0) options.updateVariableValue(variable.id, modeId, parsed);
}
function createVariableNameColumn(options) {
	return {
		id: "name",
		header: "Name",
		size: 200,
		minSize: 120,
		maxSize: 400,
		cell: ({ row }) => {
			const variable = row.original;
			return h("div", { class: "flex items-center gap-2" }, [h(options.icons[variable.type] ?? options.fallbackIcon, { class: "size-3.5 shrink-0 text-muted" }), h(EditableRoot, {
				defaultValue: options.shortName(variable),
				class: "min-w-0 flex-1",
				onSubmit: (value) => value && commitNameEdit(options, variable, value)
			}, () => h(EditableArea, { class: "flex" }, () => [h(EditablePreview, { class: "min-w-0 flex-1 cursor-text truncate text-xs text-surface" }), h(EditableInput, { class: "min-w-0 flex-1 rounded border border-border bg-surface/10 px-1 py-0.5 text-xs text-surface outline-none" })]))]);
		}
	};
}
function createVariableModeColumns(options) {
	return options.activeModes.value.map((mode) => ({
		id: `mode-${mode.modeId}`,
		header: mode.name,
		size: 200,
		minSize: 120,
		maxSize: 500,
		cell: ({ row }) => {
			const variable = row.original;
			const value = variable.valuesByMode[mode.modeId];
			if (variable.type === "COLOR" && value && typeof value === "object" && "r" in value) return h(options.ColorInput, {
				color: value,
				onUpdate: (color) => options.updateVariableValue(variable.id, mode.modeId, color)
			});
			return h(EditableRoot, {
				defaultValue: options.formatModeValue(variable, mode.modeId),
				class: "min-w-0 flex-1",
				onSubmit: (submitted) => submitted && commitValueEdit(options, variable, mode.modeId, submitted)
			}, () => h(EditableArea, { class: "flex" }, () => [h(EditablePreview, { class: "min-w-0 flex-1 cursor-text truncate font-mono text-xs text-muted" }), h(EditableInput, { class: "min-w-0 flex-1 rounded border border-border bg-surface/10 px-1 py-0.5 font-mono text-xs text-surface outline-none" })]));
		}
	}));
}
function createDeleteColumn(options) {
	return {
		id: "actions",
		header: "",
		size: 36,
		minSize: 36,
		maxSize: 36,
		enableResizing: false,
		cell: ({ row }) => h("button", {
			class: "flex size-5 cursor-pointer items-center justify-center rounded border-none bg-transparent text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-surface",
			onClick: () => options.removeVariable(row.original.id)
		}, h(options.deleteIcon, { class: "size-3" }))
	};
}
function createVariableColumns(options) {
	return [
		createVariableNameColumn(options),
		...createVariableModeColumns(options),
		createDeleteColumn(options)
	];
}
//#endregion
//#region src/variables/table/use.ts
function useVariablesTable(options) {
	return { columns: computed(() => createVariableColumns(options)) };
}
//#endregion
//#region src/variables/editor/use.ts
/**
* Composes variables dialog state, table columns, and TanStack table wiring
* into a single higher-level variables editor API.
*/
function useVariablesEditor(options) {
	const ctx = useVariablesDialogState();
	const { columns } = useVariablesTable({
		activeModes: ctx.activeModes,
		formatModeValue: ctx.formatModeValue,
		parseVariableValue: ctx.parseVariableValue,
		shortName: ctx.shortName,
		renameVariable: ctx.renameVariable,
		updateVariableValue: ctx.updateVariableValue,
		removeVariable: ctx.removeVariable,
		ColorInput: options.colorInput,
		icons: options.icons,
		fallbackIcon: options.fallbackIcon,
		deleteIcon: options.deleteIcon
	});
	const table = useVueTable({
		get data() {
			return ctx.variables.value;
		},
		get columns() {
			return columns.value;
		},
		columnResizeMode: "onChange",
		getCoreRowModel: getCoreRowModel(),
		defaultColumn: {
			minSize: 60,
			maxSize: 800
		},
		getRowId: (row) => row.id
	});
	const hasCollections = computed(() => ctx.collections.value.length > 0);
	return {
		...ctx,
		columns,
		table,
		hasCollections
	};
}
//#endregion
//#region src/primitives/Fill/useFill.ts
const FILL_CATEGORY = {
	SOLID: "SOLID",
	GRADIENT_LINEAR: "GRADIENT",
	GRADIENT_RADIAL: "GRADIENT",
	GRADIENT_ANGULAR: "GRADIENT",
	GRADIENT_DIAMOND: "GRADIENT",
	IMAGE: "IMAGE"
};
function effectiveColor(color, opacity) {
	return {
		...color,
		a: color.a * opacity
	};
}
function gradientCSS(stops, opacity) {
	return stops.map((stop) => `${colorToCSS(effectiveColor(stop.color, opacity))} ${stop.position * 100}%`).join(", ");
}
function fillCategory(fill) {
	return FILL_CATEGORY[fill.type] ?? "SOLID";
}
function fillIsTransparent(fill) {
	if (fill.opacity < 1) return true;
	if (fillCategory(fill) === "GRADIENT") return fill.gradientStops?.some((stop) => stop.color.a < 1) ?? fill.color.a < 1;
	return fill.color.a < 1;
}
function fillSwatchBackground(fill) {
	if (fillCategory(fill) === "GRADIENT" && fill.gradientStops?.length) return `linear-gradient(to right, ${gradientCSS(fill.gradientStops, fill.opacity)})`;
	return colorToCSS(effectiveColor(fill.color, fill.opacity));
}
/** Fill category state and immutable conversion actions without picker or popover behavior. */
function useFill(fill, onUpdate) {
	const category = computed(() => fillCategory(fill.value));
	const swatchBackground = computed(() => fillSwatchBackground(fill.value));
	const transparent = computed(() => fillIsTransparent(fill.value));
	function toSolid() {
		if (category.value === "SOLID") return;
		const color = fill.value.gradientStops?.[0]?.color ?? fill.value.color;
		onUpdate({
			...fill.value,
			type: "SOLID",
			color: { ...color }
		});
	}
	function toGradient() {
		if (category.value === "GRADIENT") return;
		const gradientStops = fill.value.gradientStops?.length ? structuredClone(fill.value.gradientStops) : [{
			color: { ...fill.value.color },
			position: 0
		}, {
			color: {
				r: 1,
				g: 1,
				b: 1,
				a: 1
			},
			position: 1
		}];
		onUpdate({
			...fill.value,
			type: "GRADIENT_LINEAR",
			gradientStops,
			gradientTransform: {
				m00: 1,
				m01: 0,
				m02: 0,
				m10: 0,
				m11: 0,
				m12: .5
			}
		});
	}
	function toImage() {
		if (category.value === "IMAGE") return;
		onUpdate({
			...fill.value,
			type: "IMAGE"
		});
	}
	return {
		category,
		swatchBackground,
		transparent,
		actions: {
			toSolid,
			toGradient,
			toImage
		},
		toSolid,
		toGradient,
		toImage
	};
}
//#endregion
//#region src/primitives/Fill/FillRoot.vue
const _sfc_main$40 = /* @__PURE__ */ defineComponent({
	__name: "FillRoot",
	props: { fill: {
		type: Object,
		required: true
	} },
	emits: ["update"],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const __returned__ = {
			emit,
			model: useFill(computed(() => __props.fill), (updated) => emit("update", updated))
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$40(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default", {
		fill: $props.fill,
		category: $setup.model.category.value,
		swatchBackground: $setup.model.swatchBackground.value,
		transparent: $setup.model.transparent.value,
		actions: $setup.model.actions
	});
}
var FillRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$40, [["render", _sfc_render$40], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/Fill/FillRoot.vue"]]);
//#endregion
//#region src/primitives/BindableValue/context.ts
const BINDABLE_VALUE_KEY = Symbol("BindableValue");
function provideBindableValue(context) {
	provide(BINDABLE_VALUE_KEY, context);
}
function useBindableValue() {
	const context = inject(BINDABLE_VALUE_KEY);
	if (!context) throw new Error("[open-pencil] BindableValue part must be used inside BindableValueRoot");
	return context;
}
function useOptionalBindableValue() {
	return inject(BINDABLE_VALUE_KEY, void 0);
}
//#endregion
//#region src/primitives/Fill/FillSwatch.vue
const _sfc_main$39 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "FillSwatch",
	props: {
		fill: {
			type: Object,
			required: true
		},
		label: {
			type: String,
			required: false
		},
		asChild: {
			type: Boolean,
			required: false,
			default: false
		},
		as: {
			type: null,
			required: false,
			default: "span"
		}
	},
	setup(__props, { expose: __expose }) {
		__expose();
		const binding = useOptionalBindableValue();
		const bindingState = computed(() => binding?.state.value);
		const boundColor = computed(() => bindingState.value === "bound" ? binding?.resolvedValue.value : void 0);
		const effectiveFill = computed(() => __props.fill.type === "SOLID" && boundColor.value ? {
			...__props.fill,
			color: boundColor.value
		} : __props.fill);
		const category = computed(() => fillCategory(effectiveFill.value));
		const background = computed(() => fillSwatchBackground(effectiveFill.value));
		const transparent = computed(() => fillIsTransparent(effectiveFill.value));
		const accessibleLabel = computed(() => __props.label ?? `${category.value.toLowerCase()} fill`);
		const stateAttrs = computed(() => binding?.stateAttrs.value);
		const __returned__ = {
			binding,
			bindingState,
			boundColor,
			effectiveFill,
			category,
			background,
			transparent,
			accessibleLabel,
			stateAttrs,
			slotProps: computed(() => ({
				fill: effectiveFill.value,
				color: effectiveFill.value.color,
				category: category.value,
				background: background.value,
				transparent: transparent.value,
				bindingState: bindingState.value,
				stateAttrs: stateAttrs.value
			})),
			get Primitive() {
				return Primitive;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$39(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["Primitive"], mergeProps({
		..._ctx.$attrs,
		...$setup.stateAttrs
	}, {
		as: $props.as,
		"as-child": $props.asChild,
		"aria-label": $setup.accessibleLabel,
		"data-fill-type": $setup.effectiveFill.type,
		"data-fill-category": $setup.category,
		"data-transparent": $setup.transparent ? "" : void 0,
		style: { "--open-pencil-fill-swatch-background": $setup.background },
		role: "img",
		"aria-roledescription": "fill swatch",
		"data-slot": "swatch"
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($setup.slotProps)))]),
		_: 3
	}, 16, [
		"as",
		"as-child",
		"aria-label",
		"data-fill-type",
		"data-fill-category",
		"data-transparent",
		"style"
	]);
}
var FillSwatch_default = /* @__PURE__ */ export_helper_default(_sfc_main$39, [["render", _sfc_render$39], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/Fill/FillSwatch.vue"]]);
//#endregion
//#region src/primitives/GradientEditor/useGradientStops.ts
const SUBTYPES = [
	{
		value: "GRADIENT_LINEAR",
		label: "Linear"
	},
	{
		value: "GRADIENT_RADIAL",
		label: "Radial"
	},
	{
		value: "GRADIENT_ANGULAR",
		label: "Angular"
	},
	{
		value: "GRADIENT_DIAMOND",
		label: "Diamond"
	}
];
const DEFAULT_TRANSFORMS = {
	GRADIENT_LINEAR: {
		m00: 1,
		m01: 0,
		m02: 0,
		m10: 0,
		m11: 0,
		m12: .5
	},
	GRADIENT_RADIAL: {
		m00: .5,
		m01: 0,
		m02: .5,
		m10: 0,
		m11: .5,
		m12: .5
	},
	GRADIENT_ANGULAR: {
		m00: .5,
		m01: 0,
		m02: .5,
		m10: 0,
		m11: .5,
		m12: .5
	},
	GRADIENT_DIAMOND: {
		m00: .5,
		m01: 0,
		m02: .5,
		m10: 0,
		m11: .5,
		m12: .5
	}
};
/**
* Returns gradient-stop state and mutation helpers for a fill.
*
* Use this composable for gradient editors that need subtype switching,
* active-stop selection, stop dragging, and stop color/opacity editing.
*/
function useGradientStops(fill, onUpdate) {
	const activeStopIndex = ref(0);
	const stops = computed(() => fill.value.gradientStops ?? []);
	const subtype = computed(() => fill.value.type);
	const activeColor = computed(() => {
		const s = stops.value;
		if (!s.length) return fill.value.color;
		return s[Math.min(activeStopIndex.value, s.length - 1)].color;
	});
	const barBackground = computed(() => stops.value.length ? `linear-gradient(to right, ${stops.value.map((s) => `${colorToCSS(s.color)} ${s.position * 100}%`).join(", ")})` : "");
	function emitStops(newStops) {
		onUpdate({
			...fill.value,
			gradientStops: newStops
		});
	}
	function setSubtype(type) {
		if (type === fill.value.type) return;
		onUpdate({
			...fill.value,
			type,
			gradientTransform: DEFAULT_TRANSFORMS[type]
		});
	}
	function selectStop(index) {
		activeStopIndex.value = index;
	}
	function addStop() {
		const s = [...stops.value];
		const pos = s.length >= 2 ? (s[s.length - 2].position + s[s.length - 1].position) / 2 : .5;
		s.push({
			color: { ...activeColor.value },
			position: pos
		});
		s.sort((a, b) => a.position - b.position);
		activeStopIndex.value = s.findIndex((stop) => stop.position === pos);
		emitStops(s);
	}
	function removeStop(index) {
		if (stops.value.length <= 2) return;
		emitStops(stops.value.filter((_, i) => i !== index));
		activeStopIndex.value = Math.min(activeStopIndex.value, stops.value.length - 2);
	}
	function updateStopPosition(index, position) {
		const s = [...stops.value];
		s[index] = {
			...s[index],
			position: Math.max(0, Math.min(1, position / 100))
		};
		emitStops(s);
	}
	function updateStopColor(index, hex) {
		selectStop(index);
		colorModel.updateHex(hex);
	}
	function updateStopOpacity(index, opacity) {
		const s = [...stops.value];
		s[index] = {
			...s[index],
			color: {
				...s[index].color,
				a: Math.max(0, Math.min(1, opacity / 100))
			}
		};
		emitStops(s);
	}
	function updateActiveColor(color) {
		const s = [...stops.value];
		const idx = Math.min(activeStopIndex.value, s.length - 1);
		s[idx] = {
			...s[idx],
			color
		};
		emitStops(s);
	}
	const colorModel = useColorModel({
		color: activeColor,
		onUpdate: updateActiveColor
	});
	function dragStop(index, position) {
		const s = [...stops.value];
		s[index] = {
			...s[index],
			position
		};
		emitStops(s);
	}
	return {
		activeStopIndex,
		stops,
		subtype,
		subtypes: SUBTYPES,
		activeColor,
		barBackground,
		setSubtype,
		selectStop,
		addStop,
		removeStop,
		updateStopPosition,
		updateStopColor,
		updateStopOpacity,
		updateActiveColor,
		dragStop
	};
}
//#endregion
//#region src/primitives/FontPicker/useFontPicker.ts
function normalizeOptions(items) {
	return items.map((item) => typeof item === "string" ? {
		family: item,
		source: "local"
	} : item);
}
/**
* Returns searchable font-picker state and selection helpers.
*/
function useFontPicker(options) {
	const families = ref([]);
	const searchTerm = ref("");
	const open = ref(false);
	const loading = ref(false);
	const accessState = ref(options.localFontAccess?.state() ?? "granted");
	const { contains } = useFilter({ sensitivity: "base" });
	const filtered = computed(() => {
		if (!searchTerm.value) return families.value;
		return families.value.filter((option) => contains(option.family, searchTerm.value));
	});
	async function loadFamilies() {
		if (families.value.length > 0 || loading.value) return;
		loading.value = true;
		try {
			families.value = normalizeOptions(await options.listFamilies());
			accessState.value = options.localFontAccess?.state() ?? accessState.value;
		} finally {
			loading.value = false;
		}
	}
	watch(open, async (isOpen) => {
		if (!isOpen) return;
		searchTerm.value = "";
		accessState.value = options.localFontAccess?.state() ?? accessState.value;
		if (accessState.value === "prompt") {
			await requestAccess();
			return;
		}
		await loadFamilies();
	});
	async function requestAccess() {
		if (!options.localFontAccess || loading.value) return;
		loading.value = true;
		try {
			families.value = normalizeOptions(await options.localFontAccess.load());
			accessState.value = options.localFontAccess.state();
		} finally {
			loading.value = false;
		}
	}
	function select(family) {
		options.modelValue.value = family;
		options.onSelect?.(family);
		open.value = false;
	}
	return {
		families,
		searchTerm,
		open,
		filtered,
		loading,
		accessState,
		requestAccess,
		select
	};
}
//#endregion
//#region src/primitives/ColorPicker/ColorInputRoot.vue
const _sfc_main$38 = /* @__PURE__ */ defineComponent({
	__name: "ColorInputRoot",
	props: {
		color: {
			type: Object,
			required: true
		},
		editable: {
			type: Boolean,
			required: false,
			default: false
		},
		okhcl: {
			type: [Object, null],
			required: false,
			default: null
		}
	},
	emits: ["update"],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const model = useColorModel({
			color: () => __props.color,
			onUpdate: (nextColor) => emit("update", nextColor)
		});
		const __returned__ = {
			emit,
			model,
			actions: {
				updateFromHex: model.updateHex,
				updateColor: model.updateColor
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$38(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default", {
		color: $props.color,
		editable: $props.editable,
		hex: $setup.model.hex.value,
		actions: $setup.actions,
		okhcl: $props.okhcl
	});
}
var ColorInputRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$38, [["render", _sfc_render$38], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/ColorPicker/ColorInputRoot.vue"]]);
//#endregion
//#region src/primitives/ColorPicker/ColorPickerRoot.vue
const _sfc_main$37 = /* @__PURE__ */ defineComponent({
	__name: "ColorPickerRoot",
	props: {
		color: {
			type: Object,
			required: true
		},
		label: {
			type: String,
			required: false,
			default: "Edit color"
		},
		ui: {
			type: Object,
			required: false
		}
	},
	emits: [
		"update",
		"openChange",
		"cancel"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const swatchBg = computed(() => colorToCSS(__props.color));
		function cancelFromEscape(event) {
			event.stopPropagation();
			emit("cancel");
		}
		const __returned__ = {
			emit,
			swatchBg,
			cancelFromEscape,
			get PopoverContent() {
				return PopoverContent;
			},
			get PopoverPortal() {
				return PopoverPortal;
			},
			get PopoverRoot() {
				return PopoverRoot;
			},
			get PopoverTrigger() {
				return PopoverTrigger;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
const _hoisted_1$4 = ["aria-label"];
function _sfc_render$37(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["PopoverRoot"], { "onUpdate:open": _cache[0] || (_cache[0] = ($event) => $setup.emit("openChange", $event)) }, {
		default: withCtx(() => [createVNode($setup["PopoverTrigger"], { "as-child": "" }, {
			default: withCtx(() => [renderSlot(_ctx.$slots, "trigger", { style: normalizeStyle({ background: $setup.swatchBg }) }, () => [createElementVNode("button", {
				type: "button",
				"aria-label": $props.label,
				class: normalizeClass($props.ui?.swatch),
				style: normalizeStyle({ background: $setup.swatchBg })
			}, null, 14, _hoisted_1$4)])]),
			_: 3
		}), createVNode($setup["PopoverPortal"], null, {
			default: withCtx(() => [createVNode($setup["PopoverContent"], {
				class: normalizeClass($props.ui?.content),
				"side-offset": 4,
				side: "left",
				"data-picker-content": "",
				onEscapeKeyDown: $setup.cancelFromEscape
			}, {
				default: withCtx(() => [renderSlot(_ctx.$slots, "default", { color: $props.color })]),
				_: 3
			}, 8, ["class"])]),
			_: 3
		})]),
		_: 3
	});
}
var ColorPickerRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$37, [["render", _sfc_render$37], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/ColorPicker/ColorPickerRoot.vue"]]);
//#endregion
//#region src/primitives/ChannelSlider/context.ts
const CHANNEL_SLIDER_KEY = Symbol("ChannelSlider");
function provideChannelSlider(context) {
	provide(CHANNEL_SLIDER_KEY, context);
}
function useChannelSlider() {
	const context = inject(CHANNEL_SLIDER_KEY);
	if (!context) throw new Error("[open-pencil] ChannelSlider part must be used inside ChannelSliderRoot");
	return context;
}
//#endregion
//#region src/primitives/ChannelSlider/ChannelSliderRoot.vue
/**
* Scalar color-channel slider used for OkHCL until Reka supports that color space.
*
* @deprecated-when-upstream Replace with Reka ColorSlider after
* https://github.com/unovue/reka-ui/issues/2798 lands.
*/
const _sfc_main$36 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "ChannelSliderRoot",
	props: {
		modelValue: {
			type: Number,
			required: true
		},
		label: {
			type: String,
			required: true
		},
		min: {
			type: Number,
			required: false,
			default: 0
		},
		max: {
			type: Number,
			required: false,
			default: 100
		},
		step: {
			type: Number,
			required: false,
			default: 1
		},
		orientation: {
			type: String,
			required: false,
			default: "horizontal"
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		inverted: {
			type: Boolean,
			required: false,
			default: false
		},
		formatValueText: {
			type: Function,
			required: false,
			default: String
		},
		asChild: {
			type: Boolean,
			required: false,
			default: false
		},
		as: {
			type: null,
			required: false,
			default: "span"
		}
	},
	emits: ["update:modelValue", "valueCommit"],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const sliderValue = computed({
			get: () => [__props.modelValue],
			set: (values) => emit("update:modelValue", values[0] ?? __props.min)
		});
		const value = computed(() => __props.modelValue);
		const labelRef = computed(() => __props.label);
		const minRef = computed(() => __props.min);
		const maxRef = computed(() => __props.max);
		const stepRef = computed(() => __props.step);
		const disabledRef = computed(() => __props.disabled);
		const orientationRef = computed(() => __props.orientation);
		const valueText = computed(() => __props.formatValueText(__props.modelValue));
		const slotProps = computed(() => ({
			value: value.value,
			min: minRef.value,
			max: maxRef.value,
			step: stepRef.value,
			disabled: disabledRef.value,
			orientation: orientationRef.value
		}));
		provideChannelSlider({
			value,
			label: labelRef,
			valueText,
			min: minRef,
			max: maxRef,
			step: stepRef,
			disabled: disabledRef,
			orientation: orientationRef
		});
		function commit(values) {
			emit("valueCommit", values[0] ?? __props.min);
		}
		const __returned__ = {
			emit,
			sliderValue,
			value,
			labelRef,
			minRef,
			maxRef,
			stepRef,
			disabledRef,
			orientationRef,
			valueText,
			slotProps,
			commit,
			get SliderRoot() {
				return SliderRoot;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$36(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["SliderRoot"], mergeProps(_ctx.$attrs, {
		modelValue: $setup.sliderValue,
		"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.sliderValue = $event),
		as: $props.as,
		"as-child": $props.asChild,
		min: $props.min,
		max: $props.max,
		step: $props.step,
		orientation: $props.orientation,
		disabled: $props.disabled,
		inverted: $props.inverted,
		"data-slot": "root",
		onValueCommit: $setup.commit
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($setup.slotProps)))]),
		_: 3
	}, 16, [
		"modelValue",
		"as",
		"as-child",
		"min",
		"max",
		"step",
		"orientation",
		"disabled",
		"inverted"
	]);
}
var ChannelSliderRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$36, [["render", _sfc_render$36], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/ChannelSlider/ChannelSliderRoot.vue"]]);
//#endregion
//#region src/primitives/ChannelSlider/ChannelSliderTrack.vue
const _sfc_main$35 = /* @__PURE__ */ defineComponent({
	__name: "ChannelSliderTrack",
	props: {
		asChild: {
			type: Boolean,
			required: false,
			default: false
		},
		as: {
			type: null,
			required: false,
			default: "span"
		}
	},
	setup(__props, { expose: __expose }) {
		__expose();
		const __returned__ = { get SliderTrack() {
			return SliderTrack;
		} };
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$35(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["SliderTrack"], {
		as: $props.as,
		"as-child": $props.asChild,
		"data-slot": "track"
	}, {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
		_: 3
	}, 8, ["as", "as-child"]);
}
var ChannelSliderTrack_default = /* @__PURE__ */ export_helper_default(_sfc_main$35, [["render", _sfc_render$35], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/ChannelSlider/ChannelSliderTrack.vue"]]);
//#endregion
//#region src/primitives/ChannelSlider/ChannelSliderThumb.vue
const _sfc_main$34 = /* @__PURE__ */ defineComponent({
	__name: "ChannelSliderThumb",
	props: {
		asChild: {
			type: Boolean,
			required: false,
			default: false
		},
		as: {
			type: null,
			required: false,
			default: "span"
		}
	},
	setup(__props, { expose: __expose }) {
		__expose();
		const __returned__ = {
			context: useChannelSlider(),
			get SliderThumb() {
				return SliderThumb;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$34(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["SliderThumb"], {
		as: $props.as,
		"as-child": $props.asChild,
		"aria-label": $setup.context.label.value,
		"aria-valuetext": $setup.context.valueText.value,
		"data-slot": "thumb"
	}, {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", {
			value: $setup.context.value.value,
			valueText: $setup.context.valueText.value,
			label: $setup.context.label.value
		})]),
		_: 3
	}, 8, [
		"as",
		"as-child",
		"aria-label",
		"aria-valuetext"
	]);
}
var ChannelSliderThumb_default = /* @__PURE__ */ export_helper_default(_sfc_main$34, [["render", _sfc_render$34], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/ChannelSlider/ChannelSliderThumb.vue"]]);
//#endregion
//#region src/primitives/FontPicker/FontPickerRoot.vue
const _sfc_main$33 = /* @__PURE__ */ defineComponent({
	__name: "FontPickerRoot",
	props: /* @__PURE__ */ mergeModels({
		listFamilies: {
			type: Function,
			required: true
		},
		localFontAccess: {
			type: Object,
			required: false
		},
		ui: {
			type: Object,
			required: false
		},
		emptySearchText: {
			type: String,
			required: false
		},
		emptyFontsText: {
			type: String,
			required: false
		},
		emptyFontsHint: {
			type: String,
			required: false
		}
	}, {
		"modelValue": {
			type: String,
			required: true
		},
		"modelModifiers": {}
	}),
	emits: /* @__PURE__ */ mergeModels(["select"], ["update:modelValue"]),
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const modelValue = useModel(__props, "modelValue");
		const emit = __emit;
		const contentRef = templateRef("contentRef");
		function focusSearchInput() {
			nextTick(() => {
				const content = unrefElement(contentRef);
				if (!(content instanceof HTMLElement)) return;
				content.querySelector("input")?.focus();
			});
		}
		const { searchTerm, open, filtered, loading, accessState, requestAccess, select } = useFontPicker({
			modelValue,
			listFamilies: __props.listFamilies,
			localFontAccess: __props.localFontAccess,
			onSelect: (family) => emit("select", family)
		});
		const __returned__ = {
			modelValue,
			emit,
			contentRef,
			focusSearchInput,
			searchTerm,
			open,
			filtered,
			loading,
			accessState,
			requestAccess,
			select,
			get ComboboxAnchor() {
				return ComboboxAnchor;
			},
			get ComboboxContent() {
				return ComboboxContent;
			},
			get ComboboxInput() {
				return ComboboxInput;
			},
			get ComboboxItem() {
				return ComboboxItem;
			},
			get ComboboxItemIndicator() {
				return ComboboxItemIndicator;
			},
			get ComboboxPortal() {
				return ComboboxPortal;
			},
			get ComboboxRoot() {
				return ComboboxRoot;
			},
			get ComboboxTrigger() {
				return ComboboxTrigger;
			},
			get ComboboxVirtualizer() {
				return ComboboxVirtualizer;
			},
			get ComboboxViewport() {
				return ComboboxViewport;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
const _hoisted_1$3 = { class: "truncate" };
const _hoisted_2$1 = { class: "truncate" };
const _hoisted_3$1 = { key: 0 };
const _hoisted_4 = { key: 1 };
const _hoisted_5 = { key: 2 };
const _hoisted_6 = { key: 3 };
const _hoisted_7 = {
	key: 4,
	class: "mt-1"
};
const _hoisted_8 = ["disabled"];
function _sfc_render$33(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["ComboboxRoot"], {
		open: $setup.open,
		"onUpdate:open": _cache[3] || (_cache[3] = ($event) => $setup.open = $event),
		"model-value": $setup.modelValue,
		"ignore-filter": true,
		"onUpdate:modelValue": _cache[4] || (_cache[4] = (v) => {
			if (typeof v === "string") $setup.select(v);
		})
	}, {
		default: withCtx(() => [createVNode($setup["ComboboxAnchor"], { "as-child": "" }, {
			default: withCtx(() => [createVNode($setup["ComboboxTrigger"], { "as-child": "" }, {
				default: withCtx(() => [renderSlot(_ctx.$slots, "trigger", {
					value: $setup.modelValue,
					open: $setup.open
				}, () => [createElementVNode("button", { class: normalizeClass($props.ui?.trigger) }, [createElementVNode("span", _hoisted_1$3, toDisplayString($setup.modelValue), 1)], 2)])]),
				_: 3
			})]),
			_: 3
		}), createVNode($setup["ComboboxPortal"], null, {
			default: withCtx(() => [createVNode($setup["ComboboxContent"], {
				"side-offset": 2,
				align: "start",
				position: "popper",
				class: normalizeClass($props.ui?.content),
				onOpenAutoFocus: _cache[2] || (_cache[2] = withModifiers(() => {}, ["prevent"])),
				ref: "contentRef",
				onVnodeMounted: $setup.focusSearchInput
			}, {
				default: withCtx(() => [renderSlot(_ctx.$slots, "search", { searchTerm: $setup.searchTerm }, () => [createVNode($setup["ComboboxInput"], {
					modelValue: $setup.searchTerm,
					"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.searchTerm = $event),
					"display-value": () => "",
					class: normalizeClass($props.ui?.search),
					placeholder: "Search fonts…",
					autocomplete: "off",
					autocorrect: "off",
					autocapitalize: "off",
					spellcheck: "false"
				}, null, 8, ["modelValue", "class"])]), createVNode($setup["ComboboxViewport"], { class: normalizeClass($props.ui?.viewport ?? "max-h-72 overflow-y-auto") }, {
					default: withCtx(() => [createVNode($setup["ComboboxVirtualizer"], {
						options: $setup.filtered,
						"text-content": (option) => option.family,
						"estimate-size": 36
					}, {
						default: withCtx(({ option }) => [createVNode($setup["ComboboxItem"], {
							value: option.family,
							class: normalizeClass($props.ui?.item),
							style: normalizeStyle({ fontFamily: `'${option.family}', sans-serif` })
						}, {
							default: withCtx(() => [renderSlot(_ctx.$slots, "item", {
								family: option.family,
								source: option.source,
								selected: option.family === $setup.modelValue
							}, () => [createVNode($setup["ComboboxItemIndicator"], null, {
								default: withCtx(() => [renderSlot(_ctx.$slots, "indicator", { selected: option.family === $setup.modelValue })]),
								_: 2
							}, 1024), createElementVNode("span", _hoisted_2$1, toDisplayString(option.family), 1)])]),
							_: 2
						}, 1032, [
							"value",
							"class",
							"style"
						])]),
						_: 3
					}, 8, ["options", "text-content"]), $setup.filtered.length === 0 && $setup.searchTerm ? (openBlock(), createElementBlock("div", {
						key: 0,
						class: normalizeClass($props.ui?.empty)
					}, toDisplayString($props.emptySearchText ?? "No fonts found"), 3)) : $setup.filtered.length === 0 ? (openBlock(), createElementBlock("div", {
						key: 1,
						class: normalizeClass($props.ui?.empty)
					}, [createElementVNode("div", null, [
						$setup.accessState === "prompt" ? (openBlock(), createElementBlock("p", _hoisted_3$1, " Allow local font access to browse installed fonts. ")) : $setup.accessState === "denied" ? (openBlock(), createElementBlock("p", _hoisted_4, " Local font access is blocked for this site. ")) : $setup.accessState === "unsupported" ? (openBlock(), createElementBlock("p", _hoisted_5, " Local fonts are not available in this browser. ")) : (openBlock(), createElementBlock("p", _hoisted_6, toDisplayString($props.emptyFontsText ?? "No local fonts available."), 1)),
						$props.emptyFontsHint ? (openBlock(), createElementBlock("p", _hoisted_7, toDisplayString($props.emptyFontsHint), 1)) : createCommentVNode("v-if", true),
						$setup.accessState === "prompt" ? (openBlock(), createElementBlock("button", {
							key: 5,
							type: "button",
							class: normalizeClass($props.ui?.emptyAction),
							disabled: $setup.loading,
							onClick: _cache[1] || (_cache[1] = (...args) => $setup.requestAccess && $setup.requestAccess(...args))
						}, toDisplayString($setup.loading ? "Loading…" : "Allow local fonts"), 11, _hoisted_8)) : createCommentVNode("v-if", true)
					])], 2)) : createCommentVNode("v-if", true)]),
					_: 3
				}, 8, ["class"])]),
				_: 3
			}, 8, ["class"])]),
			_: 3
		})]),
		_: 3
	}, 8, ["open", "model-value"]);
}
var FontPickerRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$33, [["render", _sfc_render$33], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/FontPicker/FontPickerRoot.vue"]]);
//#endregion
//#region src/primitives/GradientEditor/GradientEditorRoot.vue
const _sfc_main$32 = /* @__PURE__ */ defineComponent({
	__name: "GradientEditorRoot",
	props: { fill: {
		type: Object,
		required: true
	} },
	emits: ["update"],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const { activeStopIndex, stops, subtype, subtypes, activeColor, barBackground, setSubtype, selectStop, addStop, removeStop, updateStopPosition, updateStopColor, updateStopOpacity, updateActiveColor, dragStop } = useGradientStops(computed(() => __props.fill), (updated) => emit("update", updated));
		const __returned__ = {
			emit,
			activeStopIndex,
			stops,
			subtype,
			subtypes,
			activeColor,
			barBackground,
			setSubtype,
			selectStop,
			addStop,
			removeStop,
			updateStopPosition,
			updateStopColor,
			updateStopOpacity,
			updateActiveColor,
			dragStop,
			actions: {
				setSubtype,
				selectStop,
				addStop,
				removeStop,
				updateStopPosition,
				updateStopColor,
				updateStopOpacity,
				updateActiveColor,
				dragStop
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$32(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default", {
		stops: $setup.stops,
		subtype: $setup.subtype,
		subtypes: $setup.subtypes,
		activeStopIndex: $setup.activeStopIndex,
		activeColor: $setup.activeColor,
		barBackground: $setup.barBackground,
		actions: $setup.actions
	});
}
var GradientEditorRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$32, [["render", _sfc_render$32], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/GradientEditor/GradientEditorRoot.vue"]]);
//#endregion
//#region src/primitives/GradientEditor/GradientEditorBar.vue
const _sfc_main$31 = /* @__PURE__ */ defineComponent({
	__name: "GradientEditorBar",
	props: {
		stops: {
			type: Array,
			required: true
		},
		activeStopIndex: {
			type: Number,
			required: true
		},
		barBackground: {
			type: String,
			required: true
		},
		ui: {
			type: Object,
			required: false
		}
	},
	emits: ["selectStop", "dragStop"],
	setup(__props, { expose: __expose, emit: __emit }) {
		const emit = __emit;
		const barRef = templateRef("barRef");
		const draggingIndex = ref(null);
		function stopPointerDown(index, e) {
			emit("selectStop", index);
			draggingIndex.value = index;
			barRef.value?.setPointerCapture(e.pointerId);
		}
		function onPointerMove(e) {
			const el = barRef.value;
			if (!el || draggingIndex.value === null || !el.hasPointerCapture(e.pointerId)) return;
			const rect = el.getBoundingClientRect();
			const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
			emit("dragStop", draggingIndex.value, pos);
		}
		function onPointerUp() {
			draggingIndex.value = null;
		}
		const actions = { stopPointerDown };
		__expose({ barRef });
		const __returned__ = {
			emit,
			barRef,
			draggingIndex,
			stopPointerDown,
			onPointerMove,
			onPointerUp,
			actions
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$31(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createElementBlock("div", {
		ref: "barRef",
		class: normalizeClass($props.ui?.bar),
		style: normalizeStyle({ background: $props.barBackground }),
		onPointermove: $setup.onPointerMove,
		onPointerup: $setup.onPointerUp
	}, [renderSlot(_ctx.$slots, "default", {
		stops: $props.stops,
		activeStopIndex: $props.activeStopIndex,
		barBackground: $props.barBackground,
		actions: $setup.actions,
		draggingIndex: $setup.draggingIndex
	})], 38);
}
var GradientEditorBar_default = /* @__PURE__ */ export_helper_default(_sfc_main$31, [["render", _sfc_render$31], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/GradientEditor/GradientEditorBar.vue"]]);
//#endregion
//#region src/primitives/GradientEditor/GradientEditorStop.vue
const _sfc_main$30 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "GradientEditorStop",
	props: {
		stop: {
			type: Object,
			required: true
		},
		index: {
			type: Number,
			required: true
		},
		active: {
			type: Boolean,
			required: true
		},
		dragging: {
			type: Boolean,
			required: false,
			default: false
		},
		interactive: {
			type: Boolean,
			required: false,
			default: true
		},
		removable: {
			type: Boolean,
			required: false,
			default: true
		},
		positionStep: {
			type: Number,
			required: false,
			default: 1
		},
		label: {
			type: String,
			required: false
		},
		asChild: {
			type: Boolean,
			required: false,
			default: false
		},
		as: {
			type: null,
			required: false,
			default: "div"
		}
	},
	emits: [
		"select",
		"updatePosition",
		"updateColor",
		"updateOpacity",
		"remove"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const positionPercent = computed(() => Math.round(__props.stop.position * 100));
		const opacityPercent = computed(() => Math.round(__props.stop.color.a * 100));
		const hex = computed(() => colorToHexRaw(__props.stop.color));
		const css = computed(() => colorToCSS(__props.stop.color));
		const accessibleLabel = computed(() => __props.label ?? `Gradient stop ${__props.index + 1}`);
		const actions = {
			select: () => emit("select", __props.index),
			updatePosition: (position) => emit("updatePosition", __props.index, position),
			updateColor: (hexValue) => emit("updateColor", __props.index, hexValue),
			updateOpacity: (opacity) => emit("updateOpacity", __props.index, opacity),
			remove: () => emit("remove", __props.index)
		};
		function onKeydown(event) {
			if (!__props.interactive) return;
			const amount = __props.positionStep * (event.shiftKey ? 10 : 1);
			let nextPosition;
			if (event.code === "ArrowLeft" || event.code === "ArrowDown") nextPosition = positionPercent.value - amount;
			else if (event.code === "ArrowRight" || event.code === "ArrowUp") nextPosition = positionPercent.value + amount;
			else if (event.code === "Home") nextPosition = 0;
			else if (event.code === "End") nextPosition = 100;
			else if ((event.code === "Delete" || event.code === "Backspace") && __props.removable) {
				event.preventDefault();
				event.stopPropagation();
				actions.remove();
				return;
			}
			if (nextPosition === void 0) return;
			event.preventDefault();
			event.stopPropagation();
			actions.updatePosition(Math.max(0, Math.min(100, nextPosition)));
		}
		const __returned__ = {
			emit,
			positionPercent,
			opacityPercent,
			hex,
			css,
			accessibleLabel,
			actions,
			onKeydown,
			get Primitive() {
				return Primitive;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$30(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["Primitive"], mergeProps(_ctx.$attrs, {
		as: $props.as,
		"as-child": $props.asChild,
		"data-selected": $props.active ? "" : void 0,
		"data-dragging": $props.dragging ? "" : void 0,
		role: $props.interactive ? "slider" : void 0,
		tabindex: $props.interactive ? 0 : void 0,
		"aria-label": $props.interactive ? $setup.accessibleLabel : void 0,
		"aria-valuemin": $props.interactive ? 0 : void 0,
		"aria-valuemax": $props.interactive ? 100 : void 0,
		"aria-valuenow": $props.interactive ? $setup.positionPercent : void 0,
		"aria-valuetext": $props.interactive ? `${$setup.positionPercent}%` : void 0,
		"data-slot": "stop",
		onClick: $setup.actions.select,
		onFocus: $setup.actions.select,
		onKeydown: $setup.onKeydown
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", {
			stop: $props.stop,
			index: $props.index,
			active: $props.active,
			selected: $props.active,
			dragging: $props.dragging,
			positionPercent: $setup.positionPercent,
			opacityPercent: $setup.opacityPercent,
			hex: $setup.hex,
			css: $setup.css,
			actions: $setup.actions
		})]),
		_: 3
	}, 16, [
		"as",
		"as-child",
		"data-selected",
		"data-dragging",
		"role",
		"tabindex",
		"aria-label",
		"aria-valuemin",
		"aria-valuemax",
		"aria-valuenow",
		"aria-valuetext",
		"onClick",
		"onFocus"
	]);
}
var GradientEditorStop_default = /* @__PURE__ */ export_helper_default(_sfc_main$30, [["render", _sfc_render$30], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/GradientEditor/GradientEditorStop.vue"]]);
//#endregion
//#region src/primitives/LayerTree/context.ts
const LAYER_TREE_KEY = Symbol("layer-tree");
function provideLayerTree(ctx) {
	provide(LAYER_TREE_KEY, ctx);
}
function useLayerTree() {
	const ctx = inject(LAYER_TREE_KEY);
	if (!ctx) throw new Error("[open-pencil] useLayerTree() called outside <LayerTreeRoot>");
	return ctx;
}
//#endregion
//#region src/primitives/LayerTree/model.ts
function nodeToLayerNode(node) {
	return {
		id: node.id,
		name: node.name,
		type: node.type,
		layoutMode: node.layoutMode,
		visible: node.visible,
		locked: node.locked
	};
}
function buildLayerTreeModel(graph, parentId) {
	const byId = /* @__PURE__ */ new Map();
	const buildChildren = (id) => {
		const parent = graph.getNode(id);
		if (!parent) return [];
		const children = [];
		for (const childId of parent.childIds) {
			const sceneNode = graph.getNode(childId);
			if (!sceneNode || sceneNode.internalOnly) continue;
			const node = nodeToLayerNode(sceneNode);
			byId.set(node.id, node);
			if (sceneNode.childIds.length > 0) node.children = buildChildren(node.id);
			children.push(node);
		}
		return children;
	};
	return {
		items: buildChildren(parentId),
		byId
	};
}
function indexLayerNodes(items) {
	const byId = /* @__PURE__ */ new Map();
	const visit = (nodes) => {
		for (const node of nodes) {
			byId.set(node.id, node);
			if (node.children) visit(node.children);
		}
	};
	visit(items);
	return byId;
}
function patchLayerNode(target, source) {
	if (!(target.name !== source.name || target.type !== source.type || target.layoutMode !== source.layoutMode || target.visible !== source.visible || target.locked !== source.locked)) return false;
	target.name = source.name;
	target.type = source.type;
	target.layoutMode = source.layoutMode;
	target.visible = source.visible;
	target.locked = source.locked;
	return true;
}
function visibleLayerRows(items, expandedIds) {
	const rows = [];
	const append = (nodes, level) => {
		for (const node of nodes) {
			const hasChildren = (node.children?.length ?? 0) > 0;
			rows.push({
				node,
				level,
				hasChildren
			});
			if (hasChildren && expandedIds.has(node.id)) append(node.children ?? [], level + 1);
		}
	};
	append(items, 1);
	return rows;
}
function layerSelectionForTarget(visibleIds, currentIds, anchorId, targetId, mode) {
	if (!mode.range || !anchorId) {
		if (!mode.additive) return /* @__PURE__ */ new Set([targetId]);
		const next = new Set(currentIds);
		if (next.has(targetId)) next.delete(targetId);
		else next.add(targetId);
		return next;
	}
	const anchorIndex = visibleIds.indexOf(anchorId);
	const targetIndex = visibleIds.indexOf(targetId);
	if (anchorIndex === -1 || targetIndex === -1) return /* @__PURE__ */ new Set([targetId]);
	const start = Math.min(anchorIndex, targetIndex);
	const end = Math.max(anchorIndex, targetIndex);
	const next = mode.additive ? new Set(currentIds) : /* @__PURE__ */ new Set();
	for (let index = start; index <= end; index++) {
		const id = visibleIds[index];
		if (id) next.add(id);
	}
	return next;
}
//#endregion
//#region src/primitives/LayerTree/LayerTreeRoot.vue
const _sfc_main$29 = /* @__PURE__ */ defineComponent({
	__name: "LayerTreeRoot",
	props: { indentPerLevel: {
		type: Number,
		required: false,
		default: 16
	} },
	emits: [
		"select",
		"toggleExpand",
		"toggleVisibility",
		"toggleLock",
		"rename"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const editor = useEditor();
		const items = ref([]);
		const expanded = ref([]);
		const treeVersion = ref(0);
		const selectedIds = computed(() => editor.state.selectedIds);
		const focused = ref(false);
		const visibleRows = computed(() => visibleLayerRows(items.value, new Set(expanded.value)));
		let nodesById = /* @__PURE__ */ new Map();
		let virtualizer = null;
		let selectionAnchorId = null;
		let applyingSelection = false;
		function expandNode(id) {
			if (!expanded.value.includes(id)) expanded.value = [...expanded.value, id];
		}
		const { draggingId, instruction, instructionTargetId, setupItem } = useLayerDrag(editor, __props.indentPerLevel, expandNode);
		let rebuildPending = false;
		let rebuildToken = 0;
		function rebuildTree() {
			rebuildPending = false;
			rebuildToken++;
			const model = buildLayerTreeModel(editor.graph, editor.state.currentPageId);
			items.value = model.items;
			nodesById = model.byId;
			expanded.value = expanded.value.filter((id) => nodesById.has(id));
			treeVersion.value++;
		}
		function scheduleTreeRebuild() {
			if (rebuildPending) return;
			rebuildPending = true;
			const token = ++rebuildToken;
			queueMicrotask(() => {
				if (!rebuildPending || token !== rebuildToken) return;
				rebuildTree();
			});
		}
		rebuildTree();
		const PATCHABLE_NODE_KEYS = /* @__PURE__ */ new Set([
			"name",
			"type",
			"layoutMode",
			"visible",
			"locked"
		]);
		function patchTreeNode(id, changes) {
			if ("childIds" in changes || "parentId" in changes) {
				rebuildTree();
				return;
			}
			if (!Object.keys(changes).some((key) => PATCHABLE_NODE_KEYS.has(key))) return;
			const target = nodesById.get(id);
			const source = editor.graph.getNode(id);
			if (target && source) patchLayerNode(target, source);
		}
		const rowRefs = /* @__PURE__ */ new Map();
		function setRowRef(id, el) {
			if (el) rowRefs.set(id, el);
			else rowRefs.delete(id);
		}
		function expandSelectionAncestors(ids) {
			const next = new Set(expanded.value);
			for (const id of ids) {
				let node = editor.graph.getNode(id);
				while (node?.parentId && node.parentId !== editor.state.currentPageId) {
					next.add(node.parentId);
					node = editor.graph.getNode(node.parentId);
				}
			}
			if (next.size !== expanded.value.length) expanded.value = [...next];
		}
		function scrollToNode(id) {
			nextTick(() => {
				const index = visibleRows.value.findIndex((row) => row.node.id === id);
				if (index !== -1 && virtualizer) {
					virtualizer.scrollToIndex(index, { align: "auto" });
					return;
				}
				rowRefs.get(id)?.scrollIntoView({ block: "nearest" });
			});
		}
		function onSelectionChanged(ids) {
			expandSelectionAncestors(ids);
			if (applyingSelection) return;
			const visibleIds = new Set(visibleRows.value.map((row) => row.node.id));
			selectionAnchorId = ids.find((id) => visibleIds.has(id)) ?? null;
			if (selectionAnchorId) scrollToNode(selectionAnchorId);
		}
		const unsubscribe = [
			editor.onEditorEvent("graph:replaced", rebuildTree),
			editor.onEditorEvent("page:changed", rebuildTree),
			editor.onEditorEvent("node:created", scheduleTreeRebuild),
			editor.onEditorEvent("node:deleted", scheduleTreeRebuild),
			editor.onEditorEvent("node:reparented", scheduleTreeRebuild),
			editor.onEditorEvent("node:reordered", scheduleTreeRebuild),
			editor.onEditorEvent("node:updated", patchTreeNode),
			editor.onEditorEvent("selection:changed", onSelectionChanged)
		];
		onScopeDispose(() => {
			for (const stop of unsubscribe) stop();
		});
		function syncCanvasScope(nodeId) {
			const node = editor.graph.getNode(nodeId);
			if (!node) return;
			let parentId = node.parentId;
			while (parentId && parentId !== editor.state.currentPageId) {
				if (editor.graph.isContainer(parentId)) {
					editor.enterContainer(parentId);
					return;
				}
				parentId = editor.graph.getNode(parentId)?.parentId ?? null;
			}
			editor.state.enteredContainerId = null;
		}
		function select(id, selection) {
			const mode = typeof selection === "boolean" ? {
				additive: selection,
				range: false
			} : selection;
			emit("select", id, mode.additive);
			const next = layerSelectionForTarget(visibleRows.value.map((row) => row.node.id), editor.state.selectedIds, selectionAnchorId, id, mode);
			if (!mode.range) selectionAnchorId = id;
			applyingSelection = true;
			try {
				editor.select([...next]);
			} finally {
				applyingSelection = false;
			}
			if (!mode.additive && !mode.range) syncCanvasScope(id);
			scrollToNode(id);
		}
		function toggleExpand(id) {
			emit("toggleExpand", id);
			if (expanded.value.indexOf(id) !== -1) expanded.value = expanded.value.filter((expandedId) => expandedId !== id);
			else expandNode(id);
		}
		function getKey(node) {
			return node.id;
		}
		function getChildren(node) {
			return node.children;
		}
		function setVirtualizer(next) {
			virtualizer = next;
		}
		const actions = {
			select,
			toggleExpand,
			setFocused: (value) => {
				focused.value = value;
			},
			setVirtualizer
		};
		provideLayerTree({
			editor,
			items,
			expanded,
			visibleRows,
			treeVersion,
			selectedIds,
			focused,
			indentPerLevel: __props.indentPerLevel,
			draggingId,
			instruction,
			instructionTargetId,
			setupDrag: setupItem,
			select,
			toggleExpand,
			setFocused: actions.setFocused,
			setVirtualizer,
			toggleVisibility: (id) => {
				emit("toggleVisibility", id);
				editor.toggleNodeVisibility(id);
			},
			toggleLock: (id) => {
				emit("toggleLock", id);
				editor.toggleNodeLock(id);
			},
			rename: (id, name) => {
				emit("rename", id, name);
				editor.renameNode(id, name);
			},
			setRowRef
		});
		const __returned__ = {
			emit,
			editor,
			items,
			expanded,
			treeVersion,
			selectedIds,
			focused,
			visibleRows,
			get nodesById() {
				return nodesById;
			},
			set nodesById(v) {
				nodesById = v;
			},
			get virtualizer() {
				return virtualizer;
			},
			set virtualizer(v) {
				virtualizer = v;
			},
			get selectionAnchorId() {
				return selectionAnchorId;
			},
			set selectionAnchorId(v) {
				selectionAnchorId = v;
			},
			get applyingSelection() {
				return applyingSelection;
			},
			set applyingSelection(v) {
				applyingSelection = v;
			},
			expandNode,
			draggingId,
			instruction,
			instructionTargetId,
			setupItem,
			get rebuildPending() {
				return rebuildPending;
			},
			set rebuildPending(v) {
				rebuildPending = v;
			},
			get rebuildToken() {
				return rebuildToken;
			},
			set rebuildToken(v) {
				rebuildToken = v;
			},
			rebuildTree,
			scheduleTreeRebuild,
			PATCHABLE_NODE_KEYS,
			patchTreeNode,
			rowRefs,
			setRowRef,
			expandSelectionAncestors,
			scrollToNode,
			onSelectionChanged,
			unsubscribe,
			syncCanvasScope,
			select,
			toggleExpand,
			getKey,
			getChildren,
			setVirtualizer,
			actions,
			get TreeRoot() {
				return TreeRoot;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$29(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["TreeRoot"], {
		expanded: $setup.expanded,
		"onUpdate:expanded": _cache[0] || (_cache[0] = ($event) => $setup.expanded = $event),
		as: "div",
		class: "flex min-h-0 flex-1 flex-col overflow-hidden",
		items: $setup.items,
		"get-key": $setup.getKey,
		"get-children": $setup.getChildren
	}, {
		default: withCtx(({ flattenItems }) => [renderSlot(_ctx.$slots, "default", {
			items: $setup.items,
			flattenItems,
			visibleRows: $setup.visibleRows,
			expanded: $setup.expanded,
			treeVersion: $setup.treeVersion,
			selectedIds: $setup.selectedIds,
			focused: $setup.focused,
			draggingId: $setup.draggingId,
			instruction: $setup.instruction,
			instructionTargetId: $setup.instructionTargetId,
			actions: $setup.actions
		})]),
		_: 3
	}, 8, ["expanded", "items"]);
}
var LayerTreeRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$29, [["render", _sfc_render$29], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/LayerTree/LayerTreeRoot.vue"]]);
//#endregion
//#region src/primitives/LayerTree/LayerTreeItem.vue
const _sfc_main$28 = /* @__PURE__ */ defineComponent({
	__name: "LayerTreeItem",
	props: {
		node: {
			type: Object,
			required: true
		},
		level: {
			type: Number,
			required: true
		},
		hasChildren: {
			type: Boolean,
			required: true
		}
	},
	emits: [
		"select",
		"toggleExpand",
		"toggleVisibility",
		"toggleLock",
		"rename"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		const emit = __emit;
		const ctx = useLayerTree();
		const isSelected = computed(() => ctx.selectedIds.value.has(__props.node.id));
		const isDragging = computed(() => ctx.draggingId.value === __props.node.id);
		const padLeft = computed(() => `${(__props.level - 1) * ctx.indentPerLevel}px`);
		const rowEl = ref(null);
		function onRef(el) {
			const htmlEl = el;
			rowEl.value = htmlEl;
			ctx.setRowRef(__props.node.id, htmlEl);
		}
		ctx.setupDrag(rowEl, () => ({
			id: __props.node.id,
			level: __props.level,
			hasChildren: __props.hasChildren,
			parentId: null
		}));
		const actions = {
			select: (additive) => {
				emit("select", __props.node.id, additive);
				ctx.select(__props.node.id, additive);
			},
			toggleExpand: () => {
				emit("toggleExpand", __props.node.id);
				ctx.toggleExpand(__props.node.id);
			},
			toggleVisibility: () => {
				emit("toggleVisibility", __props.node.id);
				ctx.toggleVisibility(__props.node.id);
			},
			toggleLock: () => {
				emit("toggleLock", __props.node.id);
				ctx.toggleLock(__props.node.id);
			},
			rename: (name) => {
				emit("rename", __props.node.id, name);
				ctx.rename(__props.node.id, name);
			}
		};
		__expose({ rowEl });
		const __returned__ = {
			emit,
			ctx,
			isSelected,
			isDragging,
			padLeft,
			rowEl,
			onRef,
			actions
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
const _hoisted_1$2 = ["data-node-id"];
function _sfc_render$28(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createElementBlock("div", {
		ref: $setup.onRef,
		"data-node-id": $props.node.id,
		class: "w-full"
	}, [renderSlot(_ctx.$slots, "default", {
		node: $props.node,
		level: $props.level,
		hasChildren: $props.hasChildren,
		isSelected: $setup.isSelected,
		isDragging: $setup.isDragging,
		focused: $setup.ctx.focused.value,
		padLeft: $setup.padLeft,
		actions: $setup.actions
	})], 8, _hoisted_1$2);
}
var LayerTreeItem_default = /* @__PURE__ */ export_helper_default(_sfc_main$28, [["render", _sfc_render$28], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/LayerTree/LayerTreeItem.vue"]]);
//#endregion
//#region src/primitives/LayoutControls/context.ts
const LAYOUT_CONTROLS_KEY = Symbol("LayoutControlsContext");
function provideLayoutControls(ctx) {
	provide(LAYOUT_CONTROLS_KEY, ctx);
}
function useLayoutControlsContext() {
	const ctx = inject(LAYOUT_CONTROLS_KEY);
	if (!ctx) throw new Error("Layout controls must be used within LayoutControlsRoot");
	return ctx;
}
//#endregion
//#region src/primitives/LayoutControls/LayoutControlsRoot.vue
const _sfc_main$27 = /* @__PURE__ */ defineComponent({
	__name: "LayoutControlsRoot",
	setup(__props, { expose: __expose }) {
		__expose();
		const ctx = useLayout();
		const actions = {
			updateProp: ctx.updateProp,
			updateSizeLimit: ctx.updateSizeLimit,
			setSizeLimitToCurrent: ctx.setSizeLimitToCurrent,
			commitSizeLimit: ctx.commitSizeLimit,
			addSizeLimit: ctx.addSizeLimit,
			removeSizeLimit: ctx.removeSizeLimit,
			commitProp: ctx.commitProp,
			setAxisSizing: ctx.setAxisSizing,
			updateAxisSize: ctx.updateAxisSize,
			commitAxisSize: ctx.commitAxisSize,
			setHorizontalPadding: ctx.setHorizontalPadding,
			commitHorizontalPadding: ctx.commitHorizontalPadding,
			setVerticalPadding: ctx.setVerticalPadding,
			commitVerticalPadding: ctx.commitVerticalPadding,
			setAlignment: ctx.setAlignment,
			setGapAuto: ctx.setGapAuto,
			setLayoutDirection: ctx.setLayoutDirection,
			updateGridTrack: ctx.updateGridTrack,
			addTrack: ctx.addTrack,
			removeTrack: ctx.removeTrack,
			toggleIndividualPadding: ctx.toggleIndividualPadding
		};
		provideLayoutControls(proxyRefs(ctx));
		const __returned__ = {
			ctx,
			actions
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$27(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default", {
		editor: $setup.ctx.editor,
		node: $setup.ctx.node.value,
		layoutDirection: $setup.ctx.layoutDirection.value,
		gapAuto: $setup.ctx.gapAuto.value,
		isInAutoLayout: $setup.ctx.isInAutoLayout.value,
		isGrid: $setup.ctx.isGrid.value,
		isFlex: $setup.ctx.isFlex.value,
		widthSizing: $setup.ctx.widthSizing.value,
		heightSizing: $setup.ctx.heightSizing.value,
		widthSizingOptions: $setup.ctx.widthSizingOptions.value,
		heightSizingOptions: $setup.ctx.heightSizingOptions.value,
		alignGrid: $setup.ctx.alignGrid.value,
		showIndividualPadding: $setup.ctx.showIndividualPadding.value,
		hasUniformPadding: $setup.ctx.hasUniformPadding.value,
		hasSymmetricPadding: $setup.ctx.hasSymmetricPadding.value,
		trackSizingOptions: $setup.ctx.trackSizingOptions,
		trackLabel: $setup.ctx.trackLabel,
		actions: $setup.actions
	});
}
var LayoutControlsRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$27, [["render", _sfc_render$27], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/LayoutControls/LayoutControlsRoot.vue"]]);
//#endregion
//#region src/primitives/AppearanceControls/AppearanceControlsRoot.vue
const _sfc_main$26 = /* @__PURE__ */ defineComponent({
	__name: "AppearanceControlsRoot",
	setup(__props, { expose: __expose }) {
		__expose();
		const ctx = useAppearance();
		const __returned__ = {
			ctx,
			actions: {
				updateProp: ctx.updateProp,
				commitProp: ctx.commitProp,
				setBlendMode: ctx.setBlendMode,
				toggleVisibility: ctx.toggleVisibility,
				toggleIndependentCorners: ctx.toggleIndependentCorners,
				updateCornerProp: ctx.updateCornerProp,
				commitCornerProp: ctx.commitCornerProp
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$26(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default", {
		node: $setup.ctx.node.value,
		isMulti: $setup.ctx.isMulti.value,
		active: $setup.ctx.active.value,
		hasCornerRadius: $setup.ctx.hasCornerRadius.value,
		independentCorners: $setup.ctx.independentCorners.value,
		showIndependentCorners: $setup.ctx.showIndependentCorners.value,
		cornerRadiusValue: $setup.ctx.cornerRadiusValue.value,
		cornerSmoothingPercent: $setup.ctx.cornerSmoothingPercent.value,
		opacityPercent: $setup.ctx.opacityPercent.value,
		blendModeValue: $setup.ctx.blendModeValue.value,
		visibilityState: $setup.ctx.visibilityState.value,
		actions: $setup.actions
	});
}
var AppearanceControlsRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$26, [["render", _sfc_render$26], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/AppearanceControls/AppearanceControlsRoot.vue"]]);
//#endregion
//#region src/primitives/ConstraintsControl/ConstraintsControlRoot.vue
const _sfc_main$25 = /* @__PURE__ */ defineComponent({
	__name: "ConstraintsControlRoot",
	setup(__props, { expose: __expose }) {
		__expose();
		const constraints = useConstraints();
		const __returned__ = {
			constraints,
			actions: {
				setHorizontal: (value) => constraints.setAxis("horizontal", value),
				setVertical: (value) => constraints.setAxis("vertical", value),
				setCenter: (axis) => constraints.setAxis(axis, "CENTER"),
				togglePin: constraints.togglePin
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$25(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default", {
		active: $setup.constraints.active.value,
		isMulti: $setup.constraints.isMulti.value,
		horizontal: $setup.constraints.horizontal.value,
		vertical: $setup.constraints.vertical.value,
		actions: $setup.actions
	});
}
var ConstraintsControlRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$25, [["render", _sfc_render$25], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/ConstraintsControl/ConstraintsControlRoot.vue"]]);
//#endregion
//#region src/primitives/PageList/PageListRoot.vue
const _sfc_main$24 = /* @__PURE__ */ defineComponent({
	__name: "PageListRoot",
	props: { dividerPattern: {
		type: null,
		required: false
	} },
	emits: [
		"add",
		"switch",
		"rename",
		"delete",
		"move"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const { pages, currentPageId, switchPage, addPage, renamePage, deletePage, movePage } = usePageList();
		const dividerPattern = computed(() => __props.dividerPattern ?? /^[-–—*\s]+$/);
		function isDivider(page) {
			return page.childIds.length === 0 && dividerPattern.value.test(page.name);
		}
		function handleAdd() {
			addPage();
			emit("add");
		}
		function handleSwitch(pageId) {
			switchPage(pageId);
			emit("switch", pageId);
		}
		function handleRename(pageId, name) {
			renamePage(pageId, name);
			emit("rename", pageId, name);
		}
		function handleDelete(pageId) {
			deletePage(pageId);
			emit("delete", pageId);
		}
		function handleMove(pageId, index) {
			movePage(pageId, index);
			emit("move", pageId, index);
		}
		const __returned__ = {
			emit,
			pages,
			currentPageId,
			switchPage,
			addPage,
			renamePage,
			deletePage,
			movePage,
			dividerPattern,
			isDivider,
			handleAdd,
			handleSwitch,
			handleRename,
			handleDelete,
			handleMove,
			actions: {
				add: handleAdd,
				switch: handleSwitch,
				rename: handleRename,
				delete: handleDelete,
				move: handleMove
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$24(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default", {
		pages: $setup.pages,
		currentPageId: $setup.currentPageId,
		isDivider: $setup.isDivider,
		actions: $setup.actions
	});
}
var PageListRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$24, [["render", _sfc_render$24], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/PageList/PageListRoot.vue"]]);
//#endregion
//#region src/primitives/PositionControls/PositionControlsRoot.vue
const _sfc_main$23 = /* @__PURE__ */ defineComponent({
	__name: "PositionControlsRoot",
	setup(__props, { expose: __expose }) {
		__expose();
		const { updateProp, commitProp, node, nodes, isMulti, active, prop: multiProp, store } = useNodeProps();
		const xValue = computed(() => isMulti.value ? multiProp("x").value : Math.round(node.value?.x ?? 0));
		const yValue = computed(() => isMulti.value ? multiProp("y").value : Math.round(node.value?.y ?? 0));
		const wValue = multiProp("width");
		const hValue = multiProp("height");
		const rotationValue = computed(() => isMulti.value ? multiProp("rotation").value : Math.round(node.value?.rotation ?? 0));
		const ids = computed(() => nodes.value.map((n) => n.id));
		function align(axis, pos) {
			store.alignNodes(ids.value, axis, pos);
		}
		function flip(axis) {
			store.flipNodes(ids.value, axis);
		}
		function rotate(degrees) {
			store.rotateNodes(ids.value, degrees);
		}
		const __returned__ = {
			updateProp,
			commitProp,
			node,
			nodes,
			isMulti,
			active,
			multiProp,
			store,
			xValue,
			yValue,
			wValue,
			hValue,
			rotationValue,
			ids,
			align,
			flip,
			rotate,
			actions: {
				updateProp,
				commitProp,
				align,
				flip,
				rotate
			},
			get MIXED() {
				return MIXED;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$23(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default", {
		active: $setup.active,
		isMulti: $setup.isMulti,
		ids: $setup.ids,
		xValue: $setup.xValue,
		yValue: $setup.yValue,
		wValue: $setup.wValue,
		hValue: $setup.hValue,
		rotationValue: $setup.rotationValue,
		mixed: $setup.MIXED,
		actions: $setup.actions
	});
}
var PositionControlsRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$23, [["render", _sfc_render$23], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/PositionControls/PositionControlsRoot.vue"]]);
//#endregion
//#region src/primitives/PropertyList/context.ts
const PROPERTY_LIST_KEY = Symbol("PropertyList");
function providePropertyList(context) {
	provide(PROPERTY_LIST_KEY, context);
}
function usePropertyList() {
	const context = inject(PROPERTY_LIST_KEY);
	if (!context) throw new Error("[open-pencil] PropertyList part must be used inside PropertyListRoot");
	return context;
}
function usePropertyListPart(propKey) {
	const context = usePropertyList();
	if (context.propKey !== propKey) throw new Error(`[open-pencil] PropertyList part propKey must match PropertyListRoot (${propKey})`);
	return context;
}
//#endregion
//#region src/primitives/PropertyList/PropertyListRoot.vue
const _sfc_main$22 = /* @__PURE__ */ defineComponent({
	__name: "PropertyListRoot",
	props: {
		propKey: {
			type: null,
			required: true
		},
		items: {
			type: Array,
			required: true
		},
		mixed: {
			type: Boolean,
			required: false,
			default: false
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		getKey: {
			type: Function,
			required: false
		},
		label: {
			type: String,
			required: false
		}
	},
	emits: [
		"add",
		"remove",
		"update",
		"patch",
		"toggleVisibility",
		"reorder"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const items = computed(() => __props.items);
		const isMixed = computed(() => __props.mixed);
		const disabled = computed(() => __props.disabled);
		function keyOf(item, index) {
			return __props.getKey?.(item, index) ?? index;
		}
		const actions = {
			add: (item) => {
				if (!disabled.value) emit("add", item);
			},
			remove: (index) => {
				if (!disabled.value) emit("remove", index);
			},
			update: (index, item) => {
				if (!disabled.value) emit("update", index, item);
			},
			patch: (index, changes) => {
				if (!disabled.value) emit("patch", index, changes);
			},
			toggleVisibility: (index) => {
				if (!disabled.value) emit("toggleVisibility", index);
			},
			reorder: (fromIndex, toIndex) => {
				if (!disabled.value) emit("reorder", fromIndex, toIndex);
			}
		};
		providePropertyList({
			propKey: __props.propKey,
			items,
			isMixed,
			disabled,
			keyOf,
			actions
		});
		const __returned__ = {
			emit,
			items,
			isMixed,
			disabled,
			keyOf,
			actions
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$22(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default", {
		items: $setup.items,
		isMixed: $setup.isMixed,
		disabled: $setup.disabled,
		keyOf: $setup.keyOf,
		actions: $setup.actions
	});
}
var PropertyListRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$22, [["render", _sfc_render$22], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/PropertyList/PropertyListRoot.vue"]]);
//#endregion
//#region src/primitives/PropertyList/PropertyListItem.vue
const _sfc_main$21 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "PropertyListItem",
	props: {
		propKey: {
			type: null,
			required: true
		},
		index: {
			type: Number,
			required: true
		},
		dragging: {
			type: Boolean,
			required: false,
			default: false
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		as: {
			type: null,
			required: false,
			default: "div"
		},
		asChild: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	emits: [
		"update",
		"patch",
		"remove",
		"toggleVisibility"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const context = usePropertyListPart(__props.propKey);
		const item = computed(() => context.items.value[__props.index]);
		const hidden = computed(() => item.value?.visible === false);
		const disabled = computed(() => __props.disabled || context.disabled.value);
		const actions = {
			update: (nextItem) => {
				if (disabled.value) return;
				emit("update", __props.index, nextItem);
				context.actions.update(__props.index, nextItem);
			},
			patch: (changes) => {
				if (disabled.value) return;
				emit("patch", __props.index, changes);
				context.actions.patch(__props.index, changes);
			},
			remove: () => {
				if (disabled.value) return;
				emit("remove", __props.index);
				context.actions.remove(__props.index);
			},
			toggleVisibility: () => {
				if (disabled.value) return;
				emit("toggleVisibility", __props.index);
				context.actions.toggleVisibility(__props.index);
			}
		};
		const __returned__ = {
			emit,
			context,
			item,
			hidden,
			disabled,
			actions,
			slotProps: computed(() => ({
				item: item.value,
				index: __props.index,
				hidden: hidden.value,
				dragging: __props.dragging,
				disabled: disabled.value,
				actions
			})),
			get Primitive() {
				return Primitive;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$21(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["Primitive"], mergeProps(_ctx.$attrs, {
		as: $props.as,
		"as-child": $props.asChild,
		"data-hidden": $setup.hidden ? "" : void 0,
		"data-dragging": $props.dragging ? "" : void 0,
		"data-disabled": $setup.disabled ? "" : void 0,
		"data-slot": "item"
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($setup.slotProps)))]),
		_: 3
	}, 16, [
		"as",
		"as-child",
		"data-hidden",
		"data-dragging",
		"data-disabled"
	]);
}
var PropertyListItem_default = /* @__PURE__ */ export_helper_default(_sfc_main$21, [["render", _sfc_render$21], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/PropertyList/PropertyListItem.vue"]]);
//#endregion
//#region src/primitives/PropertyList/PropertyListAdd.vue
const _sfc_main$20 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "PropertyListAdd",
	props: {
		propKey: {
			type: null,
			required: true
		},
		as: {
			type: null,
			required: false,
			default: "button"
		},
		asChild: {
			type: Boolean,
			required: false,
			default: false
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		item: {
			type: null,
			required: true
		}
	},
	emits: ["add"],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const context = usePropertyListPart(__props.propKey);
		const disabled = computed(() => __props.disabled || context.disabled.value);
		function add() {
			if (disabled.value) return;
			emit("add", __props.item);
			context.actions.add(__props.item);
		}
		const __returned__ = {
			emit,
			context,
			disabled,
			add,
			get Primitive() {
				return Primitive;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$20(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["Primitive"], mergeProps(_ctx.$attrs, {
		as: $props.as,
		"as-child": $props.asChild,
		type: !$props.asChild && $props.as === "button" ? "button" : void 0,
		disabled: $setup.disabled,
		"data-slot": "add",
		onClick: $setup.add
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
		_: 3
	}, 16, [
		"as",
		"as-child",
		"type",
		"disabled"
	]);
}
var PropertyListAdd_default = /* @__PURE__ */ export_helper_default(_sfc_main$20, [["render", _sfc_render$20], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/PropertyList/PropertyListAdd.vue"]]);
//#endregion
//#region src/primitives/PropertyList/PropertyListRemove.vue
const _sfc_main$19 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "PropertyListRemove",
	props: {
		propKey: {
			type: null,
			required: true
		},
		as: {
			type: null,
			required: false,
			default: "button"
		},
		asChild: {
			type: Boolean,
			required: false,
			default: false
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		index: {
			type: Number,
			required: true
		}
	},
	emits: ["remove"],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const context = usePropertyListPart(__props.propKey);
		const disabled = computed(() => __props.disabled || context.disabled.value);
		function remove() {
			if (disabled.value) return;
			emit("remove", __props.index);
			context.actions.remove(__props.index);
		}
		const __returned__ = {
			emit,
			context,
			disabled,
			remove,
			get Primitive() {
				return Primitive;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$19(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["Primitive"], mergeProps(_ctx.$attrs, {
		as: $props.as,
		"as-child": $props.asChild,
		type: !$props.asChild && $props.as === "button" ? "button" : void 0,
		disabled: $setup.disabled,
		"data-slot": "remove",
		onClick: $setup.remove
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
		_: 3
	}, 16, [
		"as",
		"as-child",
		"type",
		"disabled"
	]);
}
var PropertyListRemove_default = /* @__PURE__ */ export_helper_default(_sfc_main$19, [["render", _sfc_render$19], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/PropertyList/PropertyListRemove.vue"]]);
//#endregion
//#region src/primitives/PropertyList/PropertyListVisibility.vue
const _sfc_main$18 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "PropertyListVisibility",
	props: {
		propKey: {
			type: null,
			required: true
		},
		as: {
			type: null,
			required: false,
			default: "button"
		},
		asChild: {
			type: Boolean,
			required: false,
			default: false
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		index: {
			type: Number,
			required: true
		}
	},
	emits: ["toggle"],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const context = usePropertyListPart(__props.propKey);
		const disabled = computed(() => __props.disabled || context.disabled.value);
		const visible = computed(() => context.items.value[__props.index]?.visible !== false);
		function toggle() {
			if (disabled.value) return;
			emit("toggle", __props.index);
			context.actions.toggleVisibility(__props.index);
		}
		const __returned__ = {
			emit,
			context,
			disabled,
			visible,
			toggle,
			get Primitive() {
				return Primitive;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$18(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["Primitive"], mergeProps(_ctx.$attrs, {
		as: $props.as,
		"as-child": $props.asChild,
		type: !$props.asChild && $props.as === "button" ? "button" : void 0,
		disabled: $setup.disabled,
		"aria-pressed": $setup.visible,
		"data-hidden": $setup.visible ? void 0 : "",
		"data-slot": "visibility",
		onClick: $setup.toggle
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", { visible: $setup.visible })]),
		_: 3
	}, 16, [
		"as",
		"as-child",
		"type",
		"disabled",
		"aria-pressed",
		"data-hidden"
	]);
}
var PropertyListVisibility_default = /* @__PURE__ */ export_helper_default(_sfc_main$18, [["render", _sfc_render$18], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/PropertyList/PropertyListVisibility.vue"]]);
//#endregion
//#region src/primitives/PropertyGrid/PropertyGridRoot.vue
const _sfc_main$17 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "PropertyGridRoot",
	props: {
		columns: {
			type: Number,
			required: false,
			default: 1
		},
		distribution: {
			type: String,
			required: false,
			default: "equal"
		}
	},
	setup(__props, { expose: __expose }) {
		__expose();
		const __returned__ = {};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
const _hoisted_1$1 = ["data-columns", "data-distribution"];
const _hoisted_2 = { "data-slot": "fields" };
const _hoisted_3 = {
	key: 0,
	"data-slot": "actions"
};
function _sfc_render$17(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createElementBlock("div", mergeProps(_ctx.$attrs, {
		"data-slot": "root",
		"data-property-grid": "",
		"data-columns": $props.columns,
		"data-distribution": $props.distribution
	}), [createElementVNode("div", _hoisted_2, [renderSlot(_ctx.$slots, "default")]), _ctx.$slots.actions ? (openBlock(), createElementBlock("div", _hoisted_3, [renderSlot(_ctx.$slots, "actions")])) : createCommentVNode("v-if", true)], 16, _hoisted_1$1);
}
var PropertyGridRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$17, [["render", _sfc_render$17], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/PropertyGrid/PropertyGridRoot.vue"]]);
//#endregion
//#region src/internal/create-context.ts
function createContext(name) {
	const key = Symbol(name);
	const provideContext = (value) => {
		provide(key, value);
		return value;
	};
	const injectContext = () => {
		const value = inject(key);
		if (!value) throw new Error(`[open-pencil] Injection \`${name}\` not found. Component must be used within the corresponding Root.`);
		return value;
	};
	return [injectContext, provideContext];
}
//#endregion
//#region src/primitives/PropertySection/context.ts
const [usePropertySection, providePropertySection] = createContext("PropertySection");
//#endregion
//#region src/primitives/PropertySection/PropertySectionRoot.vue
const _sfc_main$16 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "PropertySectionRoot",
	props: {
		open: {
			type: Boolean,
			required: false
		},
		defaultOpen: {
			type: Boolean,
			required: false,
			default: true
		},
		empty: {
			type: Boolean,
			required: false,
			default: false
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		unmountOnHide: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	emits: ["update:open"],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const vnodeProps = getCurrentInstance()?.vnode.props;
		const controlled = vnodeProps ? Object.hasOwn(vnodeProps, "open") : false;
		const uncontrolledOpen = ref(__props.defaultOpen);
		const open = computed({
			get: () => controlled ? __props.open : uncontrolledOpen.value,
			set: (value) => {
				if (!controlled) uncontrolledOpen.value = value;
				emit("update:open", value);
			}
		});
		const empty = computed(() => __props.empty);
		const disabled = computed(() => __props.disabled);
		const stateAttrs = computed(() => ({
			"data-state": open.value ? "open" : "closed",
			"data-empty": empty.value ? "" : void 0,
			"data-disabled": disabled.value ? "" : void 0
		}));
		const actions = {
			open: () => {
				if (!disabled.value) open.value = true;
			},
			close: () => {
				if (!disabled.value) open.value = false;
			},
			toggle: () => {
				if (!disabled.value) open.value = !open.value;
			}
		};
		const slotProps = computed(() => ({
			open: open.value,
			empty: empty.value,
			stateAttrs: stateAttrs.value,
			actions
		}));
		providePropertySection({
			open,
			empty,
			disabled,
			stateAttrs,
			slotProps,
			actions
		});
		const __returned__ = {
			emit,
			vnodeProps,
			controlled,
			uncontrolledOpen,
			open,
			empty,
			disabled,
			stateAttrs,
			actions,
			slotProps,
			get CollapsibleRoot() {
				return CollapsibleRoot;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$16(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["CollapsibleRoot"], mergeProps({
		..._ctx.$attrs,
		...$setup.stateAttrs
	}, {
		open: $setup.open,
		disabled: $setup.disabled,
		"unmount-on-hide": $props.unmountOnHide,
		"onUpdate:open": _cache[0] || (_cache[0] = ($event) => $setup.open = $event)
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($setup.slotProps)))]),
		_: 3
	}, 16, [
		"open",
		"disabled",
		"unmount-on-hide"
	]);
}
var PropertySectionRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$16, [["render", _sfc_render$16], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/PropertySection/PropertySectionRoot.vue"]]);
//#endregion
//#region src/primitives/PropertySection/PropertySectionHeader.vue
const _sfc_main$15 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "PropertySectionHeader",
	props: {
		asChild: {
			type: Boolean,
			required: false,
			default: false
		},
		as: {
			type: null,
			required: false,
			default: "div"
		}
	},
	setup(__props, { expose: __expose }) {
		__expose();
		const __returned__ = {
			ctx: usePropertySection(),
			get Primitive() {
				return Primitive;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$15(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["Primitive"], mergeProps({
		..._ctx.$attrs,
		...$setup.ctx.stateAttrs.value
	}, {
		as: $props.as,
		"as-child": $props.asChild,
		"data-slot": "header"
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($setup.ctx.slotProps.value)))]),
		_: 3
	}, 16, ["as", "as-child"]);
}
var PropertySectionHeader_default = /* @__PURE__ */ export_helper_default(_sfc_main$15, [["render", _sfc_render$15], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/PropertySection/PropertySectionHeader.vue"]]);
//#endregion
//#region src/primitives/PropertySection/PropertySectionTitle.vue
const _sfc_main$14 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "PropertySectionTitle",
	props: {
		asChild: {
			type: Boolean,
			required: false,
			default: false
		},
		as: {
			type: null,
			required: false,
			default: "div"
		}
	},
	setup(__props, { expose: __expose }) {
		__expose();
		const __returned__ = {
			ctx: usePropertySection(),
			get Primitive() {
				return Primitive;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$14(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["Primitive"], mergeProps({
		..._ctx.$attrs,
		...$setup.ctx.stateAttrs.value
	}, {
		as: $props.as,
		"as-child": $props.asChild,
		"data-slot": "title"
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($setup.ctx.slotProps.value)))]),
		_: 3
	}, 16, ["as", "as-child"]);
}
var PropertySectionTitle_default = /* @__PURE__ */ export_helper_default(_sfc_main$14, [["render", _sfc_render$14], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/PropertySection/PropertySectionTitle.vue"]]);
//#endregion
//#region src/primitives/PropertySection/PropertySectionActions.vue
const _sfc_main$13 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "PropertySectionActions",
	props: {
		asChild: {
			type: Boolean,
			required: false,
			default: false
		},
		as: {
			type: null,
			required: false,
			default: "div"
		}
	},
	setup(__props, { expose: __expose }) {
		__expose();
		const __returned__ = {
			ctx: usePropertySection(),
			get Primitive() {
				return Primitive;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$13(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["Primitive"], mergeProps({
		..._ctx.$attrs,
		...$setup.ctx.stateAttrs.value
	}, {
		as: $props.as,
		"as-child": $props.asChild,
		"data-slot": "actions"
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($setup.ctx.slotProps.value)))]),
		_: 3
	}, 16, ["as", "as-child"]);
}
var PropertySectionActions_default = /* @__PURE__ */ export_helper_default(_sfc_main$13, [["render", _sfc_render$13], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/PropertySection/PropertySectionActions.vue"]]);
//#endregion
//#region src/primitives/PropertySection/PropertySectionContent.vue
const _sfc_main$12 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "PropertySectionContent",
	props: {
		asChild: {
			type: Boolean,
			required: false,
			default: false
		},
		as: {
			type: null,
			required: false,
			default: "div"
		}
	},
	setup(__props, { expose: __expose }) {
		__expose();
		const __returned__ = {
			ctx: usePropertySection(),
			get CollapsibleContent() {
				return CollapsibleContent;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$12(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["CollapsibleContent"], mergeProps({
		..._ctx.$attrs,
		...$setup.ctx.stateAttrs.value
	}, {
		as: $props.as,
		"as-child": $props.asChild,
		"data-slot": "content"
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($setup.ctx.slotProps.value)))]),
		_: 3
	}, 16, ["as", "as-child"]);
}
var PropertySectionContent_default = /* @__PURE__ */ export_helper_default(_sfc_main$12, [["render", _sfc_render$12], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/PropertySection/PropertySectionContent.vue"]]);
//#endregion
//#region src/primitives/PropertySection/PropertySectionEmptyAction.vue
const _sfc_main$11 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "PropertySectionEmptyAction",
	props: {
		asChild: {
			type: Boolean,
			required: false,
			default: false
		},
		as: {
			type: null,
			required: false,
			default: "button"
		}
	},
	emits: ["activate"],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const ctx = usePropertySection();
		function activate() {
			if (ctx.disabled.value) return;
			ctx.actions.open();
			emit("activate");
		}
		const __returned__ = {
			emit,
			ctx,
			activate,
			get Primitive() {
				return Primitive;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$11(_ctx, _cache, $props, $setup, $data, $options) {
	return $setup.ctx.empty.value ? (openBlock(), createBlock($setup["Primitive"], mergeProps({ key: 0 }, {
		..._ctx.$attrs,
		...$setup.ctx.stateAttrs.value
	}, {
		as: $props.as,
		"as-child": $props.asChild,
		type: !$props.asChild && $props.as === "button" ? "button" : void 0,
		"data-slot": "empty-action",
		onClick: $setup.activate
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($setup.ctx.slotProps.value)))]),
		_: 3
	}, 16, [
		"as",
		"as-child",
		"type"
	])) : createCommentVNode("v-if", true);
}
var PropertySectionEmptyAction_default = /* @__PURE__ */ export_helper_default(_sfc_main$11, [["render", _sfc_render$11], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/PropertySection/PropertySectionEmptyAction.vue"]]);
//#endregion
//#region src/primitives/SegmentedControl/context.ts
const [useSegmentedControl, provideSegmentedControl] = createContext("SegmentedControl");
//#endregion
//#region src/primitives/SegmentedControl/SegmentedControlRoot.vue
const _sfc_main$10 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "SegmentedControlRoot",
	props: {
		mode: {
			type: String,
			required: false,
			default: "single"
		},
		modelValue: {
			type: [String, Array],
			required: false
		},
		orientation: {
			type: String,
			required: false,
			default: "horizontal"
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		required: {
			type: Boolean,
			required: false,
			default: false
		},
		rovingFocus: {
			type: Boolean,
			required: false,
			default: true
		},
		loop: {
			type: Boolean,
			required: false,
			default: true
		}
	},
	emits: ["update:modelValue", "action"],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const mode = computed(() => __props.mode);
		const modelValue = computed(() => __props.modelValue);
		const disabled = computed(() => __props.disabled);
		function selected(value) {
			if (Array.isArray(modelValue.value)) return modelValue.value.includes(value);
			return modelValue.value === value;
		}
		function activate(value) {
			if (!disabled.value) emit("action", value);
		}
		function updateSingle(value) {
			if (__props.required && typeof value !== "string") return;
			emit("update:modelValue", typeof value === "string" ? value : void 0);
		}
		function updateMultiple(value) {
			if (!Array.isArray(value)) return;
			emit("update:modelValue", value.filter((item) => typeof item === "string"));
		}
		provideSegmentedControl({
			mode,
			modelValue,
			disabled,
			selected,
			activate
		});
		const __returned__ = {
			emit,
			mode,
			modelValue,
			disabled,
			selected,
			activate,
			updateSingle,
			updateMultiple,
			get RovingFocusGroup() {
				return RovingFocusGroup;
			},
			get ToggleGroupRoot() {
				return ToggleGroupRoot;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$10(_ctx, _cache, $props, $setup, $data, $options) {
	return $setup.mode === "single" ? (openBlock(), createBlock($setup["ToggleGroupRoot"], mergeProps({ key: 0 }, _ctx.$attrs, {
		type: "single",
		"model-value": typeof $setup.modelValue === "string" ? $setup.modelValue : void 0,
		orientation: $props.orientation,
		disabled: $setup.disabled,
		required: $props.required,
		"roving-focus": $props.rovingFocus,
		loop: $props.loop,
		"data-slot": "root",
		"data-mode": "single",
		"onUpdate:modelValue": $setup.updateSingle
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", {
			mode: $setup.mode,
			modelValue: $setup.modelValue
		})]),
		_: 3
	}, 16, [
		"model-value",
		"orientation",
		"disabled",
		"required",
		"roving-focus",
		"loop"
	])) : $setup.mode === "multiple" ? (openBlock(), createBlock($setup["ToggleGroupRoot"], mergeProps({ key: 1 }, _ctx.$attrs, {
		type: "multiple",
		"model-value": Array.isArray($setup.modelValue) ? $setup.modelValue : [],
		orientation: $props.orientation,
		disabled: $setup.disabled,
		"roving-focus": $props.rovingFocus,
		loop: $props.loop,
		"data-slot": "root",
		"data-mode": "multiple",
		"onUpdate:modelValue": $setup.updateMultiple
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", {
			mode: $setup.mode,
			modelValue: $setup.modelValue
		})]),
		_: 3
	}, 16, [
		"model-value",
		"orientation",
		"disabled",
		"roving-focus",
		"loop"
	])) : (openBlock(), createBlock($setup["RovingFocusGroup"], mergeProps({ key: 2 }, _ctx.$attrs, {
		orientation: $props.orientation,
		loop: $props.loop,
		role: "group",
		"data-slot": "root",
		"data-mode": "action"
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", {
			mode: $setup.mode,
			modelValue: $setup.modelValue
		})]),
		_: 3
	}, 16, ["orientation", "loop"]));
}
var SegmentedControlRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$10, [["render", _sfc_render$10], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/SegmentedControl/SegmentedControlRoot.vue"]]);
//#endregion
//#region src/primitives/SegmentedControl/SegmentedControlItem.vue
const _sfc_main$9 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "SegmentedControlItem",
	props: {
		value: {
			type: String,
			required: true
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		as: {
			type: null,
			required: false,
			default: "button"
		},
		asChild: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	setup(__props, { expose: __expose }) {
		__expose();
		const ctx = useSegmentedControl();
		const disabled = computed(() => __props.disabled || ctx.disabled.value);
		const selected = computed(() => ctx.selected(__props.value));
		const slotProps = computed(() => ({
			value: __props.value,
			selected: selected.value,
			disabled: disabled.value,
			mode: ctx.mode.value
		}));
		function activate() {
			if (!disabled.value) ctx.activate(__props.value);
		}
		const __returned__ = {
			ctx,
			disabled,
			selected,
			slotProps,
			activate,
			get Primitive() {
				return Primitive;
			},
			get RovingFocusItem() {
				return RovingFocusItem;
			},
			get ToggleGroupItem() {
				return ToggleGroupItem;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
	return $setup.ctx.mode.value !== "action" ? (openBlock(), createBlock($setup["ToggleGroupItem"], mergeProps({ key: 0 }, _ctx.$attrs, {
		value: $props.value,
		disabled: $setup.disabled,
		as: $props.as,
		"as-child": $props.asChild,
		"data-slot": "item"
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($setup.slotProps)))]),
		_: 3
	}, 16, [
		"value",
		"disabled",
		"as",
		"as-child"
	])) : (openBlock(), createBlock($setup["RovingFocusItem"], {
		key: 1,
		focusable: !$setup.disabled,
		"as-child": ""
	}, {
		default: withCtx(() => [createVNode($setup["Primitive"], mergeProps(_ctx.$attrs, {
			as: $props.as,
			"as-child": $props.asChild,
			type: !$props.asChild && $props.as === "button" ? "button" : void 0,
			disabled: $setup.disabled,
			"data-slot": "item",
			"data-state": "off",
			onClick: $setup.activate
		}), {
			default: withCtx(() => [renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($setup.slotProps)))]),
			_: 3
		}, 16, [
			"as",
			"as-child",
			"type",
			"disabled"
		])]),
		_: 3
	}, 8, ["focusable"]));
}
var SegmentedControlItem_default = /* @__PURE__ */ export_helper_default(_sfc_main$9, [["render", _sfc_render$9], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/SegmentedControl/SegmentedControlItem.vue"]]);
//#endregion
//#region src/primitives/BindableValue/BindableValueRoot.vue
const _sfc_main$8 = /* @__PURE__ */ defineComponent({
	__name: "BindableValueRoot",
	props: {
		provider: {
			type: Object,
			required: false
		},
		targets: {
			type: Array,
			required: true
		},
		value: {
			type: null,
			required: true
		},
		policy: {
			type: String,
			required: false,
			default: "detach-on-edit"
		},
		batchLabel: {
			type: String,
			required: false,
			default: "Edit bound value"
		}
	},
	setup(__props, { expose: __expose }) {
		__expose();
		const injectedProvider = useBindingProvider();
		const resolvedProvider = __props.provider ?? injectedProvider;
		if (!resolvedProvider) throw new Error("[open-pencil] BindableValueRoot requires a provider prop or provideBindingProvider()");
		const provider = resolvedProvider;
		const beginProviderBatch = provider.beginBatch;
		const commitProviderBatch = provider.commitBatch;
		const rollbackProviderBatch = provider.rollbackBatch;
		const supportsInteractionBatch = beginProviderBatch !== void 0 && commitProviderBatch !== void 0 && rollbackProviderBatch !== void 0;
		const targets = computed(() => __props.targets);
		const value = computed(() => __props.value);
		const policy = computed(() => __props.policy);
		const open = ref(false);
		const searchTerm = ref("");
		const state = computed(() => {
			provider.revision?.value;
			return provider.getState(targets.value);
		});
		const variable = computed(() => {
			const target = targets.value[0];
			return state.value === "bound" && target ? provider.getBound(target) : void 0;
		});
		const resolvedValue = computed(() => {
			provider.revision?.value;
			const current = variable.value;
			return current ? provider.resolve(current.id) : void 0;
		});
		const variables = computed(() => {
			provider.revision?.value;
			return provider.filterVariables(searchTerm.value);
		});
		const stateAttrs = computed(() => ({
			"data-unbound": state.value === "unbound" ? "" : void 0,
			"data-bound": state.value === "bound" ? "" : void 0,
			"data-mixed": state.value === "mixed" ? "" : void 0,
			"data-picker-open": open.value ? "" : void 0,
			"data-policy": policy.value
		}));
		let interactionActive = false;
		let detachedForInteraction = false;
		let bindingSnapshot = /* @__PURE__ */ new Map();
		let resolvedSnapshot;
		function runImmediate(label, action) {
			if (provider.runBatch) provider.runBatch(label, action);
			else action();
		}
		function bind(variableId) {
			runImmediate("Bind variable", () => {
				for (const target of targets.value) provider.bind(target, variableId);
			});
			open.value = false;
		}
		function unbind() {
			runImmediate("Unbind variable", () => {
				for (const target of targets.value) provider.unbind(target);
			});
		}
		function create(name) {
			const target = targets.value[0];
			if (!target || !provider.create) return;
			runImmediate("Create and bind variable", () => provider.create?.(target, value.value, name));
			open.value = false;
		}
		function openPicker() {
			open.value = true;
		}
		function closePicker() {
			open.value = false;
		}
		function togglePicker() {
			open.value = !open.value;
		}
		function setSearchTerm(term) {
			searchTerm.value = term;
		}
		function snapshotBindings() {
			bindingSnapshot = /* @__PURE__ */ new Map();
			for (const target of targets.value) {
				const current = provider.getBound(target);
				if (current) bindingSnapshot.set(target, current.id);
			}
		}
		function beginMutation(source) {
			if (interactionActive) return true;
			const startedUnbound = state.value === "unbound";
			const startedMixed = state.value === "mixed";
			if (!startedUnbound && !startedMixed && policy.value === "readonly-when-bound") return false;
			if (!startedUnbound && !startedMixed && policy.value === "edit-variable" && (!variable.value || !provider.setValue)) return false;
			interactionActive = true;
			if (!startedUnbound) snapshotBindings();
			resolvedSnapshot = resolvedValue.value;
			if (supportsInteractionBatch) beginProviderBatch(__props.batchLabel);
			if (startedMixed || !startedUnbound && policy.value === "detach-on-edit") {
				detachedForInteraction = true;
				for (const target of targets.value) provider.unbind(target);
			}
			return true;
		}
		function applyValue(nextValue) {
			if (policy.value !== "edit-variable" || !interactionActive) return false;
			const current = variable.value;
			if (!current || !provider.setValue) return false;
			provider.setValue(current.id, nextValue);
			return true;
		}
		function resetInteraction() {
			interactionActive = false;
			detachedForInteraction = false;
			bindingSnapshot.clear();
			resolvedSnapshot = void 0;
		}
		function commitMutation() {
			if (!interactionActive) return;
			if (supportsInteractionBatch) commitProviderBatch();
			resetInteraction();
		}
		function restoreWithoutRollback() {
			if (detachedForInteraction) for (const [target, variableId] of bindingSnapshot) provider.bind(target, variableId);
			else if (policy.value === "edit-variable" && variable.value && resolvedSnapshot !== void 0 && provider.setValue) provider.setValue(variable.value.id, resolvedSnapshot);
		}
		function cancelMutation() {
			if (!interactionActive) return;
			if (supportsInteractionBatch) rollbackProviderBatch();
			else restoreWithoutRollback();
			resetInteraction();
		}
		const actions = {
			bind,
			unbind,
			create,
			openPicker,
			closePicker,
			togglePicker,
			setSearchTerm,
			beginMutation,
			applyValue,
			commitMutation,
			cancelMutation
		};
		const slotProps = computed(() => ({
			state: state.value,
			variable: variable.value,
			resolvedValue: resolvedValue.value,
			policy: policy.value,
			open: open.value,
			searchTerm: searchTerm.value,
			variables: variables.value,
			stateAttrs: stateAttrs.value,
			actions
		}));
		const context = {
			provider,
			targets,
			value,
			state,
			variable,
			resolvedValue,
			policy,
			open,
			searchTerm,
			variables,
			stateAttrs,
			slotProps,
			actions
		};
		provideBindableValue(context);
		onBeforeUnmount(cancelMutation);
		const __returned__ = {
			injectedProvider,
			resolvedProvider,
			provider,
			beginProviderBatch,
			commitProviderBatch,
			rollbackProviderBatch,
			supportsInteractionBatch,
			targets,
			value,
			policy,
			open,
			searchTerm,
			state,
			variable,
			resolvedValue,
			variables,
			stateAttrs,
			get interactionActive() {
				return interactionActive;
			},
			set interactionActive(v) {
				interactionActive = v;
			},
			get detachedForInteraction() {
				return detachedForInteraction;
			},
			set detachedForInteraction(v) {
				detachedForInteraction = v;
			},
			get bindingSnapshot() {
				return bindingSnapshot;
			},
			set bindingSnapshot(v) {
				bindingSnapshot = v;
			},
			get resolvedSnapshot() {
				return resolvedSnapshot;
			},
			set resolvedSnapshot(v) {
				resolvedSnapshot = v;
			},
			runImmediate,
			bind,
			unbind,
			create,
			openPicker,
			closePicker,
			togglePicker,
			setSearchTerm,
			snapshotBindings,
			beginMutation,
			applyValue,
			resetInteraction,
			commitMutation,
			restoreWithoutRollback,
			cancelMutation,
			actions,
			slotProps,
			context
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($setup.slotProps)));
}
var BindableValueRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$8, [["render", _sfc_render$8], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/BindableValue/BindableValueRoot.vue"]]);
//#endregion
//#region src/primitives/BindableValue/BindableValueTrigger.vue
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "BindableValueTrigger",
	props: {
		asChild: {
			type: Boolean,
			required: false,
			default: false
		},
		as: {
			type: null,
			required: false,
			default: "button"
		}
	},
	setup(__props, { expose: __expose }) {
		__expose();
		const ctx = useBindableValue();
		const __returned__ = {
			ctx,
			semanticAttrs: computed(() => ({
				type: !__props.asChild && __props.as === "button" ? "button" : void 0,
				"aria-expanded": ctx.open.value,
				"aria-haspopup": "listbox"
			})),
			get Primitive() {
				return Primitive;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["Primitive"], mergeProps({
		..._ctx.$attrs,
		...$setup.ctx.stateAttrs.value,
		...$setup.semanticAttrs
	}, {
		as: $props.as,
		"as-child": $props.asChild,
		"data-slot": "trigger",
		onClick: $setup.ctx.actions.togglePicker
	}), {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($setup.ctx.slotProps.value)))]),
		_: 3
	}, 16, [
		"as",
		"as-child",
		"onClick"
	]);
}
var BindableValueTrigger_default = /* @__PURE__ */ export_helper_default(_sfc_main$7, [["render", _sfc_render$7], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/BindableValue/BindableValueTrigger.vue"]]);
//#endregion
//#region src/primitives/BindableValue/BindableValuePicker.vue
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
	__name: "BindableValuePicker",
	setup(__props, { expose: __expose }) {
		__expose();
		const ctx = useBindableValue();
		function select(value) {
			if (typeof value !== "object" || value === null || !("id" in value)) return;
			if (typeof value.id !== "string") return;
			ctx.actions.bind(value.id);
		}
		const __returned__ = {
			ctx,
			select,
			get ComboboxRoot() {
				return ComboboxRoot;
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createBlock($setup["ComboboxRoot"], {
		open: $setup.ctx.open.value,
		"model-value": $setup.ctx.variable.value,
		"ignore-filter": true,
		"onUpdate:modelValue": $setup.select,
		"onUpdate:open": _cache[0] || (_cache[0] = (open) => open ? $setup.ctx.actions.openPicker() : $setup.ctx.actions.closePicker())
	}, {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($setup.ctx.slotProps.value)))]),
		_: 3
	}, 8, ["open", "model-value"]);
}
var BindableValuePicker_default = /* @__PURE__ */ export_helper_default(_sfc_main$6, [["render", _sfc_render$6], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/BindableValue/BindableValuePicker.vue"]]);
//#endregion
//#region src/primitives/NumberField/context.ts
const [useNumberField, provideNumberField] = createContext("NumberField");
//#endregion
//#region src/primitives/NumberField/NumberFieldRoot.vue
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
	__name: "NumberFieldRoot",
	props: {
		modelValue: {
			type: [Number, Symbol],
			required: true
		},
		min: {
			type: Number,
			required: false,
			default: () => -Infinity
		},
		max: {
			type: Number,
			required: false,
			default: () => Infinity
		},
		step: {
			type: Number,
			required: false,
			default: 1
		},
		sensitivity: {
			type: Number,
			required: false,
			default: 1
		},
		placeholder: {
			type: String,
			required: false,
			default: "Mixed"
		},
		ariaLabel: {
			type: String,
			required: false
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		bound: {
			type: Boolean,
			required: false,
			default: false
		},
		editPolicy: {
			type: String,
			required: false,
			default: "editable"
		}
	},
	emits: [
		"update:modelValue",
		"commit",
		"editing-change",
		"invalid",
		"detach-request"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		__expose();
		const emit = __emit;
		const binding = useOptionalBindableValue();
		const editing = ref(false);
		const scrubbing = ref(false);
		const draftValue = ref("");
		const inputRef = ref(null);
		const invalidReason = ref(null);
		const workingValue = ref(0);
		const isMixed = computed(() => binding?.state.value === "mixed" || typeof __props.modelValue === "symbol");
		const numericValue = computed(() => {
			const resolved = binding?.resolvedValue.value;
			if (binding?.state.value === "bound" && typeof resolved === "number") return resolved;
			return typeof __props.modelValue === "number" ? __props.modelValue : 0;
		});
		const displayValue = computed(() => isMixed.value ? "" : String(normalizeNumberValue(numericValue.value)));
		const disabled = computed(() => __props.disabled);
		const bound = computed(() => binding ? binding.state.value === "bound" : __props.bound);
		const effectiveEditPolicy = computed(() => {
			if (!binding) return __props.editPolicy;
			if (binding.policy.value === "readonly-when-bound") return "readonly";
			if (binding.policy.value === "detach-on-edit") return "detach-on-edit";
			return "editable";
		});
		const minValue = computed(() => __props.min);
		const maxValue = computed(() => __props.max);
		const stepValue = computed(() => Number.isFinite(__props.step) && __props.step > 0 ? __props.step : 1);
		const ariaLabelValue = computed(() => __props.ariaLabel);
		let interactionStartValue = 0;
		let interactionStartedMixed = false;
		let mutationRequested = false;
		let stopMove;
		let stopUp;
		let stopCancel;
		let scrubTarget;
		let scrubPointerId;
		function canMutate() {
			return !disabled.value && !(bound.value && effectiveEditPolicy.value === "readonly");
		}
		function requestMutation(source) {
			if (mutationRequested) return true;
			if (!canMutate()) return false;
			if (binding && !binding.actions.beginMutation(source)) return false;
			if (!binding && bound.value && effectiveEditPolicy.value === "detach-on-edit") emit("detach-request", source);
			mutationRequested = true;
			return true;
		}
		function beginInteraction() {
			interactionStartValue = numericValue.value;
			interactionStartedMixed = isMixed.value;
			workingValue.value = numericValue.value;
			mutationRequested = false;
			invalidReason.value = null;
		}
		function updateValue(value) {
			const normalized = normalizeNumberValue(clampNumberValue(value, __props.min, __props.max));
			workingValue.value = normalized;
			if (binding?.actions.applyValue(normalized)) return;
			if (__props.modelValue !== normalized) emit("update:modelValue", normalized);
		}
		function restoreInteractionValue() {
			if (workingValue.value !== interactionStartValue || interactionStartedMixed !== isMixed.value) {
				workingValue.value = interactionStartValue;
				if (!binding?.actions.applyValue(interactionStartValue)) emit("update:modelValue", interactionStartValue);
			}
		}
		function finishCommit(value) {
			updateValue(value);
			editing.value = false;
			if (workingValue.value !== interactionStartValue) emit("commit", workingValue.value, interactionStartValue);
			binding?.actions.commitMutation();
		}
		function startEdit() {
			if (editing.value || !canMutate()) return;
			beginInteraction();
			draftValue.value = interactionStartedMixed ? "" : String(interactionStartValue);
			editing.value = true;
			nextTick(() => {
				inputRef.value?.focus();
				inputRef.value?.select();
			});
		}
		function setDraft(value) {
			if (value !== draftValue.value && !requestMutation("edit")) return;
			draftValue.value = value;
			if (/^\s*(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?\s*$/i.test(value)) updateValue(Number(value));
		}
		function onInput(event) {
			setDraft(inputValue(event));
		}
		function commitEdit() {
			if (!editing.value) return;
			const expression = draftValue.value;
			const result = evaluateNumberExpression(expression, {
				current: interactionStartValue,
				max: __props.max,
				mixed: interactionStartedMixed
			});
			if (!result.ok) {
				invalidReason.value = result.error;
				restoreInteractionValue();
				editing.value = false;
				binding?.actions.cancelMutation();
				emit("invalid", expression, result.error);
				return;
			}
			finishCommit(result.value);
		}
		function cancelEdit() {
			if (!editing.value) return;
			restoreInteractionValue();
			invalidReason.value = null;
			editing.value = false;
			binding?.actions.cancelMutation();
		}
		function stopScrubListeners() {
			stopMove?.();
			stopUp?.();
			stopCancel?.();
			stopMove = void 0;
			stopUp = void 0;
			stopCancel = void 0;
			if (scrubTarget && scrubPointerId != null && scrubTarget.hasPointerCapture(scrubPointerId)) scrubTarget.releasePointerCapture(scrubPointerId);
			scrubTarget = void 0;
			scrubPointerId = void 0;
			if (typeof document !== "undefined") document.body.style.cursor = "";
		}
		function startScrub(event) {
			if (!canMutate()) return;
			event.preventDefault();
			beginInteraction();
			const startX = event.clientX;
			let lastX = startX;
			let accumulated = numericValue.value;
			let hasMoved = false;
			const target = event.currentTarget instanceof Element ? event.currentTarget : void 0;
			scrubTarget = target;
			scrubPointerId = event.pointerId;
			target?.setPointerCapture(event.pointerId);
			const listenerTarget = target ?? document;
			stopMove = useEventListener(listenerTarget, "pointermove", (moveEvent) => {
				if (moveEvent.pointerId !== event.pointerId) return;
				const dx = moveEvent.clientX - lastX;
				lastX = moveEvent.clientX;
				if (!hasMoved && Math.abs(moveEvent.clientX - startX) > 2) {
					if (!requestMutation("scrub")) return;
					hasMoved = true;
					scrubbing.value = true;
					document.body.style.cursor = "ew-resize";
				}
				if (!hasMoved) return;
				accumulated += dx * stepValue.value * __props.sensitivity;
				updateValue(accumulated);
			});
			const finish = (cancelled) => {
				stopScrubListeners();
				scrubbing.value = false;
				if (cancelled) {
					restoreInteractionValue();
					binding?.actions.cancelMutation();
					return;
				}
				if (!hasMoved) {
					startEdit();
					return;
				}
				if (workingValue.value !== interactionStartValue) emit("commit", workingValue.value, interactionStartValue);
				binding?.actions.commitMutation();
			};
			stopUp = useEventListener(listenerTarget, "pointerup", (upEvent) => {
				if (upEvent.pointerId === event.pointerId) finish(false);
			});
			stopCancel = useEventListener(listenerTarget, "pointercancel", (cancelEvent) => {
				if (cancelEvent.pointerId === event.pointerId) finish(true);
			});
		}
		function stepValueFromKeyboard(event) {
			if (event.code !== "ArrowUp" && event.code !== "ArrowDown") return false;
			if (!editing.value) beginInteraction();
			if (!requestMutation("step")) return true;
			event.preventDefault();
			const draftResult = editing.value ? evaluateNumberExpression(draftValue.value, {
				current: interactionStartValue,
				max: __props.max,
				mixed: interactionStartedMixed
			}) : void 0;
			const next = stepNumberValue(draftResult?.ok ? draftResult.value : workingValue.value, event.code === "ArrowUp" ? 1 : -1, stepValue.value, event, __props.min, __props.max);
			updateValue(next);
			draftValue.value = String(next);
			if (!editing.value) {
				if (next !== interactionStartValue) emit("commit", next, interactionStartValue);
				binding?.actions.commitMutation();
			}
			return true;
		}
		function onKeydown(event) {
			if (stepValueFromKeyboard(event)) return;
			if (event.code === "Enter") {
				event.preventDefault();
				commitEdit();
			} else if (event.code === "Escape") {
				event.preventDefault();
				cancelEdit();
			}
		}
		const state = computed(() => ({
			editing: editing.value,
			scrubbing: scrubbing.value,
			mixed: isMixed.value,
			disabled: disabled.value,
			bound: bound.value
		}));
		const stateAttrs = computed(() => ({
			"data-editing": editing.value ? "" : void 0,
			"data-scrubbing": scrubbing.value ? "" : void 0,
			"data-mixed": isMixed.value ? "" : void 0,
			"data-disabled": disabled.value ? "" : void 0,
			"data-bound": bound.value ? "" : void 0
		}));
		const rootTabindex = computed(() => {
			if (editing.value) return void 0;
			return disabled.value ? -1 : 0;
		});
		const rootAttrs = computed(() => ({
			...stateAttrs.value,
			role: editing.value ? void 0 : "spinbutton",
			tabindex: rootTabindex.value,
			"aria-valuenow": editing.value || isMixed.value ? void 0 : numericValue.value,
			"aria-valuemin": !editing.value && Number.isFinite(__props.min) ? __props.min : void 0,
			"aria-valuemax": !editing.value && Number.isFinite(__props.max) ? __props.max : void 0,
			"aria-disabled": !editing.value && disabled.value ? "true" : void 0,
			"aria-label": editing.value ? void 0 : __props.ariaLabel,
			onFocus: startEdit,
			onKeydown
		}));
		const actions = {
			startScrub,
			startEdit,
			cancelEdit,
			commitEdit,
			setDraft,
			input: onInput,
			keydown: onKeydown
		};
		const slotProps = computed(() => ({
			modelValue: __props.modelValue,
			displayValue: displayValue.value,
			draftValue: draftValue.value,
			isMixed: isMixed.value,
			placeholder: __props.placeholder,
			...state.value,
			state: state.value,
			attrs: rootAttrs.value,
			actions
		}));
		provideNumberField({
			modelValue: computed(() => __props.modelValue),
			numericValue,
			displayValue,
			draftValue,
			isMixed,
			editing,
			scrubbing,
			disabled,
			bound,
			min: minValue,
			max: maxValue,
			step: stepValue,
			ariaLabel: ariaLabelValue,
			inputRef,
			state,
			stateAttrs,
			rootAttrs,
			slotProps,
			actions,
			invalidReason
		});
		watch(editing, (value) => emit("editing-change", value));
		watch(() => __props.modelValue, (value) => {
			if (!editing.value && !scrubbing.value && typeof value === "number") workingValue.value = value;
		}, { immediate: true });
		onBeforeUnmount(stopScrubListeners);
		const __returned__ = {
			emit,
			binding,
			editing,
			scrubbing,
			draftValue,
			inputRef,
			invalidReason,
			workingValue,
			isMixed,
			numericValue,
			displayValue,
			disabled,
			bound,
			effectiveEditPolicy,
			minValue,
			maxValue,
			stepValue,
			ariaLabelValue,
			get interactionStartValue() {
				return interactionStartValue;
			},
			set interactionStartValue(v) {
				interactionStartValue = v;
			},
			get interactionStartedMixed() {
				return interactionStartedMixed;
			},
			set interactionStartedMixed(v) {
				interactionStartedMixed = v;
			},
			get mutationRequested() {
				return mutationRequested;
			},
			set mutationRequested(v) {
				mutationRequested = v;
			},
			get stopMove() {
				return stopMove;
			},
			set stopMove(v) {
				stopMove = v;
			},
			get stopUp() {
				return stopUp;
			},
			set stopUp(v) {
				stopUp = v;
			},
			get stopCancel() {
				return stopCancel;
			},
			set stopCancel(v) {
				stopCancel = v;
			},
			get scrubTarget() {
				return scrubTarget;
			},
			set scrubTarget(v) {
				scrubTarget = v;
			},
			get scrubPointerId() {
				return scrubPointerId;
			},
			set scrubPointerId(v) {
				scrubPointerId = v;
			},
			canMutate,
			requestMutation,
			beginInteraction,
			updateValue,
			restoreInteractionValue,
			finishCommit,
			startEdit,
			setDraft,
			onInput,
			commitEdit,
			cancelEdit,
			stopScrubListeners,
			startScrub,
			stepValueFromKeyboard,
			onKeydown,
			state,
			stateAttrs,
			rootTabindex,
			rootAttrs,
			actions,
			slotProps
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($setup.slotProps)));
}
var NumberFieldRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$5, [["render", _sfc_render$5], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/NumberField/NumberFieldRoot.vue"]]);
//#endregion
//#region src/primitives/NumberField/NumberFieldInput.vue
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "NumberFieldInput",
	setup(__props, { expose: __expose }) {
		__expose();
		const ctx = useNumberField();
		const inputEl = templateRef("inputEl");
		const ariaAttrs = computed(() => ({
			role: "spinbutton",
			"aria-valuenow": ctx.isMixed.value ? void 0 : ctx.numericValue.value,
			"aria-valuemin": Number.isFinite(ctx.min.value) ? ctx.min.value : void 0,
			"aria-valuemax": Number.isFinite(ctx.max.value) ? ctx.max.value : void 0,
			"aria-disabled": ctx.disabled.value ? "true" : void 0,
			"aria-label": ctx.ariaLabel.value
		}));
		watchEffect(() => {
			ctx.inputRef.value = inputEl.value;
		});
		const __returned__ = {
			ctx,
			inputEl,
			ariaAttrs
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
const _hoisted_1 = ["disabled", "value"];
function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
	return $setup.ctx.editing.value ? (openBlock(), createElementBlock("input", mergeProps({
		key: 0,
		ref: "inputEl"
	}, {
		..._ctx.$attrs,
		...$setup.ctx.stateAttrs.value,
		...$setup.ariaAttrs
	}, {
		"data-slot": "input",
		type: "text",
		inputmode: "decimal",
		autocomplete: "off",
		spellcheck: false,
		disabled: $setup.ctx.disabled.value,
		value: $setup.ctx.draftValue.value,
		onBlur: _cache[0] || (_cache[0] = (...args) => $setup.ctx.actions.commitEdit && $setup.ctx.actions.commitEdit(...args)),
		onKeydown: _cache[1] || (_cache[1] = withModifiers((...args) => $setup.ctx.actions.keydown && $setup.ctx.actions.keydown(...args), ["stop"])),
		onInput: _cache[2] || (_cache[2] = (...args) => $setup.ctx.actions.input && $setup.ctx.actions.input(...args))
	}), null, 16, _hoisted_1)) : createCommentVNode("v-if", true);
}
var NumberFieldInput_default = /* @__PURE__ */ export_helper_default(_sfc_main$4, [["render", _sfc_render$4], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/NumberField/NumberFieldInput.vue"]]);
//#endregion
//#region src/primitives/NumberField/NumberFieldValue.vue
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "NumberFieldValue",
	setup(__props, { expose: __expose }) {
		__expose();
		const __returned__ = { ctx: useNumberField() };
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
	return !$setup.ctx.editing.value ? (openBlock(), createElementBlock("span", mergeProps({ key: 0 }, {
		..._ctx.$attrs,
		...$setup.ctx.stateAttrs.value
	}, { "data-slot": "value" }), [renderSlot(_ctx.$slots, "default", mergeProps($setup.ctx.slotProps.value, { value: $setup.ctx.displayValue.value }), () => [createTextVNode(toDisplayString($setup.ctx.isMixed.value ? $setup.ctx.slotProps.value.placeholder : $setup.ctx.displayValue.value), 1)])], 16)) : createCommentVNode("v-if", true);
}
var NumberFieldValue_default = /* @__PURE__ */ export_helper_default(_sfc_main$3, [["render", _sfc_render$3], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/NumberField/NumberFieldValue.vue"]]);
//#endregion
//#region src/primitives/NumberField/parts.ts
function createNumberFieldPart(part) {
	return defineComponent({
		name: `NumberField${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`,
		inheritAttrs: false,
		setup(_props, { attrs, slots }) {
			const ctx = useNumberField();
			return () => h("span", {
				...attrs,
				...ctx.stateAttrs.value,
				"data-slot": part
			}, slots.default?.(ctx.slotProps.value));
		}
	});
}
const NumberFieldLeading = createNumberFieldPart("leading");
const NumberFieldUnit = createNumberFieldPart("unit");
const NumberFieldTrailing = createNumberFieldPart("trailing");
const NumberFieldMenu = createNumberFieldPart("menu");
//#endregion
//#region src/primitives/TypographyControls/TypographyControlsRoot.vue
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
	__name: "TypographyControlsRoot",
	props: { fontLoader: {
		type: Object,
		required: false
	} },
	setup(__props, { expose: __expose }) {
		__expose();
		const ctx = useTypography({ fontLoader: __props.fontLoader });
		function onAlignChange(val) {
			if (val) ctx.setAlign(val);
		}
		function onFormattingChange(val) {
			if (Array.isArray(val)) ctx.onFormattingChange(val);
		}
		const __returned__ = {
			ctx,
			onAlignChange,
			onFormattingChange,
			actions: {
				setFamily: ctx.setFamily,
				setWeight: ctx.setWeight,
				setDirection: ctx.setDirection,
				setVerticalAlign: ctx.setVerticalAlign,
				setTextCase: ctx.setTextCase,
				setTruncation: ctx.setTruncation,
				setFontFeature: ctx.setFontFeature,
				updateProp: ctx.updateProp,
				commitProp: ctx.commitProp,
				align: onAlignChange,
				formatting: onFormattingChange,
				toggleBold: ctx.toggleBold,
				toggleItalic: ctx.toggleItalic,
				toggleDecoration: ctx.toggleDecoration
			}
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default", {
		node: $setup.ctx.node,
		weights: $setup.ctx.weights,
		missingFonts: $setup.ctx.missingFonts,
		hasMissingFonts: $setup.ctx.hasMissingFonts,
		activeFormatting: $setup.ctx.activeFormatting,
		actions: $setup.actions
	});
}
var TypographyControlsRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$2, [["render", _sfc_render$2], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/TypographyControls/TypographyControlsRoot.vue"]]);
//#endregion
//#region src/primitives/Toolbar/context.ts
const TOOLBAR_KEY = Symbol("toolbar");
function provideToolbar(ctx) {
	provide(TOOLBAR_KEY, ctx);
}
function useToolbar() {
	const ctx = inject(TOOLBAR_KEY);
	if (!ctx) throw new Error("[open-pencil] useToolbar() called outside <ToolbarRoot>");
	return ctx;
}
//#endregion
//#region src/primitives/Toolbar/ToolbarRoot.vue
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
	__name: "ToolbarRoot",
	props: { tools: {
		type: Array,
		required: false,
		default: () => EDITOR_TOOLS
	} },
	setup(__props, { expose: __expose }) {
		__expose();
		const editor = useEditor();
		const activeTool = computed(() => editor.state.activeTool);
		const expandedFlyout = ref(null);
		const flyoutSelections = reactive(/* @__PURE__ */ new Map());
		watch(activeTool, (currentTool) => {
			for (const tool of __props.tools) if (tool.flyout?.includes(currentTool)) flyoutSelections.set(tool.key, currentTool);
		}, { immediate: true });
		function setTool(tool) {
			editor.setTool(tool);
			expandedFlyout.value = null;
		}
		function toggleFlyout(tool) {
			expandedFlyout.value = expandedFlyout.value === tool ? null : tool;
		}
		function closeFlyout() {
			expandedFlyout.value = null;
		}
		const actions = {
			setTool,
			toggleFlyout,
			closeFlyout
		};
		provideToolbar({
			editor,
			tools: __props.tools,
			activeTool,
			flyoutSelections,
			expandedFlyout,
			setTool,
			toggleFlyout,
			closeFlyout
		});
		const __returned__ = {
			editor,
			activeTool,
			expandedFlyout,
			flyoutSelections,
			setTool,
			toggleFlyout,
			closeFlyout,
			actions
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default", {
		tools: $props.tools,
		activeTool: $setup.activeTool,
		flyoutSelections: $setup.flyoutSelections,
		expandedFlyout: $setup.expandedFlyout,
		actions: $setup.actions
	});
}
var ToolbarRoot_default = /* @__PURE__ */ export_helper_default(_sfc_main$1, [["render", _sfc_render$1], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/Toolbar/ToolbarRoot.vue"]]);
//#endregion
//#region src/primitives/Toolbar/ToolbarItem.vue
const _sfc_main = /* @__PURE__ */ defineComponent({
	__name: "ToolbarItem",
	props: { tool: {
		type: String,
		required: true
	} },
	setup(__props, { expose: __expose }) {
		__expose();
		const { activeTool, setTool } = useToolbar();
		const __returned__ = {
			activeTool,
			setTool,
			isActive: computed(() => activeTool.value === __props.tool),
			actions: { select: () => setTool(__props.tool) }
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default", {
		active: $setup.isActive,
		actions: $setup.actions,
		tool: $props.tool
	});
}
var ToolbarItem_default = /* @__PURE__ */ export_helper_default(_sfc_main, [["render", _sfc_render], ["__file", "/tmp/open-pencil-debug/packages/vue/src/primitives/Toolbar/ToolbarItem.vue"]]);
//#endregion
export { AppearanceControlsRoot_default, BindableValuePicker_default, BindableValueRoot_default, BindableValueTrigger_default, ChannelSliderRoot_default, ChannelSliderThumb_default, ChannelSliderTrack_default, ColorInputRoot_default, ColorPickerRoot_default, ConstraintsControlRoot_default, EDITOR_TOOLS$1 as EDITOR_TOOLS, FillRoot_default, FillSwatch_default, FontPickerRoot_default, GradientEditorBar_default, GradientEditorRoot_default, GradientEditorStop_default, LayerTreeItem_default, LayerTreeRoot_default, LayoutControlsRoot_default, NumberFieldInput_default, NumberFieldLeading, NumberFieldMenu, NumberFieldRoot_default, NumberFieldTrailing, NumberFieldUnit, NumberFieldValue_default, PageListRoot_default, PositionControlsRoot_default, PropertyGridRoot_default, PropertyListAdd_default, PropertyListItem_default, PropertyListRemove_default, PropertyListRoot_default, PropertyListVisibility_default, PropertySectionActions_default, PropertySectionContent_default, PropertySectionEmptyAction_default, PropertySectionHeader_default, PropertySectionRoot_default, PropertySectionTitle_default, SegmentedControlItem_default, SegmentedControlRoot_default, TOOL_SHORTCUTS, ToolbarItem_default, ToolbarRoot_default, TypographyControlsRoot_default, acpPermissionOptionTestId, buildLayerTreeModel, createEditor, fillCategory, fillIsTransparent, fillSwatchBackground, getToolbarToolSelection, indexLayerNodes, isToolbarToolActive, layerSelectionForTarget, patchLayerNode, testId, testIdSelector, toolbarFlyoutItemTestId, toolbarFlyoutTestId, toolbarToolTestId, useBindableValue, useFill, useFlatReorderDrag, useFontPicker, useGradientStops, useLayerDrag, useLayerTree, useLayoutControlsContext, useNumberField, useOptionalBindableValue, usePropertyList, usePropertySection, useSegmentedControl, useToolbar, useToolbarState, useVariables, useVariablesDialogState, useVariablesEditor, useVariablesTable, vTestId, variablesAddTestId, visibleLayerRows };

//# sourceMappingURL=index2.js.map
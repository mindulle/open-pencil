import { CANVAS_BG_COLOR } from "../constants.js";
//#region src/editor/state.ts
function createDefaultEditorState(pageId) {
	return {
		activeTool: "SELECT",
		currentPageId: pageId,
		selectedIds: /* @__PURE__ */ new Set(),
		marquee: null,
		snapGuides: [],
		rotationPreview: null,
		dropTargetId: null,
		layoutInsertIndicator: null,
		hoveredNodeId: null,
		editingTextId: null,
		penState: null,
		penCursorX: null,
		penCursorY: null,
		remoteCursors: [],
		autoLayoutHover: null,
		documentName: "Untitled",
		panX: 0,
		pageColor: { ...CANVAS_BG_COLOR },
		panY: 0,
		zoom: 1,
		renderVersion: 0,
		sceneVersion: 0,
		loading: false,
		enteredContainerId: null
	};
}
//#endregion
export { createDefaultEditorState };

//# sourceMappingURL=state.js.map
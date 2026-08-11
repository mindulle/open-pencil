//#region src/canvas/text-edit/input.ts
function createTextEditInput(options) {
	const { editor, getCoords, hitTestInScope, hitTestSectionTitle, hitTestComponentLabel, getClickCount, wasSelectedBeforeClickSequence, setDrag } = options;
	function handleTextEditClick(cx, cy, shiftKey) {
		const textEd = editor.textEditor;
		const editNode = editor.state.editingTextId ? editor.graph.getNode(editor.state.editingTextId) : null;
		if (!textEd || !editNode) {
			editor.commitTextEdit();
			return false;
		}
		const abs = editor.graph.getAbsolutePosition(editNode.id);
		const localX = cx - abs.x;
		const localY = cy - abs.y;
		if (localX < 0 || localY < 0 || localX > editNode.width || localY > editNode.height) {
			editor.commitTextEdit();
			const hit = hitTestInScope(cx, cy, true);
			if (hit?.type === "TEXT" && hit.id !== editNode.id) {
				startTextEditingAt(hit, cx, cy);
				return true;
			}
			return false;
		}
		if (getClickCount() >= 3) textEd.selectAll();
		else if (getClickCount() === 2) textEd.selectWordAt(localX, localY);
		else {
			textEd.setCursorAt(localX, localY, shiftKey);
			setDrag({
				type: "text-select",
				startX: cx,
				startY: cy
			});
		}
		editor.requestRender();
		return true;
	}
	function startTextEditingAt(hit, cx, cy) {
		editor.select([hit.id]);
		editor.startTextEditing(hit.id);
		const textEd = editor.textEditor;
		if (textEd) {
			const abs = editor.graph.getAbsolutePosition(hit.id);
			textEd.selectWordAt(cx - abs.x, cy - abs.y);
			editor.requestRender();
		}
	}
	function getContainerDescendantHit(containerId, cx, cy) {
		const hit = editor.graph.hitTestDeep(cx, cy, editor.state.currentPageId);
		if (!hit) return null;
		if (hit.id === containerId || editor.graph.isDescendant(hit.id, containerId)) return hit;
		return null;
	}
	function onDblClick(e) {
		const nodeEditEditor = editor;
		if (editor.state.editingTextId) return;
		const { cx, cy } = getCoords(e);
		const selectedId = editor.state.selectedIds.size === 1 ? [...editor.state.selectedIds][0] : void 0;
		const selectedNode = selectedId ? editor.graph.getNode(selectedId) : void 0;
		if (selectedNode && selectedId && editor.graph.isContainer(selectedId) && !selectedNode.locked) {
			const hit = getContainerDescendantHit(selectedId, cx, cy);
			editor.enterContainer(selectedId);
			if (hit?.type === "TEXT") startTextEditingAt(hit, cx, cy);
			else if (hit) editor.select([hit.id]);
			else editor.clearSelection();
			return;
		}
		const hit = hitTestSectionTitle(cx, cy) ?? hitTestComponentLabel(cx, cy) ?? hitTestInScope(cx, cy, true);
		if (!hit) return;
		if (hit.type === "TEXT") {
			if (!(hit.parentId === editor.state.currentPageId) && selectedId !== hit.id && !wasSelectedBeforeClickSequence(hit.id)) {
				editor.select([hit.id]);
				return;
			}
			startTextEditingAt(hit, cx, cy);
			return;
		}
		if (hit.type === "VECTOR") {
			nodeEditEditor.enterNodeEditMode?.(hit.id);
			return;
		}
		editor.select([hit.id]);
	}
	return {
		handleTextEditClick,
		onDblClick
	};
}
//#endregion
export { createTextEditInput };

//# sourceMappingURL=input.js.map
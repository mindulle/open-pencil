import { ref } from "vue";
import { useEventListener } from "@vueuse/core";
//#region src/shared/input/drop-target.ts
function findMoveDropTarget(cx, cy, editor) {
	let dropTarget = editor.graph.hitTestFrame(cx, cy, editor.state.selectedIds, editor.state.currentPageId);
	if ([...editor.state.selectedIds].some((id) => editor.graph.getNode(id)?.type === "SECTION") && dropTarget && dropTarget.type !== "SECTION" && dropTarget.type !== "CANVAS") dropTarget = null;
	return dropTarget;
}
function reparentOutsideNodes(editor) {
	for (const id of editor.state.selectedIds) {
		const node = editor.graph.getNode(id);
		if (!node?.parentId || editor.isTopLevel(node.parentId)) continue;
		const parent = editor.graph.getNode(node.parentId);
		if (!parent || parent.type !== "FRAME" && parent.type !== "SECTION") continue;
		const outsideX = node.x + node.width < 0 || node.x > parent.width;
		const outsideY = node.y + node.height < 0 || node.y > parent.height;
		if (outsideX || outsideY) {
			const grandparentId = parent.parentId ?? editor.state.currentPageId;
			editor.graph.reparentNode(id, grandparentId);
		}
	}
}
//#endregion
//#region src/canvas/drop/use.ts
const RASTER_IMAGE_TYPES = /* @__PURE__ */ new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
	"image/avif"
]);
const COMPONENT_MIME = "application/x-openpencil-component";
function hasComponentData(e) {
	return e.dataTransfer?.types.includes(COMPONENT_MIME) ?? false;
}
function dropPoint(e, canvas, editor) {
	const rect = canvas.getBoundingClientRect();
	return editor.screenToCanvas(e.clientX - rect.left, e.clientY - rect.top);
}
function componentDropPlacement(componentId, cx, cy, editor) {
	const component = editor.graph.getNode(componentId);
	if (component?.type !== "COMPONENT") return null;
	const parentId = findMoveDropTarget(cx, cy, editor)?.id ?? editor.state.currentPageId;
	const parentOffset = parentId === editor.state.currentPageId ? {
		x: 0,
		y: 0
	} : editor.graph.getAbsolutePosition(parentId);
	return {
		parentId,
		x: cx - parentOffset.x - component.width / 2,
		y: cy - parentOffset.y - component.height / 2
	};
}
function useCanvasDrop(canvasRef, editor) {
	const isDraggingOver = ref(false);
	useEventListener(canvasRef, "dragover", (e) => {
		if (!hasComponentData(e) && !hasFileData(e)) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
		isDraggingOver.value = true;
	});
	useEventListener(canvasRef, "dragenter", (e) => {
		if (!hasComponentData(e) && !hasFileData(e)) return;
		e.preventDefault();
		isDraggingOver.value = true;
	});
	useEventListener(canvasRef, "dragleave", () => {
		isDraggingOver.value = false;
	});
	useEventListener(canvasRef, "drop", (e) => {
		e.preventDefault();
		isDraggingOver.value = false;
		const canvas = canvasRef.value;
		if (!canvas) return;
		const point = dropPoint(e, canvas, editor);
		const componentId = e.dataTransfer?.getData(COMPONENT_MIME);
		if (componentId) {
			const placement = componentDropPlacement(componentId, point.x, point.y, editor);
			if (!placement) return;
			editor.createInstanceFromComponent(componentId, placement.x, placement.y, placement.parentId);
			editor.requestRender();
			return;
		}
		const files = filterCanvasFiles(e.dataTransfer?.files ?? null);
		if (!files.length) return;
		editor.placeFiles(files, point.x, point.y).catch((error) => {
			console.error("Failed to place dropped files", error);
		});
	});
	return { isDraggingOver };
}
function hasFileData(e) {
	return e.dataTransfer?.types.includes("Files") ?? false;
}
function isSVGFile(file) {
	return file.type === "image/svg+xml" || file.type === "" && file.name.toLowerCase().endsWith(".svg");
}
function filterCanvasFiles(files) {
	if (!files) return [];
	return Array.from(files).filter((file) => RASTER_IMAGE_TYPES.has(file.type) || isSVGFile(file));
}
function extractImageFilesFromClipboard(e) {
	const files = e.clipboardData?.files;
	return files ? Array.from(files).filter((file) => RASTER_IMAGE_TYPES.has(file.type)) : [];
}
//#endregion
export { extractImageFilesFromClipboard, findMoveDropTarget, reparentOutsideNodes, useCanvasDrop };

//# sourceMappingURL=use.js.map
import { computed } from "vue";
//#region src/canvas/overlays/useCanvasVirtualReference.ts
function useCanvasVirtualReference(canvasRef, editor, anchor) {
	return computed(() => {
		const point = anchor.value;
		const canvas = canvasRef.value;
		if (!point || !canvas) return null;
		const zoom = editor.state.zoom;
		const panX = editor.state.panX;
		const panY = editor.state.panY;
		return { getBoundingClientRect() {
			const rect = canvas.getBoundingClientRect();
			const x = rect.left + point.x * zoom + panX;
			const y = rect.top + point.y * zoom + panY;
			return new DOMRect(x, y, 0, 0);
		} };
	});
}
//#endregion
export { useCanvasVirtualReference };

//# sourceMappingURL=useCanvasVirtualReference.js.map
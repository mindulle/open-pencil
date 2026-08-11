import { useEditor } from "../../canvas/CanvasRoot.js";
import { onScopeDispose } from "vue";
//#region src/editor/events/use.ts
function useEditorEvent(event, handler) {
	const stop = useEditor().onEditorEvent(event, handler);
	onScopeDispose(stop);
	return stop;
}
//#endregion
export { useEditorEvent };

//# sourceMappingURL=use.js.map
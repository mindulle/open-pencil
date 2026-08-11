import { useEditor } from "../../canvas/CanvasRoot.js";
import { OKHCL_FIELD_OPTIONS, createOkHCLActions, createOkHCLFieldFormats, createOkHCLPreviewHelpers, getFillOkHCLColor, getStrokeOkHCLColor } from "./helpers.js";
import { ref } from "vue";
//#region src/controls/okhcl/use.ts
function useOkHCL() {
	const editor = useEditor();
	const fieldFormats = ref(/* @__PURE__ */ new Map());
	const { ensureFillOkHCL, ensureStrokeOkHCL, updateFillOkHCL, updateStrokeOkHCL } = createOkHCLActions(editor);
	const { getFillPreviewInfo, getStrokePreviewInfo } = createOkHCLPreviewHelpers(editor);
	const { getFieldFormat, setFillFieldFormat, setStrokeFieldFormat } = createOkHCLFieldFormats(fieldFormats, ensureFillOkHCL, ensureStrokeOkHCL);
	return {
		getFillOkHCLColor,
		getStrokeOkHCLColor,
		getFillPreviewInfo,
		getStrokePreviewInfo,
		getFieldFormat,
		setFillFieldFormat,
		setStrokeFieldFormat,
		updateFillOkHCL,
		updateStrokeOkHCL,
		fieldOptions: OKHCL_FIELD_OPTIONS
	};
}
//#endregion
export { useOkHCL };

//# sourceMappingURL=use.js.map
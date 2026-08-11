import { useColorVariableBinding } from "../color-variable-binding/use.js";
import { DEFAULT_SHAPE_FILL } from "@open-pencil/core/constants";
//#region src/controls/fill/use.ts
/**
* Returns fill-related panel helpers and a reusable default fill value.
*
* This composable extends variable-binding behavior with SDK-level defaults for
* fill editing UIs.
*/
function useFillControls() {
	return {
		...useColorVariableBinding("fills"),
		defaultFill: DEFAULT_SHAPE_FILL
	};
}
//#endregion
export { useFillControls };

//# sourceMappingURL=use.js.map
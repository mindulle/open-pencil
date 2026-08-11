import { useEditor } from "../../canvas/CanvasRoot.js";
import { EFFECT_OPTIONS, createDefaultEffect, createEffectControlActions, createEffectEditActions, isShadow } from "./helpers.js";
import { ref } from "vue";
//#region src/controls/effects/use.ts
/**
* Returns effect-editing helpers for property panels.
*
* This composable manages default effect creation, expanded-row state,
* scrub-preview behavior, and effect type/color updates.
*/
function useEffectsControls() {
	const editor = useEditor();
	const expandedIndex = ref(null);
	const editActions = createEffectEditActions(editor, ref(null));
	const controlActions = createEffectControlActions(expandedIndex);
	return {
		expandedIndex,
		effectOptions: EFFECT_OPTIONS,
		createDefaultEffect,
		isShadow,
		...editActions,
		...controlActions
	};
}
//#endregion
export { useEffectsControls };

//# sourceMappingURL=use.js.map
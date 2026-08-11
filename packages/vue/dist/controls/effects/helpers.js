import { useI18n } from "../../canvas/tool-input/use.js";
//#region src/controls/effects/helpers.ts
const { panels } = useI18n();
const EFFECT_LABELS = {
	DROP_SHADOW: panels.value.dropShadow,
	INNER_SHADOW: panels.value.innerShadow,
	LAYER_BLUR: panels.value.layerBlur,
	BACKGROUND_BLUR: panels.value.backgroundBlur,
	FOREGROUND_BLUR: panels.value.foregroundBlur
};
const EFFECT_OPTIONS = Object.keys(EFFECT_LABELS).map((t) => ({
	value: t,
	label: EFFECT_LABELS[t]
}));
function isShadow(type) {
	return type === "DROP_SHADOW" || type === "INNER_SHADOW";
}
function createDefaultEffect() {
	return {
		type: "DROP_SHADOW",
		color: {
			r: 0,
			g: 0,
			b: 0,
			a: .25
		},
		offset: {
			x: 0,
			y: 4
		},
		radius: 4,
		spread: 0,
		visible: true
	};
}
function createEffectEditActions(editor, effectsBeforeScrub) {
	function scrubEffect(node, index, changes) {
		if (!node) return;
		if (!effectsBeforeScrub.value) effectsBeforeScrub.value = {
			effects: node.effects.map((e) => ({
				...e,
				color: { ...e.color },
				offset: { ...e.offset }
			})),
			effectStyleId: node.effectStyleId
		};
		const effects = [...node.effects];
		effects[index] = {
			...effects[index],
			...changes
		};
		editor.updateNode(node.id, { effects });
		editor.requestRender();
	}
	function commitEffect(node, index, changes) {
		if (!node) return;
		const previous = effectsBeforeScrub.value;
		effectsBeforeScrub.value = null;
		const effects = [...node.effects];
		effects[index] = {
			...effects[index],
			...changes
		};
		editor.updateNode(node.id, { effects });
		editor.requestRender();
		if (previous) editor.commitNodeUpdate(node.id, {
			effects: previous.effects,
			effectStyleId: previous.effectStyleId
		}, "Change effect");
	}
	return {
		scrubEffect,
		commitEffect
	};
}
function createEffectControlActions(expandedIndex) {
	function updateType(patch, node, index, type) {
		if (!node) return;
		const changes = { type };
		if (!isShadow(type)) {
			changes.offset = {
				x: 0,
				y: 0
			};
			changes.spread = 0;
		} else if (!isShadow(node.effects[index].type)) {
			changes.offset = {
				x: 0,
				y: 4
			};
			changes.spread = 0;
		}
		patch(index, changes);
	}
	function updateColor(patch, index, color) {
		patch(index, { color });
	}
	function adjustExpandedAfterRemove(index) {
		if (expandedIndex.value === index) expandedIndex.value = null;
		else if (expandedIndex.value !== null && expandedIndex.value > index) expandedIndex.value--;
	}
	function handleRemove(removeFn, index) {
		removeFn(index);
		adjustExpandedAfterRemove(index);
	}
	function toggleExpand(index) {
		expandedIndex.value = expandedIndex.value === index ? null : index;
	}
	return {
		updateType,
		updateColor,
		handleRemove,
		adjustExpandedAfterRemove,
		toggleExpand
	};
}
//#endregion
export { EFFECT_OPTIONS, createDefaultEffect, createEffectControlActions, createEffectEditActions, isShadow };

//# sourceMappingURL=helpers.js.map
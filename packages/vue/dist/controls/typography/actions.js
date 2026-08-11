import { useSceneComputed } from "../appearance/helpers.js";
import { computed } from "vue";
import { DEFAULT_FONT_FAMILY } from "@open-pencil/core/constants";
import { FONT_WEIGHT_NAMES, fontManager, weightToStyle } from "@open-pencil/core/text";
//#region src/shared/font-status/use.ts
/**
* Returns missing-font information for a text node getter.
*
* This is useful for typography panels and warnings that need to surface fonts
* that are referenced by a node but not yet loaded in the current runtime.
*/
function useNodeFontStatus(node) {
	const missingFonts = computed(() => {
		const n = node();
		if (n?.type !== "TEXT") return [];
		const families = /* @__PURE__ */ new Set();
		families.add(n.fontFamily || DEFAULT_FONT_FAMILY);
		for (const run of n.styleRuns) if (run.style.fontFamily) families.add(run.style.fontFamily);
		return [...families].filter((f) => !fontManager.isLoaded(f));
	});
	return {
		missingFonts,
		hasMissingFonts: computed(() => missingFonts.value.length > 0)
	};
}
//#endregion
//#region src/controls/typography/actions.ts
const TYPOGRAPHY_WEIGHTS = Object.entries(FONT_WEIGHT_NAMES).map(([value, label]) => ({
	value: Number(value),
	label
}));
function createTypographyState(editor) {
	const node = useSceneComputed(() => editor.getSelectedNode() ?? null);
	const { missingFonts, hasMissingFonts } = useNodeFontStatus(() => node.value);
	return {
		node,
		fontFamily: computed(() => node.value?.fontFamily ?? ""),
		fontWeight: computed(() => node.value?.fontWeight ?? 400),
		fontSize: computed(() => node.value?.fontSize ?? 16),
		currentWeightLabel: computed(() => FONT_WEIGHT_NAMES[node.value?.fontWeight ?? 400] ?? "Regular"),
		activeFormatting: computed(() => {
			const n = node.value;
			if (!n) return [];
			const result = [];
			if (n.fontWeight >= 700) result.push("bold");
			if (n.italic) result.push("italic");
			if (n.textDecoration === "UNDERLINE") result.push("underline");
			if (n.textDecoration === "STRIKETHROUGH") result.push("strikethrough");
			return result;
		}),
		missingFonts,
		hasMissingFonts
	};
}
function createTypographyActions({ editor, node, currentWeightLabel, activeFormatting, options }) {
	let propBeforePreview;
	async function doLoadFont(family, style) {
		await options.fontLoader?.load(family, style);
	}
	async function setFamily(family) {
		if (!node.value) return;
		await doLoadFont(family, currentWeightLabel.value);
		editor.updateNodeWithUndo(node.value.id, { fontFamily: family }, "Change font");
	}
	async function setWeight(weight) {
		if (!node.value) return;
		const { id, fontFamily } = node.value;
		const style = weightToStyle(weight);
		editor.updateNodeWithUndo(id, { fontWeight: weight }, "Change font weight");
		await doLoadFont(fontFamily, style);
	}
	function setAlign(align) {
		if (!node.value) return;
		editor.updateNodeWithUndo(node.value.id, { textAlignHorizontal: align }, "Change text alignment");
	}
	function setDirection(direction) {
		if (!node.value) return;
		editor.updateNodeWithUndo(node.value.id, { textDirection: direction }, "Change text direction");
	}
	function setVerticalAlign(align) {
		if (!node.value) return;
		editor.updateNodeWithUndo(node.value.id, { textAlignVertical: align }, "Change vertical text alignment");
	}
	function setTextCase(textCase) {
		if (!node.value) return;
		editor.updateNodeWithUndo(node.value.id, { textCase }, "Change text case");
	}
	function setTruncation(textTruncation) {
		if (!node.value) return;
		editor.updateNodeWithUndo(node.value.id, { textTruncation }, "Change text truncation");
	}
	function setFontFeature(tag, enabled) {
		if (!node.value) return;
		const fontFeatures = node.value.fontFeatures.filter((feature) => feature.tag !== tag);
		fontFeatures.push({
			tag,
			enabled
		});
		editor.updateNodeWithUndo(node.value.id, { fontFeatures }, `Change ${tag} feature`);
	}
	function toggleBold() {
		if (!node.value) return;
		setWeight(node.value.fontWeight >= 700 ? 400 : 700);
	}
	function toggleItalic() {
		if (!node.value) return;
		editor.updateNodeWithUndo(node.value.id, { italic: !node.value.italic }, "Toggle italic");
	}
	function toggleDecoration(deco) {
		if (!node.value) return;
		const current = node.value.textDecoration;
		editor.updateNodeWithUndo(node.value.id, { textDecoration: current === deco ? "NONE" : deco }, `Toggle ${deco.toLowerCase()}`);
	}
	function onFormattingChange(values) {
		if (!node.value) return;
		const prev = activeFormatting.value;
		const added = values.filter((v) => !prev.includes(v));
		const removed = prev.filter((v) => !values.includes(v));
		for (const item of [...added, ...removed]) if (item === "bold") toggleBold();
		else if (item === "italic") toggleItalic();
		else if (item === "underline") toggleDecoration("UNDERLINE");
		else if (item === "strikethrough") toggleDecoration("STRIKETHROUGH");
	}
	function updateProp(key, value) {
		if (!node.value) return;
		if (!propBeforePreview || propBeforePreview.key !== key) propBeforePreview = {
			key,
			value: node.value[key],
			textStyleId: node.value.textStyleId
		};
		editor.updateNode(node.value.id, { [key]: value });
	}
	function commitProp(key, _value, previous) {
		if (!node.value) return;
		const snapshot = propBeforePreview?.key === key ? propBeforePreview : void 0;
		editor.commitNodeUpdate(node.value.id, {
			[key]: snapshot ? snapshot.value : previous,
			...snapshot ? { textStyleId: snapshot.textStyleId } : {}
		}, `Change ${String(key)}`);
		propBeforePreview = void 0;
	}
	return {
		setFamily,
		setWeight,
		setAlign,
		setDirection,
		setVerticalAlign,
		setTextCase,
		setTruncation,
		setFontFeature,
		toggleBold,
		toggleItalic,
		toggleDecoration,
		onFormattingChange,
		updateProp,
		commitProp
	};
}
//#endregion
export { TYPOGRAPHY_WEIGHTS, createTypographyActions, createTypographyState, useNodeFontStatus };

//# sourceMappingURL=actions.js.map
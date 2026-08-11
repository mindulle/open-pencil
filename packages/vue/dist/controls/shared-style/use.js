import { useNodeProps, useSceneComputed } from "../appearance/helpers.js";
import { sharedStyleDetachPatch, sharedStylePatch } from "./model.js";
import { computed } from "vue";
import { getSharedStyles, sharedStyleRefKey, sharedStyleTypeForKind } from "@open-pencil/scene-graph";
//#region src/controls/shared-style/use.ts
function supportsStyle(node, kind) {
	if (kind === "text") return node.type === "TEXT";
	if (kind === "grid") return node.type === "FRAME" || node.type === "COMPONENT" || node.type === "COMPONENT_SET" || node.type === "INSTANCE";
	return node.type !== "CANVAS";
}
function useSharedStyleBinding(kind) {
	const { store, nodes, merged } = useNodeProps();
	const refKey = sharedStyleRefKey(kind);
	const active = computed(() => nodes.value.length > 0 && nodes.value.every((node) => supportsStyle(node, kind)));
	const styleId = computed(() => merged(refKey));
	const styles = useSceneComputed(() => {
		store.state.sceneVersion;
		return getSharedStyles(store.graph, kind);
	});
	function update(label, apply) {
		if (!active.value) return;
		const targets = nodes.value;
		const run = () => {
			for (const node of targets) store.updateNodeWithUndo(node.id, apply(node), label);
		};
		if (targets.length > 1) store.undo.runBatch(label, run);
		else run();
	}
	function bind(nextStyleId) {
		const styleInfo = styles.value.find((style) => style.id === nextStyleId);
		const styleNode = styleInfo ? store.graph.getNode(styleInfo.nodeId) ?? null : null;
		if (styleNode?.sharedStyleType !== sharedStyleTypeForKind(kind)) return;
		update(`Apply ${kind} style`, (node) => sharedStylePatch(kind, node, nextStyleId, styleNode));
	}
	function unbind() {
		update(`Detach ${kind} style`, () => sharedStyleDetachPatch(kind));
	}
	return {
		kind,
		active,
		styleId,
		styles,
		bind,
		unbind
	};
}
//#endregion
export { useSharedStyleBinding };

//# sourceMappingURL=use.js.map
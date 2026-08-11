import { randomHex } from "../random.js";
import { createComponentFocusActions } from "./components/focus.js";
import { createComponentInstanceActions } from "./components/instances.js";
import { createComponentPropertyActions } from "./components/properties.js";
import { createVariantActions } from "./components/variants.js";
//#region src/editor/components.ts
function createComponentActions(ctx) {
	function createComponentFromSelection(selectedNodes, wrapSelectionInContainer) {
		if (selectedNodes.length === 0) return;
		const prevSelection = new Set(ctx.state.selectedIds);
		if (selectedNodes.length === 1) {
			const node = selectedNodes[0];
			const prevType = node.type;
			if (node.type === "COMPONENT") return;
			if (node.type === "FRAME" || node.type === "GROUP") {
				ctx.graph.updateNode(node.id, { type: "COMPONENT" });
				ctx.setSelectedIds(/* @__PURE__ */ new Set([node.id]));
				ctx.undo.push({
					label: "Create component",
					forward: () => {
						ctx.graph.updateNode(node.id, { type: "COMPONENT" });
						ctx.setSelectedIds(/* @__PURE__ */ new Set([node.id]));
					},
					inverse: () => {
						ctx.graph.updateNode(node.id, { type: prevType });
						ctx.setSelectedIds(prevSelection);
					}
				});
				return;
			}
		}
		wrapSelectionInContainer("COMPONENT", selectedNodes);
	}
	function createComponentSetFromComponents(selectedNodes, wrapSelectionInContainer) {
		if (selectedNodes.length < 2) return;
		if (!selectedNodes.every((n) => n.type === "COMPONENT")) return;
		const containerId = wrapSelectionInContainer("COMPONENT_SET", selectedNodes);
		if (!containerId) return;
		const slashCounts = selectedNodes.map((n) => (n.name.match(/\//g) ?? []).length);
		if (slashCounts.every((c) => c === slashCounts[0]) && slashCounts[0] > 0) {
			const propCount = slashCounts[0];
			const propDefs = [];
			const propValues = /* @__PURE__ */ new Map();
			for (let i = 0; i < propCount; i++) {
				const propId = `prop:${randomHex(8)}`;
				const propName = i === 0 ? "Variant" : `Property ${i + 1}`;
				propDefs.push({
					id: propId,
					name: propName,
					type: "VARIANT",
					defaultValue: ""
				});
				propValues.set(propName, /* @__PURE__ */ new Set());
			}
			for (const node of selectedNodes) {
				const parts = node.name.split("/").slice(1);
				const values = {};
				for (let i = 0; i < propDefs.length; i++) {
					const value = parts[i]?.trim() ?? "";
					values[propDefs[i].name] = value;
					propValues.get(propDefs[i].name)?.add(value);
				}
				ctx.graph.updateNode(node.id, {
					componentPropertyValues: values,
					name: Object.values(values).join(", ")
				});
			}
			for (const def of propDefs) {
				def.variantOptions = [...propValues.get(def.name) ?? []];
				if (!def.defaultValue && def.variantOptions[0]) def.defaultValue = def.variantOptions[0];
			}
			ctx.graph.updateNode(containerId, { componentPropertyDefinitions: propDefs });
		}
	}
	const focusActions = createComponentFocusActions(ctx);
	const instanceActions = createComponentInstanceActions(ctx);
	const variantActions = createVariantActions(ctx);
	const componentPropertyActions = createComponentPropertyActions(ctx, variantActions.switchInstanceVariant);
	return {
		createComponentFromSelection,
		createComponentSetFromComponents,
		...instanceActions,
		...focusActions,
		...variantActions,
		...componentPropertyActions
	};
}
//#endregion
export { createComponentActions };

//# sourceMappingURL=components.js.map
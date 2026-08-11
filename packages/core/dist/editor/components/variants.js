import { randomHex } from "../../random.js";
import { reapplyInstanceComponentProperties } from "./properties.js";
import { omit } from "es-toolkit/object";
import { buildVariantName, parseVariantName } from "@open-pencil/scene-graph/variant-name";
//#region src/editor/components/variants.ts
function sortByCanvasPosition(a, b) {
	return a.y - b.y || a.x - b.x || a.name.localeCompare(b.name);
}
function createVariantActions(ctx) {
	function getComponentSetPropertyDefs(componentSetId) {
		const node = ctx.graph.getNode(componentSetId);
		if (node?.type !== "COMPONENT_SET") return [];
		return node.componentPropertyDefinitions;
	}
	function addPropertyDefinition(componentSetId, name, type = "VARIANT", defaultValue = "") {
		const node = ctx.graph.getNode(componentSetId);
		if (node?.type !== "COMPONENT_SET") return void 0;
		const id = `prop:${randomHex(8)}`;
		const def = {
			id,
			name,
			type,
			defaultValue,
			variantOptions: type === "VARIANT" ? [defaultValue] : void 0
		};
		const prevDefs = [...node.componentPropertyDefinitions];
		ctx.graph.updateNode(componentSetId, { componentPropertyDefinitions: [...prevDefs, def] });
		ctx.undo.push({
			label: "Add property",
			forward: () => {
				const n = ctx.graph.getNode(componentSetId);
				if (n) ctx.graph.updateNode(componentSetId, { componentPropertyDefinitions: [...n.componentPropertyDefinitions, def] });
				ctx.requestRender();
			},
			inverse: () => {
				ctx.graph.updateNode(componentSetId, { componentPropertyDefinitions: prevDefs });
				ctx.requestRender();
			}
		});
		ctx.requestRender();
		return id;
	}
	function removePropertyDefinition(componentSetId, propertyId) {
		const node = ctx.graph.getNode(componentSetId);
		if (node?.type !== "COMPONENT_SET") return;
		const prevDefs = [...node.componentPropertyDefinitions];
		const def = prevDefs.find((d) => d.id === propertyId);
		if (!def) return;
		ctx.graph.updateNode(componentSetId, { componentPropertyDefinitions: prevDefs.filter((d) => d.id !== propertyId) });
		for (const childId of node.childIds) {
			const child = ctx.graph.getNode(childId);
			if (!child) continue;
			const values = omit(child.componentPropertyValues, [def.name]);
			ctx.graph.updateNode(childId, { componentPropertyValues: values });
		}
		ctx.undo.push({
			label: "Remove property",
			forward: () => {
				const n = ctx.graph.getNode(componentSetId);
				if (n) {
					ctx.graph.updateNode(componentSetId, { componentPropertyDefinitions: n.componentPropertyDefinitions.filter((d) => d.id !== propertyId) });
					for (const cid of n.childIds) {
						const c = ctx.graph.getNode(cid);
						if (!c) continue;
						const v = omit(c.componentPropertyValues, [def.name]);
						ctx.graph.updateNode(cid, { componentPropertyValues: v });
					}
				}
				ctx.requestRender();
			},
			inverse: () => {
				ctx.graph.updateNode(componentSetId, { componentPropertyDefinitions: prevDefs });
				ctx.requestRender();
			}
		});
		ctx.requestRender();
	}
	function renamePropertyDefinition(componentSetId, propertyId, newName) {
		const node = ctx.graph.getNode(componentSetId);
		if (node?.type !== "COMPONENT_SET") return;
		const def = node.componentPropertyDefinitions.find((d) => d.id === propertyId);
		if (!def) return;
		const prevName = def.name;
		const newDefs = node.componentPropertyDefinitions.map((d) => d.id === propertyId ? {
			...d,
			name: newName
		} : d);
		ctx.graph.updateNode(componentSetId, { componentPropertyDefinitions: newDefs });
		for (const childId of node.childIds) {
			const child = ctx.graph.getNode(childId);
			if (!child) continue;
			const values = { ...child.componentPropertyValues };
			if (prevName in values) {
				const nextValues = omit(values, [prevName]);
				nextValues[newName] = values[prevName];
				ctx.graph.updateNode(childId, { componentPropertyValues: nextValues });
			}
		}
		const renamePropertyDef = (name) => {
			const n = ctx.graph.getNode(componentSetId);
			if (!n) return;
			ctx.graph.updateNode(componentSetId, { componentPropertyDefinitions: n.componentPropertyDefinitions.map((d) => d.id === propertyId ? {
				...d,
				name
			} : d) });
			ctx.requestRender();
		};
		ctx.undo.push({
			label: "Rename property",
			forward: () => renamePropertyDef(newName),
			inverse: () => renamePropertyDef(prevName)
		});
		ctx.requestRender();
	}
	function collectVariantOptions(componentSetId) {
		const node = ctx.graph.getNode(componentSetId);
		if (node?.type !== "COMPONENT_SET") return /* @__PURE__ */ new Map();
		const options = /* @__PURE__ */ new Map();
		for (const childId of node.childIds) {
			const child = ctx.graph.getNode(childId);
			if (child?.type !== "COMPONENT") continue;
			for (const [key, value] of Object.entries(child.componentPropertyValues)) {
				const set = options.get(key) ?? /* @__PURE__ */ new Set();
				set.add(value);
				options.set(key, set);
			}
		}
		return options;
	}
	function getComponentSetVariants(componentSetId) {
		const node = ctx.graph.getNode(componentSetId);
		if (node?.type !== "COMPONENT_SET") return [];
		return node.childIds.map((id) => ctx.graph.getNode(id)).filter((child) => child?.type === "COMPONENT");
	}
	function findVariantByValues(componentSetId, values) {
		for (const child of getComponentSetVariants(componentSetId).sort(sortByCanvasPosition)) {
			const childValues = child.componentPropertyValues;
			if (Object.entries(values).every(([k, v]) => childValues[k] === v)) return child;
		}
	}
	function getDefaultVariantForComponentSet(componentSetId) {
		const node = ctx.graph.getNode(componentSetId);
		if (node?.type !== "COMPONENT_SET") return void 0;
		const defaultValues = Object.fromEntries(node.componentPropertyDefinitions.filter((def) => def.type === "VARIANT" && def.defaultValue).map((def) => [def.name, def.defaultValue]));
		if (Object.keys(defaultValues).length > 0) {
			const explicitDefault = findVariantByValues(componentSetId, defaultValues);
			if (explicitDefault) return explicitDefault;
		}
		return getComponentSetVariants(componentSetId).sort(sortByCanvasPosition)[0];
	}
	function getComponentSetVariantConflicts(componentSetId) {
		const node = ctx.graph.getNode(componentSetId);
		if (node?.type !== "COMPONENT_SET") return [];
		const propNames = node.componentPropertyDefinitions.filter((def) => def.type === "VARIANT").map((def) => def.name);
		const byKey = /* @__PURE__ */ new Map();
		for (const variant of getComponentSetVariants(componentSetId)) {
			const values = Object.fromEntries(propNames.map((name) => [name, variant.componentPropertyValues[name] ?? ""]));
			const key = propNames.map((name) => `${name}=${values[name]}`).join("\0");
			const entry = byKey.get(key) ?? {
				values,
				componentIds: []
			};
			entry.componentIds.push(variant.id);
			byKey.set(key, entry);
		}
		return [...byKey.values()].filter((entry) => entry.componentIds.length > 1);
	}
	function switchInstanceVariant(instanceId, propertyName, newValue) {
		const instance = ctx.graph.getNode(instanceId);
		if (instance?.type !== "INSTANCE" || !instance.componentId) return;
		const component = ctx.graph.getNode(instance.componentId);
		if (!component) return;
		const componentSetId = component.parentId;
		if (!componentSetId) return;
		if (ctx.graph.getNode(componentSetId)?.type !== "COMPONENT_SET") return;
		const currentValues = { ...component.componentPropertyValues };
		currentValues[propertyName] = newValue;
		const target = findVariantByValues(componentSetId, currentValues);
		if (!target || target.id === instance.componentId) return;
		const prevComponentId = instance.componentId;
		ctx.graph.swapInstanceComponent(instanceId, target.id);
		reapplyInstanceComponentProperties(ctx, instanceId);
		ctx.undo.push({
			label: "Switch variant",
			forward: () => {
				ctx.graph.swapInstanceComponent(instanceId, target.id);
				reapplyInstanceComponentProperties(ctx, instanceId);
				ctx.requestRender();
			},
			inverse: () => {
				ctx.graph.swapInstanceComponent(instanceId, prevComponentId);
				reapplyInstanceComponentProperties(ctx, instanceId);
				ctx.requestRender();
			}
		});
		ctx.requestRender();
	}
	return {
		getComponentSetPropertyDefs,
		addPropertyDefinition,
		removePropertyDefinition,
		renamePropertyDefinition,
		parseVariantName,
		buildVariantName,
		collectVariantOptions,
		findVariantByValues,
		getDefaultVariantForComponentSet,
		getComponentSetVariantConflicts,
		switchInstanceVariant
	};
}
//#endregion
export { createVariantActions };

//# sourceMappingURL=variants.js.map
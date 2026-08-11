//#region src/editor/components/properties.ts
function definitionOwners(ctx, instance) {
	if (!instance.componentId) return [];
	const component = ctx.graph.getNode(instance.componentId);
	if (!component) return [];
	const parent = component.parentId ? ctx.graph.getNode(component.parentId) : null;
	return parent?.type === "COMPONENT_SET" ? [parent, component] : [component];
}
function definitionsForInstance(ctx, instance) {
	const byId = /* @__PURE__ */ new Map();
	for (const owner of definitionOwners(ctx, instance)) for (const definition of owner.componentPropertyDefinitions) if (!byId.has(definition.id)) byId.set(definition.id, definition);
	return [...byId.values()];
}
function findPropertyPath(ctx, sourceParent, propertyId, path = []) {
	for (const [index, childId] of sourceParent.childIds.entries()) {
		const child = ctx.graph.getNode(childId);
		if (!child) continue;
		const reference = child.componentPropertyReferences.find((ref) => ref.propertyId === propertyId);
		if (reference) return {
			path: [...path, index],
			field: reference.field,
			source: child
		};
		const nested = findPropertyPath(ctx, child, propertyId, [...path, index]);
		if (nested) return nested;
	}
	return null;
}
function nodeAtPath(ctx, root, path) {
	let node = root;
	for (const index of path) {
		const childId = node.childIds[index];
		const child = childId ? ctx.graph.getNode(childId) : void 0;
		if (!child) return null;
		node = child;
	}
	return node;
}
function propertyTarget(ctx, instance, propertyId) {
	const component = instance.componentId ? ctx.graph.getNode(instance.componentId) : null;
	if (!component) return null;
	const match = findPropertyPath(ctx, component, propertyId);
	if (!match) return null;
	const node = nodeAtPath(ctx, instance, match.path);
	return node ? {
		node,
		field: match.field,
		source: match.source
	} : null;
}
function swapTargetId(ctx, value) {
	const direct = ctx.graph.getNode(value);
	if (direct?.type === "COMPONENT") return direct.id;
	for (const node of ctx.graph.getAllNodes()) {
		if (node.type !== "COMPONENT") continue;
		if (node.source.id === value || node.componentKey === value || node.sourceLibraryKey === value) return node.id;
	}
	return null;
}
function targetValue(target) {
	if (!target) return "";
	if (target.field === "TEXT") return target.node.text;
	if (target.field === "VISIBLE") return String(target.node.visible);
	return target.source.componentId ?? target.node.componentId ?? "";
}
function propertyOverrides(ctx, instance, target, value, swapComponentId) {
	const overrides = { ...instance.overrides };
	if (target?.field === "TEXT") overrides[`${target.node.id}:text`] = value;
	else if (target?.field === "VISIBLE") overrides[`${target.node.id}:visible`] = value === "true";
	else if (target?.field === "INSTANCE_SWAP") {
		overrides[`${target.node.id}:componentId`] = value;
		overrides[`${target.node.id}:sourceComponentId`] = target.source.id;
		const componentName = swapComponentId ? ctx.graph.getNode(swapComponentId)?.name : void 0;
		if (componentName) overrides[`${target.node.id}:name`] = componentName;
	}
	return overrides;
}
function updatePropertyTarget(ctx, target, value, swapComponentId) {
	if (target?.field === "TEXT" && target.node.type === "TEXT") ctx.graph.updateNode(target.node.id, { text: value });
	else if (target?.field === "VISIBLE") ctx.graph.updateNode(target.node.id, { visible: value === "true" });
	else if (target?.field === "INSTANCE_SWAP" && target.node.type === "INSTANCE" && swapComponentId) ctx.graph.swapInstanceComponent(target.node.id, swapComponentId);
}
function applyPropertyValue(ctx, instanceId, definition, value) {
	const instance = ctx.graph.getNode(instanceId);
	if (instance?.type !== "INSTANCE") return;
	const target = propertyTarget(ctx, instance, definition.id);
	const swapComponentId = target?.field === "INSTANCE_SWAP" ? swapTargetId(ctx, value) : null;
	ctx.graph.updateNode(instance.id, {
		componentPropertyAssignments: {
			...instance.componentPropertyAssignments,
			[definition.id]: value
		},
		overrides: propertyOverrides(ctx, instance, target, value, swapComponentId)
	});
	updatePropertyTarget(ctx, target, value, swapComponentId);
}
function reapplyInstanceComponentProperties(ctx, instanceId) {
	const instance = ctx.graph.getNode(instanceId);
	if (instance?.type !== "INSTANCE") return;
	const definitions = new Map(definitionsForInstance(ctx, instance).map((definition) => [definition.id, definition]));
	for (const [propertyId, value] of Object.entries(instance.componentPropertyAssignments)) {
		const definition = definitions.get(propertyId);
		if (definition && definition.type !== "VARIANT") applyPropertyValue(ctx, instanceId, definition, value);
	}
}
function createComponentPropertyActions(ctx, switchVariant) {
	function getInstanceComponentPropertyDefinitions(instanceId) {
		const instance = ctx.graph.getNode(instanceId);
		return instance?.type === "INSTANCE" ? definitionsForInstance(ctx, instance) : [];
	}
	function getInstanceComponentPropertyValue(instanceId, definition) {
		const instance = ctx.graph.getNode(instanceId);
		if (instance?.type !== "INSTANCE") return definition.defaultValue;
		if (definition.type === "VARIANT") return (instance.componentId ? ctx.graph.getNode(instance.componentId) : null)?.componentPropertyValues[definition.name] ?? definition.defaultValue;
		const value = instance.componentPropertyAssignments[definition.id] ?? definition.defaultValue;
		return definition.type === "INSTANCE_SWAP" ? swapTargetId(ctx, value) ?? value : value;
	}
	function setInstanceComponentProperty(instanceId, propertyId, value) {
		const instance = ctx.graph.getNode(instanceId);
		if (instance?.type !== "INSTANCE") return;
		const definition = definitionsForInstance(ctx, instance).find((item) => item.id === propertyId);
		if (!definition) return;
		if (definition.type === "VARIANT") {
			switchVariant(instanceId, definition.name, value);
			return;
		}
		const previousAssignments = { ...instance.componentPropertyAssignments };
		const previousOverrides = structuredClone(instance.overrides);
		const target = propertyTarget(ctx, instance, propertyId);
		const assignedValue = instance.componentPropertyAssignments[propertyId];
		const previousValue = definition.type === "INSTANCE_SWAP" && assignedValue ? swapTargetId(ctx, assignedValue) ?? assignedValue : targetValue(target);
		applyPropertyValue(ctx, instanceId, definition, value);
		ctx.undo.push({
			label: `Change ${definition.name}`,
			forward: () => {
				applyPropertyValue(ctx, instanceId, definition, value);
				ctx.requestRender();
			},
			inverse: () => {
				const live = ctx.graph.getNode(instanceId);
				if (live) {
					ctx.graph.updateNode(instanceId, {
						componentPropertyAssignments: previousAssignments,
						overrides: previousOverrides
					});
					const restoredTarget = propertyTarget(ctx, live, propertyId);
					if (restoredTarget?.field === "TEXT" && restoredTarget.node.type === "TEXT") ctx.graph.updateNode(restoredTarget.node.id, { text: previousValue });
					else if (restoredTarget?.field === "VISIBLE") ctx.graph.updateNode(restoredTarget.node.id, { visible: previousValue === "true" });
					else if (restoredTarget?.field === "INSTANCE_SWAP") {
						const componentId = swapTargetId(ctx, previousValue);
						if (componentId && restoredTarget.node.type === "INSTANCE") ctx.graph.swapInstanceComponent(restoredTarget.node.id, componentId);
					}
				}
				ctx.requestRender();
			}
		});
		ctx.requestRender();
	}
	return {
		getInstanceComponentPropertyDefinitions,
		getInstanceComponentPropertyValue,
		reapplyInstanceComponentProperties: (instanceId) => reapplyInstanceComponentProperties(ctx, instanceId),
		setInstanceComponentProperty
	};
}
//#endregion
export { createComponentPropertyActions, reapplyInstanceComponentProperties };

//# sourceMappingURL=properties.js.map
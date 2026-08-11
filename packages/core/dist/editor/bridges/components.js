//#region src/editor/bridges/components.ts
function createComponentBridge(components, selection, structure, pages) {
	return {
		createComponentFromSelection: () => components.createComponentFromSelection(selection.getSelectedNodes(), structure.wrapSelectionInContainer),
		createComponentSetFromComponents: () => components.createComponentSetFromComponents(selection.getSelectedNodes(), structure.wrapSelectionInContainer),
		createInstanceFromComponent: components.createInstanceFromComponent,
		detachInstance: () => components.detachInstance(selection.getSelectedNode()),
		focusComponent: (componentId) => components.focusComponent(componentId, pages.switchPage),
		goToMainComponent: () => components.goToMainComponent(selection.getSelectedNode(), pages.switchPage),
		getComponentSetPropertyDefs: components.getComponentSetPropertyDefs,
		addPropertyDefinition: components.addPropertyDefinition,
		removePropertyDefinition: components.removePropertyDefinition,
		renamePropertyDefinition: components.renamePropertyDefinition,
		collectVariantOptions: components.collectVariantOptions,
		findVariantByValues: components.findVariantByValues,
		getDefaultVariantForComponentSet: components.getDefaultVariantForComponentSet,
		getComponentSetVariantConflicts: components.getComponentSetVariantConflicts,
		switchInstanceVariant: components.switchInstanceVariant,
		getInstanceComponentPropertyDefinitions: components.getInstanceComponentPropertyDefinitions,
		getInstanceComponentPropertyValue: components.getInstanceComponentPropertyValue,
		setInstanceComponentProperty: components.setInstanceComponentProperty
	};
}
//#endregion
export { createComponentBridge };

//# sourceMappingURL=components.js.map
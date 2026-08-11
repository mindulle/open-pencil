//#region src/editor/menu-model/canvas.ts
const CANVAS_MENU_GROUPS = [
	["selection.duplicate", "selection.delete"],
	[
		"selection.moveToPageWhenAvailable",
		"selection.bringForward",
		"selection.bringToFront",
		"selection.sendBackward",
		"selection.sendToBack"
	],
	[
		"selection.group",
		"selection.frameSelection",
		"selection.ungroupWhenGroup",
		"selection.wrapInAutoLayout",
		"selection.toggleMask",
		"selection.flatten",
		"selection.outlineText",
		"selection.outlineStroke"
	],
	[
		"selection.componentAction",
		"selection.componentSetAction",
		"selection.instanceActions"
	],
	["selection.toggleVisibility", "selection.toggleLock"],
	["selection.flipHorizontal", "selection.flipVertical"]
];
function separator() {
	return { separator: true };
}
function moveToPageItem({ otherPages, moveSelectionToPage, selection, t }) {
	if (!selection.hasSelection.value || otherPages.length === 0) return [];
	const sub = otherPages.map((page) => ({
		label: page.name,
		action: () => moveSelectionToPage(page.id)
	}));
	return [{
		label: t.moveToPage,
		sub
	}];
}
function componentItems({ commandMenuItem, selection }) {
	return [selection.isComponent.value ? commandMenuItem("selection.createInstance") : commandMenuItem("selection.createComponent")];
}
function componentSetItems({ commandMenuItem, selection }) {
	return selection.canCreateComponentSet.value ? [commandMenuItem("selection.createComponentSet")] : [];
}
function instanceItems({ commandMenuItem, selection }) {
	return selection.isInstance.value ? [commandMenuItem("selection.goToMainComponent"), commandMenuItem("selection.detachInstance")] : [];
}
function conditionalCommand(command, options) {
	switch (command) {
		case "selection.moveToPageWhenAvailable": return moveToPageItem(options);
		case "selection.componentAction": return componentItems(options);
		case "selection.componentSetAction": return componentSetItems(options);
		case "selection.instanceActions": return instanceItems(options);
		case "selection.ungroupWhenGroup": return options.selection.isGroup.value ? [options.commandMenuItem("selection.ungroup")] : [];
		default: return [options.commandMenuItem(command)];
	}
}
function buildCanvasContextMenu(options) {
	const entries = [];
	for (const group of CANVAS_MENU_GROUPS) {
		const groupEntries = group.flatMap((command) => conditionalCommand(command, options));
		if (groupEntries.length === 0) continue;
		if (entries.length > 0) entries.push(separator());
		entries.push(...groupEntries);
	}
	return entries;
}
//#endregion
export { buildCanvasContextMenu };

//# sourceMappingURL=canvas.js.map
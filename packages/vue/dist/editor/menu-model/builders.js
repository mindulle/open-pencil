//#region src/editor/menu-model/command-groups.ts
const EDIT_MENU_COMMAND_GROUPS = [
	["edit.undo", "edit.redo"],
	["selection.duplicate", "selection.delete"],
	["selection.selectAll"]
];
const VIEW_MENU_COMMANDS = [
	"view.zoom100",
	"view.zoomFit",
	"view.zoomSelection"
];
const OBJECT_MENU_COMMAND_GROUPS = [
	["selection.group", "selection.ungroup"],
	[
		"selection.createComponent",
		"selection.createComponentSet",
		"selection.detachInstance"
	],
	["selection.bringToFront", "selection.sendToBack"]
];
//#endregion
//#region src/editor/menu-model/builders.ts
function commandGroupEntries(commandMenuItem, groups) {
	const entries = [];
	for (const [index, group] of groups.entries()) {
		if (index > 0) entries.push({ separator: true });
		entries.push(...group.map((id) => commandMenuItem(id)));
	}
	return entries;
}
function buildEditMenu(commandMenuItem) {
	return commandGroupEntries(commandMenuItem, EDIT_MENU_COMMAND_GROUPS);
}
function buildViewMenu(commandMenuItem) {
	return VIEW_MENU_COMMANDS.map((id) => commandMenuItem(id));
}
function buildObjectMenu(commandMenuItem) {
	return commandGroupEntries(commandMenuItem, OBJECT_MENU_COMMAND_GROUPS);
}
//#endregion
export { buildEditMenu, buildObjectMenu, buildViewMenu };

//# sourceMappingURL=builders.js.map
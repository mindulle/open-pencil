//#region src/editor/commands/registry.ts
const EDITOR_COMMAND_METADATA = {
	"edit.undo": {
		shortcut: "MOD+Z",
		keybinding: "$mod+KeyZ"
	},
	"edit.redo": {
		shortcut: "MOD+SHIFT+Z",
		keybinding: ["$mod+Shift+KeyZ", "$mod+KeyY"]
	},
	"selection.selectAll": {
		shortcut: "MOD+A",
		keybinding: "$mod+KeyA"
	},
	"selection.selectInverse": {
		shortcut: "MOD+SHIFT+A",
		keybinding: "$mod+Shift+KeyA"
	},
	"selection.duplicate": {
		shortcut: "MOD+D",
		keybinding: "$mod+KeyD",
		contextTestId: "context-duplicate"
	},
	"selection.delete": {
		shortcut: "⌫",
		contextTestId: "context-delete"
	},
	"selection.group": {
		shortcut: "MOD+G",
		keybinding: "$mod+KeyG",
		contextTestId: "context-group"
	},
	"selection.frameSelection": {
		shortcut: "MOD+ALT+G",
		keybinding: "$mod+Alt+KeyG",
		contextTestId: "context-frame-selection"
	},
	"selection.ungroup": {
		shortcut: "MOD+SHIFT+G",
		keybinding: "$mod+Shift+KeyG"
	},
	"selection.createComponent": {
		shortcut: "MOD+ALT+K",
		keybinding: "$mod+Alt+KeyK",
		contextTestId: "context-create-component"
	},
	"selection.createComponentSet": {
		shortcut: "MOD+SHIFT+K",
		keybinding: "$mod+Shift+KeyK"
	},
	"selection.detachInstance": {
		shortcut: "MOD+ALT+B",
		keybinding: "$mod+Alt+KeyB"
	},
	"selection.goToMainComponent": {},
	"selection.createInstance": {},
	"selection.wrapInAutoLayout": {
		shortcut: "SHIFT+A",
		keybinding: "Shift+KeyA"
	},
	"selection.toggleMask": {
		shortcut: "MOD+ALT+M",
		keybinding: ["Control+Meta+KeyM", "$mod+Alt+KeyM"],
		contextTestId: "context-toggle-mask"
	},
	"selection.bringForward": {
		shortcut: "MOD+]",
		keybinding: "$mod+BracketRight",
		contextTestId: "context-bring-forward"
	},
	"selection.bringToFront": {
		shortcut: "]",
		keybinding: "BracketRight",
		contextTestId: "context-bring-to-front"
	},
	"selection.sendBackward": {
		shortcut: "MOD+[",
		keybinding: "$mod+BracketLeft",
		contextTestId: "context-send-backward"
	},
	"selection.sendToBack": {
		shortcut: "[",
		keybinding: "BracketLeft",
		contextTestId: "context-send-to-back"
	},
	"selection.toggleVisibility": {
		shortcut: "MOD+SHIFT+H",
		keybinding: "$mod+Shift+KeyH",
		contextTestId: "context-toggle-visibility"
	},
	"selection.toggleLock": {
		shortcut: "MOD+SHIFT+L",
		keybinding: "$mod+Shift+KeyL",
		contextTestId: "context-toggle-lock"
	},
	"selection.flipHorizontal": {
		shortcut: "SHIFT+H",
		keybinding: "Shift+KeyH",
		contextTestId: "context-flip-horizontal"
	},
	"selection.flipVertical": {
		shortcut: "SHIFT+V",
		keybinding: "Shift+KeyV",
		contextTestId: "context-flip-vertical"
	},
	"selection.distributeHorizontal": {},
	"selection.distributeVertical": {},
	"selection.booleanUnion": {
		shortcut: "ALT+SHIFT+U",
		keybinding: "Alt+Shift+KeyU",
		contextTestId: "context-boolean-union"
	},
	"selection.booleanSubtract": {
		shortcut: "ALT+SHIFT+S",
		keybinding: "Alt+Shift+KeyS",
		contextTestId: "context-boolean-subtract"
	},
	"selection.booleanIntersect": {
		shortcut: "ALT+SHIFT+I",
		keybinding: "Alt+Shift+KeyI",
		contextTestId: "context-boolean-intersect"
	},
	"selection.booleanExclude": {
		shortcut: "ALT+SHIFT+E",
		keybinding: "Alt+Shift+KeyE",
		contextTestId: "context-boolean-exclude"
	},
	"selection.flatten": {
		shortcut: "ALT+SHIFT+F",
		keybinding: "Alt+Shift+KeyF",
		contextTestId: "context-flatten"
	},
	"selection.outlineText": { contextTestId: "context-outline-text" },
	"selection.outlineStroke": { contextTestId: "context-outline-stroke" },
	"selection.moveToPage": {},
	"selection.setOpacity": { shortcut: "1-9, 0" },
	"view.zoom100": { keybinding: "$mod+Digit0" },
	"view.zoomFit": { keybinding: ["$mod+Digit1", "Shift+Digit1"] },
	"view.zoomSelection": { keybinding: ["$mod+Digit2", "Shift+Digit2"] }
};
function editorCommandMetadata(id) {
	return EDITOR_COMMAND_METADATA[id];
}
//#endregion
//#region src/editor/commands/shortcut.ts
const MODIFIER_DISPLAY = {
	mac: {
		MOD: "⌘",
		SHIFT: "⇧",
		ALT: "⌥",
		CTRL: "⌃"
	},
	windows: {
		MOD: "Ctrl",
		SHIFT: "Shift",
		ALT: "Alt",
		CTRL: "Ctrl"
	},
	linux: {
		MOD: "Ctrl",
		SHIFT: "Shift",
		ALT: "Alt",
		CTRL: "Ctrl"
	}
};
const MAC_MODIFIER_ORDER = [
	"CTRL",
	"ALT",
	"SHIFT",
	"MOD"
];
const STANDARD_MODIFIER_ORDER = [
	"MOD",
	"CTRL",
	"ALT",
	"SHIFT"
];
function shortcutPlatform(userAgent = navigator.userAgent) {
	if (/Mac|iPhone|iPad|iPod/u.test(userAgent)) return "mac";
	if (/Win/u.test(userAgent)) return "windows";
	return "linux";
}
function sortModifiers(modifiers, platform) {
	const order = platform === "mac" ? MAC_MODIFIER_ORDER : STANDARD_MODIFIER_ORDER;
	return [...modifiers].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}
function formatShortcut(shortcut, platform = shortcutPlatform()) {
	if (!shortcut) return void 0;
	return shortcut.split(" ").map((combo) => {
		const parts = combo.split("+").filter(Boolean);
		const modifiers = parts.filter((part) => part in MODIFIER_DISPLAY[platform]);
		const keys = parts.filter((part) => !(part in MODIFIER_DISPLAY[platform]));
		const formattedModifiers = sortModifiers(modifiers, platform).map((part) => MODIFIER_DISPLAY[platform][part]);
		const separator = platform === "mac" ? "" : "+";
		return [...formattedModifiers, ...keys].join(separator);
	}).join(" ");
}
//#endregion
//#region src/editor/commands/actions.ts
function createEditorCommandActions(commands) {
	function getCommand(id) {
		return commands[id];
	}
	function runCommand(id) {
		const command = commands[id];
		if (command.enabled.value) command.run();
	}
	function menuItem(id, shortcut = editorCommandMetadata(id).shortcut) {
		const command = getCommand(id);
		return {
			id,
			label: command.label,
			shortcut: formatShortcut(shortcut),
			get disabled() {
				return !command.enabled.value;
			},
			action: () => runCommand(id)
		};
	}
	return {
		getCommand,
		runCommand,
		menuItem
	};
}
//#endregion
export { EDITOR_COMMAND_METADATA, createEditorCommandActions, editorCommandMetadata, formatShortcut, shortcutPlatform };

//# sourceMappingURL=actions.js.map
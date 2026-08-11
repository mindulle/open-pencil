//#region src/editor/tool-registry.ts
const EDITOR_TOOLS = [
	{
		key: "SELECT",
		label: "Move",
		shortcut: "V"
	},
	{
		key: "FRAME",
		label: "Frame",
		shortcut: "F",
		flyout: ["FRAME", "SECTION"]
	},
	{
		key: "RECTANGLE",
		label: "Rectangle",
		shortcut: "R",
		flyout: [
			"RECTANGLE",
			"LINE",
			"ELLIPSE",
			"POLYGON",
			"STAR"
		]
	},
	{
		key: "PEN",
		label: "Pen",
		shortcut: "P"
	},
	{
		key: "TEXT",
		label: "Text",
		shortcut: "T"
	},
	{
		key: "HAND",
		label: "Hand",
		shortcut: "H"
	}
];
const TOOL_SHORTCUTS = {
	KeyV: "SELECT",
	KeyF: "FRAME",
	KeyS: "SECTION",
	KeyR: "RECTANGLE",
	KeyO: "ELLIPSE",
	KeyL: "LINE",
	KeyT: "TEXT",
	KeyP: "PEN",
	KeyH: "HAND"
};
//#endregion
export { EDITOR_TOOLS, TOOL_SHORTCUTS };

//# sourceMappingURL=tool-registry.js.map
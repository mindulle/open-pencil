//#region src/layout/derived.ts
function usesDetachedDerivedLayout(child) {
	const derived = child.figmaDerivedLayout;
	if (!derived || child.layoutMode === "NONE" || child.layoutGrow > 0) return false;
	const isRow = child.layoutMode === "HORIZONTAL";
	const widthSizing = isRow ? child.primaryAxisSizing : child.counterAxisSizing;
	const heightSizing = isRow ? child.counterAxisSizing : child.primaryAxisSizing;
	return widthSizing === "HUG" && derived.width !== void 0 || heightSizing === "HUG" && derived.height !== void 0;
}
//#endregion
export { usesDetachedDerivedLayout };

//# sourceMappingURL=derived.js.map
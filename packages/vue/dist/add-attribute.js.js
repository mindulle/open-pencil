//#region ../../node_modules/.bun/@atlaskit+pragmatic-drag-and-drop@1.7.9/node_modules/@atlaskit/pragmatic-drag-and-drop/dist/esm/util/add-attribute.js
function addAttribute(element, _ref) {
	var attribute = _ref.attribute, value = _ref.value;
	element.setAttribute(attribute, value);
	return function() {
		return element.removeAttribute(attribute);
	};
}
//#endregion
export { addAttribute };

//# sourceMappingURL=add-attribute.js.js.map
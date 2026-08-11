//#region src/design-jsx/tree.ts
function isTreeNode(x) {
	if (x === null || typeof x !== "object") return false;
	return "type" in x && typeof x.type === "string" && "props" in x && "children" in x && Array.isArray(x.children);
}
function isReactElement(x) {
	return x !== null && typeof x === "object" && "type" in x && "props" in x;
}
/**
* Resolve any element-like value (ReactElement, TreeNode, function component)
* into a TreeNode. Handles recursive function components up to depth 100.
*/
function resolveToTree(element, depth = 0) {
	if (depth > 100) throw new Error("Component resolution depth exceeded");
	if (element == null) return null;
	if (isTreeNode(element)) return element;
	if (!isReactElement(element)) return null;
	if (typeof element.type === "function") {
		const component = element.type;
		return resolveToTree(component(element.props), depth + 1);
	}
	if (typeof element.type === "string") {
		const children = [];
		const elChildren = element.props.children;
		if (elChildren != null) {
			const childArray = Array.isArray(elChildren) ? elChildren : [elChildren];
			for (const child of childArray.flat()) {
				if (child == null) continue;
				if (typeof child === "string" || typeof child === "number") children.push(String(child));
				else {
					const resolved = resolveToTree(child, depth + 1);
					if (resolved) children.push(resolved);
				}
			}
		}
		const { children: _, ...props } = element.props;
		return {
			type: element.type,
			props,
			children
		};
	}
	return null;
}
function resolveChild(child) {
	if (child == null) return null;
	if (typeof child === "string" || typeof child === "number") return String(child);
	return resolveToTree(child);
}
function node(type, props) {
	const { children, ...rest } = props;
	return {
		type,
		props: rest,
		children: [children].flat(Infinity).map(resolveChild).filter((c) => c !== null)
	};
}
//#endregion
export { isTreeNode, node, resolveToTree };

//# sourceMappingURL=tree.js.map
//#region src/editor/structure/rename.ts
function defaultNodeName(type) {
	const words = type.toLowerCase().replaceAll("_", " ");
	return words.charAt(0).toUpperCase() + words.slice(1);
}
function numberedReplacement(replacement, index, count, startNumber) {
	const firstNumber = Number.isFinite(startNumber) ? Math.trunc(startNumber) : 1;
	return replacement.replace(/\$([nN]+)/g, (_token, digits) => {
		const number = digits[0] === "n" ? firstNumber + index : firstNumber + count - index - 1;
		return String(number).padStart(digits.length, "0");
	});
}
function previewRenamedNodes(nodes, options) {
	let pattern;
	try {
		pattern = options.match ? new RegExp(options.match) : /^.*$/;
	} catch {
		return {
			names: /* @__PURE__ */ new Map(),
			error: "invalid-pattern"
		};
	}
	const names = /* @__PURE__ */ new Map();
	nodes.forEach((node, index) => {
		const replacement = numberedReplacement(options.replacement, index, nodes.length, options.startNumber);
		const renamed = node.name.replace(pattern, replacement).trim();
		names.set(node.id, renamed || defaultNodeName(node.type));
	});
	return {
		names,
		error: null
	};
}
//#endregion
export { defaultNodeName, previewRenamedNodes };

//# sourceMappingURL=rename.js.map
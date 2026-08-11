import { omit } from "es-toolkit/object";
//#region src/bindings.ts
function removeStaleBindings(node, field, changes) {
	const length = node[field].length;
	const stale = Object.keys(node.boundVariables).filter((key) => {
		if (key === field) return true;
		if (!key.startsWith(`${field}/`)) return false;
		const index = Number.parseInt(key.split("/")[1] ?? "", 10);
		return Number.isNaN(index) || index < 0 || index >= length;
	});
	if (stale.length === 0) return;
	node.boundVariables = omit(node.boundVariables, stale);
	changes.boundVariables = { ...node.boundVariables };
}
//#endregion
export { removeStaleBindings };

//# sourceMappingURL=bindings.js.map
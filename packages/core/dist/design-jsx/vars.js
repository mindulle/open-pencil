//#region src/design-jsx/vars.ts
const VAR_SYMBOL = Symbol.for("open-pencil.variable");
function isVariable(value) {
	return typeof value === "object" && value !== null && VAR_SYMBOL in value;
}
function defineVars(vars) {
	const result = {};
	for (const [key, def] of Object.entries(vars)) result[key] = designVar(def);
	return result;
}
function designVar(def, value) {
	if (typeof def === "string") return {
		[VAR_SYMBOL]: true,
		id: def,
		name: def,
		value
	};
	return {
		[VAR_SYMBOL]: true,
		id: def.id,
		name: def.name ?? def.id ?? "",
		value: def.value
	};
}
//#endregion
export { defineVars, designVar, isVariable };

//# sourceMappingURL=vars.js.map
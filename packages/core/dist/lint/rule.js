//#region src/lint/rule.ts
function defineRule(definition) {
	return {
		meta: {
			severity: "warning",
			...definition.meta
		},
		match: definition.match,
		check: definition.check
	};
}
//#endregion
export { defineRule };

//# sourceMappingURL=rule.js.map
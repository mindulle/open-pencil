import { colorToHex } from "../color/index.js";
//#region src/rpc/variables-command.ts
function formatVariableValue(variable, graph) {
	const modeId = graph.getActiveModeId(variable.collectionId);
	const raw = variable.valuesByMode[modeId];
	if (typeof raw === "object" && "aliasId" in raw) {
		const alias = graph.variables.get(raw.aliasId);
		return alias ? `→ ${alias.name}` : `→ ${raw.aliasId}`;
	}
	if (typeof raw === "object" && "r" in raw) return colorToHex(raw).toLowerCase();
	return String(raw);
}
const variablesCommand = {
	name: "variables",
	execute: (graph, args) => {
		const typeFilter = args.type?.toUpperCase();
		const collFilter = args.collection?.toLowerCase();
		const result = {
			collections: [],
			totalVariables: graph.variables.size,
			totalCollections: graph.variableCollections.size
		};
		for (const coll of graph.variableCollections.values()) {
			if (collFilter && !coll.name.toLowerCase().includes(collFilter)) continue;
			const collVars = graph.getVariablesForCollection(coll.id).filter((v) => !typeFilter || v.type === typeFilter);
			if (collVars.length === 0) continue;
			result.collections.push({
				id: coll.id,
				name: coll.name,
				modes: coll.modes.map((m) => m.name),
				variables: collVars.map((v) => ({
					id: v.id,
					name: v.name,
					type: v.type,
					value: formatVariableValue(v, graph)
				}))
			});
		}
		return result;
	}
};
//#endregion
export { variablesCommand };

//# sourceMappingURL=variables-command.js.map
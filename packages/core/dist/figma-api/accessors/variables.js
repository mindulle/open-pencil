import { raw } from "../accessor-utils.js";
//#region src/figma-api/accessors/variables.ts
function graph(target, internals) {
	return target[internals.graph];
}
function installVariableModeNodeProxyAccessors(prototype, internals) {
	Object.defineProperties(prototype, {
		explicitVariableModes: { get() {
			return Object.freeze({ ...raw(this, internals).variableModes });
		} },
		resolvedVariableModes: { get() {
			const sceneGraph = graph(this, internals);
			const node = raw(this, internals);
			const modes = {};
			for (const collectionId of sceneGraph.variableCollections.keys()) {
				const modeId = sceneGraph.getNodeVariableModeId(node.id, collectionId);
				if (modeId) modes[collectionId] = modeId;
			}
			return Object.freeze(modes);
		} }
	});
}
//#endregion
export { installVariableModeNodeProxyAccessors };

//# sourceMappingURL=variables.js.map
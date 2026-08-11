import { Color } from "./primitives2.js";
import { SceneGraph } from "./coordinate.js";
import { Variable, VariableCollection, VariableType, VariableValue } from "./types2.js";

//#region src/variables.d.ts
declare function addVariable(graph: SceneGraph, variable: Variable): void;
declare function removeVariable(graph: SceneGraph, id: string): void;
declare function addCollection(graph: SceneGraph, collection: VariableCollection): void;
declare function createVariable(graph: SceneGraph, generateId: () => string, name: string, type: VariableType, collectionId: string, value?: VariableValue): Variable;
declare function createCollection(graph: SceneGraph, generateId: () => string, name: string): VariableCollection;
declare function removeCollection(graph: SceneGraph, id: string): void;
declare function getActiveModeId(graph: SceneGraph, collectionId: string): string;
declare function getNodeVariableModeId(graph: SceneGraph, nodeId: string, collectionId: string): string;
declare function setActiveMode(graph: SceneGraph, collectionId: string, modeId: string): void;
declare function addMode(graph: SceneGraph, collectionId: string, modeId: string, name: string, sourceMode?: string): void;
declare function removeMode(graph: SceneGraph, collectionId: string, modeId: string): void;
declare function renameMode(graph: SceneGraph, collectionId: string, modeId: string, name: string): void;
declare function setDefaultMode(graph: SceneGraph, collectionId: string, modeId: string): void;
declare function resolveVariable(graph: SceneGraph, variableId: string, modeId?: string, visited?: Set<string>): VariableValue | undefined;
declare function resolveColorVariable(graph: SceneGraph, variableId: string): Color | undefined;
declare function resolveNumberVariable(graph: SceneGraph, variableId: string): number | undefined;
declare function resolveColorVariableForNode(graph: SceneGraph, nodeId: string, variableId: string): Color | undefined;
declare function resolveNumberVariableForNode(graph: SceneGraph, nodeId: string, variableId: string): number | undefined;
declare function getVariablesForCollection(graph: SceneGraph, collectionId: string): Variable[];
declare function getVariablesByType(graph: SceneGraph, type: VariableType): Variable[];
declare function bindVariable(graph: SceneGraph, nodeId: string, field: string, variableId: string): void;
declare function unbindVariable(graph: SceneGraph, nodeId: string, field: string): void;
//#endregion
export { addCollection, addMode, addVariable, bindVariable, createCollection, createVariable, getActiveModeId, getNodeVariableModeId, getVariablesByType, getVariablesForCollection, removeCollection, removeMode, removeVariable, renameMode, resolveColorVariable, resolveColorVariableForNode, resolveNumberVariable, resolveNumberVariableForNode, resolveVariable, setActiveMode, setDefaultMode, unbindVariable };
//# sourceMappingURL=variables.d.ts.map
import { EditorContext } from "./types.js";
import { Variable, VariableCollection, VariableType, VariableValue } from "@open-pencil/scene-graph";

//#region src/editor/variables.d.ts
declare function createVariableActions(ctx: EditorContext): {
  getVariablesByType: (type: VariableType) => Variable[];
  getVariable: (id: string) => Variable | undefined;
  resolveColorVariable: (id: string) => import("@open-pencil/scene-graph").Color | undefined;
  resolveNumberVariable: (id: string) => number | undefined;
  getVariablesForCollection: (collectionId: string) => Variable[];
  getCollection: (id: string) => VariableCollection | undefined;
  getCollections: () => VariableCollection[];
  getCollectionCount: () => number;
  getVariableCount: () => number;
  renameCollection: (id: string, newName: string) => void;
  addCollection: (collection: VariableCollection) => void;
  removeCollection: (id: string) => void;
  addVariable: (variable: Variable) => void;
  removeVariable: (id: string) => void;
  renameVariable: (id: string, newName: string) => void;
  updateVariableValue: (id: string, modeId: string, value: VariableValue) => void;
  addMode: (collectionId: string, name?: string) => string | undefined;
  removeMode: (collectionId: string, modeId: string) => void;
  renameMode: (collectionId: string, modeId: string, newName: string) => void;
  setDefaultMode: (collectionId: string, modeId: string) => void;
  duplicateMode: (collectionId: string, sourceModeId: string) => string | undefined;
  setActiveMode: (collectionId: string, modeId: string) => void;
};
//#endregion
export { createVariableActions };
//# sourceMappingURL=variables.d.ts.map
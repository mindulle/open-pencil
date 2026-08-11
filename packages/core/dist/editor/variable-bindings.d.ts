import { EditorContext } from "./types.js";

//#region src/editor/variable-bindings.d.ts
declare function createVariableBindingActions(ctx: EditorContext): {
  bindVariable: (nodeId: string, path: string, variableId: string) => void;
  unbindVariable: (nodeId: string, path: string) => void;
};
//#endregion
export { createVariableBindingActions };
//# sourceMappingURL=variable-bindings.d.ts.map
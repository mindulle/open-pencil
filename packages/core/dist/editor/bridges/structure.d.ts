import { createSelectionActions } from "../selection.js";
import { createStructureActions } from "../structure.js";

//#region src/editor/bridges/structure.d.ts
type SelectionActions = ReturnType<typeof createSelectionActions>;
type StructureActions = ReturnType<typeof createStructureActions>;
declare function createStructureBridge(structure: StructureActions, selection: SelectionActions): {
  wrapInAutoLayout: () => void;
  groupSelected: () => string | null;
  frameSelection: () => string | null;
  booleanOperationSelected: (operation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE") => string | null;
  flattenSelected: () => string | null;
  outlineTextSelected: () => string | null;
  outlineStrokeSelected: () => string | null;
  ungroupSelected: () => void;
};
//#endregion
export { createStructureBridge };
//# sourceMappingURL=structure.d.ts.map
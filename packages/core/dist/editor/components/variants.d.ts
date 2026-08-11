import { EditorContext } from "../types.js";
import { ComponentPropertyDefinition, ComponentPropertyType, SceneNode } from "@open-pencil/scene-graph";
import { buildVariantName, parseVariantName } from "@open-pencil/scene-graph/variant-name";

//#region src/editor/components/variants.d.ts
type VariantConflict = {
  values: Record<string, string>;
  componentIds: string[];
};
declare function createVariantActions(ctx: EditorContext): {
  getComponentSetPropertyDefs: (componentSetId: string) => ComponentPropertyDefinition[];
  addPropertyDefinition: (componentSetId: string, name: string, type?: ComponentPropertyType, defaultValue?: string) => string | undefined;
  removePropertyDefinition: (componentSetId: string, propertyId: string) => void;
  renamePropertyDefinition: (componentSetId: string, propertyId: string, newName: string) => void;
  parseVariantName: typeof parseVariantName;
  buildVariantName: typeof buildVariantName;
  collectVariantOptions: (componentSetId: string) => Map<string, Set<string>>;
  findVariantByValues: (componentSetId: string, values: Record<string, string>) => SceneNode | undefined;
  getDefaultVariantForComponentSet: (componentSetId: string) => SceneNode | undefined;
  getComponentSetVariantConflicts: (componentSetId: string) => VariantConflict[];
  switchInstanceVariant: (instanceId: string, propertyName: string, newValue: string) => void;
};
//#endregion
export { VariantConflict, createVariantActions };
//# sourceMappingURL=variants.d.ts.map
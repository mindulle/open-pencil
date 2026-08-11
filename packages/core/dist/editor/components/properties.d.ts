import { EditorContext } from "../types.js";
import { ComponentPropertyDefinition } from "@open-pencil/scene-graph";

//#region src/editor/components/properties.d.ts
declare function reapplyInstanceComponentProperties(ctx: EditorContext, instanceId: string): void;
declare function createComponentPropertyActions(ctx: EditorContext, switchVariant: (instanceId: string, propertyName: string, newValue: string) => void): {
  getInstanceComponentPropertyDefinitions: (instanceId: string) => ComponentPropertyDefinition[];
  getInstanceComponentPropertyValue: (instanceId: string, definition: ComponentPropertyDefinition) => string;
  reapplyInstanceComponentProperties: (instanceId: string) => void;
  setInstanceComponentProperty: (instanceId: string, propertyId: string, value: string) => void;
};
//#endregion
export { createComponentPropertyActions, reapplyInstanceComponentProperties };
//# sourceMappingURL=properties.d.ts.map
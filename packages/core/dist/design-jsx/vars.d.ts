import { Color } from "@open-pencil/scene-graph/primitives";

//#region src/design-jsx/vars.d.ts
declare const VAR_SYMBOL: unique symbol;
type VarDef = string | {
  id?: string;
  name?: string;
  value?: string | Color;
};
interface DesignVariable {
  [VAR_SYMBOL]: true;
  id?: string;
  name: string;
  value?: string | Color;
}
declare function isVariable(value: unknown): value is DesignVariable;
declare function defineVars<T extends Record<string, VarDef>>(vars: T): { [K in keyof T]: DesignVariable };
declare function designVar(def: string | {
  id?: string;
  name?: string;
  value?: string | Color;
}): DesignVariable;
declare function designVar(idOrName: string, value?: string | Color): DesignVariable;
//#endregion
export { DesignVariable, VarDef, defineVars, designVar, isVariable };
//# sourceMappingURL=vars.d.ts.map
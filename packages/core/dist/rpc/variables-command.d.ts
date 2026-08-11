import { RPCCommand } from "./types.js";

//#region src/rpc/variables-command.d.ts
interface VariablesArgs {
  collection?: string;
  type?: string;
}
interface VariablesResult {
  collections: Array<{
    id: string;
    name: string;
    modes: string[];
    variables: Array<{
      id: string;
      name: string;
      type: string;
      value: string;
    }>;
  }>;
  totalVariables: number;
  totalCollections: number;
}
declare const variablesCommand: RPCCommand<VariablesArgs, VariablesResult>;
//#endregion
export { VariablesArgs, VariablesResult, variablesCommand };
//# sourceMappingURL=variables-command.d.ts.map
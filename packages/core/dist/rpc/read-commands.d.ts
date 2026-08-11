import { RPCCommand } from "./types.js";

//#region src/rpc/read-commands.d.ts
interface InfoResult {
  pages: number;
  totalNodes: number;
  types: Record<string, number>;
  fonts: string[];
  pageCounts: Record<string, number>;
}
declare const infoCommand: RPCCommand<void, InfoResult>;
interface PageItem {
  id: string;
  name: string;
  nodes: number;
}
declare const pagesCommand: RPCCommand<void, PageItem[]>;
interface TreeArgs {
  page?: string;
  depth?: number;
}
interface TreeNodeResult {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children?: TreeNodeResult[];
}
interface TreeResult {
  page: {
    id: string;
    name: string;
    type: string;
  };
  children: TreeNodeResult[];
}
declare const treeCommand: RPCCommand<TreeArgs, TreeResult | {
  error: string;
}>;
interface FindArgs {
  name?: string;
  type?: string;
  page?: string;
  limit?: number;
}
interface FindNodeResult {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
}
declare const findCommand: RPCCommand<FindArgs, FindNodeResult[]>;
interface QueryArgs {
  selector: string;
  page?: string;
  limit?: number;
}
interface QueryNodeResult {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
declare const queryCommand: RPCCommand<QueryArgs, QueryNodeResult[] | {
  error: string;
}>;
interface NodeArgs {
  id: string;
}
interface NodeResult {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  rotation: number;
  fills: unknown[];
  strokes: unknown[];
  effects: unknown[];
  cornerRadius: number;
  blendMode: string;
  layoutMode: string;
  layoutDirection: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textDirection: string;
  text: string | null;
  parent: {
    id: string;
    name: string;
    type: string;
  } | null;
  children: number;
  boundVariables: Record<string, string>;
}
declare const nodeCommand: RPCCommand<NodeArgs, NodeResult | {
  error: string;
}>;
//#endregion
export { FindArgs, FindNodeResult, InfoResult, NodeArgs, NodeResult, PageItem, QueryArgs, QueryNodeResult, TreeArgs, TreeNodeResult, TreeResult, findCommand, infoCommand, nodeCommand, pagesCommand, queryCommand, treeCommand };
//# sourceMappingURL=read-commands.d.ts.map
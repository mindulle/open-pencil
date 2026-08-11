import { FigmaNodeProxy } from "../figma-api/proxy.js";
import { FigmaAPI } from "../figma-api/index.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/tools/schema.d.ts
type ParamType = 'string' | 'number' | 'boolean' | 'color' | 'string[]';
interface ParamDef {
  type: ParamType;
  description: string;
  required?: boolean;
  default?: unknown;
  enum?: string[];
  min?: number;
  max?: number;
}
interface ToolDef {
  name: string;
  description: string;
  mutates?: boolean;
  params: Record<string, ParamDef>;
  execute: (figma: FigmaAPI, args: Record<string, unknown>) => unknown;
}
type ResolvedType<T extends ParamType> = T extends 'string' ? string : T extends 'number' ? number : T extends 'boolean' ? boolean : T extends 'color' ? string : T extends 'string[]' ? string[] : never;
type ResolvedParams<P extends Record<string, ParamDef>> = { [K in keyof P as P[K]['required'] extends true ? K : never]: ResolvedType<P[K]['type']> } & { [K in keyof P as P[K]['required'] extends true ? never : K]?: ResolvedType<P[K]['type']> };
declare function defineTool<P extends Record<string, ParamDef>>(def: {
  name: string;
  description: string;
  mutates?: boolean;
  params: P;
  execute: (figma: FigmaAPI, args: ResolvedParams<P>) => unknown;
}): ToolDef;
declare class NodeNotFoundError extends Error {
  constructor(id: string);
}
declare function requireNode(figma: FigmaAPI, id: string): ReturnType<FigmaAPI['getNodeById']>;
declare function nodeNotFound(id: string): {
  error: string;
};
declare function getRawNodeOrError(figma: FigmaAPI, id: string): {
  node: SceneNode;
} | {
  error: string;
};
declare function nodeToResult(node: FigmaNodeProxy, maxDepth?: number): Record<string, unknown>;
declare function nodeSummary(node: FigmaNodeProxy): {
  id: string;
  name: string;
  type: string;
};
//#endregion
export { NodeNotFoundError, ParamDef, ParamType, ToolDef, defineTool, getRawNodeOrError, nodeNotFound, nodeSummary, nodeToResult, requireNode };
//# sourceMappingURL=schema.d.ts.map
import { NodeType, SceneNode, SourceMetadata } from "./types2.js";

//#region src/node-defaults.d.ts
declare function createDefaultSourceMetadata(): SourceMetadata;
declare function createDefaultNode(generateId: () => string, type: NodeType, overrides?: Partial<SceneNode>): SceneNode;
declare const CONTAINER_TYPES: Set<NodeType>;
//#endregion
export { CONTAINER_TYPES, createDefaultNode, createDefaultSourceMetadata };
//# sourceMappingURL=node-defaults.d.ts.map
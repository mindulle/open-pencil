import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";

//#region src/figma-api/plugin-data.d.ts
declare const OPEN_PENCIL_PLUGIN_DATA_NAMESPACE = "open-pencil";
type PluginDataEntry = SceneNode['pluginData'][number];
declare function isOpenPencilPluginData(entry: PluginDataEntry): boolean;
declare function getPluginData(node: SceneNode, key: string): string;
declare function setPluginData(graph: SceneGraph, node: SceneNode, key: string, value: string): void;
declare function getPluginDataKeys(node: SceneNode): string[];
declare function getSharedPluginData(node: SceneNode, namespace: string, key: string): string;
declare function setSharedPluginData(graph: SceneGraph, node: SceneNode, namespace: string, key: string, value: string): void;
declare function getSharedPluginDataKeys(node: SceneNode, namespace: string): string[];
//#endregion
export { OPEN_PENCIL_PLUGIN_DATA_NAMESPACE, getPluginData, getPluginDataKeys, getSharedPluginData, getSharedPluginDataKeys, isOpenPencilPluginData, setPluginData, setSharedPluginData };
//# sourceMappingURL=plugin-data.d.ts.map
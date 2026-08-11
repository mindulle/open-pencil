//#region src/figma-api/plugin-data.ts
const OPEN_PENCIL_PLUGIN_DATA_NAMESPACE = "open-pencil";
function isOpenPencilPluginData(entry) {
	return entry.pluginId === OPEN_PENCIL_PLUGIN_DATA_NAMESPACE;
}
function encodedSharedKey(entry, namespace) {
	const prefix = `${namespace}/`;
	if (entry.pluginId !== namespace || !entry.key.startsWith(prefix)) return null;
	return entry.key.slice(prefix.length);
}
function isEncodedSharedPluginData(entry) {
	return encodedSharedKey(entry, entry.pluginId) !== null;
}
function matchesSharedPluginData(entry, namespace, key) {
	const encodedKey = encodedSharedKey(entry, namespace);
	if (encodedKey !== null) return encodedKey === key;
	if (isOpenPencilPluginData(entry)) return false;
	return entry.pluginId === namespace && entry.key === key;
}
function sharedPluginDataKey(entry, namespace) {
	const encodedKey = encodedSharedKey(entry, namespace);
	if (encodedKey !== null) return encodedKey;
	if (isOpenPencilPluginData(entry)) return null;
	return entry.pluginId === namespace ? entry.key : null;
}
function getPluginData(node, key) {
	return node.pluginData.find((entry) => isOpenPencilPluginData(entry) && entry.key === key)?.value ?? "";
}
function setPluginData(graph, node, key, value) {
	const pluginData = node.pluginData.filter((entry) => !(isOpenPencilPluginData(entry) && entry.key === key));
	if (value !== "") pluginData.push({
		pluginId: OPEN_PENCIL_PLUGIN_DATA_NAMESPACE,
		key,
		value
	});
	graph.updateNode(node.id, { pluginData });
}
function getPluginDataKeys(node) {
	return node.pluginData.filter((entry) => isOpenPencilPluginData(entry) && !isEncodedSharedPluginData(entry)).map((entry) => entry.key);
}
function getSharedPluginData(node, namespace, key) {
	return node.pluginData.find((entry) => matchesSharedPluginData(entry, namespace, key))?.value ?? "";
}
function setSharedPluginData(graph, node, namespace, key, value) {
	const pluginData = node.pluginData.filter((entry) => !matchesSharedPluginData(entry, namespace, key));
	if (value !== "") pluginData.push({
		pluginId: namespace,
		key: `${namespace}/${key}`,
		value
	});
	graph.updateNode(node.id, { pluginData });
}
function getSharedPluginDataKeys(node, namespace) {
	return node.pluginData.flatMap((entry) => {
		const key = sharedPluginDataKey(entry, namespace);
		return key === null ? [] : [key];
	});
}
//#endregion
export { OPEN_PENCIL_PLUGIN_DATA_NAMESPACE, getPluginData, getPluginDataKeys, getSharedPluginData, getSharedPluginDataKeys, isOpenPencilPluginData, setPluginData, setSharedPluginData };

//# sourceMappingURL=plugin-data.js.map
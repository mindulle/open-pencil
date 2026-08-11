import { useSceneComputed } from "../../controls/appearance/helpers.js";
import { computed } from "vue";
import { MAX_EXPORT_SCALE, MIN_EXPORT_SCALE, clampExportScale } from "@open-pencil/scene-graph";
import { BUILTIN_IO_FORMATS, IORegistry } from "@open-pencil/core/io";
//#region src/document/export/helpers.ts
const EXPORT_SCALES = [
	.5,
	.75,
	1,
	1.5,
	2,
	3,
	4
];
const EXPORT_FORMATS = [
	"png",
	"jpg",
	"webp",
	"svg",
	"pdf"
];
const OPEN_PENCIL_PLUGIN_ID = "open-pencil";
const EXPORT_SETTINGS_PLUGIN_KEY = "exportSettings";
const io = new IORegistry(BUILTIN_IO_FORMATS);
function createDefaultExportSetting() {
	return {
		scale: 1,
		format: "png"
	};
}
function formatSupportsScale(format) {
	return io.getFormat(format)?.exportOptions?.scale ?? false;
}
function createExportTargetState(editor, selectedIds) {
	const hasSelection = computed(() => selectedIds.value.length > 0);
	const activeTarget = computed(() => hasSelection.value ? "selection" : "page");
	const targetIds = useSceneComputed(() => selectedIds.value.length > 0 ? selectedIds.value : [editor.state.currentPageId]);
	const selectedNodeName = computed(() => {
		const ids = editor.state.selectedIds;
		if (ids.size === 1) {
			const id = [...ids][0];
			return editor.graph.getNode(id)?.name ?? "Export";
		}
		if (ids.size > 1) return `${ids.size} layers`;
		return null;
	});
	const currentPageName = computed(() => {
		return editor.graph.getNode(editor.state.currentPageId)?.name ?? "Page";
	});
	return {
		hasSelection,
		activeTarget,
		targetIds,
		selectedNodeName,
		currentPageName,
		activeName: computed(() => activeTarget.value === "selection" ? selectedNodeName.value ?? "Export" : currentPageName.value),
		activeSettings: useSceneComputed(() => {
			const firstId = targetIds.value[0];
			return firstId ? [...editor.graph.getNode(firstId)?.exportSettings ?? []] : [];
		}),
		mixed: useSceneComputed(() => {
			const [firstId, ...otherIds] = targetIds.value;
			if (!firstId || otherIds.length === 0) return false;
			const first = editor.graph.getNode(firstId)?.exportSettings ?? [];
			return otherIds.some((id) => {
				return !exportSettingsEqual(first, editor.graph.getNode(id)?.exportSettings ?? []);
			});
		})
	};
}
function exportSettingsEqual(a, b) {
	if (a.length !== b.length) return false;
	return a.every((setting, index) => {
		const other = b[index];
		return setting.scale === other.scale && setting.format === other.format;
	});
}
function nextExportSetting(settings) {
	const last = settings.at(-1);
	if (!last) return createDefaultExportSetting();
	return {
		scale: clampExportScale(last.scale * 2),
		format: last.format
	};
}
function syncExportSettingsPluginData(pluginData, settings) {
	const withoutExportSettings = pluginData.filter((entry) => !(entry.pluginId === OPEN_PENCIL_PLUGIN_ID && entry.key === EXPORT_SETTINGS_PLUGIN_KEY));
	if (settings.length === 0) return withoutExportSettings;
	return [...withoutExportSettings, {
		pluginId: OPEN_PENCIL_PLUGIN_ID,
		key: EXPORT_SETTINGS_PLUGIN_KEY,
		value: JSON.stringify(settings)
	}];
}
function updateEveryTarget(editor, targetIds, label, update) {
	editor.undo.runBatch(label, () => {
		for (const id of targetIds.value) {
			const node = editor.graph.getNode(id);
			if (!node) continue;
			const exportSettings = update(node.exportSettings);
			editor.updateNodeWithUndo(id, {
				exportSettings,
				pluginData: syncExportSettingsPluginData(node.pluginData, exportSettings)
			}, label);
		}
	});
}
function createExportSettingActions(editor, targetIds) {
	function addSetting() {
		updateEveryTarget(editor, targetIds, "Add export setting", (settings) => [...settings, nextExportSetting(settings)]);
	}
	function removeSetting(index) {
		updateEveryTarget(editor, targetIds, "Remove export setting", (settings) => settings.filter((_, i) => i !== index));
	}
	function updateScale(index, scale) {
		updateEveryTarget(editor, targetIds, "Update export scale", (settings) => settings.map((setting, i) => i === index ? {
			...setting,
			scale: clampExportScale(scale)
		} : setting));
	}
	function updateFormat(index, format) {
		updateEveryTarget(editor, targetIds, "Update export format", (settings) => settings.map((setting, i) => i === index ? {
			...setting,
			format
		} : setting));
	}
	return {
		addSetting,
		removeSetting,
		updateScale,
		updateFormat,
		addSelectionSetting: addSetting,
		addPageSetting: addSetting,
		removeSelectionSetting: removeSetting,
		removePageSetting: removeSetting,
		updateSelectionScale: updateScale,
		updatePageScale: updateScale,
		updateSelectionFormat: updateFormat,
		updatePageFormat: updateFormat
	};
}
//#endregion
export { EXPORT_FORMATS, EXPORT_SCALES, MAX_EXPORT_SCALE, MIN_EXPORT_SCALE, clampExportScale, createExportSettingActions, createExportTargetState, formatSupportsScale };

//# sourceMappingURL=helpers.js.map
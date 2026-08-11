import { DEFAULT_FRAME_FILL } from "../constants.js";
import { wrapInAutoLayout } from "./structure/auto-layout-wrap.js";
import { booleanOperationSelected } from "./structure/boolean.js";
import { wrapSelectionInContainer } from "./structure/container-wrap.js";
import { flattenSelected, outlineStrokeSelected } from "./structure/flatten.js";
import { ungroupSelected } from "./structure/group.js";
import { defaultNodeName, previewRenamedNodes } from "./structure/rename.js";
import { createStructureReorderActions } from "./structure/reorder.js";
import { createStructureStateActions } from "./structure/state.js";
//#region src/editor/structure.ts
function createStructureActions(ctx) {
	const reorderActions = createStructureReorderActions(ctx);
	const stateActions = createStructureStateActions(ctx);
	function isTopLevel(parentId) {
		return !parentId || parentId === ctx.graph.rootId || parentId === ctx.state.currentPageId;
	}
	function reparentNodes(nodeIds, newParentId) {
		const parent = ctx.graph.getNode(newParentId);
		for (const id of nodeIds) {
			if (ctx.graph.getNode(id)?.type === "SECTION" && parent && parent.type !== "CANVAS" && parent.type !== "SECTION") continue;
			ctx.graph.reparentNode(id, newParentId);
		}
	}
	function wrapSelectionInContainer$1(containerType, selectedNodes, extraProps) {
		return wrapSelectionInContainer(ctx, isTopLevel, containerType, selectedNodes, extraProps);
	}
	function wrapInAutoLayout$1(selectedNodes) {
		wrapInAutoLayout(ctx, isTopLevel, selectedNodes);
	}
	function groupSelected(selectedNodes) {
		return wrapSelectionInContainer$1("GROUP", selectedNodes);
	}
	function frameSelection(selectedNodes) {
		return wrapSelectionInContainer$1("FRAME", selectedNodes, { fills: [structuredClone(DEFAULT_FRAME_FILL)] });
	}
	function booleanOperationSelected$1(selectedNodes, operation) {
		return booleanOperationSelected(ctx, isTopLevel, selectedNodes, operation);
	}
	function ungroupSelected$1(selectedNode) {
		ungroupSelected(ctx, selectedNode);
	}
	function flattenSelected$1(selectedNodes) {
		return flattenSelected(ctx, selectedNodes);
	}
	function outlineTextSelected(selectedNodes) {
		if (selectedNodes.length === 0 || selectedNodes.some((node) => node.type !== "TEXT")) return null;
		return flattenSelected(ctx, selectedNodes, { label: "Outline text" });
	}
	function outlineStrokeSelected$1(selectedNodes) {
		return outlineStrokeSelected(ctx, selectedNodes);
	}
	function moveToPage(pageId) {
		if (ctx.graph.getNode(pageId)?.type !== "CANVAS") return;
		const ids = [...ctx.state.selectedIds];
		for (const id of ids) ctx.graph.reparentNode(id, pageId);
		ctx.setSelectedIds(/* @__PURE__ */ new Set());
	}
	function selectedNodes() {
		return [...ctx.state.selectedIds].map((id) => ctx.graph.getNode(id)).filter((node) => node != null);
	}
	function previewRenameSelected(options) {
		return previewRenamedNodes(selectedNodes(), options);
	}
	function renameSelected(options) {
		const nodes = selectedNodes();
		if (nodes.length === 0) return;
		const before = new Map(nodes.map((node) => [node.id, node.name]));
		const preview = previewRenamedNodes(nodes, options);
		if (preview.error) return;
		const applyNames = (names) => {
			for (const [id, nextName] of names) ctx.graph.updateNode(id, { name: nextName });
		};
		applyNames(preview.names);
		ctx.undo.push({
			label: "Rename selection",
			forward: () => applyNames(preview.names),
			inverse: () => applyNames(before)
		});
	}
	function renameNode(id, name) {
		const node = ctx.graph.getNode(id);
		if (!node) return;
		const trimmedName = name.trim();
		ctx.graph.updateNode(id, { name: trimmedName || defaultNodeName(node.type) });
	}
	return {
		isTopLevel,
		...reorderActions,
		reparentNodes,
		wrapSelectionInContainer: wrapSelectionInContainer$1,
		wrapInAutoLayout: wrapInAutoLayout$1,
		groupSelected,
		frameSelection,
		booleanOperationSelected: booleanOperationSelected$1,
		ungroupSelected: ungroupSelected$1,
		flattenSelected: flattenSelected$1,
		outlineTextSelected,
		outlineStrokeSelected: outlineStrokeSelected$1,
		...stateActions,
		moveToPage,
		previewRenameSelected,
		renameSelected,
		renameNode
	};
}
//#endregion
export { createStructureActions };

//# sourceMappingURL=structure.js.map
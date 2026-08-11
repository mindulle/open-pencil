import { createTextEditSession, resizeTextNodeForEdit, snapshotTextNode, textSnapshotChanged } from "./text/session.js";
//#region src/editor/text.ts
function containingInstanceIds(ctx, nodeId) {
	const ids = [];
	let current = ctx.graph.getNode(nodeId);
	while (current?.parentId) {
		current = ctx.graph.getNode(current.parentId);
		if (current?.type === "INSTANCE") ids.push(current.id);
	}
	return ids;
}
function snapshotInstanceOverrides(ctx, instanceIds) {
	return instanceIds.flatMap((instanceId) => {
		const instance = ctx.graph.getNode(instanceId);
		return instance?.type === "INSTANCE" ? [{
			instanceId,
			overrides: structuredClone(instance.overrides)
		}] : [];
	});
}
function restoreInstanceOverrides(ctx, snapshots) {
	for (const snapshot of snapshots) ctx.graph.updateNode(snapshot.instanceId, { overrides: structuredClone(snapshot.overrides) });
}
function applyTextInstanceOverride(ctx, instanceIds, nodeId, text) {
	for (const instanceId of instanceIds) {
		const instance = ctx.graph.getNode(instanceId);
		if (instance?.type !== "INSTANCE") continue;
		ctx.graph.updateNode(instanceId, { overrides: {
			...instance.overrides,
			[`${nodeId}:text`]: text
		} });
	}
}
function createTextActions(ctx) {
	let activeSession = null;
	function startTextEditing(nodeId) {
		const te = ctx.getTextEditor();
		if (ctx.state.editingTextId) commitTextEdit();
		const node = ctx.graph.getNode(nodeId);
		if (!node) return;
		activeSession = createTextEditSession(node);
		ctx.state.editingTextId = nodeId;
		if (te) {
			te.setRenderer(ctx.getRenderer());
			te.start(node);
		}
		ctx.requestRender();
	}
	function commitTextEdit() {
		const te = ctx.getTextEditor();
		if (!te?.isActive) {
			ctx.state.editingTextId = null;
			activeSession = null;
			return;
		}
		const textState = te.state;
		if (!textState) {
			te.stop();
			ctx.state.editingTextId = null;
			activeSession = null;
			ctx.requestRender();
			return;
		}
		const result = {
			nodeId: textState.nodeId,
			text: textState.text
		};
		const before = activeSession?.before ?? {
			text: "",
			styleRuns: [],
			size: {}
		};
		const node = ctx.graph.getNode(result.nodeId);
		const after = snapshotTextNode(node, result.text);
		after.text = result.text;
		const sizeChanges = before.text !== after.text ? resizeTextNodeForEdit(node, textState.paragraph) : {};
		if (Object.keys(sizeChanges).length > 0) after.size = sizeChanges;
		const changed = textSnapshotChanged(before, after);
		const containingInstances = containingInstanceIds(ctx, result.nodeId);
		const instanceOverridesBefore = snapshotInstanceOverrides(ctx, containingInstances);
		te.stop();
		if (!changed) {
			ctx.state.editingTextId = null;
			activeSession = null;
			ctx.requestRender();
			return;
		}
		ctx.graph.updateNode(result.nodeId, {
			text: after.text,
			styleRuns: after.styleRuns,
			...sizeChanges
		});
		if (before.text !== after.text) applyTextInstanceOverride(ctx, containingInstances, result.nodeId, after.text);
		const instanceOverridesAfter = snapshotInstanceOverrides(ctx, containingInstances);
		ctx.state.editingTextId = null;
		activeSession = null;
		ctx.undo.push({
			label: "Edit text",
			forward: () => {
				ctx.graph.updateNode(result.nodeId, {
					text: after.text,
					styleRuns: after.styleRuns,
					...after.size
				});
				restoreInstanceOverrides(ctx, instanceOverridesAfter);
			},
			inverse: () => {
				ctx.graph.updateNode(result.nodeId, {
					text: before.text,
					styleRuns: before.styleRuns,
					...before.size
				});
				restoreInstanceOverrides(ctx, instanceOverridesBefore);
			}
		});
	}
	return {
		startTextEditing,
		commitTextEdit
	};
}
//#endregion
export { createTextActions };

//# sourceMappingURL=text.js.map
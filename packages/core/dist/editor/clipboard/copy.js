import { buildOpenPencilClipboardHTML } from "../../clipboard/openpencil.js";
import { buildFigmaClipboardHTML } from "../../clipboard.js";
//#region src/editor/clipboard/copy.ts
function createClipboardCopyActions(ctx) {
	async function writeCopyData(clipboardData, selectedNodes) {
		if (selectedNodes.length === 0) return;
		const names = selectedNodes.map((n) => n.name).join("\n");
		clipboardData.setData("text/html", buildOpenPencilClipboardHTML(selectedNodes, ctx.graph));
		clipboardData.setData("text/plain", names);
		const html = await buildFigmaClipboardHTML(selectedNodes, ctx.graph);
		if (html) clipboardData.setData("text/html", html);
	}
	return { writeCopyData };
}
//#endregion
export { createClipboardCopyActions };

//# sourceMappingURL=copy.js.map
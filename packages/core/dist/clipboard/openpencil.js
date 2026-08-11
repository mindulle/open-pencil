import { decodeBase64, encodeBase64 } from "../bytes/base64.js";
import { deflateSync, inflateSync } from "fflate";
//#region src/clipboard/openpencil.ts
function parseOpenPencilClipboard(html) {
	const match = html.match(/<!--\(openpencil\)(.*?)\(\/openpencil\)-->/s);
	if (!match) return null;
	try {
		const raw = decodeBase64(match[1]);
		let bytes;
		try {
			bytes = inflateSync(raw);
		} catch {
			bytes = raw;
		}
		const decoded = JSON.parse(new TextDecoder().decode(bytes));
		if (decoded.format === "openpencil/v1" && Array.isArray(decoded.nodes)) {
			restoreTextPictures(decoded.nodes);
			const images = /* @__PURE__ */ new Map();
			if (decoded.images && typeof decoded.images === "object") {
				for (const [hash, b64] of Object.entries(decoded.images)) if (typeof b64 === "string") images.set(hash, decodeBase64(b64));
			}
			return {
				nodes: decoded.nodes,
				images
			};
		}
	} catch (e) {
		console.warn("Failed to parse OpenPencil clipboard data:", e);
	}
	return null;
}
function restoreTextPictures(nodes) {
	for (const node of nodes) {
		if (typeof node.textPicture === "string") node.textPicture = decodeBase64(node.textPicture);
		if (Array.isArray(node.children)) restoreTextPictures(node.children);
	}
}
function collectImageHashes(nodes, graph) {
	const hashes = /* @__PURE__ */ new Set();
	function walk(nodeList) {
		for (const node of nodeList) {
			for (const fill of node.fills) if (fill.imageHash) hashes.add(fill.imageHash);
			walk(graph.getChildren(node.id));
		}
	}
	walk(nodes);
	return hashes;
}
function buildOpenPencilClipboardHTML(nodes, graph, textPictureBuilder) {
	const nodeTree = collectNodeTree(nodes, graph, textPictureBuilder);
	const hashes = collectImageHashes(nodes, graph);
	const images = {};
	for (const hash of hashes) {
		const bytes = graph.images.get(hash);
		if (bytes) images[hash] = encodeBase64(bytes);
	}
	const data = {
		format: "openpencil/v1",
		nodes: nodeTree,
		images
	};
	return `<!--(openpencil)${encodeBase64(deflateSync(new TextEncoder().encode(JSON.stringify(data))))}(/openpencil)-->`;
}
function collectNodeTree(nodes, graph, textPictureBuilder) {
	return nodes.map((node) => {
		const children = graph.getChildren(node.id);
		const serialized = { ...node };
		if (node.type === "TEXT" && node.text && textPictureBuilder) {
			const pic = node.textPicture ?? textPictureBuilder(node);
			if (pic) serialized.textPicture = encodeBase64(pic);
		} else delete serialized.textPicture;
		if (children.length > 0) serialized.children = collectNodeTree(children, graph, textPictureBuilder);
		return serialized;
	});
}
//#endregion
export { buildOpenPencilClipboardHTML, parseOpenPencilClipboard };

//# sourceMappingURL=openpencil.js.map
import { weightToStyle } from "../../../../text/font-style.js";
import { fontManager } from "../../../../text/fonts.js";
//#region src/kiwi/fig/node-change/font/digests.ts
const fontDigestCache = /* @__PURE__ */ new Map();
async function computeFontDigest(data) {
	if (typeof crypto !== "undefined") {
		const hash = await crypto.subtle.digest("SHA-1", data);
		return new Uint8Array(hash);
	}
	return /* @__PURE__ */ new Uint8Array(20);
}
async function getFontDigest(family, style) {
	const key = `${family}|${style}`;
	const cached = fontDigestCache.get(key);
	if (cached) return cached;
	const data = fontManager.loadedData(family, style);
	if (!data) return null;
	const digest = await computeFontDigest(data);
	fontDigestCache.set(key, digest);
	return digest;
}
async function buildFontDigestMap(graph) {
	const fontKeys = /* @__PURE__ */ new Set();
	for (const node of graph.getAllNodes()) {
		if (node.type !== "TEXT") continue;
		const baseStyle = weightToStyle(node.fontWeight, node.italic);
		fontKeys.add(`${node.fontFamily}|${baseStyle}`);
		for (const run of node.styleRuns) {
			const family = run.style.fontFamily ?? node.fontFamily;
			const weight = run.style.fontWeight ?? node.fontWeight;
			const italic = run.style.italic ?? node.italic;
			fontKeys.add(`${family}|${weightToStyle(weight, italic)}`);
		}
	}
	const result = /* @__PURE__ */ new Map();
	for (const key of fontKeys) {
		const [family, style] = key.split("|");
		const digest = await getFontDigest(family, style);
		if (digest) result.set(key, digest);
	}
	return result;
}
//#endregion
export { buildFontDigestMap };

//# sourceMappingURL=digests.js.map
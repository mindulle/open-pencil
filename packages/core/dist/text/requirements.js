import "../constants.js";
import { transformTextCase } from "./case.js";
import { cjkFallbackScriptForLanguage } from "./fallbacks.js";
import { weightToStyle } from "./font-style.js";
//#region src/text/requirements.ts
function collectGraphFontKeys(graph, nodeIds) {
	const fontKeys = /* @__PURE__ */ new Set();
	const collect = (nodeId) => {
		const node = graph.getNode(nodeId);
		if (!node) return;
		if (node.type === "TEXT") {
			const family = node.fontFamily || "Inter";
			fontKeys.add(`${family}\0${weightToStyle(node.fontWeight || 400, node.italic)}`);
			for (const run of node.styleRuns) {
				const runFamily = run.style.fontFamily ?? family;
				const weight = run.style.fontWeight ?? node.fontWeight;
				const italic = run.style.italic ?? node.italic;
				fontKeys.add(`${runFamily}\0${weightToStyle(weight, italic)}`);
			}
		}
		for (const childId of node.childIds) collect(childId);
	};
	for (const nodeId of nodeIds) collect(nodeId);
	return Array.from(fontKeys, (key) => key.split("\0"));
}
function fallbackScriptForCharacter(character, language) {
	if (/\p{Script=Arabic}/u.test(character)) return "arabic";
	if (/\p{Script=Hangul}/u.test(character)) return "cjk-kr";
	if (/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(character)) return "cjk-jp";
	if (/\p{Script=Han}/u.test(character)) return cjkFallbackScriptForLanguage(language) ?? "cjk-sc";
	return null;
}
function textLanguageAt(node, index) {
	return node.styleRuns.find((item) => index >= item.start && index < item.start + item.length)?.style.textLanguage ?? node.textLanguage;
}
function collectGraphFontRequirements(graph, nodeIds) {
	const characters = /* @__PURE__ */ new Set();
	const nodes = [];
	const scripts = /* @__PURE__ */ new Set();
	const collect = (nodeId) => {
		const node = graph.getNode(nodeId);
		if (!node) return;
		nodes.push(node);
		if (node.type === "TEXT") {
			let index = 0;
			for (const character of transformTextCase(node.text, node.textCase)) {
				characters.add(character);
				const script = fallbackScriptForCharacter(character, textLanguageAt(node, index));
				if (script) scripts.add(script);
				index += character.length;
			}
		}
		for (const childId of node.childIds) collect(childId);
	};
	for (const nodeId of nodeIds) collect(nodeId);
	return {
		characters: Array.from(characters).join(""),
		nodes,
		scripts: Array.from(scripts)
	};
}
//#endregion
export { collectGraphFontKeys, collectGraphFontRequirements };

//# sourceMappingURL=requirements.js.map
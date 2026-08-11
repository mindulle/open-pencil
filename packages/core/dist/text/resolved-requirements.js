import { textNeededFallbackScripts } from "./coverage.js";
//#region src/text/resolved-requirements.ts
function missingGraphFontScripts(requirements) {
	const scripts = /* @__PURE__ */ new Set();
	for (const node of requirements.nodes) {
		if (node.type !== "TEXT") continue;
		for (const script of textNeededFallbackScripts(node)) scripts.add(script);
	}
	return Array.from(scripts);
}
//#endregion
export { missingGraphFontScripts };

//# sourceMappingURL=resolved-requirements.js.map
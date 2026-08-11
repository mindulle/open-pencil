import { compileTailwindCSS } from "./convert.js";
import { designDocumentToSceneGraph, jsxToDesignDocumentCore } from "./browser.js";
//#region src/jsx/runtime.ts
async function runtimeForOptions(runtime) {
	if (runtime) return runtime;
	const { createCSSRuntime } = await import("./convert.js").then((n) => n.runtime_exports);
	return createCSSRuntime();
}
async function jsxToDesignDocument(input, options = {}) {
	const document = jsxToDesignDocumentCore(input);
	if (!options.cssText && !options.runtime && !options.compute) return document;
	return (await runtimeForOptions(options.runtime)).computeStyles(document, options.cssText, options.compute);
}
async function jsxToSceneGraph(input, options = {}) {
	return designDocumentToSceneGraph(await jsxToDesignDocument(input, options), options);
}
async function tailwindJSXToDesignDocument(input, candidates, options = {}) {
	const cssText = await compileTailwindCSS(candidates, options);
	return jsxToDesignDocument(input, {
		...options,
		cssText
	});
}
async function tailwindJSXToSceneGraph(input, candidates, options = {}) {
	return designDocumentToSceneGraph(await tailwindJSXToDesignDocument(input, candidates, options), options);
}
//#endregion
export { jsxToDesignDocument, jsxToSceneGraph, tailwindJSXToDesignDocument, tailwindJSXToSceneGraph };

//# sourceMappingURL=index.js.map
import { parse } from "acorn";
//#region src/tools/analyze/eval/wrap.ts
/**
* Wrap eval code so the last bare expression is returned (REPL-style).
*
* Uses acorn to parse the code as a proper JS AST:
* - Already starts with `return` -> used verbatim (inside async function body)
* - Last statement is an ExpressionStatement -> replace it with `return (expr)`
* - Otherwise -> wrap in async IIFE so side-effects still execute
*/
function wrapEvalCode(code) {
	const trimmed = code.trim();
	if (trimmed.startsWith("return")) return trimmed;
	let body;
	try {
		body = parse(trimmed, {
			ecmaVersion: "latest",
			sourceType: "module",
			allowAwaitOutsideFunction: true,
			allowReturnOutsideFunction: true
		}).body;
	} catch {
		return `return (async () => { ${trimmed} })()`;
	}
	if (body.length === 0) return trimmed;
	const last = body[body.length - 1];
	if (last.type === "ExpressionStatement") return `${trimmed.slice(0, last.start)}return (${trimmed.slice(last.start, last.end).replace(/;$/, "")})`;
	return `return (async () => { ${trimmed} })()`;
}
//#endregion
export { wrapEvalCode };

//# sourceMappingURL=wrap.js.map
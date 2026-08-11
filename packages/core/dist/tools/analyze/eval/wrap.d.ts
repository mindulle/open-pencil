//#region src/tools/analyze/eval/wrap.d.ts
/**
 * Wrap eval code so the last bare expression is returned (REPL-style).
 *
 * Uses acorn to parse the code as a proper JS AST:
 * - Already starts with `return` -> used verbatim (inside async function body)
 * - Last statement is an ExpressionStatement -> replace it with `return (expr)`
 * - Otherwise -> wrap in async IIFE so side-effects still execute
 */
declare function wrapEvalCode(code: string): string;
//#endregion
export { wrapEvalCode };
//# sourceMappingURL=wrap.d.ts.map
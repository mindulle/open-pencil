import { fontFallbackScriptForCharacter } from "../coverage.js";
//#region src/text/resolver/coverage.ts
function codePointSpans(text) {
	const spans = [];
	let utf8Start = 0;
	let utf16Start = 0;
	const encoder = new TextEncoder();
	for (const character of text) {
		spans.push({
			character,
			utf8Start,
			utf16Start
		});
		utf8Start += encoder.encode(character).byteLength;
		utf16Start += character.length;
	}
	return {
		spans,
		utf8Length: utf8Start
	};
}
function missingGlyphCharacters(text, lines) {
	if (!text || lines.length === 0) return [];
	const { spans, utf8Length } = codePointSpans(text);
	const offsetsAreUtf16 = lines.at(-1)?.textRange.last === text.length && utf8Length !== text.length;
	const spansByOffset = /* @__PURE__ */ new Map();
	for (const span of spans) spansByOffset.set(offsetsAreUtf16 ? span.utf16Start : span.utf8Start, span.character);
	const missing = /* @__PURE__ */ new Set();
	for (const line of lines) for (const run of line.runs) for (let index = 0; index < run.glyphs.length; index++) {
		if (run.glyphs[index] !== 0) continue;
		const offset = run.offsets[index];
		const character = spansByOffset.get(offset);
		if (character) missing.add(character);
	}
	return [...missing];
}
function missingGlyphScripts(text, lines) {
	const scripts = /* @__PURE__ */ new Set();
	for (const character of missingGlyphCharacters(text, lines)) {
		const script = fontFallbackScriptForCharacter(character);
		if (script) scripts.add(script);
	}
	return [...scripts];
}
//#endregion
export { missingGlyphCharacters, missingGlyphScripts };

//# sourceMappingURL=coverage.js.map
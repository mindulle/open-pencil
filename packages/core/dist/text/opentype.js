import { fontManager } from "./fonts.js";
import * as OpenTypeSync from "opentype.js";
//#region src/text/opentype.ts
const parsedFontCache = /* @__PURE__ */ new Map();
function getParsedFont(family, style) {
	const key = `${family}|${style}`;
	const bytes = fontManager.loadedData(family, style);
	if (!bytes) return null;
	const cached = parsedFontCache.get(key);
	if (cached?.bytes === bytes) return cached.font;
	try {
		const font = OpenTypeSync.parse(bytes.slice(0));
		parsedFontCache.set(key, {
			bytes,
			font
		});
		return font;
	} catch {
		parsedFontCache.set(key, {
			bytes,
			font: null
		});
		return null;
	}
}
function glyphsForCodePoints(font, text) {
	return Array.from(text, (character) => font.charToGlyph(character));
}
function glyphAdvanceWidth(font, glyph, fontSize) {
	return (glyph.advanceWidth ?? 0) * fontSize / font.unitsPerEm;
}
function measureTextWithOpenType(text, fontSize, family, style, maxWidth, lineHeight) {
	const font = getParsedFont(family, style);
	if (!font) return null;
	const scale = fontSize / font.unitsPerEm;
	const lineGap = font.tables.os2?.sTypoLineGap ?? 0;
	const lineH = lineHeight ?? Math.ceil((font.ascender - font.descender + lineGap) * scale);
	const singleLineWidth = glyphsForCodePoints(font, text).reduce((width, glyph) => width + glyphAdvanceWidth(font, glyph, fontSize), 0);
	if (maxWidth && maxWidth > 0 && singleLineWidth > maxWidth) {
		const lines = Math.ceil(singleLineWidth / maxWidth);
		return {
			width: maxWidth,
			height: Math.ceil(lines * lineH)
		};
	}
	return {
		width: Math.ceil(singleLineWidth),
		height: lineH
	};
}
function fontGlyphCoverageSync(family, style, char) {
	if (!fontManager.loadedData(family, style)) return "unknown";
	const font = getParsedFont(family, style);
	if (!font) return "unknown";
	return font.charToGlyphIndex(char) !== 0 ? "has" : "missing";
}
function fontHasGlyphSync(family, style, char) {
	return fontGlyphCoverageSync(family, style, char) === "has";
}
function getGlyphOutlineMetricsSync(family, style, text, fontSize) {
	const font = getParsedFont(family, style);
	if (!font) return null;
	const glyphs = glyphsForCodePoints(font, text);
	let x = 0;
	return glyphs.map((glyph) => {
		const commands = glyph.getPath(0, 0, fontSize).commands;
		const advance = glyphAdvanceWidth(font, glyph, fontSize);
		const metrics = {
			commands,
			x,
			advance
		};
		x += advance;
		return metrics;
	});
}
async function probeGlyphOutlineCommands(family, style, text, fontSize) {
	const bytes = fontManager.loadedData(family, style);
	if (!bytes) return null;
	const font = OpenTypeSync.parse(bytes.slice(0));
	const firstGlyph = glyphsForCodePoints(font, text).find((glyph) => glyph.path.commands.length > 0);
	const firstGlyphCommandSample = (firstGlyph?.getPath(0, 0, fontSize).commands ?? []).slice(0, 12);
	return {
		family,
		style,
		unitsPerEm: font.unitsPerEm,
		commandCount: firstGlyph?.path.commands.length ?? 0,
		firstGlyphCommandSample
	};
}
//#endregion
export { fontGlyphCoverageSync, fontHasGlyphSync, getGlyphOutlineMetricsSync, measureTextWithOpenType, probeGlyphOutlineCommands };

//# sourceMappingURL=opentype.js.map
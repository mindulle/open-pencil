import { getGlyphOutlineMetricsSync } from "../opentype.js";
import { buildDerivedTextData, encodePathCommandsBlob, weightToFigmaStyle } from "@open-pencil/fig/node-change";
import { normalizeFontFamily, weightToStyle } from "@open-pencil/scene-graph";
import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext";
//#region src/text/derived-text/clipboard.ts
function computeWordWrapBreaks(text, glyphMetrics, fallbackAdvance, maxWidth, fontSize, fontFamily) {
	try {
		const { lines } = layoutWithLines(prepareWithSegments(text, `${fontSize}px ${fontFamily}`), maxWidth, Math.ceil(fontSize * 1.2));
		const breaks = [];
		let charOffset = 0;
		for (const line of lines) {
			if (charOffset > 0) breaks.push(charOffset);
			charOffset += line.text.length;
		}
		return breaks;
	} catch {
		return computeFallbackBreaks(text, glyphMetrics, fallbackAdvance, maxWidth);
	}
}
function computeFallbackBreaks(text, glyphMetrics, fallbackAdvance, maxWidth) {
	const breaks = [];
	let x = 0;
	let lastBreak = 0;
	let lastBreakX = 0;
	for (let i = 0; i < glyphMetrics.length; i++) {
		const advance = glyphMetrics[i].advance || fallbackAdvance;
		const ch = text[i];
		if (ch === " " || ch === "	" || ch === "-" && i + 1 < text.length) {
			lastBreak = i + 1;
			lastBreakX = x + advance;
		}
		if (x > 0 && x + advance > maxWidth + .5) {
			const lineStart = breaks.length > 0 ? breaks[breaks.length - 1] : 0;
			if (lastBreak > lineStart) {
				breaks.push(lastBreak);
				x -= lastBreakX;
			} else {
				breaks.push(i);
				x = 0;
			}
			lastBreak = breaks[breaks.length - 1];
			lastBreakX = 0;
		}
		x += advance;
	}
	return breaks;
}
function buildTextGlyphs(text, glyphMetrics, fallbackAdvance, fontSize) {
	if (glyphMetrics.length > 0) return glyphMetrics.map((glyph) => ({
		advance: glyph.advance || fallbackAdvance,
		commands: glyph.commands
	}));
	return Array.from({ length: text.length }, () => ({
		advance: fallbackAdvance || fontSize * .6,
		commands: []
	}));
}
function computeLineBreaks(node, glyphMetrics, textGlyphs, fallbackAdvance, shaped) {
	if (shaped) return [];
	if (glyphMetrics.length > 0) return computeWordWrapBreaks(node.text, textGlyphs, fallbackAdvance, node.width, node.fontSize, node.fontFamily);
	return computeFallbackBreaks(node.text, textGlyphs, fallbackAdvance, node.width);
}
async function buildDerivedTextDataV4(node, digestMap, shaped, blobs) {
	const style = weightToStyle(node.fontWeight, node.italic);
	const normalizedFamily = normalizeFontFamily(node.fontFamily);
	const key = `${normalizedFamily}|${style}`;
	const lineHeightFallback = node.lineHeight ?? Math.ceil(node.fontSize * 1.2);
	const glyphMetrics = getGlyphOutlineMetricsSync(node.fontFamily, style, node.text, node.fontSize) ?? [];
	const fallbackAdvance = node.text.length > 0 ? node.width / Math.max(node.text.length, 1) : 0;
	const textGlyphs = buildTextGlyphs(node.text, glyphMetrics, fallbackAdvance, node.fontSize);
	const lineAscent = Math.max(lineHeightFallback - node.fontSize * .2, 0);
	const lineBreaks = computeLineBreaks(node, glyphMetrics, textGlyphs, fallbackAdvance, shaped);
	const lineBreakSet = new Set(lineBreaks);
	const shapedByChar = /* @__PURE__ */ new Map();
	if (shaped) for (const g of shaped.glyphs) shapedByChar.set(g.firstCharacter, g);
	const fallbackBaselines = [];
	const fallbackOffsets = Array.from({ length: node.text.length + 1 }, () => 0);
	let fallbackX = 0;
	let fallbackY = lineHeightFallback;
	let lineStart = 0;
	const glyphs = textGlyphs.map((glyph, index) => {
		const shapedGlyph = shapedByChar.get(index);
		const fallbackGlyphAdvance = glyph.advance || fallbackAdvance;
		if (!shapedGlyph && lineBreakSet.has(index)) {
			fallbackBaselines.push({
				firstCharacter: lineStart,
				endCharacter: index,
				position: {
					x: 0,
					y: fallbackY
				},
				width: fallbackX,
				lineHeight: lineHeightFallback,
				lineAscent
			});
			lineStart = index;
			fallbackX = 0;
			fallbackY += lineHeightFallback;
		}
		const glyphX = fallbackX;
		fallbackOffsets[index] = glyphX;
		fallbackX += fallbackGlyphAdvance;
		return {
			commandsBlob: blobs && glyph.commands.length > 0 ? blobs.push(encodePathCommandsBlob(glyph.commands, node.fontSize)) - 1 : void 0,
			position: {
				x: shapedGlyph?.x ?? glyphX,
				y: shapedGlyph?.y ?? shaped?.baseline ?? fallbackY
			},
			fontSize: node.fontSize,
			firstCharacter: shapedGlyph?.firstCharacter ?? index,
			advance: (shapedGlyph?.advance ?? fallbackGlyphAdvance) / node.fontSize,
			rotation: 0
		};
	});
	fallbackOffsets[node.text.length] = fallbackX;
	if (node.text.length > 0) fallbackBaselines.push({
		firstCharacter: lineStart,
		endCharacter: node.text.length,
		position: {
			x: 0,
			y: fallbackY
		},
		width: fallbackX,
		lineHeight: lineHeightFallback,
		lineAscent
	});
	return buildDerivedTextData({
		node,
		glyphs,
		fontMetaData: [{
			key: {
				family: normalizedFamily,
				style: weightToFigmaStyle(node.fontWeight, node.italic),
				postscript: ""
			},
			fontLineHeight: 1.2,
			fontDigest: digestMap.get(key),
			fontStyle: node.italic ? "ITALIC" : "NORMAL",
			fontWeight: node.fontWeight
		}],
		baseline: shaped?.baseline ?? lineHeightFallback,
		width: shaped?.lineWidth ?? node.width,
		lineHeight: shaped?.lineHeight ?? lineHeightFallback,
		lineAscent: shaped?.lineAscent ?? lineAscent,
		baselines: shaped ? shaped.baselines : fallbackBaselines,
		logicalIndexToCharacterOffsetMap: shaped?.logicalIndexToCharacterOffsetMap ?? fallbackOffsets
	});
}
//#endregion
export { buildDerivedTextDataV4 };

//# sourceMappingURL=clipboard.js.map
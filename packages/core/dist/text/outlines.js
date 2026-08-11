import { weightToStyle } from "./font-style.js";
import { fontManager } from "./fonts.js";
import { fontHasGlyphSync, getGlyphOutlineMetricsSync } from "./opentype.js";
import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext";
//#region src/text/outlines.ts
const COMPLEX_SCRIPT_PATTERN = /[\u0590-\u08ff\u0900-\u0dff\ufb1d-\ufdff\ufe70-\ufeff]/;
function baseTextStyle(node) {
	return {
		fontFamily: node.fontFamily,
		fontSize: node.fontSize,
		fontWeight: node.fontWeight,
		italic: node.italic,
		letterSpacing: node.letterSpacing
	};
}
function styleName(style) {
	return weightToStyle(style.fontWeight, style.italic);
}
function styleKey(style) {
	return `${style.fontFamily}|${styleName(style)}|${style.fontSize}|${style.letterSpacing}`;
}
function textStyleAt(node, index) {
	const base = baseTextStyle(node);
	const run = node.styleRuns.find((item) => index >= item.start && index < item.start + item.length);
	if (!run) return base;
	return {
		fontFamily: run.style.fontFamily ?? base.fontFamily,
		fontSize: run.style.fontSize ?? base.fontSize,
		fontWeight: run.style.fontWeight ?? base.fontWeight,
		italic: run.style.italic ?? base.italic,
		letterSpacing: run.style.letterSpacing ?? base.letterSpacing
	};
}
function resolvedGlyphStyle(style, char) {
	if (fontHasGlyphSync(style.fontFamily, styleName(style), char)) return style;
	const family = fallbackFamilies().find((candidate) => {
		const next = fallbackStyle(style, candidate);
		return fontManager.loadedData(next.fontFamily, styleName(next)) && fontHasGlyphSync(next.fontFamily, styleName(next), char);
	});
	return family ? fallbackStyle(style, family) : null;
}
function fallbackFamilies() {
	return [...fontManager.getCJKFallbackFamilies(), ...fontManager.getArabicFallbackFamilies()];
}
function fallbackStyle(style, family) {
	return {
		...style,
		fontFamily: family
	};
}
function textStyles(node) {
	if (node.styleRuns.length === 0) return [baseTextStyle(node)];
	const styles = /* @__PURE__ */ new Map();
	for (let index = 0; index < node.text.length; index++) {
		const style = textStyleAt(node, index);
		styles.set(styleKey(style), style);
	}
	return [...styles.values()];
}
function getTextOutlineSupport(node) {
	if (node.type !== "TEXT") return {
		supported: false,
		reason: "not-text"
	};
	if (!node.text) return {
		supported: false,
		reason: "empty-text"
	};
	if (COMPLEX_SCRIPT_PATTERN.test(node.text)) return {
		supported: false,
		reason: "complex-script"
	};
	for (const style of textStyles(node)) if (!fontManager.loadedData(style.fontFamily, styleName(style))) return {
		supported: false,
		reason: "missing-font"
	};
	for (let index = 0; index < node.text.length; index++) {
		const char = node.text[index];
		if (char === "\n") continue;
		if (!resolvedGlyphStyle(textStyleAt(node, index), char)) return {
			supported: false,
			reason: "missing-glyph"
		};
	}
	return { supported: true };
}
function lineHeight(node) {
	return node.lineHeight ?? Math.ceil(node.fontSize * 1.2);
}
function hardTextLines(text) {
	const lines = [];
	let start = 0;
	for (const line of text.split("\n")) {
		lines.push({
			text: line,
			start
		});
		start += line.length + 1;
	}
	return lines;
}
function glyphAdvance(node, absoluteIndex) {
	const char = node.text[absoluteIndex];
	const style = resolvedGlyphStyle(textStyleAt(node, absoluteIndex), char);
	if (!style) return null;
	const glyph = getGlyphOutlineMetricsSync(style.fontFamily, styleName(style), char, style.fontSize)?.[0];
	return glyph ? glyph.advance + style.letterSpacing : null;
}
function wrapStyledLine(node, line) {
	if (!line.text || node.width <= 0) return [line];
	const result = [];
	let lineStart = 0;
	let cursor = 0;
	let lastBreak = -1;
	for (let index = 0; index < line.text.length; index++) {
		const advance = glyphAdvance(node, line.start + index);
		if (advance == null) return [line];
		cursor += advance;
		if (/\s/.test(line.text[index])) lastBreak = index + 1;
		if (cursor <= node.width || index === lineStart) continue;
		const breakIndex = lastBreak > lineStart ? lastBreak : index;
		result.push({
			text: line.text.slice(lineStart, breakIndex),
			start: line.start + lineStart
		});
		lineStart = breakIndex;
		index = breakIndex - 1;
		cursor = 0;
		lastBreak = -1;
	}
	result.push({
		text: line.text.slice(lineStart),
		start: line.start + lineStart
	});
	return result;
}
function textLines(node) {
	const hardLines = hardTextLines(node.text);
	if (node.textAutoResize === "WIDTH_AND_HEIGHT") return hardLines;
	if (node.styleRuns.length > 0) return hardLines.flatMap((line) => wrapStyledLine(node, line));
	const result = [];
	for (const hardLine of hardLines) {
		if (!hardLine.text) {
			result.push(hardLine);
			continue;
		}
		try {
			const layout = layoutWithLines(prepareWithSegments(hardLine.text, `${node.fontSize}px ${node.fontFamily}`), node.width, lineHeight(node));
			let start = hardLine.start;
			for (const line of layout.lines) {
				result.push({
					text: line.text,
					start
				});
				start += line.text.length;
			}
		} catch {
			result.push(hardLine);
		}
	}
	return result;
}
function lineOffsetX(node, width) {
	switch (node.textAlignHorizontal) {
		case "CENTER": return Math.max(0, (node.width - width) / 2);
		case "RIGHT": return Math.max(0, node.width - width);
		default: return 0;
	}
}
function verticalOffset(node, contentHeight) {
	switch (node.textAlignVertical) {
		case "CENTER": return Math.max(0, (node.height - contentHeight) / 2);
		case "BOTTOM": return Math.max(0, node.height - contentHeight);
		default: return 0;
	}
}
function lineGlyphs(node, line, baseline, xOffset) {
	const glyphs = [];
	let cursorX = xOffset;
	let index = 0;
	while (index < line.text.length) {
		const style = resolvedGlyphStyle(textStyleAt(node, line.start + index), line.text[index]);
		if (!style) return null;
		const key = styleKey(style);
		let end = index + 1;
		while (end < line.text.length) {
			const nextStyle = resolvedGlyphStyle(textStyleAt(node, line.start + end), line.text[end]);
			if (!nextStyle || styleKey(nextStyle) !== key) break;
			end++;
		}
		const segment = line.text.slice(index, end);
		const metrics = getGlyphOutlineMetricsSync(style.fontFamily, styleName(style), segment, style.fontSize);
		if (!metrics) return null;
		for (const glyph of metrics) {
			glyphs.push({
				commands: glyph.commands,
				x: cursorX,
				y: baseline
			});
			cursorX += glyph.advance + style.letterSpacing;
		}
		index = end;
	}
	return {
		glyphs,
		width: cursorX - xOffset
	};
}
function textNodeToOutlineLayout(node) {
	if (!getTextOutlineSupport(node).supported) return null;
	const lines = textLines(node);
	const lineH = lineHeight(node);
	const contentHeight = lines.length * lineH;
	const yOffset = verticalOffset(node, contentHeight);
	const glyphs = [];
	let maxWidth = 0;
	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		const baseline = yOffset + lineIndex * lineH + lineH;
		const measured = lineGlyphs(node, lines[lineIndex], baseline, 0);
		if (!measured) return null;
		const xOffset = lineOffsetX(node, measured.width);
		maxWidth = Math.max(maxWidth, measured.width);
		const placed = xOffset === 0 ? measured.glyphs : measured.glyphs.map((glyph) => ({
			...glyph,
			x: glyph.x + xOffset
		}));
		glyphs.push(...placed);
	}
	return {
		glyphs,
		width: maxWidth,
		height: contentHeight
	};
}
//#endregion
export { getTextOutlineSupport, textNodeToOutlineLayout };

//# sourceMappingURL=outlines.js.map
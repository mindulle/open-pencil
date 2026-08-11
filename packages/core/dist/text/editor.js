import { resolveNodeTextDirection } from "./direction.js";
//#region src/text/editor.ts
var TextEditor = class {
	ck;
	renderer = null;
	_state = null;
	paragraphNode = null;
	caretVisible = true;
	constructor(ck) {
		this.ck = ck;
	}
	prepareMove(extend) {
		const s = this._state;
		if (!s) return null;
		if (extend && s.selectionAnchor === null) s.selectionAnchor = s.cursor;
		if (!extend) s.selectionAnchor = null;
		return s;
	}
	replaceRange(start, end, text) {
		const s = this._state;
		if (!s) return null;
		s.text = s.text.slice(0, start) + text + s.text.slice(end);
		s.cursor = start + text.length;
		s.selectionAnchor = null;
		return s;
	}
	currentLineMetrics() {
		const s = this._state;
		if (!s?.paragraph) return null;
		const lineNum = s.paragraph.getLineNumberAt(s.cursor);
		return lineNum < 0 ? null : s.paragraph.getLineMetricsAt(lineNum);
	}
	collapseSelectionTo(edge) {
		const s = this._state;
		if (!s || !this.hasSelection()) return false;
		const range = this.getSelectionRange();
		if (range) s.cursor = range[edge];
		s.selectionAnchor = null;
		return true;
	}
	get state() {
		const state = this._state;
		if (state && this.renderer && this.paragraphNode && state.paragraphFontGeneration !== this.renderer.fontGeneration) this.rebuildParagraph(this.paragraphNode);
		return state;
	}
	get isActive() {
		return this._state !== null;
	}
	get nodeId() {
		return this._state?.nodeId ?? null;
	}
	setRenderer(renderer) {
		this.renderer = renderer;
	}
	start(node) {
		this._state = {
			nodeId: node.id,
			text: node.text,
			cursor: node.text.length,
			selectionAnchor: null,
			paragraph: null,
			paragraphFontGeneration: -1,
			textDirection: resolveNodeTextDirection(node)
		};
		this.rebuildParagraph(node);
	}
	stop() {
		if (!this._state) return null;
		const result = {
			nodeId: this._state.nodeId,
			text: this._state.text
		};
		this._state.paragraph?.delete();
		this._state = null;
		this.paragraphNode = null;
		return result;
	}
	rebuildParagraph(node) {
		const s = this._state;
		if (!s || !this.renderer) return;
		s.paragraph?.delete();
		this.paragraphNode = node;
		s.textDirection = resolveNodeTextDirection(node);
		s.paragraph = this.renderer.buildParagraph({
			...node,
			text: s.text
		});
		s.paragraphFontGeneration = this.renderer.fontGeneration;
	}
	hasSelection() {
		const s = this._state;
		return s !== null && s.selectionAnchor !== null && s.selectionAnchor !== s.cursor;
	}
	getSelectionRange() {
		const s = this._state;
		if (!s || s.selectionAnchor === null || s.selectionAnchor === s.cursor) return null;
		return [Math.min(s.cursor, s.selectionAnchor), Math.max(s.cursor, s.selectionAnchor)];
	}
	getSelectedText() {
		const range = this.getSelectionRange();
		if (!range || !this._state) return "";
		return this._state.text.slice(range[0], range[1]);
	}
	selectAll() {
		const s = this._state;
		if (!s) return;
		s.selectionAnchor = 0;
		s.cursor = s.text.length;
	}
	selectWord(pos) {
		const s = this._state;
		if (!s) return;
		const text = s.text;
		let start = pos;
		let end = pos;
		while (start > 0 && !isWordBoundary(text[start - 1])) start--;
		while (end < text.length && !isWordBoundary(text[end])) end++;
		s.selectionAnchor = start;
		s.cursor = end;
	}
	setCursorAt(x, y, extend = false) {
		const s = this._state;
		if (!s?.paragraph) return;
		const pos = s.paragraph.getGlyphPositionAtCoordinate(x, y).pos;
		if (extend) {
			if (s.selectionAnchor === null) s.selectionAnchor = s.cursor;
		} else s.selectionAnchor = null;
		s.cursor = pos;
	}
	selectLine(pos) {
		const s = this._state;
		if (!s?.paragraph) return;
		const lineNum = s.paragraph.getLineNumberAt(pos);
		if (lineNum < 0) return;
		const metrics = s.paragraph.getLineMetricsAt(lineNum);
		if (!metrics) return;
		s.selectionAnchor = metrics.startIndex;
		s.cursor = metrics.endExcludingWhitespaces;
	}
	selectWordAt(x, y) {
		const s = this._state;
		if (!s?.paragraph) return;
		const pos = s.paragraph.getGlyphPositionAtCoordinate(x, y).pos;
		this.selectWord(pos);
	}
	selectLineAt(x, y) {
		const s = this._state;
		if (!s?.paragraph) return;
		const pos = s.paragraph.getGlyphPositionAtCoordinate(x, y).pos;
		this.selectLine(pos);
	}
	insert(text, node) {
		const s = this._state;
		if (!s) return;
		const range = this.getSelectionRange() ?? [s.cursor, s.cursor];
		this.replaceRange(range[0], range[1], text);
		this.rebuildParagraph(node);
	}
	backspace(node) {
		const s = this._state;
		if (!s) return;
		const range = this.getSelectionRange() ?? (s.cursor > 0 ? [s.cursor - 1, s.cursor] : null);
		if (range) this.replaceRange(range[0], range[1], "");
		this.rebuildParagraph(node);
	}
	delete(node) {
		const s = this._state;
		if (!s) return;
		const range = this.getSelectionRange() ?? (s.cursor < s.text.length ? [s.cursor, s.cursor + 1] : null);
		if (range) this.replaceRange(range[0], range[1], "");
		this.rebuildParagraph(node);
	}
	moveHorizontal(extend, visualDirection) {
		const s = this._state;
		if (!s) return;
		if (!extend && this.collapseSelectionTo(visualDirection === "left" ? 0 : 1)) return;
		this.prepareMove(extend);
		const step = visualDirection === "left" === (s.textDirection === "RTL") ? 1 : -1;
		const next = s.cursor + step;
		if (next >= 0 && next <= s.text.length) s.cursor = next;
	}
	moveLeft(extend = false) {
		this.moveHorizontal(extend, "left");
	}
	moveRight(extend = false) {
		this.moveHorizontal(extend, "right");
	}
	moveVertical(extend, edge) {
		const s = this._state;
		if (!s?.paragraph) return;
		this.prepareMove(extend);
		const caret = this.getCaretRect();
		if (!caret) return;
		const fontSize = s.paragraph.getLineMetrics()[0]?.height ?? 14;
		const y = edge === "up" ? caret.y0 - fontSize / 2 : caret.y1 + fontSize / 2;
		s.cursor = s.paragraph.getGlyphPositionAtCoordinate(caret.x, y).pos;
	}
	moveUp(extend = false) {
		this.moveVertical(extend, "up");
	}
	moveDown(extend = false) {
		this.moveVertical(extend, "down");
	}
	moveToLineEdge(extend, edge) {
		const s = this._state;
		if (!s?.paragraph) return;
		this.prepareMove(extend);
		const metrics = this.currentLineMetrics();
		if (!metrics) return;
		const isRTLStart = s.textDirection === "RTL" && edge === "start";
		const isLTREnd = s.textDirection !== "RTL" && edge === "end";
		s.cursor = isRTLStart || isLTREnd ? metrics.endExcludingWhitespaces : metrics.startIndex;
	}
	moveToLineStart(extend = false) {
		this.moveToLineEdge(extend, "start");
	}
	moveToLineEnd(extend = false) {
		this.moveToLineEdge(extend, "end");
	}
	moveWord(extend, direction) {
		const s = this.prepareMove(extend);
		if (!s) return;
		const movingLeft = direction === "left";
		let pos = this.skipWordBoundaryRun(s.text, s.cursor, movingLeft);
		pos = this.skipWordInteriorRun(s.text, pos, movingLeft);
		s.cursor = pos;
	}
	skipWordBoundaryRun(text, start, movingLeft) {
		return this.advanceWhile(text, start, movingLeft, (boundary) => movingLeft === boundary);
	}
	skipWordInteriorRun(text, start, movingLeft) {
		return this.advanceWhile(text, start, movingLeft, (boundary) => movingLeft !== boundary);
	}
	advanceWhile(text, start, movingLeft, shouldMove) {
		let pos = start;
		const step = movingLeft ? -1 : 1;
		while (movingLeft ? pos > 0 : pos < text.length) {
			if (!shouldMove(isWordBoundary(movingLeft ? text[pos - 1] : text[pos]))) break;
			pos += step;
		}
		return pos;
	}
	moveWordLeft(extend = false) {
		this.moveWord(extend, "left");
	}
	moveWordRight(extend = false) {
		this.moveWord(extend, "right");
	}
	getCaretRect() {
		const s = this._state;
		if (!s?.paragraph) return null;
		const text = s.text;
		const cursor = s.cursor;
		if (text.length === 0) {
			const metrics = s.paragraph.getLineMetrics();
			if (metrics.length === 0) return null;
			const line = metrics[0];
			return {
				x: line.left,
				y0: 0,
				y1: line.height
			};
		}
		let lo;
		let hi;
		let useRight = false;
		if (cursor === 0) {
			lo = 0;
			hi = 1;
			useRight = s.textDirection === "RTL";
		} else if (cursor >= text.length) {
			lo = text.length - 1;
			hi = text.length;
			useRight = s.textDirection !== "RTL";
		} else {
			lo = cursor;
			hi = cursor + 1;
		}
		const rects = s.paragraph.getRectsForRange(lo, hi, this.ck.RectHeightStyle.Max, this.ck.RectWidthStyle.Tight);
		if (rects.length === 0) return null;
		const [left, top, right, bottom] = rects[0].rect;
		return {
			x: useRight ? right : left,
			y0: top,
			y1: bottom
		};
	}
	getSelectionRects() {
		const s = this._state;
		if (!s?.paragraph) return [];
		const range = this.getSelectionRange();
		if (!range) return [];
		return s.paragraph.getRectsForRange(range[0], range[1], this.ck.RectHeightStyle.Max, this.ck.RectWidthStyle.Tight).map((r) => {
			const [left, top, right, bottom] = r.rect;
			return {
				x: left,
				y: top,
				width: right - left,
				height: bottom - top
			};
		});
	}
};
function isWordBoundary(ch) {
	return /\s|[.,;:!?()[\]{}"'`<>/\\|@#$%^&*~+=\-_]/.test(ch);
}
//#endregion
export { TextEditor };

//# sourceMappingURL=editor.js.map
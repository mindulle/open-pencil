import { omit } from "es-toolkit/object";
//#region src/text/style-runs.ts
function getStyleAt(runs, index) {
	for (const run of runs) if (index >= run.start && index < run.start + run.length) return run.style;
	return {};
}
function expandRuns(runs, textLength) {
	const chars = Array.from({ length: textLength }, () => null);
	for (const run of runs) for (let i = run.start; i < run.start + run.length && i < textLength; i++) chars[i] = {
		...chars[i],
		...run.style
	};
	return chars;
}
function applyStyleToRange(runs, start, end, patch, textLength) {
	const chars = expandRuns(runs, textLength);
	for (let i = start; i < end && i < textLength; i++) chars[i] = {
		...chars[i],
		...patch
	};
	return compactRuns(chars);
}
function removeStyleFromRange(runs, start, end, keys, textLength) {
	const chars = expandRuns(runs, textLength);
	for (let i = start; i < end && i < textLength; i++) if (chars[i]) {
		const current = chars[i];
		if (!current) continue;
		const copy = omit(current, keys);
		chars[i] = Object.keys(copy).length > 0 ? copy : null;
	}
	return compactRuns(chars);
}
function selectionHasStyle(runs, start, end, key, value) {
	for (let i = start; i < end; i++) if (getStyleAt(runs, i)[key] !== value) return false;
	return true;
}
function stylesEqual(a, b) {
	if (a === b) return true;
	if (!a || !b) return a === b;
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) return false;
	for (const k of aKeys) if (a[k] !== b[k]) return false;
	return true;
}
function isEmptyStyle(style) {
	return !style || Object.keys(style).length === 0;
}
function compactRuns(chars) {
	const result = [];
	let i = 0;
	while (i < chars.length) {
		if (isEmptyStyle(chars[i])) {
			i++;
			continue;
		}
		const start = i;
		const style = chars[i];
		if (!style) {
			i++;
			continue;
		}
		while (i < chars.length && stylesEqual(chars[i], style)) i++;
		result.push({
			start,
			length: i - start,
			style: { ...style }
		});
	}
	return result;
}
function adjustRunsForInsert(runs, pos, insertLength) {
	return runs.map((run) => {
		if (pos <= run.start) return {
			...run,
			start: run.start + insertLength
		};
		if (pos > run.start && pos < run.start + run.length) return {
			...run,
			length: run.length + insertLength
		};
		return run;
	});
}
function adjustRunsForDelete(runs, start, deleteLength) {
	const end = start + deleteLength;
	const result = [];
	for (const run of runs) {
		const runEnd = run.start + run.length;
		if (runEnd <= start) result.push(run);
		else if (run.start >= end) result.push({
			...run,
			start: run.start - deleteLength
		});
		else {
			const newStart = Math.max(run.start, start);
			const removed = Math.min(runEnd, end) - newStart;
			const newLength = run.length - removed;
			if (newLength > 0) result.push({
				...run,
				start: Math.min(run.start, start),
				length: newLength
			});
		}
	}
	return result;
}
function toggleBoldInRange(runs, start, end, nodeWeight, textLength) {
	const allBold = selectionAllBold(runs, start, end, nodeWeight);
	const targetWeight = allBold ? 400 : 700;
	return {
		runs: allBold ? removeStyleFromRange(runs, start, end, ["fontWeight"], textLength) : applyStyleToRange(runs, start, end, { fontWeight: 700 }, textLength),
		newWeight: targetWeight
	};
}
function selectionAllBold(runs, start, end, nodeWeight) {
	for (let i = start; i < end; i++) if ((getStyleAt(runs, i).fontWeight ?? nodeWeight) < 700) return false;
	return true;
}
function toggleItalicInRange(runs, start, end, nodeItalic, textLength) {
	const allItalic = selectionAllItalic(runs, start, end, nodeItalic);
	return {
		runs: allItalic ? removeStyleFromRange(runs, start, end, ["italic"], textLength) : applyStyleToRange(runs, start, end, { italic: true }, textLength),
		newItalic: !allItalic
	};
}
function selectionAllItalic(runs, start, end, nodeItalic) {
	for (let i = start; i < end; i++) if (!(getStyleAt(runs, i).italic ?? nodeItalic)) return false;
	return true;
}
function toggleDecorationInRange(runs, start, end, deco, nodeDeco, textLength) {
	const allHave = selectionAllHasDecoration(runs, start, end, deco, nodeDeco);
	return {
		runs: allHave ? removeStyleFromRange(runs, start, end, ["textDecoration"], textLength) : applyStyleToRange(runs, start, end, { textDecoration: deco }, textLength),
		newDeco: allHave ? "NONE" : deco
	};
}
function selectionAllHasDecoration(runs, start, end, deco, nodeDeco) {
	for (let i = start; i < end; i++) if ((getStyleAt(runs, i).textDecoration ?? nodeDeco) !== deco) return false;
	return true;
}
//#endregion
export { adjustRunsForDelete, adjustRunsForInsert, applyStyleToRange, getStyleAt, removeStyleFromRange, selectionHasStyle, toggleBoldInRange, toggleDecorationInRange, toggleItalicInRange };

//# sourceMappingURL=style-runs.js.map
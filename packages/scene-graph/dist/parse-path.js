import svgpath from "svgpath";
//#region src/parse-path.ts
/**
* Parse an SVG path `d` attribute into a VectorNetwork.
*
* Uses `svgpath` to normalize all commands to absolute M/L/C/Z
* (arcs → cubics via `.unarc()`, smooth curves → explicit via `.unshort()`).
*/
function parseSVGPath(d, windingRule = "NONZERO") {
	const parsed = parsePath(d, windingRule, {
		includeOpenRegions: false,
		strictCommands: false
	});
	return parsed.ok ? parsed.network : {
		vertices: [],
		segments: [],
		regions: []
	};
}
/** Parse the strict absolute command subset accepted by Figma's VectorPath API. */
function parsePluginVectorPath(d, windingRule) {
	return parsePath(d, windingRule, {
		includeOpenRegions: windingRule !== "NONE",
		strictCommands: true
	});
}
function parsePath(d, windingRule, options) {
	const vertices = [];
	const segments = [];
	const subPaths = [];
	let currentSubPath = null;
	let cx = 0;
	let cy = 0;
	const vertexMap = /* @__PURE__ */ new Map();
	function getOrCreateVertex(x, y) {
		const key = `${x},${y}`;
		const existing = vertexMap.get(key);
		if (existing !== void 0) return existing;
		const idx = vertices.length;
		vertices.push({
			x,
			y
		});
		vertexMap.set(key, idx);
		return idx;
	}
	function addSegment(x1, y1, x2, y2, tx1, ty1, tx2, ty2) {
		const startIdx = getOrCreateVertex(x1, y1);
		const endIdx = getOrCreateVertex(x2, y2);
		const segIdx = segments.length;
		segments.push({
			start: startIdx,
			end: endIdx,
			tangentStart: {
				x: tx1 - x1,
				y: ty1 - y1
			},
			tangentEnd: {
				x: tx2 - x2,
				y: ty2 - y2
			}
		});
		if (currentSubPath) currentSubPath.segmentIndices.push(segIdx);
	}
	function addLine(x1, y1, x2, y2) {
		addSegment(x1, y1, x2, y2, x1, y1, x2, y2);
	}
	function addCubic(x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2) {
		addSegment(x1, y1, x2, y2, cp1x, cp1y, cp2x, cp2y);
	}
	const parsed = svgpath(d);
	const parseError = "err" in parsed && typeof parsed.err === "string" ? parsed.err : null;
	if (parseError) return {
		ok: false,
		error: parseError
	};
	if (options.strictCommands) {
		const unsupportedCommands = /* @__PURE__ */ new Set();
		parsed.iterate((segment) => {
			if (![
				"M",
				"L",
				"Q",
				"C",
				"Z"
			].includes(segment[0])) unsupportedCommands.add(segment[0]);
		});
		const unsupportedCommand = unsupportedCommands.values().next().value;
		if (unsupportedCommand !== void 0) return {
			ok: false,
			error: `Unsupported path command ${unsupportedCommand}`
		};
	}
	parsed.abs().unshort().unarc().iterate((seg) => {
		const cmd = seg[0];
		if (cmd === "M") {
			cx = seg[1];
			cy = seg[2];
			currentSubPath = {
				startVertexIndex: getOrCreateVertex(cx, cy),
				segmentIndices: [],
				closed: false
			};
			subPaths.push(currentSubPath);
		} else if (cmd === "L") {
			addLine(cx, cy, seg[1], seg[2]);
			cx = seg[1];
			cy = seg[2];
		} else if (cmd === "H") {
			addLine(cx, cy, seg[1], cy);
			cx = seg[1];
		} else if (cmd === "V") {
			addLine(cx, cy, cx, seg[1]);
			cy = seg[1];
		} else if (cmd === "C") {
			addCubic(cx, cy, seg[1], seg[2], seg[3], seg[4], seg[5], seg[6]);
			cx = seg[5];
			cy = seg[6];
		} else if (cmd === "Q") {
			const qx = seg[1];
			const qy = seg[2];
			const ex = seg[3];
			const ey = seg[4];
			const cp1x = cx + 2 / 3 * (qx - cx);
			const cp1y = cy + 2 / 3 * (qy - cy);
			const cp2x = ex + 2 / 3 * (qx - ex);
			const cp2y = ey + 2 / 3 * (qy - ey);
			addCubic(cx, cy, cp1x, cp1y, cp2x, cp2y, ex, ey);
			cx = ex;
			cy = ey;
		} else if (cmd === "Z" || cmd === "z") {
			if (currentSubPath) {
				const startVert = vertices[currentSubPath.startVertexIndex];
				if (Math.abs(cx - startVert.x) > .001 || Math.abs(cy - startVert.y) > .001) addLine(cx, cy, startVert.x, startVert.y);
				currentSubPath.closed = true;
				cx = startVert.x;
				cy = startVert.y;
			}
		}
	});
	const regions = [];
	const regionPaths = subPaths.filter((subPath) => windingRule !== "NONE" && subPath.segmentIndices.length > 0 && (subPath.closed || options.includeOpenRegions));
	if (regionPaths.length > 0 && windingRule !== "NONE") regions.push({
		windingRule,
		loops: regionPaths.map((subPath) => subPath.segmentIndices)
	});
	return {
		ok: true,
		network: {
			vertices,
			segments,
			regions
		}
	};
}
//#endregion
export { parsePluginVectorPath, parseSVGPath };

//# sourceMappingURL=parse-path.js.map
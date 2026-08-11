//#region src/matrix.ts
const identity = () => [
	1,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	1
];
const multiply2 = (m1, m2) => {
	return [
		m1[0] * m2[0] + m1[1] * m2[3] + m1[2] * m2[6],
		m1[0] * m2[1] + m1[1] * m2[4] + m1[2] * m2[7],
		m1[0] * m2[2] + m1[1] * m2[5] + m1[2] * m2[8],
		m1[3] * m2[0] + m1[4] * m2[3] + m1[5] * m2[6],
		m1[3] * m2[1] + m1[4] * m2[4] + m1[5] * m2[7],
		m1[3] * m2[2] + m1[4] * m2[5] + m1[5] * m2[8],
		m1[6] * m2[0] + m1[7] * m2[3] + m1[8] * m2[6],
		m1[6] * m2[1] + m1[7] * m2[4] + m1[8] * m2[7],
		m1[6] * m2[2] + m1[7] * m2[5] + m1[8] * m2[8]
	];
};
const multiply = (...ms) => {
	if (ms.length === 0) return identity();
	let out = ms[0].slice();
	for (let i = 1; i < ms.length; i++) out = multiply2(out, ms[i]);
	return out;
};
const translated = (dx, dy) => [
	1,
	0,
	dx,
	0,
	1,
	dy,
	0,
	0,
	1
];
const rotated = (radians, px = 0, py = 0) => {
	const s = Math.sin(radians);
	const c = Math.cos(radians);
	return [
		c,
		-s,
		s * py + (1 - c) * px,
		s,
		c,
		-s * px + (1 - c) * py,
		0,
		0,
		1
	];
};
const scaled = (sx, sy, px = 0, py = 0) => {
	return [
		sx,
		0,
		px - sx * px,
		0,
		sy,
		py - sy * py,
		0,
		0,
		1
	];
};
const invert = (m) => {
	const det = m[0] * m[4] * m[8] + m[1] * m[5] * m[6] + m[2] * m[3] * m[7] - m[2] * m[4] * m[6] - m[1] * m[3] * m[8] - m[0] * m[5] * m[7];
	if (!det) return null;
	return [
		(m[4] * m[8] - m[5] * m[7]) / det,
		(m[2] * m[7] - m[1] * m[8]) / det,
		(m[1] * m[5] - m[2] * m[4]) / det,
		(m[5] * m[6] - m[3] * m[8]) / det,
		(m[0] * m[8] - m[2] * m[6]) / det,
		(m[2] * m[3] - m[0] * m[5]) / det,
		(m[3] * m[7] - m[4] * m[6]) / det,
		(m[1] * m[6] - m[0] * m[7]) / det,
		(m[0] * m[4] - m[1] * m[3]) / det
	];
};
const mapPoints = (matrix, ptArr) => {
	if (ptArr.length % 2) throw new Error("mapPoints requires even length [x,y,...].");
	const out = ptArr.slice();
	for (let i = 0; i < out.length; i += 2) {
		const x = out[i];
		const y = out[i + 1];
		const denom = matrix[6] * x + matrix[7] * y + matrix[8];
		const xTrans = matrix[0] * x + matrix[1] * y + matrix[2];
		const yTrans = matrix[3] * x + matrix[4] * y + matrix[5];
		out[i] = xTrans / denom;
		out[i + 1] = yTrans / denom;
	}
	return out;
};
const mapPoint = (m, p) => {
	const arr = mapPoints(m, [p.x, p.y]);
	return {
		x: arr[0],
		y: arr[1]
	};
};
const Matrix = {
	identity,
	multiply,
	translated,
	rotated,
	scaled,
	invert,
	mapPoints,
	mapPoint
};
//#endregion
//#region src/coordinate.ts
function getWorldMatrix(node, graph) {
	const chain = [];
	let current = node;
	while (current) {
		chain.unshift(current);
		if (!current.parentId) break;
		current = graph.getNode(current.parentId);
	}
	let matrix = Matrix.identity();
	for (const n of chain) {
		const local = getNodeLocalMatrix(n);
		matrix = Matrix.multiply(matrix, local);
	}
	return matrix;
}
function getAbsolutePosition(node, graph) {
	const matrix = getWorldMatrix(node, graph);
	const p = Matrix.mapPoints(matrix, [0, 0]);
	return {
		x: p[0],
		y: p[1]
	};
}
function getAbsoluteRotation(node, graph) {
	const matrix = getWorldMatrix(node, graph);
	const a = matrix[0];
	const b = matrix[1];
	let deg = Math.atan2(b, a) * 180 / Math.PI;
	deg = (deg + 360) % 360;
	return deg;
}
function getAbsolutePositionFull(node, graph) {
	const matrix = getWorldMatrix(node, graph);
	const origin = Matrix.mapPoints(matrix, [0, 0]);
	const x = origin[0];
	const y = origin[1];
	const [x1, y1, x2, y2, x3, y3, x4, y4] = Matrix.mapPoints(matrix, [
		0,
		0,
		node.width,
		0,
		node.width,
		node.height,
		0,
		node.height
	]);
	const minX = Math.min(x1, x2, x3, x4);
	const maxX = Math.max(x1, x2, x3, x4);
	const minY = Math.min(y1, y2, y3, y4);
	const maxY = Math.max(y1, y2, y3, y4);
	const width = maxX - minX;
	const height = maxY - minY;
	let angle = Math.atan2(matrix[3], matrix[0]);
	if (matrix[0] * matrix[4] - matrix[1] * matrix[3] < 0) angle = -angle;
	const rotation = angle * (180 / Math.PI);
	const center = Matrix.mapPoints(matrix, [node.width / 2, node.height / 2]);
	return {
		x,
		y,
		boundX: minX,
		boundY: minY,
		width,
		height,
		rotation,
		centerX: center[0],
		centerY: center[1]
	};
}
function getNodeLocalMatrix(n) {
	const rad = n.rotation * Math.PI / 180;
	const cx = n.width / 2;
	const cy = n.height / 2;
	const sx = n.flipX ? -1 : 1;
	const sy = n.flipY ? -1 : 1;
	let m = Matrix.identity();
	m = Matrix.multiply(m, Matrix.translated(n.x, n.y));
	m = Matrix.multiply(m, Matrix.translated(cx, cy));
	if (n.flipX || n.flipY) m = Matrix.multiply(m, Matrix.scaled(sx, sy));
	if (n.rotation) m = Matrix.multiply(m, Matrix.rotated(rad, 0, 0));
	m = Matrix.multiply(m, Matrix.translated(-cx, -cy));
	return m;
}
function getNodeWorldBounds(node) {
	const m = getNodeLocalMatrix(node);
	const points = Matrix.mapPoints(m, [
		0,
		0,
		node.width,
		0,
		node.width,
		node.height,
		0,
		node.height
	]);
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (let i = 0; i < points.length; i += 2) {
		const x = points[i];
		const y = points[i + 1];
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	}
	return {
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY
	};
}
function getWorldHandles(node, graph) {
	const matrix = getWorldMatrix(node, graph);
	const w = node.width;
	const h = node.height;
	const localPts = [
		0,
		0,
		w / 2,
		0,
		w,
		0,
		w,
		h / 2,
		w,
		h,
		w / 2,
		h,
		0,
		h,
		0,
		h / 2
	];
	const pts = Matrix.mapPoints(matrix, localPts);
	return {
		nw: {
			x: pts[0],
			y: pts[1]
		},
		n: {
			x: pts[2],
			y: pts[3]
		},
		ne: {
			x: pts[4],
			y: pts[5]
		},
		e: {
			x: pts[6],
			y: pts[7]
		},
		se: {
			x: pts[8],
			y: pts[9]
		},
		s: {
			x: pts[10],
			y: pts[11]
		},
		sw: {
			x: pts[12],
			y: pts[13]
		},
		w: {
			x: pts[14],
			y: pts[15]
		}
	};
}
//#endregion
export { Matrix, getAbsolutePosition, getAbsolutePositionFull, getAbsoluteRotation, getNodeLocalMatrix, getNodeWorldBounds, getWorldHandles, getWorldMatrix };

//# sourceMappingURL=coordinate.js.map
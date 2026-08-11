import { clampRot, round2 } from "./style.js";
import { TransformMatrix, getWorldMatrix } from "@open-pencil/scene-graph";
//#region src/io/formats/pptx/geometry.ts
const MIN_SIZE_IN = .01;
const MATRIX_EPSILON = 1e-6;
function inch(ctx, px) {
	return px / ctx.pxPerInch;
}
/** px → pt. 1in = 96px (scene units) = 72pt. */
function pt(ctx, px) {
	return px * 72 / ctx.pxPerInch;
}
function nodeBox(ctx, node) {
	const transform = getNodeTransform(ctx, node);
	const [centerX, centerY] = TransformMatrix.mapPoints(transform.matrix, [node.width / 2, node.height / 2]);
	const w = Math.max(inch(ctx, node.width * transform.scaleX), MIN_SIZE_IN);
	const h = Math.max(inch(ctx, node.height * transform.scaleY), MIN_SIZE_IN);
	return {
		x: ctx.offsetX + inch(ctx, centerX) - w / 2,
		y: ctx.offsetY + inch(ctx, centerY) - h / 2,
		w,
		h,
		rotate: clampRot(round2(transform.radians * 180 / Math.PI)),
		flipH: transform.mirrored
	};
}
function hasUnsupportedTransform(ctx, node) {
	const { matrix, scaleX, scaleY } = getNodeTransform(ctx, node);
	if (scaleX <= MATRIX_EPSILON || scaleY <= MATRIX_EPSILON) return true;
	if (Math.abs(matrix[6]) > MATRIX_EPSILON || Math.abs(matrix[7]) > MATRIX_EPSILON || Math.abs(matrix[8] - 1) > MATRIX_EPSILON) return true;
	const basisDot = matrix[0] * matrix[1] + matrix[3] * matrix[4];
	return Math.abs(basisDot) > MATRIX_EPSILON * scaleX * scaleY;
}
function transformNodeVector(ctx, node, vector) {
	const { matrix } = getNodeTransform(ctx, node);
	return {
		x: inch(ctx, matrix[0] * vector.x + matrix[1] * vector.y),
		y: inch(ctx, matrix[3] * vector.x + matrix[4] * vector.y)
	};
}
function nodeScale(ctx, node) {
	const { scaleX, scaleY } = getNodeTransform(ctx, node);
	return {
		x: scaleX,
		y: scaleY
	};
}
function getNodeTransform(ctx, node) {
	const matrix = TransformMatrix.multiply(ctx.toSlideSpace, getWorldMatrix(node, ctx.graph));
	const scaleX = Math.hypot(matrix[0], matrix[3]);
	const scaleY = Math.hypot(matrix[1], matrix[4]);
	const mirrored = matrix[0] * matrix[4] - matrix[1] * matrix[3] < 0;
	return {
		matrix,
		scaleX,
		scaleY,
		mirrored,
		radians: mirrored ? Math.atan2(-matrix[3], matrix[4]) : Math.atan2(matrix[3], matrix[0])
	};
}
//#endregion
export { hasUnsupportedTransform, inch, nodeBox, nodeScale, pt, transformNodeVector };

//# sourceMappingURL=geometry.js.map
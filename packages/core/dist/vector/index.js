import { computeAccurateBounds, nearestPointOnNetwork } from "./curve-math.js";
import { addLoopToPath, addOpenSegmentsToPath } from "./path-helpers.js";
import { regenerateFillGeometry } from "./fill-geometry.js";
import { createVectorFrameChildren, resolveVectorFramePlacement } from "./vectorize/placement.js";
import { preprocessForVectorize } from "./vectorize/preprocess.js";
import { svgToVectorPaths } from "./vectorize/svg/to-vectors.js";
import { breakAtVertex, deleteVertex, findAllHandles, findOppositeHandle, mirrorHandle, removeVertex, splitSegmentAt } from "./bezier.js";
import { fitCircleArc, isClosedThinCrescent, vectorNetworkToCenterlinePath } from "./centerline.js";
import { buildStyleOverrideTable, decodeVectorNetworkBlob, encodeVectorNetworkBlob } from "@open-pencil/fig/node-change";
//#region src/vector/index.ts
function vectorNetworkToPath(ck, network) {
	const { vertices, segments, regions } = network;
	if (regions.length > 0) {
		const paths = [];
		for (const region of regions) {
			const regionPath = new ck.Path();
			for (const loop of region.loops) addLoopToPath(regionPath, loop, segments, vertices);
			regionPath.setFillType(region.windingRule === "EVENODD" ? ck.FillType.EvenOdd : ck.FillType.Winding);
			paths.push(regionPath);
		}
		return paths;
	}
	const path = new ck.Path();
	addOpenSegmentsToPath(path, segments, vertices);
	return [path];
}
const CMD_CLOSE = 0;
const CMD_MOVE_TO = 1;
const CMD_LINE_TO = 2;
const CMD_QUAD_TO = 3;
const CMD_CUBIC_TO = 4;
function geometryBlobToPath(ck, blob, windingRule) {
	const path = new ck.Path();
	if (!(blob.buffer instanceof ArrayBuffer)) return path;
	const dv = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
	let o = 0;
	while (o < blob.length) switch (blob[o++]) {
		case CMD_CLOSE:
			path.close();
			break;
		case CMD_MOVE_TO: {
			const x = dv.getFloat32(o, true);
			const y = dv.getFloat32(o + 4, true);
			o += 8;
			path.moveTo(x, y);
			break;
		}
		case CMD_LINE_TO: {
			const x = dv.getFloat32(o, true);
			const y = dv.getFloat32(o + 4, true);
			o += 8;
			path.lineTo(x, y);
			break;
		}
		case CMD_QUAD_TO: {
			const x1 = dv.getFloat32(o, true);
			const y1 = dv.getFloat32(o + 4, true);
			const x = dv.getFloat32(o + 8, true);
			const y = dv.getFloat32(o + 12, true);
			o += 16;
			path.quadTo(x1, y1, x, y);
			break;
		}
		case CMD_CUBIC_TO: {
			const x1 = dv.getFloat32(o, true);
			const y1 = dv.getFloat32(o + 4, true);
			const x2 = dv.getFloat32(o + 8, true);
			const y2 = dv.getFloat32(o + 12, true);
			const x = dv.getFloat32(o + 16, true);
			const y = dv.getFloat32(o + 20, true);
			o += 24;
			path.cubicTo(x1, y1, x2, y2, x, y);
			break;
		}
		default: return path;
	}
	path.setFillType(windingRule === "EVENODD" ? ck.FillType.EvenOdd : ck.FillType.Winding);
	return path;
}
//#endregion
export { breakAtVertex, buildStyleOverrideTable, computeAccurateBounds, createVectorFrameChildren, decodeVectorNetworkBlob, deleteVertex, encodeVectorNetworkBlob, findAllHandles, findOppositeHandle, fitCircleArc, geometryBlobToPath, isClosedThinCrescent, mirrorHandle, nearestPointOnNetwork, preprocessForVectorize, regenerateFillGeometry, removeVertex, resolveVectorFramePlacement, splitSegmentAt, svgToVectorPaths, vectorNetworkToCenterlinePath, vectorNetworkToPath };

//# sourceMappingURL=index.js.map
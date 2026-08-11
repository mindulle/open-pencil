import { addLoopToPath, addOpenSegmentsToPath } from "./path-helpers.js";
//#region src/vector/fill-geometry.ts
const CMD_CLOSE = 0;
const CMD_MOVE_TO = 1;
const CMD_LINE_TO = 2;
const CMD_CUBIC_TO = 4;
/** PathSink that encodes commands into the .fig geometry commandsBlob format. */
var GeometryBlobBuilder = class {
	cmds = [];
	moveTo(x, y) {
		this.cmds.push({
			code: CMD_MOVE_TO,
			args: [x, y]
		});
	}
	lineTo(x, y) {
		this.cmds.push({
			code: CMD_LINE_TO,
			args: [x, y]
		});
	}
	cubicTo(x1, y1, x2, y2, x3, y3) {
		this.cmds.push({
			code: CMD_CUBIC_TO,
			args: [
				x1,
				y1,
				x2,
				y2,
				x3,
				y3
			]
		});
	}
	close() {
		this.cmds.push({
			code: CMD_CLOSE,
			args: []
		});
	}
	toBlob() {
		const size = this.cmds.reduce((n, c) => n + 1 + c.args.length * 4, 0);
		const out = new Uint8Array(size);
		const view = new DataView(out.buffer);
		let o = 0;
		for (const c of this.cmds) {
			out[o++] = c.code;
			for (const v of c.args) {
				view.setFloat32(o, v, true);
				o += 4;
			}
		}
		return out;
	}
};
/**
* Rebuild fillGeometry command blobs from a (possibly edited) VectorNetwork so
* fills follow network edits. Imported .fig vectors pair fillGeometry entries
* with network regions positionally (fillGeometry[i] ↔ regions[i]); per-path
* fills are preserved. Networks without regions (open chains) map to a
* single fillGeometry entry.
*/
function regenerateFillGeometry(network, existing) {
	if (existing.length === 0) return existing;
	const { vertices, segments, regions } = network;
	if (regions.length === existing.length) return existing.map((g, i) => {
		const region = regions[i];
		const builder = new GeometryBlobBuilder();
		for (const loop of region.loops) addLoopToPath(builder, loop, segments, vertices);
		return {
			...g,
			windingRule: region.windingRule,
			commandsBlob: builder.toBlob()
		};
	});
	if (regions.length === 0 && existing.length === 1) {
		const builder = new GeometryBlobBuilder();
		addOpenSegmentsToPath(builder, segments, vertices);
		return [{
			...existing[0],
			commandsBlob: builder.toBlob()
		}];
	}
	if (regions.length > 0) return regions.map((region) => {
		const builder = new GeometryBlobBuilder();
		for (const loop of region.loops) addLoopToPath(builder, loop, segments, vertices);
		return {
			windingRule: region.windingRule,
			commandsBlob: builder.toBlob()
		};
	});
	if (segments.length > 0) {
		const builder = new GeometryBlobBuilder();
		addOpenSegmentsToPath(builder, segments, vertices);
		return [{
			windingRule: "NONZERO",
			commandsBlob: builder.toBlob()
		}];
	}
	return [];
}
//#endregion
export { regenerateFillGeometry };

//# sourceMappingURL=fill-geometry.js.map
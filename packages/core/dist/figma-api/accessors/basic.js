import { graph, nodeId, raw } from "../accessor-utils.js";
import { getNodeLocalMatrix, getWorldMatrix } from "@open-pencil/scene-graph";
//#region src/figma-api/accessors/basic.ts
const TRANSFORM_FIELDS = /* @__PURE__ */ new Set([
	"x",
	"y",
	"rotation",
	"flipX",
	"flipY"
]);
function preservesRawTransform(node) {
	return !node.source.editedFields.some((field) => TRANSFORM_FIELDS.has(field));
}
function cleanTransformValue(value) {
	if (Math.abs(value) < 1e-12) return 0;
	const nearestInteger = Math.round(value);
	return Math.abs(value - nearestInteger) < 1e-12 ? nearestInteger : value;
}
function figmaTransform(matrix) {
	return [[
		cleanTransformValue(matrix[0]),
		cleanTransformValue(matrix[1]),
		cleanTransformValue(matrix[2])
	], [
		cleanTransformValue(matrix[3]),
		cleanTransformValue(matrix[4]),
		cleanTransformValue(matrix[5])
	]];
}
function installBasicNodeProxyAccessors(prototype, internals) {
	Object.defineProperties(prototype, {
		id: { get() {
			return nodeId(this, internals);
		} },
		type: { get() {
			return raw(this, internals).type;
		} },
		name: {
			get() {
				return raw(this, internals).name;
			},
			set(value) {
				graph(this, internals).updateNode(nodeId(this, internals), { name: value });
			}
		},
		removed: { get() {
			return !graph(this, internals).getNode(nodeId(this, internals));
		} },
		x: {
			get() {
				return raw(this, internals).x;
			},
			set(value) {
				graph(this, internals).updateNode(nodeId(this, internals), { x: value });
			}
		},
		y: {
			get() {
				return raw(this, internals).y;
			},
			set(value) {
				graph(this, internals).updateNode(nodeId(this, internals), { y: value });
			}
		},
		width: { get() {
			return raw(this, internals).width;
		} },
		height: { get() {
			return raw(this, internals).height;
		} },
		rotation: {
			get() {
				const node = raw(this, internals);
				const sourceTransform = node.source.fig.rawTransform;
				if (sourceTransform && preservesRawTransform(node)) return Math.atan2(-sourceTransform.m10, sourceTransform.m00) * (180 / Math.PI);
				return node.rotation;
			},
			set(value) {
				graph(this, internals).updateNode(nodeId(this, internals), { rotation: value });
			}
		},
		relativeTransform: { get() {
			const node = raw(this, internals);
			const sourceTransform = node.source.fig.rawTransform;
			if (sourceTransform && preservesRawTransform(node)) return figmaTransform([
				sourceTransform.m00,
				sourceTransform.m01,
				sourceTransform.m02,
				sourceTransform.m10,
				sourceTransform.m11,
				sourceTransform.m12
			]);
			return figmaTransform(getNodeLocalMatrix(node));
		} },
		absoluteTransform: { get() {
			return figmaTransform(getWorldMatrix(raw(this, internals), graph(this, internals)));
		} },
		absoluteBoundingBox: { get() {
			return graph(this, internals).getAbsoluteBounds(nodeId(this, internals));
		} },
		absoluteRenderBounds: { get() {
			return graph(this, internals).getAbsoluteBounds(nodeId(this, internals));
		} }
	});
	Object.assign(prototype, {
		resize(width, height) {
			graph(this, internals).updateNode(nodeId(this, internals), {
				width,
				height
			});
		},
		resizeWithoutConstraints(width, height) {
			this.resize(width, height);
		}
	});
}
//#endregion
export { installBasicNodeProxyAccessors };

//# sourceMappingURL=basic.js.map
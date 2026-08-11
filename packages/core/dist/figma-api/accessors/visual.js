import { normalizeColor } from "../../color/normalize.js";
import { raw, updateNode } from "../accessor-utils.js";
import { copyEffects, copyFills, copyStrokes } from "@open-pencil/scene-graph/copy";
//#region src/figma-api/accessors/visual.ts
function installVisualNodeProxyAccessors(prototype, internals, mixed) {
	Object.defineProperties(prototype, {
		fills: {
			get() {
				return Object.freeze(copyFills(raw(this, internals).fills));
			},
			set(value) {
				updateNode(this, internals, { fills: value.map((fill) => ({
					...fill,
					color: normalizeColor(fill.color),
					gradientStops: fill.gradientStops?.map((stop) => ({
						...stop,
						color: normalizeColor(stop.color)
					}))
				})) });
			}
		},
		strokes: {
			get() {
				return Object.freeze(copyStrokes(raw(this, internals).strokes));
			},
			set(value) {
				updateNode(this, internals, { strokes: value.map((stroke) => ({
					...stroke,
					color: normalizeColor(stroke.color)
				})) });
			}
		},
		effects: {
			get() {
				return Object.freeze(copyEffects(raw(this, internals).effects));
			},
			set(value) {
				updateNode(this, internals, { effects: value.map((effect) => ({
					...effect,
					color: normalizeColor(effect.color)
				})) });
			}
		},
		opacity: {
			get() {
				return raw(this, internals).opacity;
			},
			set(value) {
				updateNode(this, internals, { opacity: value });
			}
		},
		visible: {
			get() {
				return raw(this, internals).visible;
			},
			set(value) {
				updateNode(this, internals, { visible: value });
			}
		},
		locked: {
			get() {
				return raw(this, internals).locked;
			},
			set(value) {
				updateNode(this, internals, { locked: value });
			}
		},
		blendMode: {
			get() {
				return raw(this, internals).blendMode;
			},
			set(value) {
				updateNode(this, internals, { blendMode: value });
			}
		},
		clipsContent: {
			get() {
				return raw(this, internals).clipsContent;
			},
			set(value) {
				updateNode(this, internals, { clipsContent: value });
			}
		},
		cornerRadius: {
			get() {
				const node = raw(this, internals);
				if (node.independentCorners) return mixed;
				return node.cornerRadius;
			},
			set(value) {
				if (value === mixed) return;
				updateNode(this, internals, {
					cornerRadius: value,
					topLeftRadius: value,
					topRightRadius: value,
					bottomRightRadius: value,
					bottomLeftRadius: value,
					independentCorners: false
				});
			}
		},
		topLeftRadius: cornerAccessor(internals, "topLeftRadius"),
		topRightRadius: cornerAccessor(internals, "topRightRadius"),
		bottomLeftRadius: cornerAccessor(internals, "bottomLeftRadius"),
		bottomRightRadius: cornerAccessor(internals, "bottomRightRadius"),
		cornerSmoothing: {
			get() {
				return raw(this, internals).cornerSmoothing;
			},
			set(value) {
				updateNode(this, internals, { cornerSmoothing: value });
			}
		}
	});
}
function cornerAccessor(internals, field) {
	return {
		get() {
			return raw(this, internals)[field];
		},
		set(value) {
			updateNode(this, internals, {
				[field]: value,
				independentCorners: true
			});
		}
	};
}
//#endregion
export { installVisualNodeProxyAccessors };

//# sourceMappingURL=visual.js.map
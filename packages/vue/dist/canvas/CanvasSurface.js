import { export_helper_default, useCanvasContext } from "./CanvasRoot.js";
import { createElementBlock, defineComponent, mergeProps, openBlock, watchEffect } from "vue";
import { templateRef } from "@vueuse/core";
//#region src/canvas/CanvasSurface.vue
const _sfc_main = /* @__PURE__ */ defineComponent({
	inheritAttrs: false,
	__name: "CanvasSurface",
	setup(__props, { expose: __expose }) {
		__expose();
		const { canvasRef } = useCanvasContext();
		const surfaceRef = templateRef("surfaceRef");
		watchEffect(() => {
			canvasRef.value = surfaceRef.value;
		});
		const __returned__ = {
			canvasRef,
			surfaceRef
		};
		Object.defineProperty(__returned__, "__isScriptSetup", {
			enumerable: false,
			value: true
		});
		return __returned__;
	}
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createElementBlock("canvas", mergeProps({ ref: "surfaceRef" }, _ctx.$attrs), null, 16);
}
var CanvasSurface_default = /* @__PURE__ */ export_helper_default(_sfc_main, [["render", _sfc_render], ["__file", "/tmp/open-pencil-debug/packages/vue/src/canvas/CanvasSurface.vue"]]);
//#endregion
export { CanvasSurface_default };

//# sourceMappingURL=CanvasSurface.js.map
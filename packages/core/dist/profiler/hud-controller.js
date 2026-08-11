import { HudRenderer } from "./hud-renderer.js";
//#region src/profiler/hud-controller.ts
var HudController = class {
	ck;
	hud = null;
	typeface = null;
	constructor(ck) {
		this.ck = ck;
	}
	setTypeface(typeface) {
		this.typeface = typeface;
		this.hud?.setTypeface(typeface);
	}
	draw(canvas, stats, phases, showRulers) {
		if (!this.hud) {
			this.hud = new HudRenderer(this.ck);
			if (this.typeface) this.hud.setTypeface(this.typeface);
		}
		this.hud.draw(canvas, stats, phases.averages, showRulers);
	}
	destroy() {
		this.hud?.destroy();
		this.hud = null;
	}
};
//#endregion
export { HudController };

//# sourceMappingURL=hud-controller.js.map
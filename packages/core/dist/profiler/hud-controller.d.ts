import { FrameStats } from "./frame/stats.js";
import { PhaseTimer } from "./phase-timer.js";
import { Canvas, CanvasKit, Typeface } from "canvaskit-wasm";

//#region src/profiler/hud-controller.d.ts
declare class HudController {
  private ck;
  private hud;
  private typeface;
  constructor(ck: CanvasKit);
  setTypeface(typeface: Typeface): void;
  draw(canvas: Canvas, stats: FrameStats, phases: PhaseTimer, showRulers: boolean): void;
  destroy(): void;
}
//#endregion
export { HudController };
//# sourceMappingURL=hud-controller.d.ts.map
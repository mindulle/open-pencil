import { FrameStats } from "./frame/stats.js";
import { Canvas, CanvasKit, Typeface } from "canvaskit-wasm";

//#region src/profiler/hud-renderer.d.ts
declare class HudRenderer {
  private ck;
  private bgPaint;
  private textPaint;
  private dimTextPaint;
  private greenPaint;
  private yellowPaint;
  private redPaint;
  private gpuPaint;
  private budgetLinePaint;
  private graphBgPaint;
  private hudFont;
  constructor(ck: CanvasKit);
  setTypeface(typeface: Typeface): void;
  draw(canvas: Canvas, stats: FrameStats, phases: Map<string, number>, showRulers: boolean): void;
  private drawLegendRow;
  private drawBarGraph;
  destroy(): void;
}
//#endregion
export { HudRenderer };
//# sourceMappingURL=hud-renderer.d.ts.map
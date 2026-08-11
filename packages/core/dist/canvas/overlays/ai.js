import { AI_ACTIVE_COLOR, AI_DONE_COLOR, AI_PULSE_PERIOD_MS } from "../../constants.js";
import { drawNodeHighlightRect } from "../highlight-rect.js";
//#region src/canvas/overlays/ai.ts
function drawAIOverlays(r, canvas, graph) {
	const now = performance.now();
	for (const nodeId of r._aiActiveNodes) {
		const phase = now % AI_PULSE_PERIOD_MS / AI_PULSE_PERIOD_MS;
		drawNodeHighlightRect(r, canvas, graph, nodeId, AI_ACTIVE_COLOR, .3 + .5 * (.5 + .5 * Math.sin(phase * Math.PI * 2)));
	}
	for (let i = r._aiDoneFlashes.length - 1; i >= 0; i--) {
		const flash = r._aiDoneFlashes[i];
		const elapsed = now - flash.startTime;
		if (elapsed > 800) {
			r._aiDoneFlashes.splice(i, 1);
			continue;
		}
		const t = elapsed / 800;
		const opacity = t < .3 ? t / .3 : 1 - (t - .3) / .7;
		drawNodeHighlightRect(r, canvas, graph, flash.nodeId, AI_DONE_COLOR, opacity);
	}
}
//#endregion
export { drawAIOverlays };

//# sourceMappingURL=ai.js.map
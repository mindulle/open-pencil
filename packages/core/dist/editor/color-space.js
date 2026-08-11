import { rgbaToOkHCL } from "../color/okhcl.js";
import { resolveOkHCLForPreview } from "../color/management.js";
import { copyEffects, copyFill, copyStroke, copyStyleRuns } from "@open-pencil/scene-graph/copy";
//#region src/editor/color-space.ts
function remapColor(color, target) {
	return resolveOkHCLForPreview(rgbaToOkHCL(color), { documentColorSpace: target }).color;
}
function remapNodeColors(node, target, mode) {
	if (mode === "assign") return null;
	return {
		fills: node.fills.map((fill) => {
			const next = copyFill(fill);
			if (fill.type === "SOLID") {
				const resolved = remapColor(fill.color, target);
				next.color = resolved;
				next.opacity = resolved.a;
				return next;
			}
			if (fill.gradientStops) next.gradientStops = fill.gradientStops.map((stop) => ({
				...stop,
				color: remapColor(stop.color, target)
			}));
			return next;
		}),
		strokes: node.strokes.map((stroke) => {
			const next = copyStroke(stroke);
			const resolved = remapColor(stroke.color, target);
			next.color = resolved;
			next.opacity = resolved.a;
			return next;
		}),
		effects: copyEffects(node.effects).map((effect) => ({
			...effect,
			color: remapColor(effect.color, target)
		})),
		styleRuns: copyStyleRuns(node.styleRuns).map((run) => ({
			...run,
			style: {
				...run.style,
				fills: run.style.fills?.map((fill) => {
					const next = copyFill(fill);
					if (fill.type === "SOLID") {
						const resolved = remapColor(fill.color, target);
						next.color = resolved;
						next.opacity = resolved.a;
					}
					return next;
				})
			}
		}))
	};
}
function createColorSpaceActions(ctx) {
	function setDocumentColorSpace(colorSpace, mode = "assign") {
		if (ctx.graph.documentColorSpace === colorSpace) return;
		if (mode === "convert") for (const node of ctx.graph.getAllNodes()) {
			const changes = remapNodeColors(node, colorSpace, mode);
			if (changes) ctx.graph.updateNode(node.id, changes);
		}
		ctx.graph.documentColorSpace = colorSpace;
		ctx.requestRender();
	}
	return { setDocumentColorSpace };
}
//#endregion
export { createColorSpaceActions };

//# sourceMappingURL=color-space.js.map
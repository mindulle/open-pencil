import { presets } from "./presets.js";
import { getNodePath } from "./utils.js";
import { allRules } from "./rules/index.js";
//#region src/lint/linter.ts
var Linter = class {
	rules = /* @__PURE__ */ new Map();
	ruleConfigs = /* @__PURE__ */ new Map();
	messages = [];
	nodes = /* @__PURE__ */ new Map();
	constructor(options = {}) {
		let baseConfig = {};
		if (options.preset) baseConfig = { ...presets[options.preset].rules };
		if (options.config?.extends) {
			const ids = Array.isArray(options.config.extends) ? options.config.extends : [options.config.extends];
			for (const id of ids) baseConfig = {
				...baseConfig,
				...presets[id].rules
			};
		}
		if (options.config?.rules) baseConfig = {
			...baseConfig,
			...options.config.rules
		};
		const rulesToLoad = options.rules ?? Object.keys(baseConfig);
		for (const ruleId of rulesToLoad) {
			const rule = allRules[ruleId];
			const config = baseConfig[ruleId];
			if (config === "off") continue;
			this.rules.set(ruleId, rule);
			if (typeof config === "string") this.ruleConfigs.set(ruleId, { severity: config });
			else this.ruleConfigs.set(ruleId, config);
		}
	}
	lintGraph(graph, rootIds) {
		this.messages = [];
		this.nodes.clear();
		const roots = rootIds && rootIds.length > 0 ? rootIds : graph.getPages().map((p) => p.id);
		for (const id of roots) this.capture(graph, id, void 0);
		for (const id of roots) this.lintNode(id);
		return {
			messages: this.messages,
			errorCount: this.messages.filter((m) => m.severity === "error").length,
			warningCount: this.messages.filter((m) => m.severity === "warning").length,
			infoCount: this.messages.filter((m) => m.severity === "info").length
		};
	}
	capture(graph, id, parent) {
		const raw = graph.getNode(id);
		if (!raw) return;
		const node = this.toLintNode(raw);
		node.parent = parent;
		this.nodes.set(id, node);
		for (const childId of raw.childIds) this.capture(graph, childId, node);
	}
	toLintNode(raw) {
		return {
			id: raw.id,
			name: raw.name,
			type: raw.type,
			width: raw.width,
			height: raw.height,
			x: raw.x,
			y: raw.y,
			rotation: raw.rotation,
			visible: raw.visible,
			locked: raw.locked,
			layoutMode: raw.layoutMode,
			itemSpacing: raw.itemSpacing,
			paddingTop: raw.paddingTop,
			paddingRight: raw.paddingRight,
			paddingBottom: raw.paddingBottom,
			paddingLeft: raw.paddingLeft,
			cornerRadius: raw.cornerRadius,
			childIds: raw.childIds.slice(),
			componentId: raw.componentId || void 0,
			text: raw.text,
			fontSize: raw.fontSize,
			styleRunCount: raw.styleRuns.length,
			boundVariables: raw.boundVariables,
			fills: raw.fills.map((f) => ({
				type: f.type,
				visible: f.visible,
				opacity: f.opacity,
				color: f.type === "SOLID" ? f.color : void 0
			})),
			strokes: raw.strokes.map((stroke) => ({
				visible: stroke.visible,
				opacity: stroke.opacity,
				color: stroke.color
			})),
			effects: raw.effects.map((effect) => ({
				type: effect.type,
				visible: effect.visible,
				radius: effect.radius
			}))
		};
	}
	lintNode(id) {
		const node = this.nodes.get(id);
		if (!node) return;
		for (const [ruleId, rule] of this.rules) {
			if (rule.match && !rule.match.includes(node.type)) continue;
			const config = this.ruleConfigs.get(ruleId);
			if (!config || config.severity === "off") continue;
			rule.check(node, {
				report: ({ node, message, suggest }) => {
					this.messages.push({
						ruleId,
						severity: config.severity,
						message,
						nodeId: node.id,
						nodeName: node.name,
						nodePath: getNodePath(this.nodes.get(node.id) ?? node),
						suggest
					});
				},
				getConfig: () => config.options,
				getParent: (node) => this.nodes.get(node.id)?.parent ?? null,
				getChildren: (node) => node.childIds.map((childId) => this.nodes.get(childId)).filter((child) => !!child)
			});
		}
		for (const childId of node.childIds) this.lintNode(childId);
	}
};
function createLinter(options) {
	return new Linter(options);
}
//#endregion
export { Linter, createLinter };

//# sourceMappingURL=linter.js.map
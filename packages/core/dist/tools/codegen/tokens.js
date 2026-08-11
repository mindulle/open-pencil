import { colorToHex } from "../../color/index.js";
import { defineTool } from "../schema.js";
//#region src/tools/codegen/tokens.ts
function slugify(name) {
	return name.replace(/\//g, "-").replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}
function toCamelCase(name) {
	return slugify(name).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
function isColor(value) {
	return typeof value === "object" && "r" in value && "g" in value && "b" in value;
}
function isAlias(value) {
	return typeof value === "object" && "aliasId" in value;
}
function resolveValue(value, variables, visited = /* @__PURE__ */ new Set()) {
	if (!isAlias(value)) return value;
	if (visited.has(value.aliasId)) return value;
	visited.add(value.aliasId);
	const target = variables.get(value.aliasId);
	if (!target) return value;
	const modeId = Object.keys(target.valuesByMode)[0];
	if (!modeId) return value;
	return resolveValue(target.valuesByMode[modeId], variables, visited);
}
function formatCSSValue(value, variables) {
	const resolved = resolveValue(value, variables);
	if (isColor(resolved)) return colorToHex(resolved);
	if (typeof resolved === "number") return String(resolved);
	if (typeof resolved === "string") return resolved;
	if (typeof resolved === "boolean") return resolved ? "1" : "0";
	if (isAlias(resolved)) return `/* unresolved alias: ${resolved.aliasId} */`;
	return String(resolved);
}
function buildTokens(variables, collections, allVars) {
	const collectionMap = /* @__PURE__ */ new Map();
	for (const collection of collections) collectionMap.set(collection.id, collection);
	const modes = [];
	const seenModes = /* @__PURE__ */ new Set();
	for (const collection of collections) for (const mode of collection.modes) if (!seenModes.has(mode.modeId)) {
		seenModes.add(mode.modeId);
		modes.push({
			id: mode.modeId,
			name: mode.name,
			collectionName: collection.name
		});
	}
	const tokens = [];
	for (const variable of variables) {
		const collection = collectionMap.get(variable.collectionId);
		const cssVar = `--${collection ? slugify(collection.name) : "token"}-${slugify(variable.name)}`;
		const values = {};
		for (const [modeId, value] of Object.entries(variable.valuesByMode)) values[modeId] = formatCSSValue(value, allVars);
		tokens.push({
			name: variable.name,
			cssVar,
			type: variable.type,
			values
		});
	}
	return {
		tokens,
		modes
	};
}
function renderCSS(tokens, modes) {
	if (tokens.length === 0) return "/* No design tokens found */\n";
	const defaultModeId = modes[0]?.id ?? "";
	const lines = [":root {"];
	for (const token of tokens) {
		const value = token.values[defaultModeId] ?? Object.values(token.values)[0] ?? "";
		lines.push(`  ${token.cssVar}: ${value};`);
	}
	lines.push("}");
	for (const mode of modes.slice(1)) {
		const className = slugify(mode.name);
		lines.push("");
		lines.push(`/* ${mode.collectionName} / ${mode.name} */`);
		lines.push(`.${className} {`);
		for (const token of tokens) {
			const value = token.values[mode.id];
			if (value !== void 0) lines.push(`  ${token.cssVar}: ${value};`);
		}
		lines.push("}");
	}
	return `${lines.join("\n")}\n`;
}
function renderTailwindTheme(tokens, modes) {
	const defaultModeId = modes[0]?.id ?? "";
	const colors = {};
	const spacing = {};
	for (const token of tokens) {
		const key = toCamelCase(token.name);
		const value = token.values[defaultModeId] ?? Object.values(token.values)[0] ?? "";
		if (token.type === "COLOR") colors[key] = value;
		else if (token.type === "FLOAT") spacing[key] = `${value}px`;
	}
	const theme = {};
	if (Object.keys(colors).length > 0) theme.colors = colors;
	if (Object.keys(spacing).length > 0) theme.spacing = spacing;
	return `// Auto-extracted from Figma design tokens
export const designTokens = ${JSON.stringify(theme, null, 2)} as const
`;
}
function renderJSON(tokens, modes) {
	const result = {};
	for (const mode of modes) {
		const modeTokens = {};
		for (const token of tokens) {
			const value = token.values[mode.id];
			if (value !== void 0) modeTokens[token.cssVar] = value;
		}
		result[mode.name] = modeTokens;
	}
	return JSON.stringify(result, null, 2);
}
const designToTokens = defineTool({
	name: "design_to_tokens",
	description: "Extract design tokens from Figma variables as CSS custom properties, Tailwind theme config, or JSON. Resolves aliases, handles multiple modes (light/dark).",
	params: {
		format: {
			type: "string",
			description: "Output format",
			enum: [
				"css",
				"tailwind",
				"json"
			],
			default: "css"
		},
		collection: {
			type: "string",
			description: "Filter by collection name (substring, case-insensitive)"
		},
		type: {
			type: "string",
			description: "Filter by variable type",
			enum: [
				"COLOR",
				"FLOAT",
				"STRING",
				"BOOLEAN"
			]
		}
	},
	execute: (figma, args) => {
		const format = args.format ?? "css";
		let variables = figma.getLocalVariables();
		const collections = figma.getLocalVariableCollections();
		const allVars = /* @__PURE__ */ new Map();
		for (const variable of variables) allVars.set(variable.id, variable);
		if (args.collection) {
			const query = args.collection.toLowerCase();
			const matchingIds = new Set(collections.filter((collection) => collection.name.toLowerCase().includes(query)).map((collection) => collection.id));
			variables = variables.filter((variable) => matchingIds.has(variable.collectionId));
		}
		if (args.type) variables = variables.filter((variable) => variable.type === args.type);
		if (variables.length === 0) return {
			output: "/* No matching variables found */",
			tokenCount: 0
		};
		const { tokens, modes } = buildTokens(variables, collections, allVars);
		let output;
		if (format === "tailwind") output = renderTailwindTheme(tokens, modes);
		else if (format === "json") output = renderJSON(tokens, modes);
		else output = renderCSS(tokens, modes);
		return {
			output,
			tokenCount: tokens.length,
			modeCount: modes.length
		};
	}
});
//#endregion
export { designToTokens };

//# sourceMappingURL=tokens.js.map
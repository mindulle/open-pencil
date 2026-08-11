import { defineTool } from "../../schema.js";
import { wrapEvalCode } from "./wrap.js";
//#region src/tools/analyze/eval/index.ts
const evalCode = defineTool({
	name: "eval",
	description: "Execute JavaScript with full Figma Plugin API access. Use for operations not covered by other tools. The `figma` global is available.",
	params: { code: {
		type: "string",
		description: "JavaScript code to execute",
		required: true
	} },
	mutates: true,
	execute: async (figma, { code }) => {
		const AsyncFunction = Object.getPrototypeOf(async () => void 0).constructor;
		const result = await new AsyncFunction("figma", wrapEvalCode(code))(figma);
		if (result && typeof result === "object") {
			const toJSON = Reflect.get(result, "toJSON");
			if (typeof toJSON === "function") return toJSON.call(result);
		}
		if (result !== void 0 && result !== null) return result;
		return {
			ok: true,
			message: "Code executed (no return value)"
		};
	}
});
//#endregion
export { evalCode };

//# sourceMappingURL=index.js.map
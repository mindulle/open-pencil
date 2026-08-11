import { ToolDef } from "./schema.js";
import { CORE_TOOLS } from "./registry-core.js";
import { EXTENDED_TOOLS } from "./registry-extended.js";

//#region src/tools/registry.d.ts
/** All tools combined — used by MCP server and CLI. */
declare const ALL_TOOLS: ToolDef[];
//#endregion
export { ALL_TOOLS, CORE_TOOLS, EXTENDED_TOOLS };
//# sourceMappingURL=registry.d.ts.map
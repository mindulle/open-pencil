import { CORE_TOOLS } from "./registry-core.js";
import { EXTENDED_TOOLS } from "./registry-extended.js";
//#region src/tools/registry.ts
/** All tools combined — used by MCP server and CLI. */
const ALL_TOOLS = [...CORE_TOOLS, ...EXTENDED_TOOLS];
//#endregion
export { ALL_TOOLS, CORE_TOOLS, EXTENDED_TOOLS };

//# sourceMappingURL=registry.js.map
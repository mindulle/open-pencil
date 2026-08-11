import { Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ParamDef } from "@open-pencil/core/tools";
import { Server } from "node:http";

//#region src/result.d.ts
type MCPContent = {
  type: 'text';
  text: string;
} | {
  type: 'image';
  data: string;
  mimeType: string;
};
type MCPResult = {
  content: MCPContent[];
  isError?: boolean;
};
declare const MAX_RESULT_BYTES = 900000;
declare function resultTooLargeMessage(kind: string, bytes: number, hint: string): string;
declare function ok(data: unknown, toolName?: string): MCPResult;
declare function fail(e: unknown): MCPResult;
//#endregion
//#region src/tool/registration.d.ts
type RPCSender = (body: Record<string, unknown>) => Promise<unknown>;
interface RegisterToolsOptions {
  enableEval: boolean;
  mcpRoot?: string | null;
  sendRPC: RPCSender;
}
declare function registerTools(mcpServer: McpServer, options: RegisterToolsOptions): void;
//#endregion
//#region src/tool/schema.d.ts
declare function paramToZod(param: ParamDef): z.ZodType;
//#endregion
//#region src/server.d.ts
declare const MCP_VERSION: string;
interface ServerOptions {
  /** TCP port for the HTTP + WebSocket server. Ignored when `withTcp` is false. When set to 0 with `withTcp: true`, binds to an ephemeral port. Defaults to 7600. */
  httpPort?: number;
  /** Path to the Unix domain socket. Auto-resolved if omitted. */
  socketPath?: string | null;
  /** Whether to also listen on TCP (in addition to the socket). API default is `false`; the CLI passes `true` by default (derived from PORT, default 7600). */
  withTcp?: boolean;
  enableEval?: boolean;
  mcpRoot?: string | null;
  /** Auth token for /mcp and /rpc endpoints. Auto-generated (32-hex) when omitted. Pass null explicitly to disable auth. */
  authToken?: string | null;
  corsOrigin?: string | null;
}
interface ServerHandle {
  /** The Hono app (routes) */
  app: Hono;
  /** The primary Node.js HTTP server (socket listener if present, otherwise TCP) */
  server: Server;
  /** Resolved socket path (null if not listening on socket) */
  socketPath: string | null;
  /** TCP port the server is listening on (0 if TCP is disabled) */
  httpPort: number;
  /** Shut down the server: close listeners, remove socket and discovery files */
  close: () => Promise<void>;
}
declare function startServer(options?: ServerOptions): Promise<ServerHandle>;
//#endregion
export { type MCPContent, type MCPResult, MCP_VERSION, type RPCSender, type RegisterToolsOptions, ServerHandle, ServerOptions, fail, ok, paramToZod, registerTools, startServer };
//# sourceMappingURL=server.d.mts.map
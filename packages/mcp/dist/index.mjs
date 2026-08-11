#!/usr/bin/env node
import "./rolldown-runtime-ClRpJifh.mjs";
import { n as startServer } from "./server-DjIy1F3p.mjs";
//#region src/index.ts
if (process.argv.includes("--help") || process.argv.includes("-h")) {
	process.stdout.write("openpencil-mcp-http\n\nStart the OpenPencil MCP server.\n\nOn macOS/Linux, the server listens on a Unix domain socket by default\nwith optional TCP for browser clients. On Windows, only TCP is available.\n\nOptions:\n  --help, -h    Show this help message\n\nEnvironment variables:\n  PORT                         TCP port (default: 7600, set to 0 to disable TCP)\n  OPENPENCIL_MCP_SOCKET        Override Unix socket path (recorded in the discovery file)\n  OPENPENCIL_MCP_DISCOVERY_PATH Override discovery file (mcp.json) location; defaults to the\n                               platform path. Parent dir created 0o700. Mainly for test isolation.\n  OPENPENCIL_MCP_TCP           Deprecated — TCP is controlled by PORT (>0 = on, 0 = off)\n  OPENPENCIL_MCP_AUTH_TOKEN    Bearer token for MCP and RPC auth\n  OPENPENCIL_MCP_ROOT          Allowed directory for file-scoped tools (default: current working directory)\n  OPENPENCIL_MCP_EVAL          Set to 1 to enable the eval tool\n  OPENPENCIL_MCP_CORS_ORIGIN   Allowed CORS origin\n");
	process.exit(0);
}
const rawPortText = (process.env.PORT ?? "7600").trim();
if (!/^\d+$/.test(rawPortText)) {
	process.stderr.write(`Error: PORT must be an integer in 0–65535, got "${process.env.PORT}"\n`);
	process.exit(1);
}
const rawPort = Number.parseInt(rawPortText, 10);
if (rawPort < 0 || rawPort > 65535) {
	process.stderr.write(`Error: PORT must be an integer in 0–65535, got "${process.env.PORT}"\n`);
	process.exit(1);
}
const port = rawPort;
const withTcp = port > 0;
const handle = await startServer({
	httpPort: withTcp ? port : 0,
	withTcp,
	socketPath: process.env.OPENPENCIL_MCP_SOCKET?.trim() || null,
	enableEval: process.env.OPENPENCIL_MCP_EVAL === "1",
	mcpRoot: process.env.OPENPENCIL_MCP_ROOT?.trim() || process.cwd(),
	authToken: (() => {
		const raw = process.env.OPENPENCIL_MCP_AUTH_TOKEN;
		if (raw === void 0) return void 0;
		if (raw === "") return null;
		const trimmed = raw.trim();
		if (!trimmed) {
			process.stderr.write("Error: OPENPENCIL_MCP_AUTH_TOKEN is whitespace-only. Set a real token, or use an empty string to disable auth.\n");
			process.exit(1);
		}
		return trimmed;
	})(),
	corsOrigin: process.env.OPENPENCIL_MCP_CORS_ORIGIN?.trim() || null
});
process.stderr.write(`OpenPencil MCP server\n`);
if (handle.socketPath) process.stderr.write(`  Socket: ${handle.socketPath}\n`);
if (handle.httpPort) process.stderr.write(`  HTTP:   http://127.0.0.1:${handle.httpPort}\n`);
const shutdown = async () => {
	process.stderr.write("\nShutting down MCP server...\n");
	await handle.close();
	process.exit(0);
};
process.on("SIGINT", () => void shutdown().catch(() => process.exit(1)));
process.on("SIGTERM", () => void shutdown().catch(() => process.exit(1)));
//#endregion
export {};

//# sourceMappingURL=index.mjs.map
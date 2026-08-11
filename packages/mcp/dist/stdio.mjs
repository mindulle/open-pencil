#!/usr/bin/env node
import "./rolldown-runtime-ClRpJifh.mjs";
import { r as registerTools, t as MCP_VERSION } from "./server-DjIy1F3p.mjs";
import { i as platformHasUnixSockets, r as getSocketPath } from "./paths-DNhXl-ck.mjs";
import { t as readDiscoveryFile } from "./discovery-CaYdHC2c.mjs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { request } from "node:http";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
//#region src/stdio/bridge.ts
const RPC_TIMEOUT = 35e3;
const DISCONNECTED_MESSAGE = "OpenPencil app is not connected. STOP and tell the user: \"The OpenPencil desktop app is not running or no document is open. Please start the app and open a document, then try again.\" Do NOT attempt to start the app yourself or retry automatically.";
/**
* Creates an RPC bridge that connects to the MCP server via HTTP
* over a Unix domain socket.
*
* This replaces the previous WebSocket-based bridge with a simpler
* HTTP approach that natively supports Unix domain sockets.
*/
function createStdioRPCBridge({ socketPath: socketPathOverride, authToken, reconnectDelayMs = 2e3, onReady, onReconnect }) {
	let resolvedSocketPath = socketPathOverride ?? null;
	let resolvedHttpPort = null;
	let transportMode = null;
	let ready = false;
	let wasConnected = false;
	let reconnectTimer;
	let connectPromise = null;
	let closed = false;
	let authFailure = false;
	let socketFailed = false;
	const hasExplicitSocketPath = socketPathOverride !== void 0 && socketPathOverride !== null;
	const hasExplicitAuth = authToken !== void 0;
	let resolvedAuthToken = authToken ?? null;
	async function resolveAuthToken() {
		if (hasExplicitAuth) return resolvedAuthToken;
		if (resolvedAuthToken) return resolvedAuthToken;
		const info = await readDiscoveryFile();
		if (info?.authToken) resolvedAuthToken = info.authToken;
		return resolvedAuthToken;
	}
	async function resolveTransport() {
		if (transportMode) return;
		const info = await readDiscoveryFile();
		if (!hasExplicitAuth && info?.authToken) resolvedAuthToken = info.authToken;
		if (!platformHasUnixSockets()) {
			if (info?.httpPort) {
				resolvedHttpPort = info.httpPort;
				transportMode = "tcp";
				return;
			}
			throw new Error("No MCP server discovery info found");
		}
		if (hasExplicitSocketPath && resolvedSocketPath) {} else if (info?.socketPath) resolvedSocketPath = info.socketPath;
		else if (info?.httpPort) {
			resolvedHttpPort = info.httpPort;
			transportMode = "tcp";
			return;
		} else resolvedSocketPath = await getSocketPath();
		if (info?.httpPort) resolvedHttpPort = info.httpPort;
		if (!hasExplicitSocketPath && socketFailed && resolvedHttpPort) {
			transportMode = "tcp";
			return;
		}
		transportMode = "socket";
	}
	/**
	* Makes an HTTP request to the MCP server via socket or TCP.
	*/
	function httpRequest(method, path, body) {
		return new Promise((resolve, reject) => {
			const bodyJSON = body ? JSON.stringify(body) : void 0;
			const headers = {
				...bodyJSON ? { "Content-Type": "application/json" } : {},
				...resolvedAuthToken ? { Authorization: `Bearer ${resolvedAuthToken}` } : {}
			};
			let reqOpts = null;
			if (transportMode === "socket" && resolvedSocketPath) reqOpts = {
				socketPath: resolvedSocketPath,
				path,
				method,
				headers
			};
			else if (transportMode === "tcp" && resolvedHttpPort) reqOpts = {
				hostname: "127.0.0.1",
				port: resolvedHttpPort,
				path,
				method,
				headers
			};
			if (!reqOpts) {
				reject(/* @__PURE__ */ new Error(DISCONNECTED_MESSAGE));
				return;
			}
			const req = request(reqOpts, (res) => {
				const chunks = [];
				res.on("data", (chunk) => chunks.push(chunk));
				res.on("end", () => {
					const raw = Buffer.concat(chunks).toString("utf-8");
					let data;
					try {
						data = JSON.parse(raw);
					} catch {
						data = raw;
					}
					resolve({
						status: res.statusCode ?? 200,
						data,
						req
					});
				});
				res.on("error", reject);
			});
			req.on("error", reject);
			req.setTimeout(RPC_TIMEOUT - 5e3, () => {
				req.destroy(/* @__PURE__ */ new Error("Socket timeout"));
			});
			if (bodyJSON) req.write(bodyJSON);
			req.end();
		});
	}
	/**
	* Checks if the server is healthy and the browser is connected.
	*/
	async function checkHealth() {
		try {
			const { status, data } = await httpRequest("GET", "/health");
			if (status === 401) return {
				reachable: true,
				appConnected: false,
				authFailed: true
			};
			if (status !== 200) return {
				reachable: false,
				appConnected: false,
				authFailed: false
			};
			const health = data;
			return {
				reachable: health.status === "ok" || health.status === "no_app",
				appConnected: health.status === "ok",
				authFailed: false
			};
		} catch {
			if (!hasExplicitSocketPath && transportMode === "socket") socketFailed = true;
			return {
				reachable: false,
				appConnected: false,
				authFailed: false
			};
		}
	}
	/**
	* Attempts to connect to the server. Retries with a fixed delay.
	*/
	async function connect() {
		if (closed) return;
		try {
			await resolveTransport();
			if (!resolvedAuthToken) await resolveAuthToken();
		} catch {
			connectPromise = null;
			scheduleReconnect();
			return;
		}
		if (closed) return;
		const { reachable, appConnected, authFailed } = await checkHealth();
		if (closed) return;
		if (authFailed) {
			authFailure = true;
			ready = false;
			connectPromise = null;
			if (!hasExplicitAuth) {
				resolvedAuthToken = null;
				transportMode = null;
			}
			scheduleReconnect();
			return;
		}
		authFailure = false;
		if (appConnected) {
			ready = true;
			socketFailed = false;
			connectPromise = null;
			if (wasConnected) onReconnect?.();
			else {
				wasConnected = true;
				onReady?.();
			}
			return;
		}
		if (reachable) {
			ready = true;
			socketFailed = false;
			connectPromise = null;
			if (!wasConnected) {
				wasConnected = true;
				onReady?.();
			}
			return;
		}
		transportMode = null;
		if (!hasExplicitSocketPath) resolvedSocketPath = null;
		resolvedHttpPort = null;
		connectPromise = null;
		scheduleReconnect();
	}
	function scheduleReconnect() {
		if (closed) return;
		clearTimeout(reconnectTimer);
		reconnectTimer = setTimeout(() => {
			connectPromise = connect();
		}, reconnectDelayMs);
		reconnectTimer.unref();
	}
	/**
	* Sends an RPC request to the MCP server.
	*
	* Routes through the /rpc HTTP endpoint, which proxies
	* the call to the connected browser.
	*
	* When using an auto-discovered auth token (hasExplicitAuth === false),
	* a 401 response triggers a transparent retry: the cached token is cleared,
	* the discovery file is re-read for a fresh token, and the request is
	* retried once. Only if the retry also fails is the error surfaced to the
	* caller. This makes server restarts with a new auto-generated token
	* seamless to the AI agent.
	*/
	function sendRPC(body) {
		const awaitReady = async () => {
			if (!ready && connectPromise) await connectPromise;
			if (authFailure) throw new Error("Unauthorized: check OPENPENCIL_MCP_AUTH_TOKEN");
			if (!ready) throw new Error(DISCONNECTED_MESSAGE);
		};
		return awaitReady().then(() => new Promise((resolve, reject) => {
			let settled = false;
			const timer = setTimeout(() => {
				if (settled) return;
				settled = true;
				reject(/* @__PURE__ */ new Error(`RPC timeout (${Math.round(RPC_TIMEOUT / 1e3)}s)`));
			}, RPC_TIMEOUT);
			/**
			* Performs one HTTP request attempt. `allowAuthRetry` controls whether
			* a 401 with an auto-discovered token triggers a re-read and retry.
			* It is set to `false` for the second attempt to prevent infinite loops.
			*/
			function attempt(allowAuthRetry) {
				httpRequest("POST", "/rpc", body).then(({ status, data, req }) => {
					if (settled) {
						req.destroy();
						return;
					}
					if (status === 401) {
						if (allowAuthRetry && !hasExplicitAuth) {
							resolvedAuthToken = null;
							readDiscoveryFile().then((info) => {
								if (settled) return void 0;
								if (info?.authToken) {
									resolvedAuthToken = info.authToken;
									attempt(false);
									return;
								}
								clearTimeout(timer);
								authFailure = true;
								transportMode = null;
								if (!hasExplicitSocketPath) resolvedSocketPath = null;
								resolvedHttpPort = null;
								ready = false;
								settled = true;
								scheduleReconnect();
								reject(/* @__PURE__ */ new Error("Unauthorized"));
							}).catch(() => {
								if (settled) return;
								clearTimeout(timer);
								transportMode = null;
								if (!hasExplicitSocketPath) resolvedSocketPath = null;
								resolvedHttpPort = null;
								ready = false;
								settled = true;
								scheduleReconnect();
								reject(/* @__PURE__ */ new Error(DISCONNECTED_MESSAGE));
							});
							return;
						}
						clearTimeout(timer);
						authFailure = true;
						if (!hasExplicitAuth) resolvedAuthToken = null;
						transportMode = null;
						if (!hasExplicitSocketPath) resolvedSocketPath = null;
						resolvedHttpPort = null;
						ready = false;
						settled = true;
						scheduleReconnect();
						reject(/* @__PURE__ */ new Error("Unauthorized: check OPENPENCIL_MCP_AUTH_TOKEN"));
						return;
					}
					clearTimeout(timer);
					if (status >= 400) {
						const errData = data;
						settled = true;
						reject(new Error(errData.error ?? `RPC failed with status ${status}`));
						return;
					}
					settled = true;
					resolve(data);
				}).catch(() => {
					if (settled) return;
					clearTimeout(timer);
					if (!hasExplicitSocketPath && transportMode === "socket") socketFailed = true;
					transportMode = null;
					if (!hasExplicitSocketPath) resolvedSocketPath = null;
					resolvedHttpPort = null;
					ready = false;
					settled = true;
					scheduleReconnect();
					reject(/* @__PURE__ */ new Error(DISCONNECTED_MESSAGE));
				});
			}
			attempt(true);
		}));
	}
	/**
	* Stops the reconnect timer and marks the bridge as not ready.
	* Call this to cleanly shut down the bridge and prevent timer leaks.
	*/
	function close() {
		closed = true;
		clearTimeout(reconnectTimer);
		reconnectTimer = void 0;
		ready = false;
		connectPromise = null;
	}
	connectPromise = connect();
	return {
		sendRPC,
		close
	};
}
//#endregion
//#region src/stdio.ts
if (process.argv.includes("--help") || process.argv.includes("-h")) {
	process.stdout.write("openpencil-mcp\n\nStart the OpenPencil MCP stdio bridge.\n\nConnects to the MCP server via Unix domain socket on macOS/Linux (with TCP fallback) or via TCP on Windows.\nThe MCP server is started by the OpenPencil\ndesktop app; this bridge only forwards stdio JSON-RPC to it.\n\nOptions:\n  --help, -h    Show this help message\n\nEnvironment variables:\n  OPENPENCIL_MCP_SOCKET        Override socket path (auto-discovered from discovery file when unset)\n  OPENPENCIL_MCP_AUTH_TOKEN    Bearer token for RPC auth\n  OPENPENCIL_MCP_ROOT          Allowed directory for file-scoped tools\n                               (default: cwd when run standalone, home directory when app-spawned)\n  OPENPENCIL_MCP_EVAL          Set to 1 to enable the eval tool\n");
	process.exit(0);
}
const enableEval = process.env.OPENPENCIL_MCP_EVAL === "1";
const mcpRoot = process.env.OPENPENCIL_MCP_ROOT?.trim() || process.cwd();
const rawAuthToken = process.env.OPENPENCIL_MCP_AUTH_TOKEN;
if (rawAuthToken !== void 0 && rawAuthToken !== "" && rawAuthToken.trim() === "") {
	process.stderr.write("Error: OPENPENCIL_MCP_AUTH_TOKEN is whitespace-only. Set a real token, or use an empty string to disable auth.\n");
	process.exit(1);
}
function resolveAuthToken(raw) {
	if (raw === void 0) return void 0;
	if (raw === "") return null;
	return raw.trim();
}
const bridge = createStdioRPCBridge({
	authToken: resolveAuthToken(rawAuthToken),
	onReady: () => {
		process.stderr.write("Connected to OpenPencil MCP server; document availability is checked per tool call\n");
	},
	onReconnect: () => {
		process.stderr.write("Reconnected to OpenPencil MCP server; document availability is checked per tool call\n");
	}
});
const mcpServer = new McpServer({
	name: "open-pencil",
	version: MCP_VERSION
});
registerTools(mcpServer, {
	enableEval,
	mcpRoot,
	sendRPC: bridge.sendRPC
});
const transport = new StdioServerTransport();
mcpServer.connect(transport).catch((err) => {
	process.stderr.write(`Fatal: MCP connect failed — ${err instanceof Error ? err.message : err}\n`);
	process.exit(1);
});
process.on("uncaughtException", (err) => {
	process.stderr.write(`Fatal: ${err instanceof Error ? err.message : err}\n`);
	process.exit(1);
});
process.on("unhandledRejection", (reason) => {
	const message = reason instanceof Error ? reason.message : String(reason);
	process.stderr.write(`Fatal: unhandled rejection — ${message}\n`);
	process.exit(1);
});
//#endregion
export {};

//# sourceMappingURL=stdio.mjs.map
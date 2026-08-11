import "./rolldown-runtime-ClRpJifh.mjs";
import { i as platformHasUnixSockets, n as getSocketDir, r as getSocketPath, t as getDiscoveryPath } from "./paths-DNhXl-ck.mjs";
import { i as writeDiscoveryFile, n as removeDiscoveryFile, r as removeStaleSocket } from "./discovery-CaYdHC2c.mjs";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { resolveCommand } from "package-manager-detector/commands";
import { detect, getUserAgent } from "package-manager-detector/detect";
import { WebSocketServer } from "ws";
import { buildComponent, createElement, resolveToTree } from "@open-pencil/core/design-jsx";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { Buffer as Buffer$1 } from "node:buffer";
import { basename, dirname, isAbsolute, join, parse, resolve, sep } from "node:path";
import { z } from "zod";
import { ALL_TOOLS, CODEGEN_PROMPT } from "@open-pencil/core/tools";
import { access, chmod, constants, lstat, mkdir, readFile, readlink, realpath, unlink, writeFile } from "node:fs/promises";
import { decodeBase64 } from "@open-pencil/core/bytes";
import { createServer } from "node:http";
import { connect } from "node:net";
import { getRequestListener } from "@hono/node-server";
//#region src/auth.ts
function bearerToken(header) {
	return header?.startsWith("Bearer ") ? header.slice(7) : null;
}
function mcpRequestToken(authorization, headerToken) {
	return bearerToken(authorization) ?? headerToken ?? null;
}
function isAuthorized(provided, expected) {
	if (expected === null) return true;
	if (provided === null) return false;
	return timingSafeEqual(createHash("sha256").update(provided, "utf8").digest(), createHash("sha256").update(expected, "utf8").digest());
}
//#endregion
//#region src/browser-rpc.ts
const RPC_TIMEOUT = 2e4;
const APP_WAIT_TIMEOUT = 1e4;
const APP_NOT_CONNECTED_MESSAGE = "OpenPencil app is not connected. STOP and tell the user: \"The OpenPencil desktop app is not running, no document is open, or the desktop app is connected to a different MCP server. Please start OpenPencil, open a document, and try again.\" Do NOT attempt to start the app yourself or retry automatically.";
function stripEnvelope(msg) {
	const { type: _type, id: _id, ...body } = msg;
	return body;
}
function responsePayload(result) {
	if (result && typeof result === "object" && !Array.isArray(result)) return result;
	return { result };
}
function sendJSON(ws, body) {
	if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(body));
}
function createSettler(resolve, reject) {
	let settled = false;
	return {
		resolve: (value) => {
			if (settled) return;
			settled = true;
			resolve(value);
		},
		reject: (error) => {
			if (settled) return;
			settled = true;
			reject(error);
		},
		isSettled: () => settled
	};
}
function createBrowserRPCBridge({ authToken, onConnectionChange }) {
	const pending = /* @__PURE__ */ new Map();
	const clients = /* @__PURE__ */ new Set();
	const connectionWaiters = /* @__PURE__ */ new Set();
	const authenticatedClients = /* @__PURE__ */ new Set();
	let browserWs = null;
	let browserRegistered = false;
	let bridgeClosed = false;
	function isConnected() {
		return Boolean(browserWs && browserRegistered);
	}
	function notifyConnectionWaiters() {
		for (const waiter of connectionWaiters) {
			clearTimeout(waiter.timer);
			waiter.resolve(void 0);
		}
		connectionWaiters.clear();
	}
	function rejectConnectionWaiters(reason) {
		for (const waiter of connectionWaiters) {
			clearTimeout(waiter.timer);
			waiter.reject(new Error(reason));
		}
		connectionWaiters.clear();
	}
	function waitForConnection() {
		return new Promise((resolve, reject) => {
			let waiter = null;
			const timer = setTimeout(() => {
				if (waiter) connectionWaiters.delete(waiter);
				reject(/* @__PURE__ */ new Error(APP_NOT_CONNECTED_MESSAGE));
			}, APP_WAIT_TIMEOUT);
			waiter = {
				resolve: () => {
					clearTimeout(timer);
					resolve();
				},
				reject: (error) => {
					clearTimeout(timer);
					reject(error);
				},
				timer
			};
			connectionWaiters.add(waiter);
			if (browserWs && browserWs.readyState === browserWs.OPEN && browserRegistered) {
				waiter.resolve(void 0);
				connectionWaiters.delete(waiter);
			}
		});
	}
	function rejectAllPending(reason) {
		for (const [, req] of pending) {
			clearTimeout(req.timer);
			req.reject(new Error(reason));
		}
		pending.clear();
	}
	function sendRegisterPrompt(ws) {
		sendJSON(ws, {
			type: "register",
			token: null
		});
	}
	function broadcastRegisterPrompt() {
		for (const client of clients) sendRegisterPrompt(client);
	}
	function sendRPC(body) {
		if (bridgeClosed) return Promise.reject(/* @__PURE__ */ new Error("Server shutting down"));
		return new Promise((resolve, reject) => {
			const doSend = () => {
				const ws = browserWs;
				if (!ws || ws.readyState !== ws.OPEN || !browserRegistered) {
					reject(/* @__PURE__ */ new Error(APP_NOT_CONNECTED_MESSAGE));
					return;
				}
				const id = randomUUID();
				const settle = createSettler(resolve, reject);
				const timer = setTimeout(() => {
					pending.delete(id);
					settle.reject(/* @__PURE__ */ new Error(`RPC timeout (${Math.round(RPC_TIMEOUT / 1e3)}s)`));
				}, RPC_TIMEOUT);
				pending.set(id, {
					resolve: settle.resolve,
					reject: settle.reject,
					timer
				});
				try {
					ws.send(JSON.stringify({
						...body,
						type: "request",
						id
					}));
				} catch (e) {
					clearTimeout(timer);
					pending.delete(id);
					if (!settle.isSettled()) settle.reject(e instanceof Error ? e : new Error(String(e)));
				}
			};
			if (browserWs && browserWs.readyState === browserWs.OPEN && browserRegistered) doSend();
			else waitForConnection().then(doSend).catch(reject);
		});
	}
	async function handleClientRequest(ws, msg) {
		if (!msg.id) return;
		try {
			sendJSON(ws, {
				...responsePayload(await sendRPC(stripEnvelope(msg))),
				type: "response",
				id: msg.id,
				ok: true
			});
		} catch (e) {
			sendJSON(ws, {
				type: "response",
				id: msg.id,
				ok: false,
				error: e instanceof Error ? e.message : String(e)
			});
		}
	}
	function registerBrowser(ws, token) {
		if (bridgeClosed) return;
		if (!isAuthorized(token, authToken)) {
			ws.close();
			return;
		}
		authenticatedClients.add(ws);
		const previousBrowserWs = browserWs;
		browserWs = ws;
		browserRegistered = true;
		if (previousBrowserWs && previousBrowserWs !== ws) {
			rejectAllPending("Browser reconnected");
			if (previousBrowserWs.readyState === ws.OPEN) previousBrowserWs.close();
		}
		notifyConnectionWaiters();
		onConnectionChange();
		broadcastRegisterPrompt();
	}
	function handleBrowserResponse(msg, ws) {
		if (!browserRegistered || browserWs !== ws || !msg.id) return;
		const req = pending.get(msg.id);
		if (!req) return;
		pending.delete(msg.id);
		clearTimeout(req.timer);
		if (msg.ok === false) req.reject(new Error(msg.error ?? "RPC failed"));
		else req.resolve(stripEnvelope(msg));
	}
	function handleMessage(data, ws) {
		if (bridgeClosed) return;
		let parsed;
		try {
			parsed = JSON.parse(data);
		} catch (e) {
			console.warn("Malformed automation message:", e);
			return;
		}
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			ws.close();
			return;
		}
		const msg = parsed;
		if (msg.type === "auth") {
			if (msg.token === null || typeof msg.token === "string") {
				if (!isAuthorized(msg.token, authToken)) {
					ws.close();
					return;
				}
				authenticatedClients.add(ws);
			} else if (msg.token !== void 0) ws.close();
			return;
		}
		if (msg.type === "register") {
			if (msg.token === null || typeof msg.token === "string") registerBrowser(ws, msg.token);
			else if (msg.token !== void 0) ws.close();
			return;
		}
		if (!authenticatedClients.has(ws)) {
			ws.close();
			return;
		}
		if (msg.type === "request") {
			handleClientRequest(ws, msg);
			return;
		}
		if (msg.type === "response") handleBrowserResponse(msg, ws);
	}
	function handleClose(ws) {
		clients.delete(ws);
		authenticatedClients.delete(ws);
		if (browserWs !== ws) return;
		browserWs = null;
		browserRegistered = false;
		rejectAllPending("Browser disconnected");
		onConnectionChange();
	}
	function handleConnection(ws) {
		if (bridgeClosed) return;
		clients.add(ws);
		sendRegisterPrompt(ws);
	}
	function close() {
		bridgeClosed = true;
		rejectAllPending("Server shutting down");
		rejectConnectionWaiters("Server shutting down");
		browserWs = null;
		browserRegistered = false;
		clients.clear();
		authenticatedClients.clear();
	}
	return {
		close,
		isConnected,
		sendRPC,
		handleConnection,
		handleMessage,
		handleClose
	};
}
//#endregion
//#region src/http-options.ts
const MCP_CORS_METHODS = [
	"GET",
	"POST",
	"DELETE",
	"OPTIONS"
];
const MCP_CORS_HEADERS = [
	"Content-Type",
	"Authorization",
	"x-mcp-token",
	"mcp-session-id",
	"Last-Event-ID",
	"mcp-protocol-version"
];
const MCP_EXPOSED_HEADERS = ["mcp-session-id", "mcp-protocol-version"];
//#endregion
//#region src/jsx-preprocess.ts
function preprocessRPC(body) {
	if (body.command !== "tool") return body;
	const args = body.args;
	if (args?.name !== "render" || !args.args?.jsx) return body;
	try {
		const tree = resolveToTree(createElement(buildComponent(args.args.jsx), null));
		return {
			...body,
			args: {
				...args,
				args: {
					...args.args,
					jsx: void 0,
					tree
				}
			}
		};
	} catch (e) {
		console.warn("JSX preprocessing failed, passing raw:", e instanceof Error ? e.message : e);
		return body;
	}
}
//#endregion
//#region src/server/sessions.ts
const MAX_MCP_SESSIONS = 10;
const MCP_SESSION_TTL_MS = 15 * 6e4;
const SESSION_CLOSE_TIMEOUT_MS = 5e3;
function describeError(e) {
	return e instanceof Error ? e.message : String(e);
}
/**
* Wraps a promise with a timeout. Resolves with undefined if the timeout
* elapses before the promise settles. Used to prevent `transport.close()`
* from hanging indefinitely — the MCP SDK's close() does not enforce a
* timeout internally.
*/
function withTimeout(promise, ms) {
	let timer;
	return Promise.race([promise.finally(() => {
		if (timer) clearTimeout(timer);
	}), new Promise((resolve) => {
		timer = setTimeout(() => resolve(void 0), ms);
	})]);
}
async function closeSession(session) {
	try {
		await withTimeout(session.transport.close(), SESSION_CLOSE_TIMEOUT_MS);
	} catch (e) {
		process.stderr.write(`  MCP session: transport close warning (${describeError(e)})\n`);
	}
	try {
		await withTimeout(session.server.close(), SESSION_CLOSE_TIMEOUT_MS);
	} catch (e) {
		process.stderr.write(`  MCP session: server close warning (${describeError(e)})\n`);
	}
}
function createMCPSessionManager({ serverVersion, registerTools }) {
	const sessions = /* @__PURE__ */ new Map();
	const closing = /* @__PURE__ */ new Set();
	function scheduleClose(session) {
		const task = closeSession(session).finally(() => closing.delete(task));
		closing.add(task);
		return task;
	}
	function notifyToolsChanged() {
		for (const session of sessions.values()) try {
			session.server.sendToolListChanged();
		} catch {
			continue;
		}
	}
	function cleanupExpired() {
		const now = Date.now();
		for (const [id, session] of sessions) if (now - session.lastSeen > MCP_SESSION_TTL_MS) {
			sessions.delete(id);
			scheduleClose(session);
		}
	}
	const creating = /* @__PURE__ */ new Map();
	let closed = false;
	async function createSession(id) {
		if (closed) throw new Error("Session manager is closed");
		const inFlight = creating.get(id);
		if (inFlight) return inFlight;
		const promise = (async () => {
			const server = new McpServer({
				name: "open-pencil",
				version: serverVersion
			});
			registerTools(server);
			const transport = new WebStandardStreamableHTTPServerTransport({
				sessionIdGenerator: () => id,
				enableJsonResponse: true
			});
			try {
				await server.connect(transport);
			} catch (e) {
				await transport.close().catch(() => void 0);
				await server.close().catch(() => void 0);
				throw e;
			}
			if (closed) {
				await transport.close().catch(() => void 0);
				await server.close().catch(() => void 0);
				throw new Error("Session manager closed during session creation");
			}
			sessions.set(id, {
				transport,
				server,
				lastSeen: Date.now()
			});
			return transport;
		})();
		creating.set(id, promise);
		try {
			return await promise;
		} finally {
			creating.delete(id);
		}
	}
	function resolveTransport(sessionId) {
		if (closed) return Promise.resolve({ error: "closed" });
		cleanupExpired();
		const existing = sessionId ? sessions.get(sessionId) : void 0;
		if (existing) return Promise.resolve(existing.transport);
		if (sessionId) {
			const inFlight = creating.get(sessionId);
			if (inFlight) return inFlight.catch((e) => {
				if (closed) return { error: "closed" };
				throw e;
			});
		}
		if (sessions.size + creating.size + closing.size >= MAX_MCP_SESSIONS) return Promise.resolve({ error: "too_many" });
		return createSession(sessionId ?? randomUUID()).catch((e) => {
			if (closed) return { error: "closed" };
			throw e;
		});
	}
	function touch(sessionId, transport) {
		const resolvedSessionId = sessionId ?? [...sessions.entries()].find(([, entry]) => entry.transport === transport)?.[0];
		if (!resolvedSessionId) return;
		const session = sessions.get(resolvedSessionId);
		if (session) session.lastSeen = Date.now();
	}
	/**
	* Look up an existing session's transport without creating a new session.
	* Used for DELETE requests where creating a session just to delete it
	* would waste a session slot.
	*/
	function getExistingTransport(sessionId) {
		if (closed) return { error: "closed" };
		if (!sessionId) return { error: "not_found" };
		const existing = sessions.get(sessionId);
		if (existing) return existing.transport;
		return { error: "not_found" };
	}
	function deleteSession(sessionId) {
		if (closed) return;
		if (!sessionId) return;
		const session = sessions.get(sessionId);
		if (!session) return;
		sessions.delete(sessionId);
		scheduleClose(session);
	}
	async function clear() {
		closed = true;
		const all = [...sessions.values()];
		sessions.clear();
		const inFlight = [...creating.values()];
		await Promise.allSettled(inFlight);
		creating.clear();
		await Promise.allSettled([...closing, ...all.map(scheduleClose)]);
	}
	return {
		clear,
		deleteSession,
		getExistingTransport,
		notifyToolsChanged,
		resolveTransport,
		touch
	};
}
//#endregion
//#region src/result.ts
const MAX_RESULT_BYTES = 9e5;
function resultTooLargeMessage(kind, bytes, hint) {
	return `${kind} is too large (${Math.round(bytes / 1024)}KB, limit ${Math.round(MAX_RESULT_BYTES / 1024)}KB). ${hint}`;
}
function ok(data, toolName) {
	const text = JSON.stringify(data, null, 2);
	const bytes = Buffer$1.byteLength(text, "utf8");
	if (bytes > 9e5) return fail(new Error(resultTooLargeMessage(toolName ? `Result from "${toolName}"` : "Result", bytes, "Narrow the request with depth/root_id/node_types, get_node, or find_nodes.")));
	return { content: [{
		type: "text",
		text
	}] };
}
function fail(e) {
	const msg = e instanceof Error ? e.message : String(e);
	return {
		content: [{
			type: "text",
			text: JSON.stringify({ error: msg })
		}],
		isError: true
	};
}
//#endregion
//#region src/tool/output.ts
/** Returns true for filesystem errors that indicate a missing or unresolvable path (ENOENT, ENOTDIR, ELOOP). */
function isMissingPathError(e) {
	const code = typeof e === "object" && e !== null && "code" in e ? e.code : void 0;
	return code === "ENOENT" || code === "ENOTDIR" || code === "ELOOP";
}
/**
* Resolve a file path and verify it stays within the allowed root directory.
* Uses fs.realpath to resolve symlinks for the security check, preventing
* traversal attacks where a symlink inside root points outside root.
* Returns the resolved (normalized) path for display and file operations.
*/
/** Walk up from `p` until we find a path that realpath() can resolve. */
async function resolveRealAncestor(p) {
	let current = resolve(p);
	let remainder = "";
	let iterations = 0;
	do {
		try {
			return {
				realAncestor: await realpath(current),
				remainder
			};
		} catch (e) {
			if (!isMissingPathError(e)) throw e;
			const parent = dirname(current);
			if (parent === current) return {
				realAncestor: current,
				remainder
			};
			remainder = sep + basename(current) + remainder;
			current = parent;
		}
		iterations++;
	} while (iterations < 64);
	throw new Error(`Path resolution depth limit exceeded (possible circular symlinks): ${p}`);
}
/**
* Walks the non-existent path segments (remainder) from the real ancestor and
* rejects any that are symlinks. A symlink in a non-existent path segment
* could point outside the allowed root — when the file is eventually written,
* the OS follows the symlink chain and the write lands outside root.
*/
async function assertNoSymlinksInRemainder(realAncestor, remainder) {
	if (!remainder) return;
	const segments = remainder.split(sep).filter(Boolean);
	let current = realAncestor;
	for (const seg of segments) {
		current = join(current, seg);
		try {
			if ((await lstat(current)).isSymbolicLink()) throw new Error(`Path is outside the allowed root: symlink at ${current}`);
		} catch (e) {
			if (e instanceof Error && e.message.includes("outside the allowed root")) throw e;
			if (!isMissingPathError(e)) throw e;
		}
	}
}
/** Throw if `rootPath` is trivially broad (e.g. "/" or "C:\"). */
function assertNarrowRoot(rootPath, original) {
	const normalized = resolve(rootPath);
	const parsedRoot = parse(normalized).root;
	if (normalized === "/" || normalized === sep || normalized === parsedRoot) throw new Error(`Root path is too broad: "${original}" (resolved to "${normalized}"). Specify a narrower OPENPENCIL_MCP_ROOT directory.`);
}
/** Resolve `p` to its realpath-validated canonical form, handling non-existent paths. */
async function resolveRealPath(p) {
	try {
		return await realpath(p);
	} catch (e) {
		if (!isMissingPathError(e)) throw e;
		const parentDir = dirname(p);
		const baseName = basename(p);
		try {
			return join(await realpath(parentDir), baseName);
		} catch (e) {
			if (!isMissingPathError(e)) throw e;
			const { realAncestor, remainder } = await resolveRealAncestor(parentDir);
			await assertNoSymlinksInRemainder(realAncestor, remainder);
			return join(realAncestor, remainder.slice(sep.length), baseName);
		}
	}
}
const MAX_SYMLINK_DEPTH = 16;
/**
* Resolve a dangling symlink's target. When realpath fails on a symlink,
* read the link target and recursively validate it is inside root.
* Returns the canonical realPath of the target, or undefined if `resolved`
* is not a symlink.
*/
async function resolveDanglingSymlink(resolved, root, realRoot, symlinkDepth) {
	try {
		if (!(await lstat(resolved)).isSymbolicLink()) return void 0;
		const linkTarget = await readlink(resolved);
		const linkDir = dirname(resolved);
		return (await resolveSafePathInternal(isAbsolute(linkTarget) ? linkTarget : resolve(linkDir, linkTarget), root, symlinkDepth + 1, realRoot)).realPath;
	} catch (e) {
		if (e instanceof Error) {
			if (e.message.includes("outside the allowed root") || e.message.includes("Root path is too broad") || e.message.includes("depth limit exceeded")) throw e;
		}
		if (!isMissingPathError(e)) throw e;
		return;
	}
}
async function resolveSafePathInternal(filePath, root, symlinkDepth, realRoot) {
	if (symlinkDepth >= MAX_SYMLINK_DEPTH) throw new Error(`Symlink resolution depth limit exceeded (possible circular symlinks): ${filePath}`);
	const normalizedRoot = resolve(root);
	const resolved = isAbsolute(filePath) ? resolve(filePath) : resolve(normalizedRoot, filePath);
	if (!realRoot) {
		assertNarrowRoot(root, root);
		try {
			realRoot = await realpath(root);
		} catch (e) {
			if (!isMissingPathError(e)) throw e;
			const { realAncestor, remainder } = await resolveRealAncestor(root);
			realRoot = remainder ? join(realAncestor, remainder.slice(sep.length)) : realAncestor;
		}
		assertNarrowRoot(realRoot, root);
	}
	const realSep = realRoot.endsWith("/") || realRoot.endsWith("\\") ? "" : sep;
	let realPath;
	try {
		realPath = await realpath(resolved);
	} catch (e) {
		if (!isMissingPathError(e)) throw e;
		realPath = await resolveDanglingSymlink(resolved, root, realRoot, symlinkDepth) ?? await resolveRealPath(resolved);
	}
	if (!realPath.startsWith(realRoot + realSep) && realPath !== realRoot) throw new Error(`Path is outside the allowed root: ${root}`);
	return {
		resolved,
		realPath
	};
}
async function resolveSafePath(filePath, root) {
	return resolveSafePathInternal(filePath, root, 0);
}
async function writeToolOutput(toolName, result, filePath, root) {
	const { resolved, realPath } = await resolveSafePath(filePath, root);
	const parentDir = dirname(realPath);
	await mkdir(parentDir, { recursive: true });
	await resolveSafePath(parentDir, root);
	if (toolName === "export_svg" && typeof result.svg === "string") {
		await writeFile(realPath, result.svg, "utf8");
		await resolveSafePath(realPath, root);
		return ok({
			written: resolved,
			byteLength: Buffer.byteLength(result.svg, "utf8")
		});
	}
	if (toolName === "export_image" && typeof result.base64 === "string") {
		const bytes = decodeBase64(result.base64);
		await writeFile(realPath, bytes);
		await resolveSafePath(realPath, root);
		return ok({
			written: resolved,
			byteLength: bytes.length
		});
	}
	if (toolName === "get_jsx" && typeof result.jsx === "string") {
		await writeFile(realPath, result.jsx, "utf8");
		await resolveSafePath(realPath, root);
		return ok({
			written: resolved,
			byteLength: Buffer.byteLength(result.jsx, "utf8")
		});
	}
	return null;
}
//#endregion
//#region src/tool/schema.ts
function paramToZod(param) {
	const schema = {
		string: () => param.enum ? z.enum(param.enum).describe(param.description) : z.string().describe(param.description),
		number: () => {
			let schema = z.coerce.number();
			if (param.min !== void 0) schema = schema.min(param.min);
			if (param.max !== void 0) schema = schema.max(param.max);
			return schema.describe(param.description);
		},
		boolean: () => z.boolean().describe(param.description),
		color: () => z.string().describe(param.description),
		"string[]": () => z.array(z.string()).min(1).describe(param.description)
	}[param.type]();
	return param.required ? schema : schema.optional();
}
//#endregion
//#region src/tool/registration.ts
const automationTargetSchema = {
	document_id: z.string().describe("Optional OpenPencil document/tab ID to target").optional(),
	page_id: z.string().describe("Optional page ID to target within the document").optional()
};
function splitAutomationTarget(args) {
	const { document_id, page_id, ...rest } = args;
	return {
		target: {
			...typeof document_id === "string" ? { document_id } : {},
			...typeof page_id === "string" ? { page_id } : {}
		},
		args: rest
	};
}
function registerTools(mcpServer, options) {
	const { enableEval, sendRPC } = options;
	const resolvedRoot = options.mcpRoot ? resolve(options.mcpRoot) : null;
	const register = mcpServer.registerTool.bind(mcpServer);
	for (const def of ALL_TOOLS) {
		if (!enableEval && def.name === "eval") continue;
		const shape = {};
		for (const [key, param] of Object.entries(def.params)) shape[key] = paramToZod(param);
		register(def.name, {
			description: def.description,
			inputSchema: z.object({
				...shape,
				...automationTargetSchema
			})
		}, async (args) => {
			try {
				const { target, args: toolArgs } = splitAutomationTarget(args);
				const res = await sendRPC({
					command: "tool",
					args: {
						...target,
						name: def.name,
						args: toolArgs
					}
				});
				if (res.ok === false) return fail(new Error(res.error));
				const r = res.result;
				const filePath = typeof toolArgs.path === "string" ? toolArgs.path : null;
				if (r && filePath && resolvedRoot) {
					const written = await writeToolOutput(def.name, r, filePath, resolvedRoot);
					if (written) return written;
				}
				if (r && "base64" in r && "mimeType" in r) {
					const base64 = String(r.base64);
					const bytes = Buffer$1.byteLength(base64, "utf8");
					if (bytes > 9e5) return fail(new Error(resultTooLargeMessage(`Image from "${def.name}"`, bytes, "Export a smaller region or lower the scale/resolution.")));
					return { content: [{
						type: "image",
						data: base64,
						mimeType: r.mimeType
					}] };
				}
				return ok(r, def.name);
			} catch (e) {
				return fail(e);
			}
		});
	}
	register("list_documents", {
		description: "List open OpenPencil documents/tabs with their IDs, file paths, current pages, and pages.",
		inputSchema: z.object({})
	}, async () => {
		try {
			const res = await sendRPC({
				command: "list_documents",
				args: {}
			});
			if (res.ok === false) return fail(new Error(res.error));
			return ok(res.result ?? {});
		} catch (e) {
			return fail(e);
		}
	});
	register("save_file", {
		description: resolvedRoot ? `Save the current document to disk. If path is provided, it must be inside ${resolvedRoot}.` : "Save the current document to disk. Uses the existing file path if available, otherwise prompts for a location.",
		inputSchema: resolvedRoot ? z.object({
			path: z.string().min(1).describe("Path for the .fig file, absolute or relative to the MCP root").optional(),
			...automationTargetSchema
		}) : z.object({ ...automationTargetSchema })
	}, async (args) => {
		try {
			const safePath = args.path !== void 0 && resolvedRoot ? await resolveSafePath(args.path, resolvedRoot) : void 0;
			const { target } = splitAutomationTarget(args);
			const res = await sendRPC({
				command: "save_file",
				args: {
					...target,
					path: safePath?.realPath
				}
			});
			if (res.ok === false) return fail(new Error(res.error));
			return ok({
				saved: true,
				...safePath ? { path: safePath.resolved } : {},
				...res.target ? { target: res.target } : {}
			});
		} catch (e) {
			return fail(e);
		}
	});
	if (resolvedRoot) {
		register("open_file", {
			description: `Open a .fig or .pen file from disk into a new tab. Path must be inside ${resolvedRoot}.`,
			inputSchema: z.object({
				path: z.string().min(1).describe("Path to the design file, absolute or relative to the MCP root"),
				...automationTargetSchema
			})
		}, async (args) => {
			try {
				const safe = await resolveSafePath(args.path, resolvedRoot);
				const { target } = splitAutomationTarget(args);
				const res = await sendRPC({
					command: "open_file",
					args: {
						...target,
						path: safe.realPath
					}
				});
				if (res.ok === false) return fail(new Error(res.error));
				return ok({
					opened: true,
					...res.target ? { target: res.target } : {}
				});
			} catch (e) {
				return fail(e);
			}
		});
		register("new_document", {
			description: `Create a new empty document. Optionally set a save path inside ${resolvedRoot}.`,
			inputSchema: z.object({
				path: z.string().min(1).describe("Path for the new file, absolute or relative to the MCP root").optional(),
				...automationTargetSchema
			})
		}, async (args) => {
			try {
				const safePath = args.path !== void 0 ? await resolveSafePath(args.path, resolvedRoot) : void 0;
				const { target } = splitAutomationTarget(args);
				const res = await sendRPC({
					command: "new_document",
					args: {
						...target,
						path: safePath?.realPath
					}
				});
				if (res.ok === false) return fail(new Error(res.error));
				return ok({
					created: true,
					...res.target ? { target: res.target } : {}
				});
			} catch (e) {
				return fail(e);
			}
		});
	}
	register("get_codegen_prompt", {
		description: "Get design-to-code generation guidelines. Call before generating frontend code.",
		inputSchema: z.object({})
	}, async () => ok({ prompt: CODEGEN_PROMPT }));
}
//#endregion
//#region package.json
var version = "0.14.0";
//#endregion
//#region src/server/lifecycle.ts
const trackedConnections = Symbol("open-pencil-mcp-connections");
/** Create an HTTP server bound to the Hono app. Each server can listen on one address. */
function createAppServer(app) {
	const listener = getRequestListener(app.fetch);
	const server = createServer((req, res) => {
		listener(req, res);
	});
	const connections = /* @__PURE__ */ new Set();
	server[trackedConnections] = connections;
	server.on("connection", (socket) => {
		connections.add(socket);
		socket.once("close", () => connections.delete(socket));
	});
	return server;
}
/** Wire the HTTP upgrade handler onto a server. Each server needs its own. */
function wireUpgrade(server, wss) {
	server.on("upgrade", (request, socket, head) => {
		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit("connection", ws, request);
		});
	});
}
/** Start socket listener; returns the resolved socket path, or null if skipped. */
async function startSocketListener(app, wss, socketPathOverride) {
	if (!platformHasUnixSockets()) return null;
	const resolvedPath = socketPathOverride ?? await getSocketPath();
	if (socketPathOverride) await mkdir(dirname(resolvedPath), {
		recursive: true,
		mode: 448
	});
	else await getSocketDir();
	await removeStaleSocket(resolvedPath);
	if (await access(resolvedPath, constants.F_OK).then(() => true).catch(() => false)) {
		const err = /* @__PURE__ */ new Error(`listen EADDRINUSE: address already in use ${resolvedPath}`);
		err.code = "EADDRINUSE";
		throw err;
	}
	const server = createAppServer(app);
	wireUpgrade(server, wss);
	const ss = server;
	ss.on("error", (err) => console.error("[MCP] Socket server error:", err));
	await new Promise((resolve, reject) => {
		ss.on("error", reject);
		ss.listen(resolvedPath, () => {
			ss.off("error", reject);
			resolve();
		});
	}).catch((err) => {
		ss.removeAllListeners("error");
		server.close(() => {});
		throw err;
	});
	try {
		await chmod(resolvedPath, 384);
	} catch (e) {
		await closeServer(server).catch(() => void 0);
		await cleanupSocket(resolvedPath).catch(() => void 0);
		throw new Error(`Socket chmod failed — refusing to serve with insecure permissions: ${e instanceof Error ? e.message : String(e)}`);
	}
	return {
		server,
		resolvedPath
	};
}
/** Start TCP listener; returns the server and actual port, or null if skipped. */
async function startTcpListener(app, wss, httpPort) {
	const host = "127.0.0.1";
	const server = createAppServer(app);
	wireUpgrade(server, wss);
	const ts = server;
	ts.on("error", (err) => console.error("[MCP] TCP server error:", err));
	return {
		server,
		port: await new Promise((resolve, reject) => {
			ts.on("error", reject);
			ts.listen(httpPort, host, () => {
				ts.off("error", reject);
				const addr = ts.address();
				resolve(typeof addr === "object" && addr ? addr.port : httpPort);
			});
		}).catch((err) => {
			ts.removeAllListeners("error");
			server.close(() => {});
			throw err;
		})
	};
}
async function writeDiscovery(resolvedSocketPath, actualHttpPort, authToken, version) {
	const startedAt = (/* @__PURE__ */ new Date()).toISOString();
	await writeDiscoveryFile({
		pid: process.pid,
		socketPath: resolvedSocketPath,
		httpPort: actualHttpPort,
		authRequired: authToken !== null,
		authToken,
		version,
		startedAt
	});
	return startedAt;
}
async function closeServer(srv) {
	if (!srv) return;
	srv.closeIdleConnections();
	srv.closeAllConnections();
	const connections = srv[trackedConnections];
	for (const socket of connections ?? []) socket.destroy();
	const forceClose = setTimeout(() => {
		for (const socket of connections ?? []) socket.destroy();
		srv.closeAllConnections();
		srv.close();
	}, 5e3).unref();
	try {
		await new Promise((resolve) => {
			srv.close(() => resolve());
		});
	} finally {
		clearTimeout(forceClose);
	}
}
async function cleanupSocket(socketPath) {
	if (!socketPath || !platformHasUnixSockets()) return;
	try {
		if (await new Promise((resolve) => {
			let settled = false;
			const finish = (value) => {
				if (settled) return;
				settled = true;
				client.destroy();
				resolve(value);
			};
			const client = connect(socketPath).on("connect", () => finish(true)).on("error", (err) => {
				finish(!(err.code === "ECONNREFUSED" || err.code === "ENOENT"));
			});
			client.setTimeout(500, () => finish(true));
		})) return;
	} catch {}
	try {
		await unlink(socketPath);
	} catch (e) {
		if (e instanceof Error && "code" in e && e.code !== "ENOENT") process.stderr.write(`  Socket: cleanup warning (${e.message})\n`);
	}
}
async function cleanupDiscovery(ownAuthToken, ownSocketPath, ownHttpPort, ownStartedAt) {
	const discoveryPath = await getDiscoveryPath();
	try {
		const raw = await readFile(discoveryPath, "utf-8");
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") return;
		const info = parsed;
		if (info.authToken !== ownAuthToken) return;
		if (info.socketPath !== ownSocketPath) return;
		if (info.httpPort !== ownHttpPort) return;
		if (info.startedAt !== ownStartedAt) return;
	} catch {
		return;
	}
	await removeDiscoveryFile().catch((e) => {
		process.stderr.write(`  Discovery: cleanup warning (${e instanceof Error ? e.message : e})\n`);
	});
}
async function teardownListeners(state) {
	if (state.socketResult) {
		await closeServer(state.socketResult.server);
		await cleanupSocket(state.socketResult.resolvedPath);
	}
	if (state.tcpResult) await closeServer(state.tcpResult.server);
}
/**
* Close the WebSocket server with a grace period. Prevents new connections,
* then terminates any lingering clients after 2 seconds to ensure shutdown
* completes promptly even with unresponsive clients.
*/
async function closeWssGracefully(wss) {
	await new Promise((resolve) => {
		let settled = false;
		const done = () => {
			if (settled) return;
			settled = true;
			resolve();
		};
		for (const ws of wss.clients) try {
			ws.close(1001, "Server shutting down");
		} catch (e) {
			console.warn("[MCP] Failed to close WebSocket client:", e);
		}
		const graceTimer = setTimeout(() => {
			const snapshot = [...wss.clients];
			for (const ws of snapshot) try {
				ws.terminate();
			} catch (e) {
				console.warn("[MCP] Failed to terminate WebSocket client:", e);
			}
			done();
		}, 2e3).unref();
		wss.close(() => {
			clearTimeout(graceTimer);
			done();
		});
	});
}
async function tryStartTcp(app, wss, httpPort, state) {
	try {
		return await startTcpListener(app, wss, httpPort);
	} catch (err) {
		await teardownListeners(state);
		throw err;
	}
}
async function tryWriteDiscovery(resolvedSocketPath, actualHttpPort, authToken, version, state) {
	try {
		return await writeDiscovery(resolvedSocketPath, actualHttpPort, authToken, version);
	} catch (err) {
		await teardownListeners(state);
		throw err;
	}
}
//#endregion
//#region src/server.ts
const MCP_VERSION = version;
const HEARTBEAT_INTERVAL_MS = 5e3;
let installCommandPromise = null;
async function resolveMCPInstallCommand() {
	const resolved = resolveCommand(getUserAgent() ?? (await detect({ strategies: [
		"install-metadata",
		"lockfile",
		"packageManager-field",
		"devEngines-field"
	] }))?.agent ?? "npm", "global", [`@open-pencil/mcp@${MCP_VERSION}`]);
	if (!resolved) return `npm install -g @open-pencil/mcp@${MCP_VERSION}`;
	return [resolved.command, ...resolved.args].join(" ");
}
function mcpInstallCommand() {
	installCommandPromise ??= resolveMCPInstallCommand();
	return installCommandPromise;
}
/** Set up Hono routes: /health, /rpc, /mcp */
function createHonoApp(options) {
	const { authToken, corsOrigin, browserRPC, mcpSessions, sendToBrowser } = options;
	const app = new Hono();
	if (corsOrigin) app.use("*", cors({
		origin: corsOrigin,
		allowMethods: MCP_CORS_METHODS,
		allowHeaders: MCP_CORS_HEADERS,
		exposeHeaders: MCP_EXPOSED_HEADERS
	}));
	app.get("/health", async (c) => c.json({
		status: browserRPC.isConnected() ? "ok" : "no_app",
		version: MCP_VERSION,
		installCommand: await mcpInstallCommand(),
		authRequired: authToken !== null
	}));
	app.use("/rpc", async (c, next) => {
		if (authToken !== null) {
			if (!isAuthorized(bearerToken(c.req.header("authorization")), authToken)) return c.json({ error: "Unauthorized" }, 401);
		}
		return next();
	});
	app.post("/rpc", async (c) => {
		let body = await c.req.json().catch(() => null);
		if (!body || typeof body !== "object" || Array.isArray(body)) return c.json({ error: "Invalid request body" }, 400);
		try {
			body = preprocessRPC(body);
			const result = await sendToBrowser(body);
			return c.json(result);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			return c.json({
				ok: false,
				error: msg
			}, 502);
		}
	});
	app.all("/mcp", async (c) => {
		if (authToken !== null) {
			if (!isAuthorized(mcpRequestToken(c.req.header("authorization"), c.req.header("x-mcp-token")), authToken)) return c.json({ error: "Unauthorized" }, 401);
		}
		const sessionId = c.req.header("mcp-session-id") ?? void 0;
		if (c.req.method === "DELETE" && !sessionId) return c.json({ error: "Missing MCP session id" }, 400);
		if (c.req.method === "DELETE" && sessionId) {
			const existing = mcpSessions.getExistingTransport(sessionId);
			if ("error" in existing) {
				if (existing.error === "closed") return c.json({ error: "MCP server is shutting down" }, 503);
				return c.json({ error: "MCP session not found" }, 404);
			}
			try {
				return await existing.handleRequest(c.req.raw);
			} finally {
				mcpSessions.deleteSession(sessionId);
			}
		}
		if (sessionId) {
			const existing = mcpSessions.getExistingTransport(sessionId);
			if ("error" in existing) {
				if (existing.error === "closed") return c.json({ error: "MCP server is shutting down" }, 503);
				return c.json({ error: "MCP session not found" }, 404);
			}
			mcpSessions.touch(sessionId, existing);
			return existing.handleRequest(c.req.raw);
		}
		const transport = await mcpSessions.resolveTransport(void 0);
		if ("error" in transport) {
			if (transport.error === "closed") return c.json({ error: "MCP server is shutting down" }, 503);
			return c.json({ error: "Too many active MCP sessions" }, {
				status: 503,
				headers: { "Retry-After": "5" }
			});
		}
		mcpSessions.touch(void 0, transport);
		return transport.handleRequest(c.req.raw);
	});
	return app;
}
/** Set up shared WebSocket connection handling and heartbeat. Call once. */
function wireConnectionHandling(wss, browserRPC) {
	const alive = /* @__PURE__ */ new WeakMap();
	wss.on("connection", (ws) => {
		alive.set(ws, true);
		browserRPC.handleConnection(ws);
		ws.on("pong", () => alive.set(ws, true));
		ws.on("message", (raw) => {
			alive.set(ws, true);
			const data = typeof raw === "string" ? raw : Buffer.from(raw).toString("utf-8");
			browserRPC.handleMessage(data, ws);
		});
		ws.on("close", () => {
			browserRPC.handleClose(ws);
		});
		ws.on("error", () => {
			try {
				ws.terminate();
			} catch {
				alive.delete(ws);
			}
		});
	});
	const heartbeat = setInterval(() => {
		for (const ws of wss.clients) {
			if (alive.get(ws) === false) {
				try {
					ws.terminate();
				} catch {
					continue;
				}
				continue;
			}
			alive.set(ws, false);
			try {
				ws.ping();
			} catch {
				continue;
			}
		}
	}, HEARTBEAT_INTERVAL_MS);
	heartbeat.unref();
	wss.on("close", () => clearInterval(heartbeat));
}
function buildServerContext(options) {
	const httpPort = options.httpPort ?? 7600;
	const enableEval = options.enableEval ?? false;
	const mcpRoot = options.mcpRoot ?? null;
	const authToken = options.authToken === void 0 ? randomBytes(16).toString("hex") : options.authToken;
	const corsOrigin = options.corsOrigin ?? null;
	const withTcp = options.withTcp ?? false;
	if (authToken === null && withTcp) process.stderr.write(`WARNING: MCP server is running without authentication on TCP port ${httpPort}. Any local process can interact with the server. Set OPENPENCIL_MCP_AUTH_TOKEN to enable auth, or use PORT=0 for socket-only transport.
`);
	const mcpSessions = createMCPSessionManager({
		serverVersion: MCP_VERSION,
		registerTools: (mcpServer) => registerTools(mcpServer, {
			enableEval,
			mcpRoot,
			sendRPC: sendToBrowser
		})
	});
	const browserRPC = createBrowserRPCBridge({
		authToken,
		onConnectionChange: mcpSessions.notifyToolsChanged
	});
	const sendToBrowser = browserRPC.sendRPC;
	return {
		httpPort,
		withTcp,
		mcpSessions,
		browserRPC,
		sendToBrowser,
		app: createHonoApp({
			authToken,
			corsOrigin,
			browserRPC,
			mcpSessions,
			sendToBrowser
		}),
		wss: new WebSocketServer({ noServer: true }),
		authToken
	};
}
/**
* Unified runtime shutdown: closes browserRPC, clears MCP sessions,
* terminates WebSocket clients, closes the WSS, and tears down HTTP
* listeners. Used by both the startup catch block and ServerHandle.close()
* to ensure no runtime resources (WebSocket, browserRPC, mcpSessions) are
* left alive.
*/
async function shutdownRuntime(browserRPC, mcpSessions, wss, state) {
	const errors = [];
	try {
		browserRPC.close();
	} catch (e) {
		errors.push(e);
	}
	try {
		await mcpSessions.clear();
	} catch (e) {
		errors.push(e);
	}
	try {
		await closeWssGracefully(wss);
	} catch (e) {
		errors.push(e);
	}
	try {
		await teardownListeners(state);
	} catch (e) {
		errors.push(e);
	}
	if (errors.length === 1) throw errors[0];
	if (errors.length > 1) throw new AggregateError(errors, "Multiple shutdown errors");
}
function buildHandle(app, wss, browserRPC, mcpSessions, state, resolvedSocketPath, actualHttpPort, authToken, startedAt) {
	let closePromise = null;
	async function close() {
		if (closePromise) return closePromise;
		closePromise = (async () => {
			const errors = [];
			try {
				await cleanupDiscovery(authToken, resolvedSocketPath, actualHttpPort, startedAt);
			} catch (error) {
				errors.push(error);
			}
			try {
				await shutdownRuntime(browserRPC, mcpSessions, wss, state);
			} catch (error) {
				errors.push(error);
			}
			if (errors.length === 1) throw errors[0];
			if (errors.length > 1) throw new AggregateError(errors, "Multiple shutdown errors");
		})();
		return closePromise;
	}
	return {
		app,
		server: state.socketResult?.server ?? state.tcpResult?.server ?? createAppServer(app),
		socketPath: resolvedSocketPath,
		httpPort: actualHttpPort,
		close
	};
}
async function startServer(options = {}) {
	const ctx = buildServerContext(options);
	wireConnectionHandling(ctx.wss, ctx.browserRPC);
	const state = {
		socketResult: null,
		tcpResult: null
	};
	let startedAt = "";
	try {
		state.socketResult = await startSocketListener(ctx.app, ctx.wss, options.socketPath ?? null);
		state.tcpResult = ctx.withTcp ? await tryStartTcp(ctx.app, ctx.wss, ctx.httpPort, state) : null;
		const resolvedSocketPath = state.socketResult?.resolvedPath ?? null;
		const actualHttpPort = state.tcpResult?.port ?? 0;
		if (!resolvedSocketPath && !actualHttpPort) throw new Error("MCP server has no active listeners (both socket and TCP are unavailable). Ensure Unix domain sockets are supported on this platform or enable TCP with withTcp: true.");
		startedAt = await tryWriteDiscovery(resolvedSocketPath, actualHttpPort, ctx.authToken, MCP_VERSION, state);
	} catch (err) {
		await shutdownRuntime(ctx.browserRPC, ctx.mcpSessions, ctx.wss, state).catch(() => void 0);
		throw err;
	}
	const resolvedSocketPath = state.socketResult?.resolvedPath ?? null;
	const actualHttpPort = state.tcpResult?.port ?? 0;
	return buildHandle(ctx.app, ctx.wss, ctx.browserRPC, ctx.mcpSessions, state, resolvedSocketPath, actualHttpPort, ctx.authToken, startedAt);
}
//#endregion
export { fail as a, paramToZod as i, startServer as n, ok as o, registerTools as r, MCP_VERSION as t };

//# sourceMappingURL=server-DjIy1F3p.mjs.map
#!/usr/bin/env bun
import "./rolldown-runtime-ClRpJifh.mjs";
import "node:module";
import { defineCommand, runMain } from "citty";
import { VALID_OVERLAP_CATEGORIES, VALID_OVERLAP_SCOPES, VALID_OVERLAP_SEVERITIES, calcClusterConfidence, parseOverlapCategories, parseOverlapScope, parseOverlapSeverity } from "@open-pencil/core/tools";
import { bold, dim, entity, fail, histogram as fmtHistogram, kv, list as fmtList, node as fmtNode, ok, summary as fmtSummary, tree as fmtTree } from "agentfmt";
import { executeRPCCommand } from "@open-pencil/core/rpc";
import { request } from "node:http";
import { basename, dirname, extname, join, resolve } from "node:path";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir, platform } from "node:os";
import "node:crypto";
import "node:net";
import { BUILTIN_IO_FORMATS, IORegistry } from "@open-pencil/core/io";
import { populateAllLazyFigImportRoots, populateLazyFigImportRoots } from "@open-pencil/core/kiwi";
import { computeAllLayouts } from "@open-pencil/core/layout";
import { FigmaAPI } from "@open-pencil/core/figma-api";
import { decodeBase64 } from "@open-pencil/core/bytes";
import { createHeadlessCSSRuntime, exportHTMLBundle, htmlToDesignDocument, htmlToSceneGraph, sceneGraphToDesignDocument, tailwindHTMLToDesignDocument, tailwindHTMLToSceneGraph } from "@open-pencil/dom-css";
import { allRules, createLinter, presets } from "@open-pencil/core/lint";
import { colorToHex } from "@open-pencil/core/color";
//#region src/app-target.ts
const appTargetOptions = {
	"document-id": {
		type: "string",
		description: "Target OpenPencil document/tab ID when connected to the running app",
		required: false
	},
	"page-id": {
		type: "string",
		description: "Target page ID when connected to the running app",
		required: false
	}
};
function appTargetRPCArgs(args) {
	return {
		...args["document-id"] ? { document_id: args["document-id"] } : {},
		...args["page-id"] ? { page_id: args["page-id"] } : {}
	};
}
//#endregion
//#region src/format.ts
function printNodeResults(results, formatLabel = (n) => n.name) {
	if (results.length === 0) {
		console.log("No nodes found.");
		return;
	}
	console.log("");
	console.log(bold(`  Found ${results.length} node${results.length > 1 ? "s" : ""}`));
	console.log("");
	console.log(fmtList(results.map((n) => ({ header: entity(formatType(n.type), formatLabel(n), n.id) }))));
	console.log("");
}
const TYPE_LABELS = {
	FRAME: "frame",
	RECTANGLE: "rect",
	ROUNDED_RECTANGLE: "rounded-rect",
	ELLIPSE: "ellipse",
	TEXT: "text",
	COMPONENT: "component",
	COMPONENT_SET: "component-set",
	INSTANCE: "instance",
	GROUP: "group",
	VECTOR: "vector",
	LINE: "line",
	POLYGON: "polygon",
	STAR: "star",
	BOOLEAN_OPERATION: "boolean",
	SECTION: "section",
	CANVAS: "page"
};
function formatType(type) {
	return TYPE_LABELS[type] ?? type.toLowerCase();
}
function formatFill(node) {
	if (!node.fills.length) return null;
	const solid = node.fills.find((f) => f.type === "SOLID" && f.visible);
	if (!solid?.color) return null;
	const { r, g, b } = solid.color;
	const hex = "#" + [
		r,
		g,
		b
	].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("");
	return solid.opacity < 1 ? `${hex} ${Math.round(solid.opacity * 100)}%` : hex;
}
function formatStroke(node) {
	if (!node.strokes.length) return null;
	const s = node.strokes[0];
	const { r, g, b } = s.color;
	return `${"#" + [
		r,
		g,
		b
	].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("")} ${s.weight}px`;
}
function nodeDetails(node) {
	const details = {};
	const fill = formatFill(node);
	if (fill) details.fill = fill;
	const stroke = formatStroke(node);
	if (stroke) details.stroke = stroke;
	if (node.cornerRadius) details.radius = `${node.cornerRadius}px`;
	if (node.effects.length > 0) details.effects = node.effects.map((e) => {
		if (e.type === "DROP_SHADOW") return `shadow(${e.radius}px)`;
		if (e.type === "INNER_SHADOW") return `inner-shadow(${e.radius}px)`;
		if (e.type === "LAYER_BLUR") return `blur(${e.radius}px)`;
		if (e.type === "BACKGROUND_BLUR") return `backdrop-blur(${e.radius}px)`;
		return e.type.toLowerCase();
	}).join(", ");
	if (node.rotation) details.rotate = `${Math.round(node.rotation)}°`;
	if (node.opacity < 1) details.opacity = node.opacity;
	if (node.blendMode !== "PASS_THROUGH" && node.blendMode !== "NORMAL") details.blend = node.blendMode.toLowerCase().replace(/_/g, "-");
	if (node.clipsContent) details.overflow = "hidden";
	if (!node.visible) details.visible = false;
	if (node.locked) details.locked = true;
	if (node.fontFamily) details.font = `${node.fontSize}px ${node.fontFamily}`;
	if (node.layoutMode !== "NONE") {
		let layout = node.layoutMode.toLowerCase();
		if (node.layoutWrap === "WRAP") layout += " wrap";
		if (node.itemSpacing) layout += ` gap=${node.itemSpacing}`;
		details.layout = layout;
	}
	if (node.componentId) details.componentId = node.componentId;
	return details;
}
function nodeToTreeNode(graph, node, maxDepth, depth = 0) {
	const treeNode = {
		header: entity(formatType(node.type), node.name, node.id),
		details: nodeDetails(node)
	};
	if (depth < maxDepth && node.childIds.length > 0) treeNode.children = node.childIds.map((id) => graph.getNode(id)).filter((n) => n !== void 0).map((child) => nodeToTreeNode(graph, child, maxDepth, depth + 1));
	return treeNode;
}
function printError(error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error(fail(message));
}
//#endregion
//#region ../mcp/dist/paths-DNhXl-ck.mjs
/**
* Platform-specific paths for the MCP server's Unix domain socket
* and the discovery JSON file.
*
* Socket directory layout (overridable via OPENPENCIL_MCP_SOCKET):
*   macOS:   ~/Library/Application Support/OpenPencil/
*   Linux:   $XDG_RUNTIME_DIR/openpencil/  (fallback: ~/.openpencil/)
*   Windows: %LOCALAPPDATA%\OpenPencil\  (fallback: ~\AppData\Local\OpenPencil\)
*
* On Windows, Unix domain sockets are unavailable — the server uses TCP only.
*
* Discovery file: at the platform-default path above, UNLESS
* OPENPENCIL_MCP_DISCOVERY_PATH is set (see getDiscoveryPath()). The socket
* override (OPENPENCIL_MCP_SOCKET) never moves the discovery file — it is
* recorded in the discovery file's `socketPath` field so clients read it
* from the well-known location.
* Socket file:     <socketDir>/mcp.sock  (or the override path)
*
* IMPORTANT: getSocketDir() returns the directory that contains the socket
* file. It does NOT always contain the discovery file — when
* OPENPENCIL_MCP_SOCKET is set, the discovery file stays at getPlatformDir().
*/
const DIR_NAME_UNIX = "openpencil";
const DIR_NAME_MACOS = "OpenPencil";
const DISCOVERY_FILENAME = "mcp.json";
const isMacOS = platform() === "darwin";
const isWindows = platform() === "win32";
/**
* Returns the platform-specific default directory for MCP runtime files,
* ignoring OPENPENCIL_MCP_SOCKET. The discovery file always lives here so
* clients can find it at a well-known location regardless of socket overrides.
* Creates the directory (with restrictive permissions) if it does not exist.
*
* The 0o700 mode restricts permissions on Unix. On Windows, mkdir ignores
* the mode and uses default ACLs — directory access is controlled by the
* filesystem, not the permission bits.
*/
async function getPlatformDir() {
	let dir;
	if (isMacOS) dir = join(homedir(), "Library", "Application Support", DIR_NAME_MACOS);
	else if (isWindows) {
		const localAppData = process.env.LOCALAPPDATA?.trim();
		if (localAppData) dir = join(localAppData, DIR_NAME_MACOS);
		else dir = join(homedir(), "AppData", "Local", DIR_NAME_MACOS);
	} else {
		const xdgRuntime = process.env.XDG_RUNTIME_DIR?.trim();
		if (xdgRuntime) dir = join(xdgRuntime, DIR_NAME_UNIX);
		else dir = join(homedir(), `.${DIR_NAME_UNIX}`);
	}
	await mkdir(dir, {
		recursive: true,
		mode: 448
	});
	if (!isWindows) await chmod(dir, 448);
	return dir;
}
/**
* Returns the full path to the MCP discovery JSON file.
*
* The discovery file lives at the platform-default location so clients can
* find it without knowing whether OPENPENCIL_MCP_SOCKET is set. It contains
* the actual socket path (which may be overridden) in its `socketPath` field,
* so clients read the discovery file to learn where to connect — not the other
* way around.
*
* Set OPENPENCIL_MCP_DISCOVERY_PATH to relocate the discovery file (e.g. to a
* temp directory for test isolation). The desktop app reads the platform
* default via its own path computation (src/app/automation/mcp/spawn.ts) and
* does not honor this override, so it is primarily useful for tests and
* standalone server invocations. The parent directory is created (0o700) so
* writeDiscoveryFile's atomic temp-then-rename succeeds.
*/
async function getDiscoveryPath() {
	const override = process.env.OPENPENCIL_MCP_DISCOVERY_PATH?.trim();
	if (override) {
		await mkdir(dirname(override), {
			recursive: true,
			mode: 448
		});
		return override;
	}
	return join(await getPlatformDir(), DISCOVERY_FILENAME);
}
/**
* Returns true if the current platform supports Unix domain sockets.
* Unix domain sockets are available on macOS, Linux, and other POSIX
* platforms but not on native Windows. WSL is detected as Linux.
*/
function platformHasUnixSockets() {
	return !isWindows;
}
/**
* Reads the discovery file. Returns null if:
* - The file does not exist
* - The file cannot be parsed
* - The recorded PID is no longer running (stale file)
*
* On success, returns the parsed DiscoveryInfo.
*/
async function readDiscoveryFile() {
	const path = await getDiscoveryPath();
	let raw;
	try {
		raw = await readFile(path, "utf-8");
	} catch (e) {
		if (!isEnoent(e)) process.stderr.write(`  Discovery: read warning (${e instanceof Error ? e.message : String(e)})\n`);
		return null;
	}
	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}
	if (!parsed || typeof parsed !== "object") return null;
	const info = validateDiscoveryFields(parsed);
	if (!info) return null;
	if (!isProcessAlive(info.pid)) return null;
	return info;
}
function validateDiscoveryFields(obj) {
	const { pid, version, httpPort, authRequired, startedAt, socketPath, authToken } = obj;
	if (typeof pid !== "number" || !Number.isInteger(pid) || pid <= 0) return null;
	if (typeof version !== "string") return null;
	if (typeof httpPort !== "number" || !Number.isInteger(httpPort)) return null;
	if (httpPort < 0 || httpPort > 65535) return null;
	if (typeof authRequired !== "boolean") return null;
	if (typeof startedAt !== "string") return null;
	if (typeof socketPath !== "string" && socketPath !== null) return null;
	if (socketPath === "") return null;
	if (authToken !== null && typeof authToken !== "string") return null;
	return {
		pid,
		version,
		httpPort,
		authRequired,
		startedAt,
		socketPath,
		authToken
	};
}
/**
* Checks if a process with the given PID is still running.
* Uses process.kill(pid, 0) which doesn't send a signal, just checks existence.
* Works on both Unix and Windows.
*/
function isProcessAlive(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch (e) {
		if (e instanceof Error && "code" in e && e.code === "ESRCH") return false;
		return true;
	}
}
function isEnoent(e) {
	return e instanceof Error && "code" in e && e.code === "ENOENT";
}
//#endregion
//#region src/app-client.ts
/** Maximum time to wait for a single RPC request before giving up. */
const RPC_TIMEOUT_MS = 3e4;
let cachedInfo = null;
async function resolveDiscovery() {
	if (cachedInfo) return cachedInfo;
	const info = await readDiscoveryFile();
	if (!info) throw new Error("Could not read MCP discovery file.\nIs the app running? Start it with: bun run tauri dev");
	cachedInfo = info;
	return cachedInfo;
}
function doRequest(info, path, method, body, forceTcp = false) {
	return new Promise((resolve, reject) => {
		const bodyJSON = body ? JSON.stringify(body) : void 0;
		const headers = {
			...bodyJSON ? { "Content-Type": "application/json" } : {},
			...info.authToken ? { Authorization: `Bearer ${info.authToken}` } : {}
		};
		const useSocket = !forceTcp && platformHasUnixSockets() && info.socketPath;
		const req = request(useSocket ? {
			socketPath: useSocket,
			path,
			method,
			headers
		} : {
			hostname: "127.0.0.1",
			port: info.httpPort,
			path,
			method,
			headers
		}, (res) => {
			const chunks = [];
			res.on("data", (chunk) => chunks.push(chunk));
			res.on("end", () => {
				clearTimeout(timer);
				const raw = Buffer.concat(chunks).toString("utf-8");
				let data;
				try {
					data = JSON.parse(raw);
				} catch {
					data = raw;
				}
				resolve({
					status: res.statusCode ?? 500,
					data
				});
			});
			res.on("error", (err) => {
				clearTimeout(timer);
				reject(err);
			});
		});
		const timer = setTimeout(() => {
			req.destroy(/* @__PURE__ */ new Error(`RPC request timed out after ${RPC_TIMEOUT_MS / 1e3}s`));
		}, RPC_TIMEOUT_MS);
		req.on("error", (err) => {
			clearTimeout(timer);
			reject(err);
		});
		if (bodyJSON) req.write(bodyJSON);
		req.end();
	});
}
async function doRPC(info, command, args, forceTcp = false) {
	const { status, data } = await doRequest(info, "/rpc", "POST", {
		command,
		args
	}, forceTcp);
	if (status === 401) throw new UnauthorizedError("Unauthorized: the auth token in the MCP discovery file may be stale");
	if (status >= 400) throw new Error(data.error ?? `RPC failed: HTTP ${status}`);
	const body = data;
	if (body.ok === false) throw new Error(body.error ?? "RPC failed");
	return body.result;
}
/** Error class to distinguish auth failures for retry logic. */
var UnauthorizedError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "UnauthorizedError";
	}
};
function isSocketConnectionError(error) {
	if (!(error instanceof Error)) return false;
	const code = "code" in error ? String(error.code) : "";
	return code === "ECONNREFUSED" || code === "ENOENT" || code === "FailedToOpenSocket" || error.message.includes("ECONNREFUSED") || error.message.includes("ENOENT");
}
async function rpcWithFallback(info, command, args) {
	try {
		return await doRPC(info, command, args);
	} catch (error) {
		if (!platformHasUnixSockets() || !info.socketPath || info.httpPort <= 0 || !isSocketConnectionError(error)) throw error;
		return doRPC(info, command, args, true);
	}
}
async function rpc(command, args = {}) {
	try {
		return await rpcWithFallback(await resolveDiscovery(), command, args);
	} catch (error) {
		if (!(error instanceof UnauthorizedError) && !isSocketConnectionError(error)) throw error;
		cachedInfo = null;
		return rpcWithFallback(await resolveDiscovery(), command, args);
	}
}
function isAppMode(file) {
	return !file;
}
function requireFile(file) {
	if (!file) throw new Error("File path is required for headless mode");
	return file;
}
//#endregion
//#region src/headless.ts
const io$4 = new IORegistry(BUILTIN_IO_FORMATS);
async function loadDocument(filePath) {
	const bytes = new Uint8Array(await readFile(filePath));
	const { graph } = await io$4.readDocument({
		name: filePath,
		data: bytes
	});
	computeAllLayouts(graph);
	return graph;
}
function populateDocumentPage(graph, pageId) {
	const changed = populateLazyFigImportRoots(graph, [pageId]);
	if (changed) computeAllLayouts(graph, pageId);
	return changed;
}
function populateWholeDocument(graph) {
	const changed = populateAllLazyFigImportRoots(graph);
	if (changed) computeAllLayouts(graph);
	return changed;
}
function pageNameFromArgs(args) {
	if (!args || typeof args !== "object" || Array.isArray(args)) return void 0;
	const page = args.page;
	return typeof page === "string" ? page : void 0;
}
function populateRequestedPage(graph, pageName) {
	const pages = graph.getPages();
	const page = pageName ? pages.find((candidate) => candidate.name === pageName) : pages[0];
	if (page) populateDocumentPage(graph, page.id);
}
function prepareDocumentForRPC(graph, command, args) {
	if (command === "pages" || command === "variables") return;
	if (command === "tree") {
		populateRequestedPage(graph, pageNameFromArgs(args));
		return;
	}
	if (command === "find" || command === "query") {
		const pageName = pageNameFromArgs(args);
		if (pageName) populateRequestedPage(graph, pageName);
		else populateWholeDocument(graph);
		return;
	}
	populateWholeDocument(graph);
}
//#endregion
//#region src/rpc-data.ts
function isRPCArgs(value) {
	return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
async function loadRPCData(file, command, args, targetArgs) {
	if (isAppMode(file)) return rpc(command, {
		...isRPCArgs(args) ? args : {},
		...targetArgs ? appTargetRPCArgs(targetArgs) : {}
	});
	const graph = await loadDocument(requireFile(file));
	prepareDocumentForRPC(graph, command, args);
	return executeRPCCommand(graph, command, args);
}
//#endregion
//#region src/commands/analyze/clusters.ts
function formatSignature(sig) {
	const [typeSize, children] = sig.split("|");
	const type = typeSize.split(":")[0];
	if (!type) return sig;
	const typeName = type.charAt(0) + type.slice(1).toLowerCase();
	if (!children) return typeName;
	return `${typeName} > [${children.split(",").map((c) => {
		const [t, count] = c.split(":");
		if (!t) return "";
		const name = t.charAt(0) + t.slice(1).toLowerCase();
		return Number(count) > 1 ? `${name}×${count}` : name;
	}).join(", ")}]`;
}
var clusters_default = defineCommand({
	meta: { description: "Find repeated design patterns (potential components)" },
	args: {
		file: {
			type: "positional",
			description: ".fig file path (omit to connect to running app)",
			required: false
		},
		limit: {
			type: "string",
			description: "Max clusters to show",
			default: "20"
		},
		"min-size": {
			type: "string",
			description: "Min node size in px",
			default: "30"
		},
		"min-count": {
			type: "string",
			description: "Min instances to form cluster",
			default: "2"
		},
		...appTargetOptions,
		json: {
			type: "boolean",
			description: "Output as JSON"
		}
	},
	async run({ args }) {
		const data = await loadRPCData(args.file, "analyze_clusters", {
			limit: Number(args.limit),
			minSize: Number(args["min-size"]),
			minCount: Number(args["min-count"])
		}, args);
		if (args.json) {
			console.log(JSON.stringify(data, null, 2));
			return;
		}
		if (data.clusters.length === 0) {
			console.log("No repeated patterns found.");
			return;
		}
		console.log("");
		console.log(bold("  Repeated patterns"));
		console.log("");
		const items = data.clusters.map((c) => {
			const first = c.nodes[0];
			const confidence = calcClusterConfidence(c.nodes);
			const widths = c.nodes.map((n) => n.width);
			const heights = c.nodes.map((n) => n.height);
			const wRange = Math.max(...widths) - Math.min(...widths);
			const hRange = Math.max(...heights) - Math.min(...heights);
			const avgW = Math.round(widths.reduce((a, b) => a + b, 0) / widths.length);
			const avgH = Math.round(heights.reduce((a, b) => a + b, 0) / heights.length);
			const sizeStr = wRange <= 4 && hRange <= 4 ? `${avgW}×${avgH}` : `${avgW}×${avgH} (±${Math.max(wRange, hRange)}px)`;
			return {
				header: `${c.nodes.length}× ${first.type.toLowerCase()} "${first.name}" (${confidence}% match)`,
				details: {
					size: sizeStr,
					structure: formatSignature(c.signature),
					examples: c.nodes.slice(0, 3).map((n) => n.id).join(", ")
				}
			};
		});
		console.log(fmtList(items, { numbered: true }));
		const clusteredNodes = data.clusters.reduce((sum, c) => sum + c.nodes.length, 0);
		console.log("");
		console.log(fmtSummary({
			clusters: data.clusters.length,
			"total nodes": data.totalNodes,
			clustered: clusteredNodes
		}));
		console.log("");
	}
});
//#endregion
//#region src/commands/analyze/colors.ts
var colors_default = defineCommand({
	meta: { description: "Analyze color palette usage" },
	args: {
		file: {
			type: "positional",
			description: ".fig file path (omit to connect to running app)",
			required: false
		},
		limit: {
			type: "string",
			description: "Max colors to show",
			default: "30"
		},
		threshold: {
			type: "string",
			description: "Distance threshold for clustering similar colors (0–50)",
			default: "15"
		},
		similar: {
			type: "boolean",
			description: "Show similar color clusters"
		},
		...appTargetOptions,
		json: {
			type: "boolean",
			description: "Output as JSON"
		}
	},
	async run({ args }) {
		const data = await loadRPCData(args.file, "analyze_colors", {
			threshold: Number(args.threshold),
			similar: args.similar
		}, args);
		const limit = Number(args.limit);
		if (args.json) {
			console.log(JSON.stringify(data, null, 2));
			return;
		}
		if (data.colors.length === 0) {
			console.log("No colors found.");
			return;
		}
		const sorted = data.colors.slice(0, limit);
		console.log("");
		console.log(bold("  Colors by usage"));
		console.log("");
		console.log(fmtHistogram(sorted.map((c) => ({
			label: c.hex,
			value: c.count,
			tag: c.variableName ? `$${c.variableName}` : void 0
		}))));
		const hardcoded = data.colors.filter((c) => !c.variableName);
		const fromVars = data.colors.filter((c) => c.variableName);
		console.log("");
		console.log(fmtSummary({
			"unique colors": data.colors.length,
			"from variables": fromVars.length,
			hardcoded: hardcoded.length
		}));
		if (args.similar && data.clusters.length > 0) {
			console.log("");
			console.log(bold("  Similar colors (consider merging)"));
			console.log("");
			console.log(fmtList(data.clusters.slice(0, 10).map((cluster) => ({
				header: cluster.colors.map((c) => c.hex).join(", "),
				details: {
					suggest: cluster.suggestedHex,
					total: `${cluster.totalCount}×`
				}
			}))));
		}
		console.log("");
	}
});
//#endregion
//#region src/commands/analyze/overlaps.ts
function validateScope(scope) {
	const normalized = scope.toLowerCase();
	return VALID_OVERLAP_SCOPES.includes(normalized) ? void 0 : `Invalid scope "${scope}". Must be one of: ${[...VALID_OVERLAP_SCOPES].join(", ")}`;
}
function validateSeverity(severity) {
	const normalized = severity.toLowerCase();
	return VALID_OVERLAP_SEVERITIES.includes(normalized) ? void 0 : `Invalid severity "${severity}". Must be one of: ${[...VALID_OVERLAP_SEVERITIES].join(", ")}`;
}
function validateMinRatio(minRatio) {
	if (minRatio === void 0) return void 0;
	if (Number.isNaN(minRatio) || minRatio < 0 || minRatio > 1) return "--min-ratio must be a number between 0.0 and 1.0";
}
function validateLimit(limit) {
	const value = Number(limit);
	if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) return "--limit must be a positive integer";
}
function validateMinArea(minArea) {
	const value = Number(minArea);
	if (!Number.isFinite(value) || value < 0) return "--min-area must be a non-negative number";
}
function validateCategory(category) {
	const values = category.split(",").map((c) => c.trim().toLowerCase()).filter((c) => c.length > 0);
	if (values.length === 0) return void 0;
	if ((parseOverlapCategories(category) ?? []).length === 0) return `Invalid categories: ${values.join(", ")}. Must be one or more of: ${[...VALID_OVERLAP_CATEGORIES].join(", ")}`;
	const invalid = values.filter((c) => !VALID_OVERLAP_CATEGORIES.includes(c));
	if (invalid.length > 0) return `Invalid categor${invalid.length === 1 ? "y" : "ies"}: ${invalid.join(", ")}. Must be one or more of: ${[...VALID_OVERLAP_CATEGORIES].join(", ")}`;
}
function collectValidationError(args) {
	return validateScope(args.scope) ?? validateSeverity(args.severity) ?? validateLimit(args.limit) ?? (args.category ? validateCategory(args.category) : void 0) ?? (args["min-area"] !== void 0 ? validateMinArea(args["min-area"]) : void 0) ?? validateMinRatio(args["min-ratio"] ? Number(args["min-ratio"]) : void 0);
}
function buildRPCArgs(args) {
	const error = collectValidationError(args);
	if (error) return {
		rpcArgs: {},
		error
	};
	const minAreaRaw = args["min-area"];
	const minArea = minAreaRaw ? Number(minAreaRaw) : void 0;
	const minRatio = args["min-ratio"] ? Number(args["min-ratio"]) : void 0;
	const rpcArgs = {
		scope: parseOverlapScope(args.scope) ?? "all",
		severity: parseOverlapSeverity(args.severity) ?? "info",
		limit: Number(args.limit)
	};
	if (args.category) rpcArgs.category = args.category;
	if (minArea !== void 0) rpcArgs.min_area = minArea;
	if (minRatio !== void 0) rpcArgs.min_ratio = minRatio;
	if (args["include-hidden"]) rpcArgs.include_hidden = true;
	if (args["include-locked"]) rpcArgs.include_locked = true;
	if (args["include-absolute"]) rpcArgs.include_absolute = true;
	if (args.page) rpcArgs.page = args.page;
	if (args["page-id"]) rpcArgs.page_id = args["page-id"];
	if (args.type) rpcArgs.type = args.type;
	return { rpcArgs };
}
var overlaps_default = defineCommand({
	meta: { description: "Detect visual overlaps and layout overflows" },
	args: {
		file: {
			type: "positional",
			description: ".fig file path (omit to connect to running app)",
			required: false
		},
		scope: {
			type: "string",
			description: "Which pairs to inspect: all, same-parent, cross-parent, top-level, inside-parent",
			default: "all"
		},
		category: {
			type: "string",
			description: "Comma-separated categories: sibling-overlap, parent-overflow, overlay"
		},
		severity: {
			type: "string",
			description: "Minimum severity to include: critical, major, minor, info",
			default: "info"
		},
		"min-area": {
			type: "string",
			description: "Minimum overlap area in square pixels"
		},
		"min-ratio": {
			type: "string",
			description: "Minimum overlap ratio relative to the smaller node, 0.0–1.0"
		},
		"include-hidden": {
			type: "boolean",
			description: "Include hidden nodes in the analysis"
		},
		"include-locked": {
			type: "boolean",
			description: "Include locked nodes in the analysis"
		},
		"include-absolute": {
			type: "boolean",
			description: "Include absolutely-positioned nodes in the analysis"
		},
		page: {
			type: "string",
			description: "Limit analysis to nodes on the named page"
		},
		"page-id": {
			type: "string",
			description: "Limit analysis to nodes on the page with this stable ID"
		},
		"document-id": {
			type: "string",
			description: "Target OpenPencil document/tab ID when connected to the running app",
			required: false
		},
		type: {
			type: "string",
			description: "Comma-separated node types to analyze, e.g. FRAME,TEXT"
		},
		limit: {
			type: "string",
			description: "Maximum overlap findings to show",
			default: "100"
		},
		json: {
			type: "boolean",
			description: "Output as JSON"
		}
	},
	async run({ args }) {
		const { rpcArgs, error } = buildRPCArgs(args);
		if (error) {
			console.error(fail(error));
			process.exit(1);
		}
		const data = await loadRPCData(args.file, "analyze_overlaps", rpcArgs, args);
		if (args.json) {
			console.log(JSON.stringify(data, null, 2));
			return;
		}
		if (data.summary.overlapCount === 0) {
			console.log(kv("status", "No overlaps found"));
			console.log(fmtSummary({ "analyzed nodes": data.summary.analyzedNodes }));
			return;
		}
		const showing = data.overlaps.length;
		const total = data.summary.overlapCount;
		const header = showing === total ? `  Overlaps — ${total} found` : `  Overlaps — ${total} found (${showing} shown)`;
		console.log("");
		console.log(bold(header));
		console.log("");
		console.log(fmtList(data.overlaps.map((overlap) => ({
			header: `[${overlap.severity}] ${overlap.category}`,
			details: {
				message: overlap.message,
				area: `${overlap.area}px`,
				ratio: `${(overlap.ratio * 100).toFixed(1)}%`,
				a: `${overlap.nodeA.type} "${overlap.nodeA.name}" (${overlap.nodeA.id})`,
				b: `${overlap.nodeB.type} "${overlap.nodeB.name}" (${overlap.nodeB.id})`,
				suggestion: overlap.suggestion
			}
		}))));
		console.log("");
		console.log(fmtSummary({
			"analyzed nodes": data.summary.analyzedNodes,
			"total nodes": data.summary.totalNodes
		}));
		console.log(kv("by category", Object.entries(data.summary.byCategory).filter(([, count]) => count > 0).map(([k, count]) => `${k}: ${count}`).join(", ") || "none"));
		console.log(kv("by severity", Object.entries(data.summary.bySeverity).filter(([, count]) => count > 0).map(([k, count]) => `${k}: ${count}`).join(", ") || "none"));
		console.log("");
	}
});
//#endregion
//#region src/commands/analyze/spacing.ts
var spacing_default = defineCommand({
	meta: { description: "Analyze spacing values (gap, padding)" },
	args: {
		file: {
			type: "positional",
			description: ".fig file path (omit to connect to running app)",
			required: false
		},
		grid: {
			type: "string",
			description: "Base grid size to check against",
			default: "8"
		},
		...appTargetOptions,
		json: {
			type: "boolean",
			description: "Output as JSON"
		}
	},
	async run({ args }) {
		const data = await loadRPCData(args.file, "analyze_spacing", void 0, args);
		const gridSize = Number(args.grid);
		if (args.json) {
			console.log(JSON.stringify(data, null, 2));
			return;
		}
		console.log("");
		if (data.gaps.length > 0) {
			console.log(bold("  Gap values"));
			console.log("");
			console.log(fmtHistogram(data.gaps.slice(0, 15).map((g) => ({
				label: `${String(g.value).padStart(4)}px`,
				value: g.count,
				suffix: g.value % gridSize !== 0 ? "⚠" : void 0
			}))));
			console.log("");
		}
		if (data.paddings.length > 0) {
			console.log(bold("  Padding values"));
			console.log("");
			console.log(fmtHistogram(data.paddings.slice(0, 15).map((p) => ({
				label: `${String(p.value).padStart(4)}px`,
				value: p.count,
				suffix: p.value % gridSize !== 0 ? "⚠" : void 0
			}))));
			console.log("");
		}
		if (data.gaps.length === 0 && data.paddings.length === 0) {
			console.log("No auto-layout nodes with spacing found.");
			console.log("");
			return;
		}
		console.log(fmtSummary({
			"gap values": data.gaps.length,
			"padding values": data.paddings.length
		}));
		const offGridGaps = data.gaps.filter((g) => g.value % gridSize !== 0);
		const offGridPaddings = data.paddings.filter((p) => p.value % gridSize !== 0);
		if (offGridGaps.length > 0 || offGridPaddings.length > 0) {
			console.log("");
			console.log(bold(`  ⚠ Off-grid values (not ÷${gridSize}px)`));
			if (offGridGaps.length > 0) console.log(kv("Gaps", offGridGaps.map((g) => `${g.value}px`).join(", ")));
			if (offGridPaddings.length > 0) console.log(kv("Paddings", offGridPaddings.map((p) => `${p.value}px`).join(", ")));
		}
		console.log("");
	}
});
//#endregion
//#region src/commands/analyze/typography.ts
function weightName(w) {
	if (w <= 100) return "Thin";
	if (w <= 200) return "ExtraLight";
	if (w <= 300) return "Light";
	if (w <= 400) return "Regular";
	if (w <= 500) return "Medium";
	if (w <= 600) return "SemiBold";
	if (w <= 700) return "Bold";
	if (w <= 800) return "ExtraBold";
	return "Black";
}
//#endregion
//#region src/commands/analyze/index.ts
var analyze_default = defineCommand({
	meta: { description: "Analyze design tokens and patterns" },
	subCommands: {
		colors: colors_default,
		typography: defineCommand({
			meta: { description: "Analyze typography usage" },
			args: {
				file: {
					type: "positional",
					description: ".fig file path (omit to connect to running app)",
					required: false
				},
				"group-by": {
					type: "string",
					description: "Group by: family, size, weight (default: show all styles)"
				},
				limit: {
					type: "string",
					description: "Max styles to show",
					default: "30"
				},
				...appTargetOptions,
				json: {
					type: "boolean",
					description: "Output as JSON"
				}
			},
			async run({ args }) {
				const data = await loadRPCData(args.file, "analyze_typography", {}, args);
				const limit = Number(args.limit);
				const groupBy = args["group-by"];
				if (args.json) {
					console.log(JSON.stringify(data, null, 2));
					return;
				}
				if (data.styles.length === 0) {
					console.log("No text nodes found.");
					return;
				}
				console.log("");
				if (groupBy === "family") {
					const byFamily = /* @__PURE__ */ new Map();
					for (const s of data.styles) byFamily.set(s.family, (byFamily.get(s.family) ?? 0) + s.count);
					console.log(bold("  Font families"));
					console.log("");
					console.log(fmtHistogram([...byFamily.entries()].sort((a, b) => b[1] - a[1]).map(([family, count]) => ({
						label: family,
						value: count
					}))));
				} else if (groupBy === "size") {
					const bySize = /* @__PURE__ */ new Map();
					for (const s of data.styles) bySize.set(s.size, (bySize.get(s.size) ?? 0) + s.count);
					console.log(bold("  Font sizes"));
					console.log("");
					console.log(fmtHistogram([...bySize.entries()].sort((a, b) => a[0] - b[0]).map(([size, count]) => ({
						label: `${size}px`,
						value: count
					}))));
				} else if (groupBy === "weight") {
					const byWeight = /* @__PURE__ */ new Map();
					for (const s of data.styles) byWeight.set(s.weight, (byWeight.get(s.weight) ?? 0) + s.count);
					console.log(bold("  Font weights"));
					console.log("");
					console.log(fmtHistogram([...byWeight.entries()].sort((a, b) => b[1] - a[1]).map(([weight, count]) => ({
						label: `${weight} ${weightName(weight)}`,
						value: count
					}))));
				} else {
					console.log(bold("  Typography styles"));
					console.log("");
					const items = data.styles.slice(0, limit).map((s) => {
						const lh = s.lineHeight !== "auto" ? ` / ${s.lineHeight}` : "";
						return {
							label: `${s.family} ${s.size}px ${weightName(s.weight)}${lh}`,
							value: s.count
						};
					});
					console.log(fmtHistogram(items));
				}
				console.log("");
				console.log(fmtSummary({
					"unique styles": data.styles.length,
					"text nodes": data.totalTextNodes
				}));
				console.log("");
			}
		}),
		spacing: spacing_default,
		clusters: clusters_default,
		overlaps: overlaps_default
	}
});
//#endregion
//#region src/commands/convert.ts
const io$3 = new IORegistry(BUILTIN_IO_FORMATS);
function writableFormatIds() {
	return io$3.listWritableFormats().map((format) => format.id);
}
function defaultOutput$1(file, format) {
	return resolve(`${basename(file, extname(file))}.${format.toLowerCase()}`);
}
var convert_default = defineCommand({
	meta: { description: "Convert a document to another writable format" },
	args: {
		file: {
			type: "positional",
			description: "Input document file path",
			required: true
		},
		output: {
			type: "string",
			alias: "o",
			description: "Output file path (default: <name>.<format>)",
			required: false
		},
		format: {
			type: "string",
			alias: "f",
			description: "Output format: fig (default: fig)",
			default: "fig"
		}
	},
	async run({ args }) {
		const format = args.format.toLowerCase();
		const writableFormats = writableFormatIds();
		if (!writableFormats.includes(format)) {
			printError(`Invalid format "${args.format}". Use ${writableFormats.join(", ")}.`);
			process.exit(1);
		}
		const file = requireFile(args.file);
		const graph = await loadDocument(file);
		populateWholeDocument(graph);
		const result = await io$3.writeDocument(format, graph);
		const output = args.output ? resolve(args.output) : defaultOutput$1(file, format);
		await writeFile(output, result.data);
		console.log(ok(`Converted ${file} → ${output}`));
	}
});
//#endregion
//#region src/commands/documents.ts
var documents_default = defineCommand({
	meta: { description: "List open documents in the running app" },
	args: { json: {
		type: "boolean",
		description: "Output as JSON"
	} },
	async run({ args }) {
		try {
			const documents = (await rpc("list_documents")).documents;
			if (args.json) {
				console.log(JSON.stringify(documents, null, 2));
				return;
			}
			console.log("");
			console.log(bold(`  ${documents.length} open document${documents.length !== 1 ? "s" : ""}`));
			console.log("");
			console.log(fmtList(documents.map((doc) => ({
				header: `${entity("document", doc.name, doc.id)}${doc.active ? " [active]" : ""}`,
				details: {
					...doc.path ? { path: doc.path } : {},
					current: `${doc.current_page_name} (${doc.current_page_id})`,
					pages: doc.pages.map((page) => `${page.name} (${page.id})`).join(", ")
				}
			})), { compact: true }));
			console.log("");
			console.log(kv("target flags", "--document-id <id> --page-id <id>"));
			console.log("");
		} catch (error) {
			printError(error);
			process.exit(1);
		}
	}
});
//#endregion
//#region src/commands/eval.ts
function printResult(value, json) {
	if (json || !process.stdout.isTTY) console.log(JSON.stringify(value, null, 2));
	else console.log(value);
}
function serializeResult(value) {
	if (value === void 0 || value === null) return value;
	if (typeof value === "object" && "toJSON" in value && typeof value.toJSON === "function") return value.toJSON();
	if (Array.isArray(value)) return value.map(serializeResult);
	return value;
}
var eval_default = defineCommand({
	meta: { description: "Execute JavaScript with Figma plugin API" },
	args: {
		file: {
			type: "positional",
			description: "Document file path (omit to connect to running app)",
			required: false
		},
		code: {
			type: "string",
			alias: "c",
			description: "JavaScript code to execute"
		},
		stdin: {
			type: "boolean",
			description: "Read code from stdin"
		},
		write: {
			type: "boolean",
			alias: "w",
			description: "Write changes back to the input file"
		},
		output: {
			type: "string",
			alias: "o",
			description: "Write to a different file",
			required: false
		},
		...appTargetOptions,
		json: {
			type: "boolean",
			description: "Output as JSON"
		},
		quiet: {
			type: "boolean",
			alias: "q",
			description: "Suppress output"
		}
	},
	async run({ args }) {
		let code = args.code;
		if (args.stdin) {
			const chunks = [];
			for await (const chunk of process.stdin) chunks.push(chunk);
			code = Buffer.concat(chunks).toString("utf-8");
		}
		if (!code) {
			printError("Provide code via --code or --stdin");
			process.exit(1);
		}
		if (isAppMode(args.file)) {
			const result = await rpc("eval", {
				code,
				...appTargetRPCArgs(args)
			});
			if (!args.quiet && result !== void 0 && result !== null) printResult(result, !!args.json);
			return;
		}
		const file = requireFile(args.file);
		const graph = await loadDocument(file);
		populateWholeDocument(graph);
		const figma = new FigmaAPI(graph);
		const AsyncFunction = Object.getPrototypeOf(async () => void 0).constructor;
		const wrappedCode = code.trim().startsWith("return") ? code : `return (async () => { ${code} })()`;
		let result;
		try {
			result = await new AsyncFunction("figma", wrappedCode)(figma);
		} catch (err) {
			printError(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
		if (!args.quiet && result !== void 0) printResult(serializeResult(result), !!args.json);
		if (args.write || args.output) {
			const { BUILTIN_IO_FORMATS, IORegistry } = await import("@open-pencil/core/io");
			const io = new IORegistry(BUILTIN_IO_FORMATS);
			const outPath = args.output ? args.output : file;
			await writeFile(outPath, (await io.writeDocument("fig", graph)).data);
			if (!args.quiet) console.error(`Written to ${outPath}`);
		}
	}
});
//#endregion
//#region src/commands/export.ts
const io$2 = new IORegistry(BUILTIN_IO_FORMATS);
const ALL_FORMATS = /* @__PURE__ */ new Set([
	...[
		"PNG",
		"JPG",
		"WEBP"
	],
	"SVG",
	"PDF",
	"PPTX",
	"JSX",
	"FIG",
	"HTML"
]);
const JSX_STYLES = /* @__PURE__ */ new Set(["openpencil", "tailwind"]);
const HTML_STYLES = /* @__PURE__ */ new Set(["inline", "tailwind"]);
const HTML_MODES = /* @__PURE__ */ new Set(["fragment", "standalone"]);
const HTML_ASSETS = /* @__PURE__ */ new Set(["inline", "external"]);
const HTML_FONTS = /* @__PURE__ */ new Set(["assets", "none"]);
async function writeAndLog(path, content) {
	await writeFile(path, content);
	const size = typeof content === "string" ? content.length : content.length;
	console.log(ok(`Exported ${path} (${(size / 1024).toFixed(1)} KB)`));
}
async function exportViaApp(format, args) {
	const targetArgs = appTargetRPCArgs(args);
	if (format === "SVG") {
		const result = await rpc("tool", {
			...targetArgs,
			name: "export_svg",
			args: { ids: args.node ? [args.node] : void 0 }
		});
		if (!result.svg) {
			printError("Nothing to export.");
			process.exit(1);
		}
		await writeAndLog(resolve(args.output ?? "export.svg"), result.svg);
		return;
	}
	if (format === "PDF") {
		const result = await rpc("tool", {
			...targetArgs,
			name: "export_pdf",
			args: { ids: args.node ? [args.node] : void 0 }
		});
		if (!result.base64) {
			printError("Nothing to export.");
			process.exit(1);
		}
		const data = decodeBase64(result.base64);
		await writeAndLog(resolve(args.output ?? "export.pdf"), data);
		return;
	}
	if (format === "JSX" || format === "HTML" || format === "FIG" || format === "PPTX") {
		printError(`${format} export is only available in file mode right now.`);
		process.exit(1);
	}
	const data = decodeBase64((await rpc("export", {
		...targetArgs,
		nodeIds: args.node ? [args.node] : void 0,
		scale: Number(args.scale),
		format: format.toLowerCase()
	})).base64);
	const ext = format.toLowerCase() === "jpg" ? "jpg" : format.toLowerCase();
	await writeAndLog(resolve(args.output ?? `export.${ext}`), data);
}
function exportFileName(defaultName, extension, scale) {
	return scale ? `${defaultName}@${scale}x.${extension}` : `${defaultName}.${extension}`;
}
function targetLabel(pageName, nodeId, wholeDocument = false) {
	if (wholeDocument) return "whole document";
	if (nodeId) return `node ${nodeId}`;
	return pageName ? `page "${pageName}"` : "first page";
}
async function writeHTMLFiles(output, bundle) {
	const entrypoint = bundle.files.find((file) => file.path === bundle.entrypoint);
	if (!entrypoint) {
		printError(`HTML export did not include ${bundle.entrypoint}.`);
		process.exit(1);
	}
	await writeAndLog(output, entrypoint.content);
	const outputDir = dirname(output);
	const assetFiles = bundle.files.filter((file) => file.path !== bundle.entrypoint);
	for (const file of assetFiles) {
		const assetPath = join(outputDir, file.path);
		await mkdir(dirname(assetPath), { recursive: true });
		await writeFile(assetPath, file.content);
	}
	if (assetFiles.length > 0) console.log(ok(`Assets: ${assetFiles.length} files`));
}
async function exportHTMLFromFile(args, graph, target, defaultName) {
	const document = sceneGraphToDesignDocument(graph, { rootId: target.scope === "page" ? target.pageId : target.nodeId });
	const output = resolve(args.output ?? exportFileName(defaultName, "html"));
	const assetBasePath = `${basename(output, extname(output))}.assets`;
	await writeHTMLFiles(output, await exportHTMLBundle(document, {
		html: args.html,
		style: args.css,
		assets: args.assets,
		fonts: args.fonts,
		assetBasePath
	}));
	console.log(ok(`Target: ${targetLabel(args.page, args.node)}`));
}
function prepareGraphForExport(graph, pageId, format, args) {
	const wholeDocument = (format === "FIG" || format === "PPTX") && !args.page && !args.node;
	if (wholeDocument || args.node) populateWholeDocument(graph);
	else populateDocumentPage(graph, pageId);
	return wholeDocument;
}
async function executeFileExport(formatId, graph, target, options, wholeDocument) {
	if (wholeDocument) {
		if (formatId === "fig") return io$2.writeDocument(formatId, graph, options);
		return io$2.exportContent(formatId, {
			graph,
			target: { scope: "document" }
		}, options);
	}
	return io$2.exportContent(formatId, {
		graph,
		target
	}, options);
}
async function exportFromFile(format, args) {
	const file = requireFile(args.file);
	const graph = await loadDocument(file);
	const pages = graph.getPages();
	const page = args.page ? pages.find((p) => p.name === args.page) : pages[0];
	if (!page) {
		const available = pages.map((p) => `"${p.name}"`).join(", ");
		printError(args.page ? `Page "${args.page}" not found. Available pages: ${available || "none"}.` : "Document has no pages.");
		process.exit(1);
	}
	const defaultName = basename(file, extname(file));
	if (args.page && args.node) {
		printError("--page and --node cannot be used together.");
		process.exit(1);
	}
	const wholeDocument = prepareGraphForExport(graph, page.id, format, args);
	const target = args.node ? {
		scope: "node",
		nodeId: args.node
	} : {
		scope: "page",
		pageId: page.id
	};
	if (args.thumbnail) {
		printError("Thumbnail export is not supported by the shared file export path yet.");
		process.exit(1);
	}
	const formatId = format.toLowerCase();
	let options;
	if (format === "HTML") {
		await exportHTMLFromFile(args, graph, target, defaultName);
		return;
	}
	if (format === "JSX") options = { format: args.style };
	else if (format === "FIG") options = { renderThumbnail: true };
	else if (format === "PNG" || format === "JPG" || format === "WEBP") options = {
		format,
		scale: Number(args.scale),
		quality: args.quality ? Number(args.quality) : void 0
	};
	const result = await executeFileExport(formatId, graph, target, options, wholeDocument);
	await writeAndLog(resolve(args.output ?? exportFileName(defaultName, result.extension, format === "PNG" || format === "JPG" || format === "WEBP" ? Number(args.scale) : void 0)), result.data);
	console.log(ok(`Target: ${targetLabel(args.page, args.node, wholeDocument)}`));
}
var export_default = defineCommand({
	meta: { description: "Export a document to PNG, JPG, WEBP, SVG, PDF, PPTX, JSX, HTML, or .fig" },
	args: {
		file: {
			type: "positional",
			description: "Document file path (omit to connect to running app)",
			required: false
		},
		output: {
			type: "string",
			alias: "o",
			description: "Output file path (default: <name>.<format>)",
			required: false
		},
		format: {
			type: "string",
			alias: "f",
			description: "Export format: png, jpg, webp, svg, pdf, pptx, jsx, html, fig (default: png)",
			default: "png"
		},
		scale: {
			type: "string",
			alias: "s",
			description: "Export scale (default: 1)",
			default: "1"
		},
		quality: {
			type: "string",
			alias: "q",
			description: "Quality 0-100 for JPG/WEBP (default: 90)",
			required: false
		},
		page: {
			type: "string",
			description: "Export a specific page by name (FIG defaults to the whole document)",
			required: false
		},
		node: {
			type: "string",
			description: "Export a specific node by ID (cannot be combined with --page)",
			required: false
		},
		style: {
			type: "string",
			description: "JSX style: openpencil or tailwind (default: openpencil)",
			default: "openpencil"
		},
		html: {
			type: "string",
			description: "HTML output mode: fragment or standalone (default: fragment)",
			default: "fragment"
		},
		css: {
			type: "string",
			description: "HTML CSS output: inline or tailwind (default: inline)",
			default: "inline"
		},
		assets: {
			type: "string",
			description: "HTML asset output: inline or external (default: inline)",
			default: "inline"
		},
		fonts: {
			type: "string",
			description: "HTML font output: assets or none (default: none)",
			default: "none"
		},
		thumbnail: {
			type: "boolean",
			description: "Export page thumbnail instead of full render"
		},
		width: {
			type: "string",
			description: "Thumbnail width (default: 1920)",
			default: "1920"
		},
		height: {
			type: "string",
			description: "Thumbnail height (default: 1080)",
			default: "1080"
		},
		...appTargetOptions
	},
	async run({ args }) {
		const format = args.format.toUpperCase();
		if (!ALL_FORMATS.has(format)) {
			printError(`Invalid format "${args.format}". Use png, jpg, webp, svg, pdf, pptx, jsx, html, or fig.`);
			process.exit(1);
		}
		if (format === "JSX" && !JSX_STYLES.has(args.style)) {
			printError(`Invalid JSX style "${args.style}". Use openpencil or tailwind.`);
			process.exit(1);
		}
		if (format === "HTML" && !HTML_MODES.has(args.html)) {
			printError(`Invalid HTML mode "${args.html}". Use fragment or standalone.`);
			process.exit(1);
		}
		if (format === "HTML" && !HTML_STYLES.has(args.css)) {
			printError(`Invalid HTML CSS output "${args.css}". Use inline or tailwind.`);
			process.exit(1);
		}
		if (format === "HTML" && !HTML_ASSETS.has(args.assets)) {
			printError(`Invalid HTML asset output "${args.assets}". Use inline or external.`);
			process.exit(1);
		}
		if (format === "HTML" && !HTML_FONTS.has(args.fonts)) {
			printError(`Invalid HTML font output "${args.fonts}". Use assets or none.`);
			process.exit(1);
		}
		if (isAppMode(args.file)) await exportViaApp(format, args);
		else await exportFromFile(format, args);
	}
});
//#endregion
//#region src/commands/find.ts
var find_default = defineCommand({
	meta: { description: "Find nodes by name or type" },
	args: {
		file: {
			type: "positional",
			description: "Document file path (omit to connect to running app)",
			required: false
		},
		name: {
			type: "string",
			description: "Node name (partial match, case-insensitive)"
		},
		type: {
			type: "string",
			description: "Node type: FRAME, TEXT, RECTANGLE, INSTANCE, etc."
		},
		page: {
			type: "string",
			description: "Page name (default: all pages)"
		},
		limit: {
			type: "string",
			description: "Max results (default: 100)",
			default: "100"
		},
		...appTargetOptions,
		json: {
			type: "boolean",
			description: "Output as JSON"
		}
	},
	async run({ args }) {
		const results = await loadRPCData(args.file, "find", {
			name: args.name,
			type: args.type,
			page: args.page,
			limit: args.limit ? Number(args.limit) : void 0
		}, args);
		if (args.json) {
			console.log(JSON.stringify(results, null, 2));
			return;
		}
		printNodeResults(results);
	}
});
//#endregion
//#region src/commands/formats.ts
const io$1 = new IORegistry(BUILTIN_IO_FORMATS);
function supportLabels(format) {
	const labels = [];
	if (format.support.readDocument) labels.push("read");
	if (format.support.writeDocument) labels.push("write");
	if (format.support.exportDocument) labels.push("export-document");
	if (format.support.exportPage) labels.push("export-page");
	if (format.support.exportSelection) labels.push("export-selection");
	if (format.support.exportNode) labels.push("export-node");
	return labels;
}
var formats_default = defineCommand({
	meta: { description: "List supported document and export formats" },
	args: { json: {
		type: "boolean",
		description: "Output as JSON"
	} },
	async run({ args }) {
		const formats = io$1.listFormats().map((format) => ({
			id: format.id,
			label: format.label,
			role: format.role,
			category: format.category,
			extensions: format.extensions,
			mimeTypes: format.mimeTypes,
			support: supportLabels(format)
		}));
		if (args.json) {
			console.log(JSON.stringify(formats, null, 2));
			return;
		}
		console.log("");
		console.log(bold(`  ${formats.length} format${formats.length !== 1 ? "s" : ""}`));
		console.log("");
		console.log(fmtList(formats.map((format) => ({
			header: `${format.label} (${format.id})`,
			details: {
				role: format.role,
				category: format.category,
				ext: format.extensions.map((ext) => `.${ext}`).join(", "),
				support: format.support.join(", "),
				mime: format.mimeTypes.join(", ")
			}
		})), { compact: true }));
		console.log("");
		console.log(kv("Readable", io$1.listReadableFormats().map((f) => f.id).join(", ") || "none"));
		console.log(kv("Writable", io$1.listWritableFormats().map((f) => f.id).join(", ") || "none"));
		console.log("");
	}
});
//#endregion
//#region src/commands/import.ts
const io = new IORegistry(BUILTIN_IO_FORMATS);
const OUTPUT_FORMATS = /* @__PURE__ */ new Set(["fig", "json"]);
function defaultOutput(input, format) {
	return resolve(`${basename(input, extname(input))}.${format}`);
}
async function readTextFile(path) {
	return Bun.file(requireFile(path)).text();
}
async function cssTextForArgs(args) {
	const cssParts = [];
	if (args.css) cssParts.push(await readTextFile(args.css));
	if (args.cssText) cssParts.push(args.cssText);
	return cssParts.length > 0 ? cssParts.join("\n") : void 0;
}
async function tailwindCandidatesForArgs(args) {
	const parts = [];
	if (args.tailwind) parts.push(args.tailwind);
	if (args.tailwindFile) parts.push(await readTextFile(args.tailwindFile));
	const classes = parts.flatMap((part) => part.split(/\s+/)).filter((className) => className.length > 0);
	return classes.length > 0 ? classes : void 0;
}
function childCount(document) {
	return document.children.length;
}
async function importHTML(args) {
	const html = await readTextFile(requireFile(args.file));
	const runtime = createHeadlessCSSRuntime();
	const tailwind = await tailwindCandidatesForArgs(args);
	const cssText = await cssTextForArgs(args);
	if (tailwind) {
		const options = {
			...args,
			css: cssText,
			runtime
		};
		return {
			document: await tailwindHTMLToDesignDocument(html, tailwind, options),
			graph: await tailwindHTMLToSceneGraph(html, tailwind, options)
		};
	}
	const options = {
		cssText,
		runtime,
		pageName: args.pageName
	};
	return {
		document: await htmlToDesignDocument(html, options),
		graph: await htmlToSceneGraph(html, options)
	};
}
async function writeOutput(args, document, graph) {
	const format = args.format.toLowerCase();
	const output = args.output ? resolve(args.output) : defaultOutput(requireFile(args.file), format);
	if (format === "json") {
		await Bun.write(output, `${JSON.stringify(document, null, 2)}\n`);
		return output;
	}
	const result = await io.writeDocument("fig", graph);
	await Bun.write(output, result.data);
	return output;
}
var import_default = defineCommand({
	meta: { description: "Import HTML/CSS/Tailwind into an OpenPencil document" },
	args: {
		file: {
			type: "positional",
			description: "Input HTML file path",
			required: true
		},
		output: {
			type: "string",
			alias: "o",
			description: "Output file path (default: <name>.<format>)",
			required: false
		},
		format: {
			type: "string",
			alias: "f",
			description: "Output format: fig or json (default: fig)",
			default: "fig"
		},
		css: {
			type: "string",
			description: "CSS file to apply before conversion",
			required: false
		},
		cssText: {
			type: "string",
			description: "Inline CSS text to apply before conversion",
			required: false
		},
		tailwind: {
			type: "string",
			description: "Tailwind utility candidates to compile and apply",
			required: false
		},
		tailwindFile: {
			type: "string",
			description: "File containing Tailwind utility candidates",
			required: false
		},
		pageName: {
			type: "string",
			description: "Scene graph page name (default: DOM/CSS)",
			default: "DOM/CSS"
		},
		json: {
			type: "boolean",
			description: "Print a machine-readable summary to stdout"
		}
	},
	async run({ args }) {
		const format = args.format.toLowerCase();
		if (!OUTPUT_FORMATS.has(format)) {
			printError(`Invalid format "${args.format}". Use fig or json.`);
			process.exit(1);
		}
		const { document, graph } = await importHTML(args);
		const output = await writeOutput(args, document, graph);
		const pages = graph.getPages();
		const summary = {
			input: requireFile(args.file),
			output,
			format,
			pages: pages.length,
			rootElements: childCount(document)
		};
		if (args.json) {
			console.log(JSON.stringify(summary, null, 2));
			return;
		}
		console.log(ok(`Converted ${summary.input} → ${summary.output}`));
		console.log(fmtList([{
			header: "HTML/CSS import",
			details: summary
		}]));
	}
});
//#endregion
//#region src/commands/info.ts
var info_default = defineCommand({
	meta: { description: "Show document info (pages, node counts, fonts)" },
	args: {
		file: {
			type: "positional",
			description: "Document file path (omit to connect to running app)",
			required: false
		},
		...appTargetOptions,
		json: {
			type: "boolean",
			description: "Output as JSON"
		}
	},
	async run({ args }) {
		const data = await loadRPCData(args.file, "info", void 0, args);
		if (args.json) {
			console.log(JSON.stringify(data, null, 2));
			return;
		}
		console.log("");
		console.log(bold(`  ${data.pages} pages, ${data.totalNodes} nodes`));
		console.log("");
		const pageItems = Object.entries(data.pageCounts).map(([label, value]) => ({
			label,
			value
		}));
		console.log(fmtHistogram(pageItems, { unit: "nodes" }));
		console.log("");
		console.log(fmtSummary(data.types));
		if (data.fonts.length > 0) {
			console.log("");
			console.log(kv("Fonts", data.fonts.join(", ")));
		}
		console.log("");
	}
});
//#endregion
//#region src/commands/lint.ts
function formatSeverity(severity) {
	if (severity === "error") return fail("error");
	if (severity === "warning") return fail("warn");
	return ok("info");
}
function formatMessage(message) {
	return {
		header: `${formatSeverity(message.severity)} ${bold(message.ruleId)} ${dim(message.nodePath.join(" / "))}`,
		details: {
			message: message.message,
			node: `${message.nodeName} (${message.nodeId})`,
			suggest: message.suggest
		}
	};
}
var lint_default = defineCommand({
	meta: {
		name: "lint",
		description: "Lint design documents for consistency, structure, and accessibility issues"
	},
	args: {
		file: {
			type: "positional",
			required: true,
			description: "Design document to lint (.fig, .pen)"
		},
		preset: {
			type: "string",
			default: "recommended",
			description: "Preset: recommended, strict, accessibility"
		},
		rule: {
			type: "string",
			description: "Run specific rule(s) only (repeatable)"
		},
		json: {
			type: "boolean",
			default: false,
			description: "Output as JSON"
		},
		"list-rules": {
			type: "boolean",
			default: false,
			description: "List rules and exit"
		}
	},
	async run({ args }) {
		if (args["list-rules"]) {
			console.log("");
			console.log(bold("Available rules"));
			console.log("");
			console.log(fmtList(Object.entries(allRules).map(([id, rule]) => ({
				header: bold(id),
				details: {
					category: rule.meta.category,
					description: rule.meta.description
				}
			}))));
			console.log("");
			console.log(bold(`Presets: ${Object.keys(presets).join(", ")}`));
			console.log("");
			return;
		}
		const graph = await loadDocument(args.file);
		const rules = args.rule ? Array.isArray(args.rule) ? args.rule : [args.rule] : void 0;
		const result = createLinter({
			preset: args.preset,
			rules
		}).lintGraph(graph);
		if (args.json) console.log(JSON.stringify(result, null, 2));
		else if (result.messages.length === 0) console.log(ok("No lint issues found."));
		else {
			console.log("");
			console.log(bold(`Lint issues: ${result.errorCount} errors, ${result.warningCount} warnings, ${result.infoCount} info`));
			console.log("");
			console.log(fmtList(result.messages.map(formatMessage)));
			console.log("");
		}
		if (result.errorCount > 0) process.exit(1);
	}
});
//#endregion
//#region src/commands/node.ts
var node_default = defineCommand({
	meta: { description: "Show detailed node properties by ID" },
	args: {
		file: {
			type: "positional",
			description: "Document file path (omit to connect to running app)",
			required: false
		},
		id: {
			type: "string",
			description: "Node ID",
			required: true
		},
		...appTargetOptions,
		json: {
			type: "boolean",
			description: "Output as JSON"
		}
	},
	async run({ args }) {
		const data = await loadRPCData(args.file, "node", { id: args.id }, args);
		if ("error" in data) {
			printError(data.error);
			process.exit(1);
		}
		if (args.json) {
			console.log(JSON.stringify(data, null, 2));
			return;
		}
		const nodeData = {
			type: formatType(data.type),
			name: data.name,
			id: data.id,
			width: data.width,
			height: data.height,
			x: data.x,
			y: data.y
		};
		const details = {};
		if (data.parent) details.parent = `${data.parent.name} (${data.parent.id})`;
		if (data.text) details.text = data.text;
		if (data.fills.length > 0) {
			const solid = data.fills.find((f) => f.type === "SOLID" && f.visible);
			if (solid) {
				const hex = colorToHex(solid.color);
				details.fill = solid.opacity < 1 ? `${hex} ${Math.round(solid.opacity * 100)}%` : hex;
			}
		}
		if (data.cornerRadius) details.radius = `${data.cornerRadius}px`;
		if (data.rotation) details.rotate = `${Math.round(data.rotation)}°`;
		if (data.opacity < 1) details.opacity = data.opacity;
		if (!data.visible) details.visible = false;
		if (data.locked) details.locked = true;
		if (data.fontFamily) details.font = `${data.fontSize}px ${data.fontFamily}`;
		if (data.layoutMode !== "NONE") details.layout = data.layoutMode.toLowerCase();
		if (data.children > 0) details.children = data.children;
		for (const [field, name] of Object.entries(data.boundVariables)) details[`var:${field}`] = name;
		console.log("");
		console.log(fmtNode(nodeData, details));
		console.log("");
	}
});
//#endregion
//#region src/commands/pages.ts
var pages_default = defineCommand({
	meta: { description: "List pages in a document" },
	args: {
		file: {
			type: "positional",
			description: "Document file path (omit to connect to running app)",
			required: false
		},
		...appTargetOptions,
		json: {
			type: "boolean",
			description: "Output as JSON"
		}
	},
	async run({ args }) {
		const pages = await loadRPCData(args.file, "pages", void 0, args);
		if (args.json) {
			console.log(JSON.stringify(pages, null, 2));
			return;
		}
		console.log("");
		console.log(bold(`  ${pages.length} page${pages.length !== 1 ? "s" : ""}`));
		console.log("");
		console.log(fmtList(pages.map((page) => ({
			header: entity("page", page.name, page.id),
			details: { nodes: page.nodes }
		})), { compact: true }));
		console.log("");
	}
});
//#endregion
//#region src/commands/query.ts
var query_default = defineCommand({
	meta: { description: "Query nodes using XPath selectors" },
	args: {
		file: {
			type: "positional",
			description: "Document file path (omit to connect to running app)",
			required: false
		},
		selector: {
			type: "positional",
			description: "XPath selector (e.g., //FRAME[@width < 300], //TEXT[contains(@name, \"Label\")])",
			required: true
		},
		page: {
			type: "string",
			description: "Page name (default: all pages)"
		},
		limit: {
			type: "string",
			description: "Max results (default: 1000)",
			default: "1000"
		},
		...appTargetOptions,
		json: {
			type: "boolean",
			description: "Output as JSON"
		}
	},
	async run({ args }) {
		const results = await loadRPCData(args.file, "query", {
			selector: args.selector,
			page: args.page,
			limit: args.limit ? Number(args.limit) : void 0
		}, args);
		if ("error" in results) {
			printError(results.error);
			process.exit(1);
		}
		if (args.json) {
			console.log(JSON.stringify(results, null, 2));
			return;
		}
		printNodeResults(results, (n) => {
			const q = n;
			return `${q.name}  ${q.width}×${q.height}`;
		});
	}
});
//#endregion
//#region src/commands/selection.ts
var selection_default = defineCommand({
	meta: { description: "Get current selection from the running app" },
	args: {
		...appTargetOptions,
		json: {
			type: "boolean",
			description: "Output as JSON"
		}
	},
	async run({ args }) {
		try {
			const nodes = await rpc("selection", appTargetRPCArgs(args));
			if (args.json) {
				console.log(JSON.stringify(nodes, null, 2));
				return;
			}
			if (nodes.length === 0) {
				console.log("\n  No nodes selected.\n");
				return;
			}
			console.log("");
			console.log(bold(`  ${nodes.length} selected node${nodes.length !== 1 ? "s" : ""}`));
			console.log("");
			console.log(fmtList(nodes.map((n) => ({
				header: entity(formatType(n.type), n.name, n.id),
				details: {
					size: `${n.width}×${n.height}`,
					...n.xpath ? { xpath: n.xpath } : {}
				}
			}))));
			console.log("");
		} catch (error) {
			printError(error);
			process.exit(1);
		}
	}
});
//#endregion
//#region src/commands/tree.ts
function toAgentfmtTree(node, maxDepth, depth = 0) {
	const treeNode = { header: entity(formatType(node.type), node.name, node.id) };
	if (node.children && depth < maxDepth) treeNode.children = node.children.map((c) => toAgentfmtTree(c, maxDepth, depth + 1));
	return treeNode;
}
var tree_default = defineCommand({
	meta: { description: "Print the node tree" },
	args: {
		file: {
			type: "positional",
			description: "Document file path (omit to connect to running app)",
			required: false
		},
		page: {
			type: "string",
			description: "Page name (default: first page)"
		},
		depth: {
			type: "string",
			description: "Max depth (default: unlimited)"
		},
		...appTargetOptions,
		json: {
			type: "boolean",
			description: "Output as JSON"
		}
	},
	async run({ args }) {
		const data = await loadRPCData(args.file, "tree", {
			page: args.page,
			depth: args.depth ? Number(args.depth) : void 0
		}, args);
		const maxDepth = args.depth ? Number(args.depth) : Infinity;
		if ("error" in data) {
			printError(data.error);
			process.exit(1);
		}
		if (args.json) {
			console.log(JSON.stringify(data.children, null, 2));
			return;
		}
		const root = {
			header: entity(formatType(data.page.type), data.page.name, data.page.id),
			children: data.children.map((c) => toAgentfmtTree(c, maxDepth))
		};
		console.log("");
		console.log(fmtTree(root, { maxDepth }));
		console.log("");
	}
});
//#endregion
//#region src/commands/variables.ts
var variables_default = defineCommand({
	meta: { description: "List design variables and collections" },
	args: {
		file: {
			type: "positional",
			description: "Document file path (omit to connect to running app)",
			required: false
		},
		collection: {
			type: "string",
			description: "Filter by collection name"
		},
		type: {
			type: "string",
			description: "Filter by type: COLOR, FLOAT, STRING, BOOLEAN"
		},
		...appTargetOptions,
		json: {
			type: "boolean",
			description: "Output as JSON"
		}
	},
	async run({ args }) {
		const data = await loadRPCData(args.file, "variables", {
			collection: args.collection,
			type: args.type
		}, args);
		if (data.totalVariables === 0) {
			console.log("No variables found.");
			return;
		}
		if (args.json) {
			console.log(JSON.stringify(data, null, 2));
			return;
		}
		console.log("");
		for (const coll of data.collections) {
			console.log(bold(entity(coll.name, coll.modes.join(", "))));
			console.log("");
			console.log(fmtList(coll.variables.map((v) => ({
				header: v.name,
				details: {
					value: v.value,
					type: v.type.toLowerCase()
				}
			})), { compact: true }));
			console.log("");
		}
		console.log(fmtSummary({
			variables: data.totalVariables,
			collections: data.totalCollections
		}));
		console.log("");
	}
});
//#endregion
//#region src/index.ts
const { version } = await import("./package-CnxAdhSd.mjs");
runMain(defineCommand({
	meta: {
		name: "openpencil",
		description: "OpenPencil CLI — inspect, export, and lint OpenPencil design documents",
		version
	},
	subCommands: {
		analyze: analyze_default,
		convert: convert_default,
		documents: documents_default,
		eval: eval_default,
		export: export_default,
		import: import_default,
		find: find_default,
		formats: formats_default,
		info: info_default,
		lint: lint_default,
		query: query_default,
		node: node_default,
		pages: pages_default,
		selection: selection_default,
		tree: tree_default,
		variables: variables_default
	}
}));
//#endregion
export {};

//# sourceMappingURL=index.mjs.map
import "./rolldown-runtime-ClRpJifh.mjs";
import { i as platformHasUnixSockets, r as getSocketPath, t as getDiscoveryPath } from "./paths-DNhXl-ck.mjs";
import { randomBytes } from "node:crypto";
import { access, constants, lstat, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { Socket } from "node:net";
//#region src/transport/discovery.ts
/**
* Writes the discovery JSON file at the platform-appropriate location.
* Overwrites any existing file (from a previous server instance).
*
* The write is atomic: a sibling temp file is written first with `0o600`
* permissions, then renamed over the final path. This avoids leaving
* a half-written file visible to readers if the process is killed
* mid-write, and prevents concurrent writers from corrupting the file
* by interleaving their writes.
*
* WARNING: The auth token is written in plaintext. Do not sync the discovery
* file to cloud storage or include it in backups without encryption.
*/
async function writeDiscoveryFile(info) {
	const path = await getDiscoveryPath();
	const json = JSON.stringify(info, null, 2);
	const random = randomBytes(6).toString("hex");
	const tmpPath = `${path}.${process.pid}.${random}.tmp`;
	await writeFile(tmpPath, json, {
		mode: 384,
		encoding: "utf-8"
	});
	try {
		await rename(tmpPath, path);
	} catch (err) {
		await unlink(tmpPath).catch(() => void 0);
		throw err;
	}
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
* Removes the discovery file. Does not throw if the file does not exist.
*/
async function removeDiscoveryFile() {
	const path = await getDiscoveryPath();
	try {
		await unlink(path);
	} catch (e) {
		if (!isEnoent(e)) throw e;
	}
}
async function isSocketLiveViaTcp(socketPath) {
	let discoveryPath;
	try {
		discoveryPath = await getDiscoveryPath();
	} catch {
		return false;
	}
	const raw = await readFile(discoveryPath, "utf-8").catch(() => null);
	if (!raw) return false;
	let info = null;
	try {
		const parsed = JSON.parse(raw);
		if (parsed && typeof parsed === "object") info = validateDiscoveryFields(parsed);
	} catch {
		return false;
	}
	if (!info || info.socketPath !== socketPath) return false;
	if (info.httpPort <= 0) return isProcessAlive(info.pid);
	return fetch(`http://127.0.0.1:${info.httpPort}/health`, { signal: AbortSignal.timeout(2e3) }).then(() => true).catch((e) => {
		if (e instanceof Error && e.name === "TimeoutError") return true;
		return false;
	});
}
/**
* Direct Unix-socket connection probe. A server binds the socket before
* writeDiscovery(), so isSocketLiveViaTcp() can return false during that
* window. This probe connects directly to the socket path — a successful
* connection or timeout means the socket is live; only ECONNREFUSED means
* no process is listening.
*/
function probeSocketLive(socketPath) {
	return new Promise((resolve) => {
		let settled = false;
		const socket = new Socket();
		const finish = (result) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			socket.destroy();
			resolve(result);
		};
		const timer = setTimeout(() => finish(true), 1e3);
		socket.once("connect", () => finish(true));
		socket.once("error", (err) => {
			const code = err.code;
			finish(code !== "ECONNREFUSED");
		});
		socket.connect(socketPath);
	});
}
/**
* Removes a stale Unix domain socket file if it exists and is not live.
* A socket is considered stale if no process is listening on it.
*/
async function removeStaleSocket(socketPathOverride) {
	if (!platformHasUnixSockets()) return;
	const socketPath = socketPathOverride ?? await getSocketPath();
	let exists;
	try {
		await access(socketPath, constants.F_OK);
		exists = true;
	} catch {
		exists = false;
	}
	if (!exists) return;
	const stat = await lstat(socketPath).catch((e) => {
		if (isEnoent(e)) return null;
		throw e;
	});
	if (!stat) return;
	if (!stat.isSocket()) throw new Error(`Refusing to remove non-socket path: ${socketPath}`);
	if (await probeSocketLive(socketPath)) return;
	if (await isSocketLiveViaTcp(socketPath)) return;
	try {
		await unlink(socketPath);
	} catch (e) {
		if (e instanceof Error && "code" in e && e.code !== "ENOENT") process.stderr.write(`Failed to remove stale socket: ${e.message}\n`);
	}
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
export { writeDiscoveryFile as i, removeDiscoveryFile as n, removeStaleSocket as r, readDiscoveryFile as t };

//# sourceMappingURL=discovery-CaYdHC2c.mjs.map
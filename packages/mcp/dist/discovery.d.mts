//#region src/transport/discovery.d.ts
/**
 * Metadata written to the discovery file so clients can auto-locate
 * the running MCP server without knowing the socket path or TCP port.
 *
 * WARNING: The discovery file contains a plaintext auth token. Do not sync
 * this file to cloud storage or include it in backups without encryption.
 * Any process running as the same user can read this file.
 */
interface DiscoveryInfo {
  pid: number;
  /** Unix domain socket path, or null on platforms that don't support them (Windows). */
  socketPath: string | null;
  httpPort: number;
  authRequired: boolean;
  authToken: string | null;
  version: string;
  startedAt: string;
}
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
declare function writeDiscoveryFile(info: DiscoveryInfo): Promise<void>;
/**
 * Reads the discovery file. Returns null if:
 * - The file does not exist
 * - The file cannot be parsed
 * - The recorded PID is no longer running (stale file)
 *
 * On success, returns the parsed DiscoveryInfo.
 */
declare function readDiscoveryFile(): Promise<DiscoveryInfo | null>;
/**
 * Removes the discovery file. Does not throw if the file does not exist.
 */
declare function removeDiscoveryFile(): Promise<void>;
/**
 * Removes a stale Unix domain socket file if it exists and is not live.
 * A socket is considered stale if no process is listening on it.
 */
declare function removeStaleSocket(socketPathOverride?: string): Promise<void>;
//#endregion
export { DiscoveryInfo, readDiscoveryFile, removeDiscoveryFile, removeStaleSocket, writeDiscoveryFile };
//# sourceMappingURL=discovery.d.mts.map